import React from "react";
import { createContext, useEffect, useContext, ReactNode, useState, useCallback, useMemo } from "react";
import webSocketService, { ConnectionState, WSMessageType, WSMessage, MessageListener } from "../store/reducers/WebSocketService";
import AuthContext from "./ServerContext";
import { useDispatch, useSelector } from "react-redux";
import { openSnackbar } from "store/reducers/snackbar";
// Importamos correctamente las acciones
import { ADD_MULTIPLE_ALERTS, ADD_ALERT } from "store/reducers/alerts";
import { pjnSyncStarted, pjnSyncProgress, pjnSyncCompleted, pjnSyncError } from "store/reducers/pjnSync";
import { getFoldersByUserId } from "store/reducers/folder";
import { Alert } from "types/alert";
import { FolderData } from "types/folder";

// Definición del contexto WebSocket
export interface WebSocketContextType {
	// Estado
	connectionState: ConnectionState;
	isConnected: boolean;
	isAuthenticated: boolean;
	lastMessage: WSMessage | null;
	isInitialized: boolean;

	// Métodos
	connect: () => void;
	disconnect: () => void;
	sendMessage: <T>(type: WSMessageType, payload: T) => boolean;
	subscribe: <T>(type: WSMessageType, callback: MessageListener<T>) => () => void;
}

// Crear el contexto
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Props para el Provider
interface WebSocketProviderProps {
	children: ReactNode;
	autoConnect?: boolean;
}

