import axios, { AxiosError } from "axios";
import { Dispatch } from "redux";
import { PostalTrackingType, PostalTrackingState, PostalTrackingFilters, CreatePostalTrackingData, UpdatePostalTrackingData } from "types/postal-tracking";

// Action types
const SET_LOADING = "postalTracking/SET_LOADING";
const SET_ERROR = "postalTracking/SET_ERROR";
const SET_TRACKINGS = "postalTracking/SET_TRACKINGS";
const ADD_TRACKING = "postalTracking/ADD_TRACKING";
const UPDATE_TRACKING = "postalTracking/UPDATE_TRACKING";
const DELETE_TRACKING = "postalTracking/DELETE_TRACKING";
const SET_TRACKING_DETAIL = "postalTracking/SET_TRACKING_DETAIL";
const CLEAR_TRACKING_DETAIL = "postalTracking/CLEAR_TRACKING_DETAIL";

const initialState: PostalTrackingState = {
  trackings: [],
  tracking: null,
  isLoader: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
};

const postalTrackingReducer = (state = initialState, action: any): PostalTrackingState => {
  switch (action.type) {
    case SET_LOADING:
      return { ...state, isLoader: true, error: null };
    case SET_ERROR:
      return { ...state, isLoader: false, error: action.payload };
    case SET_TRACKINGS:
      return {
        ...state,
        trackings: action.payload.data,
        total: action.payload.count,
        page: action.payload.page,
        totalPages: action.payload.totalPages,
        isLoader: false,
      };
    case ADD_TRACKING:
      return {
        ...state,
        trackings: [action.payload, ...state.trackings],
        total: state.total + 1,
        isLoader: false,
      };
    case UPDATE_TRACKING:
      return {
        ...state,
        trackings: state.trackings.map((t) => (t._id === action.payload._id ? action.payload : t)),
        tracking: state.tracking?._id === action.payload._id ? action.payload : state.tracking,
        isLoader: false,
      };
    case DELETE_TRACKING:
      return {
        ...state,
        trackings: state.trackings.filter((t) => t._id !== action.payload),
        total: state.total - 1,
        isLoader: false,
      };
    case SET_TRACKING_DETAIL:
      return { ...state, tracking: action.payload, isLoader: false };
    case CLEAR_TRACKING_DETAIL:
      return { ...state, tracking: null };
    default:
      return state;
  }
};

const BASE_URL = `${import.meta.env.VITE_BASE_URL}/api/postal-tracking`;

export const fetchPostalTrackings = (filters: PostalTrackingFilters = {}) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: SET_LOADING });
    const response = await axios.get(BASE_URL, { params: filters });
    dispatch({ type: SET_TRACKINGS, payload: response.data });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al obtener los seguimientos" : "Error al obtener los seguimientos";
    dispatch({ type: SET_ERROR, payload: msg });
    return { success: false, error: msg };
  }
};

export const createPostalTracking = (data: CreatePostalTrackingData) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: SET_LOADING });
    const response = await axios.post(BASE_URL, data);
    dispatch({ type: ADD_TRACKING, payload: response.data.data });
    return { success: true, id: response.data.data._id as string };
  } catch (error: unknown) {
    const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al crear el seguimiento" : "Error al crear el seguimiento";
    dispatch({ type: SET_ERROR, payload: msg });
    return { success: false, error: msg };
  }
};

export const getPostalTrackingById = (id: string) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: SET_LOADING });
    const response = await axios.get(`${BASE_URL}/${id}`);
    dispatch({ type: SET_TRACKING_DETAIL, payload: response.data.data });
    return { success: true, data: response.data.data as PostalTrackingType };
  } catch (error: unknown) {
    const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al obtener el seguimiento" : "Error al obtener el seguimiento";
    dispatch({ type: SET_ERROR, payload: msg });
    return { success: false, error: msg };
  }
};

export const updatePostalTracking = (id: string, data: UpdatePostalTrackingData) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: SET_LOADING });
    const response = await axios.patch(`${BASE_URL}/${id}`, data);
    dispatch({ type: UPDATE_TRACKING, payload: response.data.data });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al actualizar el seguimiento" : "Error al actualizar el seguimiento";
    dispatch({ type: SET_ERROR, payload: msg });
    return { success: false, error: msg };
  }
};

export const linkFolderToTracking = (id: string, folderId: string | null) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: SET_LOADING });
    const response = await axios.patch(`${BASE_URL}/${id}`, { folderId });
    dispatch({ type: UPDATE_TRACKING, payload: response.data.data });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al vincular la carpeta" : "Error al vincular la carpeta";
    dispatch({ type: SET_ERROR, payload: msg });
    return { success: false, error: msg };
  }
};

export const reactivatePostalTracking = (id: string) => async (dispatch: Dispatch) => {
  try {
    const response = await axios.patch(`${BASE_URL}/${id}/reactivate`);
    dispatch({ type: UPDATE_TRACKING, payload: response.data.data });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al reactivar el seguimiento" : "Error al reactivar el seguimiento";
    return { success: false, error: msg };
  }
};

export const markPostalTrackingAsCompleted = (id: string) => async (dispatch: Dispatch) => {
  try {
    const response = await axios.patch(`${BASE_URL}/${id}/complete`);
    dispatch({ type: UPDATE_TRACKING, payload: response.data.data });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al completar el seguimiento" : "Error al completar el seguimiento";
    return { success: false, error: msg };
  }
};

export const deletePostalTracking = (id: string) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: SET_LOADING });
    await axios.delete(`${BASE_URL}/${id}`);
    dispatch({ type: DELETE_TRACKING, payload: id });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al eliminar el seguimiento" : "Error al eliminar el seguimiento";
    dispatch({ type: SET_ERROR, payload: msg });
    return { success: false, error: msg };
  }
};

export const uploadAttachment = (id: string, file: File) => async (_dispatch: Dispatch) => {
  try {
    const formData = new FormData();
    formData.append("attachment", file);
    const response = await axios.post(`${BASE_URL}/${id}/attachment`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, data: response.data.data };
  } catch (error: unknown) {
    const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al subir el adjunto" : "Error al subir el adjunto";
    return { success: false, error: msg };
  }
};

export const deleteAttachment = (id: string) => async (_dispatch: Dispatch) => {
  try {
    await axios.delete(`${BASE_URL}/${id}/attachment`);
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al eliminar el adjunto" : "Error al eliminar el adjunto";
    return { success: false, error: msg };
  }
};

export const clearPostalTrackingDetail = () => ({ type: CLEAR_TRACKING_DETAIL });

export default postalTrackingReducer;
