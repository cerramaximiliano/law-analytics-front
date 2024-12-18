// action - state management
import { REGISTER, LOGIN, LOGOUT, UPDATE_PICTURE } from "./actions";

// types
import { AuthProps, AuthActionProps } from "types/auth";
import { RootState } from "store";
import { Dispatch } from "redux";

// initial state
export const initialState: AuthProps = {
	isLoggedIn: false,
	isInitialized: false,
	user: {},
	email: "",
	needsVerification: false,
};

// ==============================|| AUTH REDUCER ||============================== //

const auth = (state = initialState, action: AuthActionProps) => {
	switch (action.type) {
		case REGISTER: {
			const { user, email, needsVerification } = action.payload!;
			return {
				...state,
				user,
				email, // Guarda el correo en el estado
				needsVerification: needsVerification || false,
			};
		}
		case LOGIN: {
			const { user, email, needsVerification } = action.payload!;
			return {
				...state,
				isLoggedIn: true,
				isInitialized: true,
				user,
				email, // Guarda el correo en el estado
				needsVerification: needsVerification || false,
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
		case LOGOUT: {
			return {
				...state,
				isInitialized: true,
				isLoggedIn: false,
				user: null,
				email: "", // Limpia el correo al hacer logout
				needsVerification: false,
			};
		}
		default: {
			return { ...state };
		}
	}
};

export default auth;

// ==============================|| ACTIONS ||============================== //

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
export const registerUser = (user: any, email: string, needsVerification: boolean) => (dispatch: Dispatch) => {
	dispatch({
		type: REGISTER,
		payload: { user, email, needsVerification },
	});
};

// Acción para iniciar sesión y actualizar el estado usando los datos actuales del store
export const loginUser = () => (dispatch: Dispatch, getState: () => RootState) => {
	// Obtiene los datos de autenticación actuales desde el estado
	const { user, email } = getState().auth;

	dispatch({
		type: LOGIN,
		payload: {
			user,
			email,
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

// Acción para cerrar sesión
export const logoutUser = () => (dispatch: Dispatch) => {
	dispatch({ type: LOGOUT });
};
