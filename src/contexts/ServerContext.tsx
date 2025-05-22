import { createContext, useEffect, useReducer, ReactElement, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { googleLogout } from "@react-oauth/google";
import { CredentialResponse } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { LOGIN, LOGOUT, REGISTER, SET_NEEDS_VERIFICATION } from "store/reducers/actions";
import { openSnackbar } from "store/reducers/snackbar";
import authReducer from "store/reducers/auth";
import Loader from "components/Loader";
import { UnauthorizedModal } from "../sections/auth/UnauthorizedModal";
import { LimitErrorModal } from "../sections/auth/LimitErrorModal";
import { AuthProps, ServerContextType, UserProfile, LoginResponse, RegisterResponse, VerifyCodeResponse } from "../types/auth";
import { Subscription } from "../types/user";
import { fetchUserStats } from "store/reducers/userStats";
import { AppDispatch } from "store";

// Global setting for hiding international banking data
export const HIDE_INTERNATIONAL_BANKING_DATA = process.env.REACT_APP_HIDE_BANKING_DATA === "true";

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
	const [showLimitErrorModal, setShowLimitErrorModal] = useState<boolean>(false);
	const [limitErrorData, setLimitErrorData] = useState<any>({});
	const [hasPlanRestrictionError, setHasPlanRestrictionError] = useState<boolean>(false);
	const navigate = useNavigate();
	const location = useLocation();
	const [isLogoutProcess, setIsLogoutProcess] = useState(false);
	const reduxDispatch = useDispatch<AppDispatch>();

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
				console.log("Enviando token a la API:", credential);
				const result = await axios.post<LoginResponse>(`${process.env.REACT_APP_BASE_URL}/api/auth/google`, { token: credential });

				const { user, success, subscription } = result.data;

				if (success) {
					setIsGoogleLoggedIn(true);
					localStorage.setItem("googleToken", credential);

					localDispatch({
						type: LOGIN,
						payload: {
							isLoggedIn: true,
							user,
							subscription,
						},
					});

					reduxDispatch({
						type: LOGIN,
						payload: {
							isLoggedIn: true,
							user,
							subscription,
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
				const response = await axios.get<{ user: UserProfile; subscription?: Subscription }>(
					`${process.env.REACT_APP_BASE_URL}/api/auth/me`,
				);
				const { user, subscription } = response.data;

				localDispatch({
					type: LOGIN,
					payload: {
						isLoggedIn: true,
						user,
						isInitialized: true,
						subscription,
					},
				});

				reduxDispatch({
					type: LOGIN,
					payload: {
						isLoggedIn: true,
						user,
						isInitialized: true,
						subscription,
					},
				});

				reduxDispatch(fetchUserStats());
			} catch (error) {
				// No redirigir al login, solo inicializar el estado como logged out
				// Solo mostrar errores que no sean 401 para evitar ruido en los logs durante el registro
				if (axios.isAxiosError(error) && error.response?.status !== 401) {
					console.log("Error en la inicialización:", error);
				}

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
					!url.includes("/api/auth/logout") &&
					!url.includes("/api/auth/me") // Excluir /api/auth/me para evitar problemas en registro
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

							setShowUnauthorizedModal(true);

							return Promise.reject(refreshError);
						}
					} else {
						// Si no necesita refresh, solo mostrar el modal
						console.log("[Interceptor] Mostrando modal sin intentar refresh");
						setShowUnauthorizedModal(true);
					}
				}

				// Manejar errores 403 (límites de plan)
				if (error.response?.status === 403) {
					console.log("[Interceptor] Detectado error 403 en:", url, error.response?.data);

					const responseData = error.response.data as any;

					// Verificar si es un error de límite o de característica
					// Condición más amplia para capturar diferentes formatos de respuesta
					if (
						responseData.limitInfo ||
						responseData.featureInfo ||
						responseData.upgradeRequired ||
						responseData.message?.includes("característica") ||
						responseData.message?.includes("plan") ||
						(responseData.success === false && responseData.data && responseData.data.feature)
					) {
						// Analizar si la respuesta tiene estructura específica de feature
						let featureInfo = responseData.featureInfo;
						if (responseData.data && responseData.data.feature) {
							featureInfo = {
								feature: responseData.data.feature || "Característica premium",
								plan: responseData.data.currentPlan || "Tu plan actual",
								availableIn: responseData.data.requiredPlan ? [responseData.data.requiredPlan] : ["Plan premium"],
							};
						}

						setLimitErrorData({
							message: responseData.message || "Esta característica no está disponible en tu plan actual",
							limitInfo: responseData.limitInfo,
							featureInfo: featureInfo,
							upgradeRequired: responseData.upgradeRequired || true,
						});

						// 1. Primero capturamos todos los diálogos abiertos en este momento
						// para cerrarlos específicamente y no afectar a otros componentes
						const openDialogsBeforeError = Array.from(document.querySelectorAll(".MuiDialog-root"));
						console.log(`[Interceptor] Capturando ${openDialogsBeforeError.length} diálogos abiertos antes de mostrar error de plan`);

						// 2. Marcar que estamos en medio de un error de restricción del plan ANTES de cualquier otra acción
						// Esto es importante para que otros componentes lo detecten y actúen en consecuencia
						setHasPlanRestrictionError(true);

						// 3. Emitir evento personalizado para componentes que tengan manejadores específicos
						// Esto permite a los componentes como LinkToJudicialPower cancelar sus operaciones
						const planRestrictionEvent = new CustomEvent("planRestrictionError", {
							detail: {
								message: responseData.message,
								feature: responseData.data?.feature || null,
								timestamp: Date.now(),
								// Añadir información sobre los diálogos que se encontraban abiertos
								openDialogsCount: openDialogsBeforeError.length,
							},
						});
						console.log("[Interceptor] Emitiendo evento planRestrictionError");
						window.dispatchEvent(planRestrictionEvent);

						// 4. CAMBIO DE ENFOQUE: NO cerrar modales directamente para evitar efectos secundarios
						// Este método anterior está provocando problemas al hacer clic en botones
						console.log(`[Interceptor] NO se cerrarán modales directamente para evitar efectos secundarios`);

						// Crear propiedad global para forzar cierre de modales
						// Los componentes individuales deberán observar esta propiedad y cerrar sus propios modales
						window.FORCE_CLOSE_ALL_MODALS = true;

						// Programar la limpieza del estado global después de un tiempo suficiente
						setTimeout(() => {
							console.log("[Interceptor] Limpiando flag global FORCE_CLOSE_ALL_MODALS");
							window.FORCE_CLOSE_ALL_MODALS = false;
						}, 2000);

						// 5. Esperar un poco antes de mostrar el modal de restricción del plan
						// para permitir que todos los diálogos se cierren correctamente
						setTimeout(() => {
							console.log("[Interceptor] Mostrando modal de restricción del plan");
							setShowLimitErrorModal(true);

							// 6. Programar reinicio del estado después de que se maneje todo
							setTimeout(() => {
								setHasPlanRestrictionError(false);
							}, 3000);
						}, 300);
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

			const { user, subscription } = response.data;

			localDispatch({
				type: LOGIN,
				payload: {
					isLoggedIn: true,
					user,
					subscription,
				},
			});

			reduxDispatch({
				type: LOGIN,
				payload: {
					isLoggedIn: true,
					user,
					subscription,
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
			console.log("Iniciando registro para:", email);
			const response = await axios.post<RegisterResponse>(`${process.env.REACT_APP_BASE_URL}/api/auth/register`, {
				email,
				password,
				firstName,
				lastName,
			});

			console.log("Respuesta registro:", response.data);
			// Siempre necesitará verificación para nuevos registros
			const { user } = response.data;

			// Actualizar el estado local primero
			localDispatch({
				type: REGISTER,
				payload: {
					isLoggedIn: false, // Siempre false hasta que se verifique
					user,
					email,
					needsVerification: true,
				},
			});

			// Luego actualizar el estado global de Redux
			reduxDispatch({
				type: REGISTER,
				payload: {
					isLoggedIn: false, // Siempre false hasta que se verifique
					user,
					email,
					needsVerification: true,
				},
			});

			// Verificación adicional: usar la acción específica para asegurar que needsVerification sea true
			reduxDispatch({
				type: SET_NEEDS_VERIFICATION,
				payload: { email },
			});

			showSnackbar("Registro exitoso", "success");
			console.log("Registro completado, needsVerification:", true);
			return { email, isLoggedIn: false, needsVerification: true };
		} catch (error) {
			showSnackbar("Error en el registro", "error");
			throw error;
		}
	};

	// Verificar código
	const verifyCode = async (email: string, code: string): Promise<any> => {
		try {
			// Enviar email y code directamente al endpoint verify-code
			const response = await axios.post<VerifyCodeResponse>(`${process.env.REACT_APP_BASE_URL}/api/auth/verify-code`, {
				email,
				code,
			});

			if (response.data.success) {
				// Extraer el objeto usuario si está disponible en la respuesta
				const userData = response.data.user;
				const subscription = response.data.subscription;

				if (userData) {
					console.log("Datos de usuario obtenidos después de la verificación:", userData);
					console.log("Datos de suscripción obtenidos después de la verificación:", subscription);

					// Actualizar el estado con los datos del usuario
					localDispatch({
						type: LOGIN,
						payload: {
							isLoggedIn: true,
							user: userData,
							needsVerification: false,
							subscription,
						},
					});

					// También actualizar el estado global de Redux
					reduxDispatch({
						type: LOGIN,
						payload: {
							isLoggedIn: true,
							user: userData,
							needsVerification: false,
							subscription,
						},
					});

					// Cargar estadísticas de usuario si es necesario
					reduxDispatch(fetchUserStats());
				}

				setNeedsVerification(false);
				showSnackbar("Cuenta verificada con éxito", "success");

				// Devolver los datos completos de la respuesta para que el componente
				// pueda acceder a los datos del usuario si es necesario
				return response.data;
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
			console.log("Verificando código de reseteo para:", email);

			const response = await axios.post<{ success: boolean; message: string }>(
				`${process.env.REACT_APP_BASE_URL}/api/auth/verify-reset-code`,
				{
					email,
					code,
				},
			);

			if (response.data.success) {
				showSnackbar("Código verificado correctamente", "success");
				return true;
			} else {
				throw new Error(response.data.message || "Error al verificar el código");
			}
		} catch (error) {
			console.error("Error al verificar código de reseteo:", error);

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
				hasPlanRestrictionError,
				hideInternationalBankingData: HIDE_INTERNATIONAL_BANKING_DATA,
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
			<LimitErrorModal
				open={showLimitErrorModal}
				onClose={() => setShowLimitErrorModal(false)}
				message={limitErrorData.message}
				limitInfo={limitErrorData.limitInfo}
				featureInfo={limitErrorData.featureInfo}
				upgradeRequired={limitErrorData.upgradeRequired}
			/>
		</AuthContext.Provider>
	);
};

export default AuthContext;
