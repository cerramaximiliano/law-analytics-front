// action - state management
import { REGISTER, LOGIN, LOGOUT } from "./actions";

// types
import { AuthProps, AuthActionProps } from "types/auth";

// initial state
export const initialState: AuthProps = {
	isLoggedIn: false,
	isInitialized: false,
	user: null,
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
