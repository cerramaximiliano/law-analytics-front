// action - state management
import { REGISTER, LOGIN, LOGOUT, UPDATE_PICTURE, UPDATE_USER, CHANGE_PASSWORD_SUCCESS, SET_NEEDS_VERIFICATION } from "./actions";
import axios from "axios";

// types
import { AuthProps, AuthActionProps } from "types/auth";
import { RootState } from "store";
import { Dispatch } from "redux";
import { openSnackbar } from "store/reducers/snackbar";
import { UserProfile } from "types/auth";
import { Subscription } from "types/user";

// initial state
export const initialState: AuthProps = {
	isLoggedIn: false,
	isInitialized: true, // Cambiar a true por defecto
	user: null, // Cambiar a null en lugar de objeto vacío
	email: "",
	needsVerification: false,
	subscription: null,
};

// ==============================|| AUTH REDUCER ||============================== //

const auth = (state = initialState, action: AuthActionProps) => {
	switch (action.type) {
		case REGISTER: {
			const { user, email, needsVerification, subscription } = action.payload!;
			return {
				...state,
				user,
				isInitialized: true,
				email,
				needsVerification: needsVerification || false,
				subscription: subscription || null,
			};
		}
		case LOGIN: {
			const { user, email, needsVerification, subscription } = action.payload!;
			return {
				...state,
				isLoggedIn: true,
				isInitialized: true,
				user,
				email, // Guarda el correo en el estado
				needsVerification: needsVerification || false,
				subscription: subscription || null,
			};
		}
		case UPDATE_PICTURE: {
			const { picture } = action.payload!;
			return {
				...state,
				user: {
					...(state.user || {}), // Usa un objeto vacío si `user` es null o undefined
					picture, // Actualiza la propiedad picture
				},
			};
		}
		case UPDATE_USER: {
			const payload = action.payload as { userData: Partial<UserProfile> };
			const { userData } = payload;
			return {
				...state,
				user: state.user
					? {
							...state.user,
							...userData,
					  }
					: (userData as UserProfile),
			};
		}
		case CHANGE_PASSWORD_SUCCESS: {
			// No necesitamos modificar el estado cuando se cambia la contraseña
			// pero podríamos agregar un indicador si fuera necesario
			return {
				...state,
				// passwordChanged: true (opcional)
			};
		}
		case SET_NEEDS_VERIFICATION: {
			return {
				...state,
				email: action.payload?.email || state.email,
				needsVerification: true,
			};
		}
		case LOGOUT: {
			return {
				...initialState,
				isInitialized: true,
			};
		}
		default: {
			return { ...state };
		}
	}
};

export default auth;

// ==============================|| ACTIONS ||============================== //
interface LoginPayload {
	user?: any;
	email?: string;
	needsVerification?: boolean;
	subscription?: Subscription;
}

interface PasswordChangeData {
	currentPassword: string;
	newPassword: string;
}

// Acción para obtener los datos de autenticación desde el store
export const fetchAuth = () => (dispatch: Dispatch, getState: () => RootState) => {
	// Obtiene los datos de autenticación desde el estado actual
	const { user, email, isLoggedIn, needsVerification } = getState().auth;
	return async () => {
		dispatch({
			type: LOGIN,
			payload: {
				user,
				email,
				isLoggedIn,
				needsVerification,
			},
		});
	};
};

// Acción para registrar al usuario en el estado sin hacer una llamada a la API
export const registerUser =
	(user: any, email: string, needsVerification: boolean = false) =>
	(dispatch: Dispatch) => {
		dispatch({
			type: REGISTER,
			payload: {
				user,
				email,
				needsVerification,
			},
		});
	};

// Acción para iniciar sesión y actualizar el estado usando los datos actuales del store
export const loginUser = (payload: LoginPayload) => (dispatch: Dispatch) => {
	dispatch({
		type: LOGIN,
		payload: {
			...payload,
			isLoggedIn: true,
		},
	});
};

