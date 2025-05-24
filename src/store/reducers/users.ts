import userApi from "../../utils/userApi";
import { dispatch } from "../index";

// TYPES

// ACTION TYPES
export const SET_USERS = "@users/SET_USERS";
export const SET_USER = "@users/SET_USER";
export const SET_LOADING = "@users/SET_LOADING";
export const SET_ERROR = "@users/SET_ERROR";
export const UPDATE_USER = "@users/UPDATE_USER";
export const DELETE_USER = "@users/DELETE_USER";
export const SET_LIGHT_DATA = "@users/SET_LIGHT_DATA";
export const CLEAR_USER_DATA = "@users/CLEAR_USER_DATA";

export interface UsersStateProps {
	users: any[];
	user: any | null;
	lightData: any | null;
	loading: boolean;
	error: object | string | null;
}

export const initialState: UsersStateProps = {
	users: [],
	user: null,
	lightData: null,
	loading: false,
	error: null,
};

// Datos de ejemplo para usar si la API no devuelve datos
const mockUsers = [
	{
		id: "1",
		name: "John Doe",
		email: "john.doe@example.com",
		role: "ADMIN_ROLE",
		status: "active",
		lastLogin: "2023-01-01T10:30:00Z",
		createdAt: "2022-01-01T10:00:00Z",
		updatedAt: "2023-01-01T10:30:00Z",
	},
	{
		id: "2",
		name: "Jane Smith",
		email: "jane.smith@example.com",
		role: "USER_ROLE",
		status: "active",
		lastLogin: "2023-02-15T14:20:00Z",
		createdAt: "2022-02-10T09:00:00Z",
		updatedAt: "2023-02-15T14:20:00Z",
	},
	{
		id: "3",
		name: "Robert Johnson",
		email: "robert.johnson@example.com",
		role: "USER_ROLE",
		status: "inactive",
		lastLogin: "2022-12-10T08:45:00Z",
		createdAt: "2022-03-05T11:30:00Z",
		updatedAt: "2023-03-01T16:40:00Z",
	},
	{
		id: "4",
		name: "Maria García",
		email: "maria.garcia@example.com",
		role: "ADMIN_ROLE",
		status: "active",
		lastLogin: "2023-03-20T09:15:00Z",
		createdAt: "2022-04-12T13:20:00Z",
		updatedAt: "2023-03-20T09:15:00Z",
	},
	{
		id: "5",
		name: "Carlos Rodríguez",
		email: "carlos.rodriguez@example.com",
		role: "USER_ROLE",
		status: "pending",
		createdAt: "2022-05-18T10:10:00Z",
		updatedAt: "2022-05-18T10:10:00Z",
	},
];

// Reducer
const users = (state = initialState, action: any) => {
	switch (action.type) {
		case SET_USERS:
			return {
				...state,
				users: action.payload,
			};
		case SET_USER:
			console.log("=== REDUX: SET_USER ACTION ===");
			console.log("Payload:", action.payload);
			return {
				...state,
				user: action.payload,
			};
		case UPDATE_USER:
			// Actualizar el usuario tanto en la lista de usuarios como en el usuario activo
			return {
				...state,
				user: action.payload,
				users: state.users.map((user: any) => (user.id === action.payload.id ? action.payload : user)),
			};
		case DELETE_USER:
			// Eliminar el usuario de la lista
			return {
				...state,
				users: state.users.filter((user: any) => user.id !== action.payload),
				// Si el usuario activo es el eliminado, limpiarlo
				user: state.user && state.user.id === action.payload ? null : state.user,
			};
		case SET_LOADING:
			return {
				...state,
				loading: action.payload,
			};
		case SET_ERROR:
			return {
				...state,
				error: action.payload,
			};
		case SET_LIGHT_DATA:
			console.log("=== REDUX: SET_LIGHT_DATA ACTION ===");
			console.log("Payload:", action.payload);
			return {
				...state,
				lightData: action.payload,
			};
		case CLEAR_USER_DATA:
			return {
				...state,
				user: null,
				lightData: null,
			};
		default:
			return state;
	}
};

