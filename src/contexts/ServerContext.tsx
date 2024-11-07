import { createContext, useEffect, useReducer, ReactElement } from "react";
import axios from "axios";

// Importar acciones y reducer para autenticación
import { dispatch as reduxDispatch } from "store";
import { LOGIN, LOGOUT, REGISTER } from "store/reducers/actions";
import authReducer from "store/reducers/auth";
import Loader from "components/Loader";
import { AuthProps, ServerContextType } from "types/auth";

const initialState: AuthProps = {
	isLoggedIn: false,
	isInitialized: false,
	user: null,
	needsVerification: false, // Agrega esta propiedad
	email: "",
};

// Definir el contexto de autenticación
const ServerAuthContext = createContext<ServerContextType | null>(null);

// Configurar la sesión
const setSession = (serviceToken?: string | null) => {
	if (serviceToken) {
		localStorage.setItem("serviceToken", serviceToken);
		axios.defaults.headers.common.Authorization = `Bearer ${serviceToken}`;
	} else {
		localStorage.removeItem("serviceToken");
		delete axios.defaults.headers.common.Authorization;
	}
};

// Proveedor del contexto de autenticación
export const ServerAuthProvider = ({ children }: { children: ReactElement }) => {
	const [state, localDispatch] = useReducer(authReducer, initialState);

	useEffect(() => {
		const init = async () => {
			try {
				const serviceToken = localStorage.getItem("serviceToken");
				if (serviceToken) {
					setSession(serviceToken);
					const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/auth/me`);
					const { user } = response.data;

					// Actualizar estado local y Redux
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
				} else {
					localDispatch({ type: LOGOUT });
					reduxDispatch({ type: LOGOUT });
				}
			} catch (err) {
				console.error("Error durante la inicialización de autenticación", err);
				localDispatch({ type: LOGOUT });
				reduxDispatch({ type: LOGOUT });
			}
		};

		init();
	}, []);

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
				needsVerification: value 
			},
		});
	};

	const login = async (email: string, password: string) => {
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/login`, { email, password });
		const { serviceToken, user } = response.data;
		setSession(serviceToken);

		// Actualizar estado local y Redux
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
	};

	const register = async (email: string, password: string, firstName: string, lastName: string) => {
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/register`, {
			email,
			password,
			firstName,
			lastName,
		});
		const { user, needsVerification } = response.data;

		console.log("Datos de registro:", user, email, needsVerification); // Verifica que estos datos existan

		localDispatch({
			type: REGISTER,
			payload: {
				isLoggedIn: false,
				user,
				email,
				needsVerification: needsVerification || false,
			},
		});

		reduxDispatch({
			type: REGISTER,
			payload: {
				isLoggedIn: false,
				user,
				email,
				needsVerification: needsVerification || false,
			},
		});
		return { email, isLoggedIn: false, needsVerification: needsVerification || false };
	};

	const logout = () => {
		setSession(null);

		// Actualizar estado local y Redux
		localDispatch({ type: LOGOUT });
		reduxDispatch({ type: LOGOUT });
	};

	const resetPassword = async (email: string) => {
		await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/reset-password`, { email });
	};

	const updateProfile = async (userData: any) => {
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/auth/update-profile`, userData);
		const { user } = response.data;

		// Actualizar estado local y Redux
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
	};

	if (state.isInitialized !== undefined && !state.isInitialized) {
		return <Loader />;
	}

	return (
		<ServerAuthContext.Provider
			value={{ ...state, login, logout, register, resetPassword, updateProfile, setIsLoggedIn, setNeedsVerification }}
		>
			{children}
		</ServerAuthContext.Provider>
	);
};

export default ServerAuthContext;
