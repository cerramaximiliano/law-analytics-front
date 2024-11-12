import { createContext, useEffect, useReducer, ReactElement, useState } from "react";
import axios from "axios";
import { googleLogout } from "@react-oauth/google";
import { dispatch as reduxDispatch } from "store";
import { LOGIN, LOGOUT, REGISTER } from "store/reducers/actions";
import authReducer from "store/reducers/auth";
import Loader from "components/Loader";
import { AuthProps, ServerContextType } from "types/auth";

const initialState: AuthProps = {
	isLoggedIn: false,
	isInitialized: false,
	user: null,
	needsVerification: false,
	email: "",
};

// Definir el contexto de autenticación
const ServerAuthContext = createContext<ServerContextType | null>(null);

const setSession = (serviceToken?: string | null) => {
	if (serviceToken) {
		localStorage.setItem("serviceToken", serviceToken);
		axios.defaults.headers.common.Authorization = `Bearer ${serviceToken}`;
	} else {
		localStorage.removeItem("serviceToken");
		delete axios.defaults.headers.common.Authorization;
	}
};

export const ServerAuthProvider = ({ children }: { children: ReactElement }) => {
	const [state, localDispatch] = useReducer(authReducer, initialState);
	const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(false);

	const loginWithGoogle = async (tokenResponse: any) => {
		try {
			const credential = tokenResponse.credential;
			if (credential) {
				const result = await fetch(`${process.env.REACT_APP_BASE_URL}/api/auth/google`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify({
						token: credential,
					}),
				});
				const data = await result.json();
				if (data.success) {
					setIsGoogleLoggedIn(true);
					localStorage.setItem("googleToken", credential);
					setSession(data.serviceToken);
					localDispatch({ type: LOGIN, payload: { isLoggedIn: true } });
					reduxDispatch({ type: LOGIN, payload: { isLoggedIn: true, user: data.user } });
				} else {
					throw new Error("No se pudo autenticar. Intenta nuevamente.");
				}
			}
		} catch (error) {
			console.error("Error:", error);
			throw error;
		}
	};

	useEffect(() => {
		const init = async () => {
			const googleToken = localStorage.getItem("googleToken");
			const serviceToken = localStorage.getItem("serviceToken");
			try {
				if (googleToken || serviceToken) {
					setSession(serviceToken || googleToken);
					setIsGoogleLoggedIn(!!googleToken);

					const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/auth/me`);
					const { user } = response.data;

					localDispatch({ type: LOGIN, payload: { isLoggedIn: true, user } });
					reduxDispatch({ type: LOGIN, payload: { isLoggedIn: true, user } });
				} else {
					localDispatch({ type: LOGOUT });
					reduxDispatch({ type: LOGOUT });
				}
			} catch (error) {
				if (axios.isAxiosError(error)) {
					console.error("Axios Error: ", error.message);

					// Puedes manejar diferentes códigos de error
					if (error.response && error.response.status === 401) {
						console.error("Authentication failed, logging out...");
					} else {
						console.error("An unexpected Axios error occurred:", error.response?.status);
					}
				} else {
					console.error("An unexpected error occurred:", error);
				}

				// Realiza el logout tanto en local como en Redux al ocurrir cualquier error
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
				needsVerification: value,
			},
		});
	};

	const login = async (email: string, password: string) => {
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/login`, { email, password });
		const { serviceToken, user } = response.data;
		setSession(serviceToken);
		console.log(user, serviceToken);
		localDispatch({ type: LOGIN, payload: { isLoggedIn: true, user } });
		reduxDispatch({ type: LOGIN, payload: { isLoggedIn: true, user } });
	};

	const register = async (email: string, password: string, firstName: string, lastName: string) => {
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/register`, { email, password, firstName, lastName });
		const { user, needsVerification } = response.data;

		localDispatch({ type: REGISTER, payload: { isLoggedIn: false, user, email, needsVerification } });
		reduxDispatch({ type: REGISTER, payload: { isLoggedIn: false, user, email, needsVerification } });
		return { email, isLoggedIn: false, needsVerification };
	};

	const logout = () => {
		setSession(null);
		if (isGoogleLoggedIn) {
			googleLogout();
			setIsGoogleLoggedIn(false);
			localStorage.removeItem("googleToken");
		}
		localDispatch({ type: LOGOUT });
		reduxDispatch({ type: LOGOUT });
	};

	const resetPassword = async (email: string) => {
		await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/reset-password`, { email });
	};

	const updateProfile = async (userData: any) => {
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/auth/update-profile`, userData);
		const { user } = response.data;

		localDispatch({ type: LOGIN, payload: { isLoggedIn: true, user } });
		reduxDispatch({ type: LOGIN, payload: { isLoggedIn: true, user } });
	};

	if (!state.isInitialized) {
		return <Loader />;
	}

	return (
		<ServerAuthContext.Provider
			value={{
				...state,
				isGoogleLoggedIn,
				login,
				logout,
				register,
				resetPassword,
				updateProfile,
				loginWithGoogle,
				setIsLoggedIn,
				setNeedsVerification,
			}}
		>
			{children}
		</ServerAuthContext.Provider>
	);
};

export default ServerAuthContext;