export const updatePicture = (picture: string) => (dispatch: Dispatch) => {
	dispatch({
		type: UPDATE_PICTURE,
		payload: { picture },
	});
};

// NUEVA ACCIÓN: Actualizar usuario con llamada a la API
export const updateUser = (userData: any) => (dispatch: Dispatch) => {
	// Solo actualizar el estado con los datos recibidos
	dispatch({
		type: UPDATE_USER,
		payload: { userData },
	});
};

// Acción para actualizar el perfil del usuario con llamada a la API
export const updateUserProfile = (profileData: any) => async (dispatch: Dispatch, getState: () => RootState) => {
	try {
		// Realizar la llamada a la API
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/auth/update`, profileData, {
			withCredentials: true,
		});

		// Si la actualización fue exitosa
		if (response.data && response.data.success) {
			// Obtener los datos actualizados del usuario
			const userData = response.data.data;

			// Verificar si hay un puntaje de completitud en la respuesta
			// Si no existe, calcularlo manualmente basado en los campos completados
			if (userData && !userData.profileCompletionScore) {
				// Array de campos requeridos para un perfil completo
				const requiredFields = ["firstName", "lastName", "email", "dob", "contact", "designation", "address", "country", "state"];

				// Contar cuántos campos están completos
				const completedFields = requiredFields.filter((field) => userData[field] && userData[field].toString().trim() !== "").length;

				// Calcular porcentaje de completitud
				const completionScore = Math.round((completedFields / requiredFields.length) * 100);

				// Añadir el puntaje calculado a los datos del usuario
				userData.profileCompletionScore = completionScore;
			}

			// Actualizar el estado con los datos actualizados
			dispatch({
				type: UPDATE_USER,
				payload: { userData },
			});

			// Mostrar mensaje de éxito
			dispatch(
				openSnackbar({
					open: true,
					message: "Perfil actualizado satisfactoriamente",
					variant: "alert",
					alert: {
						color: "success",
					},
					close: false,
				}),
			);

			return response.data;
		} else {
			throw new Error(response.data.message || "Error al actualizar el perfil");
		}
	} catch (error: any) {
		console.error("Error al actualizar el perfil:", error);

		// Mostrar mensaje de error
		dispatch(
			openSnackbar({
				open: true,
				message: error.response?.data?.message || error.message || "Error al actualizar el perfil",
				variant: "alert",
				alert: {
					color: "error",
				},
				close: false,
			}),
		);

		throw error;
	}
};
// Acción para cambiar la contraseña del usuario
export const changeUserPassword = (passwordData: PasswordChangeData) => async (dispatch: Dispatch) => {
	try {
		// Realizar la llamada a la API
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/auth/change-password`, passwordData, {
			headers: {
				"Content-Type": "application/json",
			},
			withCredentials: true,
		});

		// Si el cambio fue exitoso
		if (response.data && response.data.success) {
			// Despachar acción de éxito
			dispatch({
				type: CHANGE_PASSWORD_SUCCESS,
			});

			// Mostrar mensaje de éxito
			dispatch(
				openSnackbar({
					open: true,
					message: "Contraseña actualizada correctamente",
					variant: "alert",
					alert: {
						color: "success",
					},
					close: false,
				}),
			);

			return response.data;
		} else {
			throw new Error(response.data.message || "Error al cambiar la contraseña");
		}
	} catch (error: any) {
		console.error("Error al cambiar la contraseña:", error);

		// Mostrar mensaje de error
		dispatch(
			openSnackbar({
				open: true,
				message: error.response?.data?.message || error.message || "Error al cambiar la contraseña",
				variant: "alert",
				alert: {
					color: "error",
				},
				close: false,
			}),
		);

		throw error;
	}
};

// Acción para cerrar sesión
export const logoutUser = () => (dispatch: Dispatch) => {
	dispatch({ type: LOGOUT });
};

// Acción para establecer que el usuario necesita verificación
export const setNeedsVerification = (email: string) => (dispatch: Dispatch) => {
	dispatch({
		type: SET_NEEDS_VERIFICATION,
		payload: { email },
	});
};
