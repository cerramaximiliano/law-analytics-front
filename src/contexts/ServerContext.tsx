import { createContext, useEffect, useReducer, ReactElement } from "react";
import axios from "axios";

// Importar acciones y reducer para autenticación
import { LOGIN, LOGOUT } from "store/reducers/actions";
import authReducer from "store/reducers/auth";
import Loader from "components/Loader";
import { AuthProps, ServerContextType } from "types/auth";

const initialState: AuthProps = {
	isLoggedIn: false,
	isInitialized: false,
	user: null,
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

// Proveedor del contexto de autenticación con base de datos propia
export const ServerAuthProvider = ({ children }: { children: ReactElement }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	useEffect(() => {
		const init = async () => {
			try {
				const serviceToken = localStorage.getItem("serviceToken");
				if (serviceToken) {
					setSession(serviceToken);
					// Solicitar los datos del usuario desde el servidor
					const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/auth/me`);
					const { user } = response.data;

					dispatch({
						type: LOGIN,
						payload: {
							isLoggedIn: true,
							user,
						},
					});
				} else {
					dispatch({ type: LOGOUT });
				}
			} catch (err) {
				console.error("Error durante la inicialización de autenticación", err);
				dispatch({ type: LOGOUT });
			}
		};

		init();
	}, []);

	const login = async (email: string, password: string) => {
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/login`, { email, password });
		console.log("response")
		const { serviceToken, user } = response.data;
		setSession(serviceToken);
		dispatch({
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
		const { serviceToken, user } = response.data;
		setSession(serviceToken);
		dispatch({
			type: LOGIN,
			payload: {
				isLoggedIn: true,
				user,
			},
		});
	};

	const logout = () => {
		setSession(null);
		dispatch({ type: LOGOUT });
	};

	const resetPassword = async (email: string) => {
		await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/reset-password`, { email });
	};

	const updateProfile = async (userData: any) => {
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/auth/update-profile`, userData);
		const { user } = response.data;
		dispatch({
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
		<ServerAuthContext.Provider value={{ ...state, login, logout, register, resetPassword, updateProfile }}>
			{children}
		</ServerAuthContext.Provider>
	);
};

export default ServerAuthContext;