export default users;

// Actions
export const getUsers = () => {
	return async (dispatch: any) => {
		try {
			dispatch({
				type: SET_LOADING,
				payload: true,
			});
			dispatch({
				type: SET_ERROR,
				payload: null,
			});

			const response = await userApi.get("/api/users");
			console.log("Respuesta de la API de usuarios:", response.data);

			// Asegurarse de que estamos usando el formato correcto
			let userData = Array.isArray(response.data)
				? response.data
				: response.data.users
				? response.data.users
				: response.data.data
				? response.data.data
				: [];

			// Si no hay datos, usar datos de ejemplo
			if (!userData || userData.length === 0) {
				console.log("No se recibieron datos de la API, usando datos de ejemplo");
				userData = mockUsers;
			}

			dispatch({
				type: SET_USERS,
				payload: userData,
			});
		} catch (error) {
			console.error("Error al obtener usuarios:", error);

			// En caso de error, usar datos de ejemplo
			console.log("Error en la API, usando datos de ejemplo");
			dispatch({
				type: SET_USERS,
				payload: mockUsers,
			});

			dispatch({
				type: SET_ERROR,
				payload: error,
			});
		} finally {
			dispatch({
				type: SET_LOADING,
				payload: false,
			});
		}
	};
};

export const updateUser = (userId: string, userData: any) => {
	return async (dispatch: any) => {
		try {
			dispatch({
				type: SET_LOADING,
				payload: true,
			});
			dispatch({
				type: SET_ERROR,
				payload: null,
			});

			const response = await userApi.put(`/api/users/${userId}`, userData);
			console.log("Respuesta de actualización de usuario:", response.data);

			// Extraer el usuario actualizado dependiendo de la estructura de la respuesta
			const updatedUser = response.data.user || response.data;

			dispatch({
				type: UPDATE_USER,
				payload: updatedUser,
			});

			return updatedUser;
		} catch (error) {
			console.error("Error al actualizar usuario:", error);
			dispatch({
				type: SET_ERROR,
				payload: error,
			});
			throw error;
		} finally {
			dispatch({
				type: SET_LOADING,
				payload: false,
			});
		}
	};
};

export const deleteUser = (userId: string) => {
	return async (dispatch: any) => {
		try {
			dispatch({
				type: SET_LOADING,
				payload: true,
			});
			dispatch({
				type: SET_ERROR,
				payload: null,
			});

			await userApi.delete(`/api/users/${userId}`);
			console.log("Usuario eliminado:", userId);

			dispatch({
				type: DELETE_USER,
				payload: userId,
			});
		} catch (error) {
			console.error("Error al eliminar usuario:", error);
			dispatch({
				type: SET_ERROR,
				payload: error,
			});
			throw error;
		} finally {
			dispatch({
				type: SET_LOADING,
				payload: false,
			});
		}
	};
};

export const getUserById = (userId: string) => {
	return async (dispatch: any) => {
		console.log("getUserById called with userId:", userId);
		try {
			dispatch({
				type: SET_LOADING,
				payload: true,
			});
			dispatch({
				type: SET_ERROR,
				payload: null,
			});

			console.log("Making API request to:", `/api/users/${userId}?includeLightData=true`);
			const response = await userApi.get(`/api/users/${userId}?includeLightData=true`);
			console.log("Respuesta de la API de usuario por ID:", response.data);
			console.log("Response structure:", {
				hasSuccess: response.data.hasOwnProperty("success"),
				hasUser: response.data.hasOwnProperty("user"),
				hasLightData: response.data.hasOwnProperty("lightData"),
				hasSubscription: response.data.hasOwnProperty("subscription"),
			});

			// La API devuelve success, user, subscription y lightData
			if (response.data.success && response.data.user) {
				// Combinar user con subscription en un solo objeto
				const userData = {
					...response.data.user,
					subscription: response.data.subscription || undefined,
				};

				dispatch({
					type: SET_USER,
					payload: userData,
				});

				// Guardar lightData por separado
				if (response.data.lightData) {
					dispatch({
						type: SET_LIGHT_DATA,
						payload: response.data.lightData,
					});
				}
			} else {
				// Fallback para estructura antigua
				const userData = response.data.data ? response.data.data : response.data;
				dispatch({
					type: SET_USER,
					payload: userData,
				});
			}
		} catch (error) {
			console.error("Error al obtener usuario por ID:", error);

			// En caso de error, buscar en datos de ejemplo
			const mockUser = mockUsers.find((user) => user.id === userId) || null;
			if (mockUser) {
				console.log("Error en la API, usando datos de ejemplo para el usuario:", userId);
				dispatch({
					type: SET_USER,
					payload: mockUser,
				});
			}

			dispatch({
				type: SET_ERROR,
				payload: error,
			});
		} finally {
			dispatch({
				type: SET_LOADING,
				payload: false,
			});
		}
	};
};

