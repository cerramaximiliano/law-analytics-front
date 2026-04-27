import React from "react";
import { createContext, useEffect, useContext, ReactNode, useState, useCallback, useMemo } from "react";
import webSocketService, { ConnectionState, WSMessageType, WSMessage, MessageListener } from "../store/reducers/WebSocketService";
import AuthContext from "./ServerContext";
import { useDispatch, useSelector } from "react-redux";
import { openSnackbar } from "store/reducers/snackbar";
// Importamos correctamente las acciones
import { ADD_MULTIPLE_ALERTS, ADD_ALERT } from "store/reducers/alerts";
import { pjnSyncStarted, pjnSyncProgress, pjnSyncCompleted, pjnSyncError } from "store/reducers/pjnSync";
import { scbaSyncStarted, scbaSyncProgress, scbaSyncCompleted, scbaSyncError } from "store/reducers/scbaSync";
import { movementsSyncStarted, movementsSyncCompleted } from "store/reducers/movementsSync";
import { getFoldersByUserId } from "store/reducers/folder";
import {
	SET_CREDENTIAL as SECLO_SET_CREDENTIAL,
	UPDATE_SOLICITUD as SECLO_UPDATE_SOLICITUD,
} from "store/reducers/seclo";
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
	// isInitialized eliminado de los deps: solo estaba en código comentado.
	// Mantenerlo causaba que handleConnectionStateChange cambiara al conectar,
	// re-ejecutando el efecto de suscripción innecesariamente.
	const handleConnectionStateChange = useCallback(
		(state: ConnectionState) => {
			setConnectionState(state);
		},
		[],
	);

	// Manejar mensajes recibidos
	const handleMessage = useCallback(
		(message: WSMessage) => {
			setLastMessage(message);

			// Manejar tipos específicos de mensajes
			if (message.type === "FOLDER_UPDATE") {
				if (message.payload?.newFolders && Array.isArray(message.payload.newFolders)) {
					const newFolders = message.payload.newFolders as FolderData[];
					const source: "pjn" | "scba" = message.payload?.source ?? "pjn";
					const label = source === "scba" ? "SCBA" : "PJN";
					newFolders.forEach((folder) => {
						dispatch({ type: "UPSERT_FOLDER", payload: folder });
					});
					if (newFolders.length === 1) {
						showNotification(`Carpeta ${label} agregada: ${newFolders[0].folderName || "Nueva carpeta"}`, "info");
					} else {
						showNotification(`${newFolders.length} carpetas ${label} agregadas`, "info");
					}
				}
			}

			if (message.type === "SYNC_PROGRESS") {
				const p = message.payload as any;
				const source: "pjn" | "scba" = p?.source ?? "pjn";
				const label = source === "scba" ? "SCBA" : "PJN";

				if (source === "scba") {
					if (p?.phase === "started") {
						dispatch(scbaSyncStarted({ progress: p.progress, message: p.message, force: true }));
					} else if (p?.phase === "completed") {
						dispatch(scbaSyncCompleted({ foldersCreated: p.newFolders ?? 0, newCausas: p.newCausas ?? 0 }));
						if (userId) {
							dispatch(getFoldersByUserId(userId, true) as any);
						}
						showNotification(`Sincronización ${label} completada: ${p.newCausas ?? 0} causas procesadas`, "success");
					} else if (p?.phase === "error") {
						dispatch(scbaSyncError({ message: p.message ?? "Error en sincronización SCBA" }));
						showNotification(`Error en sincronización ${label}: ${p.message ?? "Error desconocido"}`, "error");
					} else if (p?.phase) {
						dispatch(scbaSyncProgress({
							progress: p.progress ?? 0,
							message: p.message ?? "",
							phase: p.phase,
							currentPage: p.currentPage,
							totalPages: p.totalPages,
							causasProcessed: p.causasProcessed,
							totalExpected: p.totalExpected,
							causasFound: p.causasFound,
						}));
					}
					return;
				}

				// source === 'pjn' (comportamiento existente, sin cambios)
				if (p?.phase === "started") {
					dispatch(pjnSyncStarted({ progress: p.progress, message: p.message, force: true }));
				} else if (p?.phase === "completed") {
					dispatch(pjnSyncCompleted({ foldersCreated: p.newFolders ?? 0, newCausas: p.newCausas ?? 0 }));
					if (userId) {
						dispatch(getFoldersByUserId(userId, true) as any);
					}
					showNotification(`Sincronización completada: ${p.newFolders ?? 0} carpetas creadas`, "success");
				} else if (p?.phase === "error") {
					dispatch(pjnSyncError({ message: p.message ?? "Error en sincronización" }));
					showNotification(`Error en sincronización: ${p.message ?? "Error desconocido"}`, "error");
				} else if (p?.phase === "movements_started") {
					dispatch(movementsSyncStarted({ totalCausas: p.totalCausas, isInitialSync: p.isInitialSync }));
				} else if (p?.phase === "movements_completed") {
					dispatch(movementsSyncCompleted({ newMovimientos: p.newMovimientos, totalCausas: p.totalCausas, isInitialSync: p.isInitialSync }));
					showNotification(`Movimientos sincronizados: ${p.newMovimientos ?? 0} nuevos`, "success");
				} else if (p?.phase) {
					dispatch(pjnSyncProgress({
						progress: p.progress ?? 0,
						message: p.message ?? "",
						phase: p.phase,
						currentPage: p.currentPage,
						totalPages: p.totalPages,
						causasProcessed: p.causasProcessed,
						totalExpected: p.totalExpected,
						batchNum: p.batchNum,
						totalBatches: p.totalBatches,
					}));
				}
			}

			// SECLO — actualización de credencial en tiempo real (checking/validated/invalid).
			// El payload trae el credential público completo, lo despachamos como
			// SET_CREDENTIAL para que CredencialesTab refleje el estado al instante.
			if (message.type === "SECLO_CREDENTIAL_UPDATE") {
				const p = message.payload as any;
				if (p?.credential) {
					dispatch({ type: SECLO_SET_CREDENTIAL, payload: p.credential });
				}
				if (p?.status === "validated") {
					showNotification("Credenciales SECLO validadas", "success");
				} else if (p?.status === "invalid") {
					showNotification(`Credenciales SECLO inválidas: ${p.reason || "verificá tu contraseña"}`, "error");
				}
				return;
			}

			// SECLO — actualización de solicitud en tiempo real.
			// El payload viene parcial (solo campos cambiados); UPDATE_SOLICITUD
			// del reducer hace merge respetando los campos que ya estaban.
			if (message.type === "SECLO_SOLICITUD_UPDATE") {
				const p = message.payload as any;
				if (!p?.solicitudId) return;
				// Construir un patch que el reducer pueda mergear vía map _id===solicitudId.
				// El reducer reemplaza la solicitud entera, así que pasamos un objeto
				// parcial — el componente que pinte el detalle hará un merge propio si
				// quiere mantener los campos previos. El listado refresca al recibir.
				dispatch({
					type: SECLO_UPDATE_SOLICITUD,
					payload: {
						_id: p.solicitudId,
						status: p.status,
						...(p.numeroExpediente !== undefined && { resultado: { numeroExpediente: p.numeroExpediente, numeroTramite: p.numeroTramite, audiencias: p.audiencia ? [p.audiencia] : undefined } }),
						...(p.error && { errorInfo: { message: p.error.message, code: p.error.code, timestamp: new Date().toISOString() } }),
					},
				});

				if (p.status === "completed") {
					showNotification(`Solicitud SECLO completada${p.numeroExpediente ? ` — ${p.numeroExpediente}` : ""}`, "success");
				} else if (p.status === "error") {
					showNotification(`Error en solicitud SECLO: ${p.error?.message || "Error desconocido"}`, "error");
				}
				return;
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

	// Conectar/desconectar automáticamente según el estado de autenticación.
	// isInitialized eliminado de los deps: llamar setIsInitialized(true) dentro de connect()
	// re-ejecutaba este efecto, causando una segunda llamada a connect() y doble conexión WS.
	// webSocketService.disconnect() es un no-op si no hay socket activo, así que el
	// else if simplificado a !isLoggedIn es seguro.
	useEffect(() => {
		if (isLoggedIn && autoConnect && userId) {
			connect();
		} else if (!isLoggedIn) {
			disconnect();
		}
	}, [isLoggedIn, autoConnect, connect, disconnect, userId]);

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

			// Desconectar siempre al hacer cleanup, no solo si isConnected().
			// Cubre sockets en estado CONNECTING que de otro modo quedarían huérfanos.
			webSocketService.disconnect();
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