export const WebSocketProvider = ({ children, autoConnect = true }: WebSocketProviderProps) => {
	// Estado
	const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
	const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);
	const { isLoggedIn, user } = useContext(AuthContext) || {};
	const dispatch = useDispatch();

	// También acceder al userId desde Redux si está disponible
	const authUser = useSelector((state: any) => state.auth?.user);
	const userId = user?._id || authUser?._id;

	// Mostrar notificaciones
	const showNotification = useCallback(
		(message: string, variant: "success" | "error" | "warning" | "info" = "info") => {
			dispatch(
				openSnackbar({
					open: true,
					message: message,
					variant: variant,
					alert: {
						color: variant,
					},
					close: false,
				}),
			);
		},
		[dispatch],
	);

	// Manejar cambios de estado de conexión
	const handleConnectionStateChange = useCallback(
		(state: ConnectionState) => {
			setConnectionState(state);

			// Comentado: Las notificaciones de conexión no son necesarias para el usuario
			// if (state === ConnectionState.CONNECTED) {
			// 	if (isInitialized) {
			// 		showNotification("Conexión con el servidor establecida", "success");
			// 	}
			// } else if (state === ConnectionState.AUTHENTICATED) {
			// 	showNotification("Autenticación con el servidor establecida", "success");
			// } else if (state === ConnectionState.ERROR) {
			// 	showNotification("Error en la conexión con el servidor", "error");
			// }
		},
		[isInitialized, showNotification],
	);

	// Manejar mensajes recibidos
	const handleMessage = useCallback(
		(message: WSMessage) => {
			setLastMessage(message);

			// Manejar tipos específicos de mensajes
			if (message.type === "FOLDER_UPDATE") {
				if (message.payload?.newFolders && Array.isArray(message.payload.newFolders)) {
					const newFolders = message.payload.newFolders as FolderData[];
					newFolders.forEach((folder) => {
						dispatch({ type: "UPSERT_FOLDER", payload: folder });
					});
					if (newFolders.length === 1) {
						showNotification(`Carpeta PJN agregada: ${newFolders[0].folderName || "Nueva carpeta"}`, "info");
					} else {
						showNotification(`${newFolders.length} carpetas PJN agregadas`, "info");
					}
				}
			}

			if (message.type === "SYNC_PROGRESS") {
				const p = message.payload as any;
				if (p?.phase === "started") {
					dispatch(pjnSyncStarted({ progress: p.progress, message: p.message }));
				} else if (p?.phase === "completed") {
					dispatch(pjnSyncCompleted({ foldersCreated: p.newFolders ?? 0, newCausas: p.newCausas ?? 0 }));
					if (userId) {
						dispatch(getFoldersByUserId(userId, true) as any);
					}
					showNotification(`Sincronización completada: ${p.newFolders ?? 0} carpetas creadas`, "success");
				} else if (p?.phase === "error") {
					dispatch(pjnSyncError({ message: p.message ?? "Error en sincronización" }));
					showNotification(`Error en sincronización: ${p.message ?? "Error desconocido"}`, "error");
				} else if (p?.phase) {
					dispatch(pjnSyncProgress({ progress: p.progress ?? 0, message: p.message ?? "", phase: p.phase }));
				}
			}

			if (message.type === "NOTIFICATION") {
				// Manejar alertas pendientes - formato {pendingAlerts: Alert[]}
				if (message.payload && message.payload.pendingAlerts) {
					try {
						const pendingAlerts = message.payload.pendingAlerts as Alert[];
						if (pendingAlerts.length > 0) {
							// Usar la acción directamente con el formato correcto
							dispatch({
								type: ADD_MULTIPLE_ALERTS,
								payload: pendingAlerts,
							});

							// Registrar para depuración

							// Mostrar notificación de alertas recibidas
							showNotification(`Recibidas ${pendingAlerts.length} notificaciones pendientes`, "info");
						}
					} catch (error) {}
				}
				// Manejar una sola alerta - formato directo Alert
				else if (message.payload) {
					try {
						const alert = message.payload as Alert;

						// Usar la acción directamente con el formato correcto
						dispatch({
							type: ADD_ALERT,
							payload: alert,
						});

						// Registrar para depuración

						// Mostrar notificación al usuario
						showNotification(
							alert.primaryText || "Nueva notificación recibida",
							(alert.primaryVariant as "success" | "error" | "warning" | "info") || "info",
						);
					} catch (error) {}
				}
			}
		},
		[dispatch, showNotification, userId],
	);

	// Conectar al WebSocket
	const connect = useCallback(() => {
		if (!userId) {
			return;
		}

		webSocketService.connect(userId);
		setIsInitialized(true);
	}, [userId]);

	// Desconectar del WebSocket
	const disconnect = useCallback(() => {
		webSocketService.disconnect();
	}, []);

	// Enviar mensaje
	const sendMessage = useCallback(<T,>(type: WSMessageType, payload: T): boolean => {
		return webSocketService.send(type, payload);
	}, []);

	// Wrapper para suscribirse a mensajes
	const subscribe = useCallback(<T,>(type: WSMessageType, callback: MessageListener<T>): (() => void) => {
		return webSocketService.subscribe(type, callback);
	}, []);

	// Conectar/desconectar automáticamente según el estado de autenticación
	useEffect(() => {
		if (isLoggedIn && autoConnect && userId) {
			connect();
		} else if (!isLoggedIn && isInitialized) {
			disconnect();
		}
	}, [isLoggedIn, autoConnect, connect, disconnect, isInitialized, userId]);

	// Actualizar userId cuando cambie
	useEffect(() => {
		if (userId && webSocketService.isConnected()) {
			webSocketService.updateUserId(userId);
		}
	}, [userId]);

	// Suscribirse a cambios de estado y mensajes al montar el componente
	useEffect(() => {
		const stateUnsubscribe = webSocketService.subscribeToState(handleConnectionStateChange);
		const messageUnsubscribe = webSocketService.subscribe("*" as WSMessageType, handleMessage);

		return () => {
			stateUnsubscribe();
			messageUnsubscribe();

			// Asegurar que nos desconectamos al desmontar
			if (webSocketService.isConnected()) {
				webSocketService.disconnect();
			}
		};
	}, [handleConnectionStateChange, handleMessage]);

	// Valor del contexto
	const value = useMemo<WebSocketContextType>(
		() => ({
			connectionState,
			isConnected: webSocketService.isConnected(),
			isAuthenticated: webSocketService.isAuthenticated && webSocketService.isAuthenticated(),
			lastMessage,
			isInitialized,
			connect,
			disconnect,
			sendMessage,
			subscribe,
		}),
		[connectionState, lastMessage, isInitialized, connect, disconnect, sendMessage, subscribe],
	);

	return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

// Hook para usar el contexto
export const useWebSocket = (): WebSocketContextType => {
	const context = useContext(WebSocketContext);

	if (!context) {
		throw new Error("useWebSocket debe usarse dentro de un WebSocketProvider");
	}

	return context;
};

export default WebSocketContext;