export function getUsers_Static() {
	return async () => {
		try {
			dispatch({
				type: SET_LOADING,
				payload: true,
			});
			dispatch({
				type: SET_ERROR,
				payload: null,
			});

			const response = await userApi.get("/api/users");
			console.log("Respuesta de la API de usuarios (Static):", response.data);

			// Asegurarse de que estamos usando el formato correcto
			let userData = Array.isArray(response.data)
				? response.data
				: response.data.users
				? response.data.users
				: response.data.data
				? response.data.data
				: [];

			// Si no hay datos, usar datos de ejemplo
			if (!userData || userData.length === 0) {
				console.log("No se recibieron datos de la API (Static), usando datos de ejemplo");
				userData = mockUsers;
			}

			dispatch({
				type: SET_USERS,
				payload: userData,
			});
		} catch (error) {
			console.error("Error al obtener usuarios (Static):", error);

			// En caso de error, usar datos de ejemplo
			console.log("Error en la API (Static), usando datos de ejemplo");
			dispatch({
				type: SET_USERS,
				payload: mockUsers,
			});

			dispatch({
				type: SET_ERROR,
				payload: error,
			});
		} finally {
			dispatch({
				type: SET_LOADING,
				payload: false,
			});
		}
	};
}

export function getUserById_Static(userId: string) {
	return async () => {
		try {
			dispatch({
				type: SET_LOADING,
				payload: true,
			});
			dispatch({
				type: SET_ERROR,
				payload: null,
			});

			const response = await userApi.get(`/api/users/${userId}?includeLightData=true`);
			console.log("Respuesta de la API de usuario por ID (Static):", response.data);

			// La API devuelve success, user, subscription y lightData
			if (response.data.success && response.data.user) {
				// Combinar user con subscription en un solo objeto
				const userData = {
					...response.data.user,
					subscription: response.data.subscription || undefined,
				};

				dispatch({
					type: SET_USER,
					payload: userData,
				});

				// Guardar lightData por separado
				if (response.data.lightData) {
					dispatch({
						type: SET_LIGHT_DATA,
						payload: response.data.lightData,
					});
				}
			} else {
				// Fallback para estructura antigua
				const userData = response.data.data ? response.data.data : response.data;
				dispatch({
					type: SET_USER,
					payload: userData,
				});
			}
		} catch (error) {
			console.error("Error al obtener usuario por ID (Static):", error);

			// En caso de error, buscar en datos de ejemplo
			const mockUser = mockUsers.find((user) => user.id === userId) || null;
			if (mockUser) {
				console.log("Error en la API (Static), usando datos de ejemplo para el usuario:", userId);
				dispatch({
					type: SET_USER,
					payload: mockUser,
				});
			}

			dispatch({
				type: SET_ERROR,
				payload: error,
			});
		} finally {
			dispatch({
				type: SET_LOADING,
				payload: false,
			});
		}
	};
}

export const clearUserData = () => {
	return async () => {
		dispatch({
			type: CLEAR_USER_DATA,
		});
	};
};
