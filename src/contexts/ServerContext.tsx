import { createContext, useEffect, useReducer, ReactElement, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { googleLogout } from "@react-oauth/google";
import { CredentialResponse } from "@react-oauth/google";
import { dispatch as reduxDispatch } from "store";
import { LOGIN, LOGOUT, REGISTER } from "store/reducers/actions";
import { openSnackbar } from "store/reducers/snackbar";
import authReducer from "store/reducers/auth";
import Loader from "components/Loader";
import { UnauthorizedModal } from "../sections/auth/UnauthorizedModal";
import { AuthProps, ServerContextType, UserProfile, LoginResponse, RegisterResponse, VerifyCodeResponse } from "../types/auth";
import { fetchUserStats } from "store/reducers/userStats";

const initialState: AuthProps = {
	isLoggedIn: false,
	isInitialized: false,
	user: null,
	needsVerification: false,
	email: "",
};

// Definir el contexto de autenticación unificado
const AuthContext = createContext<ServerContextType | null>(null);

interface AuthProviderProps {
	children: ReactElement;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [state, localDispatch] = useReducer(authReducer, initialState);
	const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState<boolean>(false);
	const [showUnauthorizedModal, setShowUnauthorizedModal] = useState<boolean>(false);
	const navigate = useNavigate();
	const location = useLocation();
	const [isLogoutProcess, setIsLogoutProcess] = useState(false);

	// Configuración global de axios
	useEffect(() => {
		axios.defaults.withCredentials = true;
	}, []);

	// Mostrar notificaciones
	const showSnackbar = useCallback((message: string, color: "success" | "error" | "info" = "success") => {
		reduxDispatch(
			openSnackbar({
				open: true,
				message,
				variant: "alert",
				alert: { color },
				close: false,
			}),
		);
	}, []);

	// Función unificada de logout
	const logout = async (showMessage = true): Promise<void> => {
		try {
			setIsLogoutProcess(true);
			navigate("/login", { replace: true });

			await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/logout`);

			// Limpiar estado local
			if (isGoogleLoggedIn) {
				googleLogout();
				setIsGoogleLoggedIn(false);
				localStorage.removeItem("googleToken");
			}

			// Actualizar states
			localDispatch({ type: LOGOUT });
			reduxDispatch({ type: LOGOUT });

			if (showMessage) {
				showSnackbar("Sesión cerrada correctamente", "info");
			}

			setShowUnauthorizedModal(false);

			setTimeout(() => {
				setIsLogoutProcess(false);
			}, 1000);
		} catch (error) {
			console.error("Logout error:", error);
			setTimeout(() => {
				setIsLogoutProcess(false);
			}, 1000);
		}
	};

	// Redirección después del logout
	const handleLogoutAndRedirect = async (): Promise<void> => {
		await logout();
		navigate("/login", {
			state: { from: location.pathname },
			replace: true,
		});
	};

	// Iniciar sesión con Google
	const loginWithGoogle = async (tokenResponse: CredentialResponse): Promise<boolean> => {
		try {
			const credential = tokenResponse.credential;
			if (credential) {
				const result = await axios.post<LoginResponse>(`${process.env.REACT_APP_BASE_URL}/api/auth/google`, { token: credential });

				const { user, success } = result.data;

				if (success) {
					setIsGoogleLoggedIn(true);
					localStorage.setItem("googleToken", credential);

					localDispatch({
						type: LOGIN,
						payload: {
							isLoggedIn: true,
							user,
						},
					});

					reduxDispatch({
						type: LOGIN,
						payload: {
							isLoggedIn: true,
							user,
						},
					});

					reduxDispatch(fetchUserStats());

					showSnackbar("¡Inicio de sesión con Google exitoso!", "success");
					return true;
				} else {
					throw new Error("No se pudo autenticar. Intenta nuevamente.");
				}
			}
			throw new Error("No se recibió credencial de Google");
		} catch (error) {
			console.error("Error:", error);
			showSnackbar("Error al iniciar sesión con Google", "error");
			throw error;
		}
	};

	// Inicialización de la autenticación
	useEffect(() => {
		const init = async (): Promise<void> => {
			try {
				// Verificar la sesión actual con el token en cookies
				const response = await axios.get<{ user: UserProfile }>(`${process.env.REACT_APP_BASE_URL}/api/auth/me`);
				const { user } = response.data;

				localDispatch({
					type: LOGIN,
					payload: {
						isLoggedIn: true,
						user,
						isInitialized: true,
					},
				});

				reduxDispatch({
					type: LOGIN,
					payload: {
						isLoggedIn: true,
						user,
						isInitialized: true,
					},
				});

				reduxDispatch(fetchUserStats());
			} catch (error) {
				// No redirigir al login, solo inicializar el estado como logged out
				console.log("Error en la inicialización:", error);

				localDispatch({
					type: LOGOUT,
					payload: {
						isInitialized: true,
					},
				});

				reduxDispatch({
					type: LOGOUT,
				});
			}
		};

		init();
	}, []);

	// Interceptor unificado de axios
	// Interceptor unificado de axios
	useEffect(() => {
		// Variable para almacenar los IDs de interceptores (para limpieza)
		const interceptors: number[] = [];

		// Interceptor de solicitud para ver qué peticiones se están haciendo
		const requestInterceptor = axios.interceptors.request.use(
			(config) => {
				console.log(`[Petición] ${config.method?.toUpperCase()} ${config.url}`, config);
				return config;
			},
			(error) => {
				console.error("[Error de petición]", error);
				return Promise.reject(error);
			},
		);

		interceptors.push(requestInterceptor);

		// Crear un nuevo interceptor de respuesta para ver errores
		const responseInterceptor = axios.interceptors.response.use(
			(response) => {
				console.log(`[Respuesta] ${response.config.method?.toUpperCase()} ${response.config.url}`, response);
				return response;
			},
			async (error: AxiosError) => {
				console.log(`[Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${error.response?.status}`, error);

				if (!error.config) {
					return Promise.reject(error);
				}

				const originalRequest = error.config as any;
				const url = originalRequest.url || "";

				// Para evitar bucles infinitos
				if (originalRequest._hasBeenHandled) {
					console.log(`[Interceptor] Petición ya fue manejada: ${url}`);
					return Promise.reject(error);
				}

				originalRequest._hasBeenHandled = true;

				if (isLogoutProcess) {
					return Promise.reject(error);
				}

				// Si es un error 401 y no es una petición de autenticación
				if (
					error.response?.status === 401 &&
					!url.includes("/api/auth/login") &&
					!url.includes("/api/auth/google") &&
					!url.includes("/api/auth/refresh-token") &&
					!url.includes("/api/auth/logout")
					//&&
					//!url.includes("/api/stats/")
					//&&
					//!url.includes("/api/auth/me")
				) {
					console.log("[Interceptor] Detectado error 401 en:", url, error.response?.data);

					// Si el backend indica que necesita refresh
					if (error.response?.data && (error.response.data as any).needRefresh === true) {
						try {
							console.log("[Interceptor] Intentando refresh token");
							// Intentar refrescar el token automáticamente
							const refreshResponse = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/refresh-token`);

							console.log("[Interceptor] Refresh exitoso", refreshResponse);

							// Si el refresh es exitoso, reintentar la petición original
							if (refreshResponse.status === 200) {
								return axios({
									...originalRequest,
									_hasBeenHandled: false,
								});
							}
						} catch (refreshError) {
							console.error("[Interceptor] Error al refrescar token:", refreshError);

							// Si falla el refresh, mostrar el modal
							console.log("[Interceptor] Mostrando modal de reautenticación");
							setShowUnauthorizedModal(true);

							return Promise.reject(refreshError);
						}
					} else {
						// Si no necesita refresh, solo mostrar el modal
						console.log("[Interceptor] Mostrando modal sin intentar refresh");
						setShowUnauthorizedModal(true);
					}
				}

				return Promise.reject(error);
			},
		);

		// Añadir el ID del interceptor a la lista para limpieza
		interceptors.push(responseInterceptor);

		// Limpiar todos los interceptores al desmontar
		return () => {
			interceptors.forEach((id) => {
				axios.interceptors.response.eject(id);
			});
		};
	}, [isLogoutProcess]);

	// Login normal
	const login = async (email: string, password: string): Promise<boolean> => {
		try {
			const response = await axios.post<LoginResponse>(`${process.env.REACT_APP_BASE_URL}/api/auth/login`, { email, password });

			const { user } = response.data;

			localDispatch({
				type: LOGIN,
				payload: {
					isLoggedIn: true,
					user,
				},
			});

			reduxDispatch({
				type: LOGIN,
				payload: {
					isLoggedIn: true,
					user,
				},
			});

			reduxDispatch(fetchUserStats());
			showSnackbar("¡Inicio de sesión exitoso!", "success");
			return true;
		} catch (error) {
			console.error("Login error:", error);

			if (axios.isAxiosError(error) && error.response) {
				if ((error.response.data as any).loginFailed) {
					throw new Error("Credenciales inválidas");
				}
			}

			throw error;
		}
	};

	// Registro
	const register = async (
		email: string,
		password: string,
		firstName: string,
		lastName: string,
	): Promise<{ email: string; isLoggedIn: boolean; needsVerification: boolean }> => {
		try {
			const response = await axios.post<RegisterResponse>(`${process.env.REACT_APP_BASE_URL}/api/auth/register`, {
				email,
				password,
				firstName,
				lastName,
			});

			const { user, needsVerification } = response.data;

			localDispatch({
				type: REGISTER,
				payload: {
					isLoggedIn: !needsVerification,
					user,
					email,
					needsVerification,
				},
			});

			reduxDispatch({
				type: REGISTER,
				payload: {
					isLoggedIn: !needsVerification,
					user,
					email,
					needsVerification,
				},
			});

			showSnackbar("Registro exitoso", "success");
			return { email, isLoggedIn: !needsVerification, needsVerification };
		} catch (error) {
			showSnackbar("Error en el registro", "error");
			throw error;
		}
	};

	// Verificar código
	const verifyCode = async (email: string, code: string): Promise<boolean> => {
		try {
			const response = await axios.post<VerifyCodeResponse>(`${process.env.REACT_APP_BASE_URL}/api/auth/verify-code`, { email, code });

			if (response.data.success) {
				setNeedsVerification(false);
				showSnackbar("Cuenta verificada con éxito", "success");
				return true;
			} else {
				throw new Error(response.data.message || "Error de verificación");
			}
		} catch (error) {
			const errorMessage = axios.isAxiosError(error)
				? (error.response?.data as any)?.message || "Error al verificar el código"
				: "Error al verificar el código";

			showSnackbar(errorMessage, "error");
			throw error;
		}
	};

	// Restablecer contraseña
	const resetPassword = async (email: string): Promise<void> => {
		try {
			await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/reset-request`, { email });
			showSnackbar("Instrucciones enviadas a tu correo", "success");
		} catch (error) {
			showSnackbar("Error al solicitar restablecimiento de contraseña", "error");
			throw error;
		}
	};

	// Actualizar perfil
	const updateProfile = async (userData: Partial<UserProfile>): Promise<void> => {
		try {
			const response = await axios.put<{ user: UserProfile }>(`${process.env.REACT_APP_BASE_URL}/api/auth/update-profile`, userData);

			const { user } = response.data;

			localDispatch({ type: LOGIN, payload: { isLoggedIn: true, user } });
			reduxDispatch({ type: LOGIN, payload: { isLoggedIn: true, user } });

			showSnackbar("Perfil actualizado correctamente", "success");
		} catch (error) {
			showSnackbar("Error al actualizar el perfil", "error");
			throw error;
		}
	};

	// Helpers para estado
	const setIsLoggedIn = (value: boolean) => {
		localDispatch({
			type: value ? LOGIN : LOGOUT,
			payload: { isLoggedIn: value },
		});
	};

	const setNeedsVerification = (value: boolean) => {
		localDispatch({
			type: LOGIN,
			payload: {
				isLoggedIn: state.isLoggedIn,
				needsVerification: value,
			},
		});
	};

	const setNewPassword = async (email: string, code: string, newPassword: string): Promise<boolean> => {
		try {
			const response = await axios.post<{ success: boolean; message: string }>(`${process.env.REACT_APP_BASE_URL}/api/auth/reset`, {
				email,
				code,
				newPassword,
			});

			if (response.data.success) {
				showSnackbar("Contraseña restablecida correctamente", "success");
				return true;
			} else {
				throw new Error(response.data.message || "Error al restablecer la contraseña");
			}
		} catch (error) {
			const errorMessage = axios.isAxiosError(error)
				? (error.response?.data as any)?.message || "Error al restablecer la contraseña"
				: "Error al restablecer la contraseña";

			showSnackbar(errorMessage, "error");
			throw error;
		}
	};

	const verifyResetCode = async (email: string, code: string): Promise<boolean> => {
		try {
			const response = await axios.post<{ success: boolean; message: string }>(`${process.env.REACT_APP_BASE_URL}/api/auth/verify-code`, {
				email,
				code,
			});

			if (response.data.success) {
				showSnackbar("Código verificado correctamente", "success");
				return true;
			} else {
				throw new Error(response.data.message || "Error al verificar el código");
			}
		} catch (error) {
			const errorMessage = axios.isAxiosError(error)
				? (error.response?.data as any)?.message || "Error al verificar el código"
				: "Error al verificar el código";

			showSnackbar(errorMessage, "error");
			throw error;
		}
	};

	if (!state.isInitialized) {
		return <Loader />;
	}

	return (
		<AuthContext.Provider
			value={{
				...state,
				isGoogleLoggedIn,
				login,
				logout,
				register,
				verifyCode,
				resetPassword,
				updateProfile,
				loginWithGoogle,
				setIsLoggedIn,
				setNeedsVerification,
				handleLogoutAndRedirect,
				verifyResetCode,
				setNewPassword,
			}}
		>
			{children}
			<UnauthorizedModal
				open={showUnauthorizedModal}
				onClose={() => setShowUnauthorizedModal(false)}
				onLogin={login}
				onGoogleLogin={loginWithGoogle}
				onLogout={handleLogoutAndRedirect}
			/>
		</AuthContext.Provider>
	);
};

export default AuthContext;
