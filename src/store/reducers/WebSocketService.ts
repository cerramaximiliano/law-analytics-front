import axios from "axios";
import { WS_BASE_URL, API_BASE_URL } from "../../config";
import { io, Socket } from "socket.io-client";
import { Alert } from "types/alert";

// Tipos para los eventos y mensajes
export type WSMessageType = "NOTIFICATION" | "FOLDER_UPDATE" | "TASK_UPDATE" | "USER_ACTIVITY" | "CONNECTION_STATE";

export interface WSMessage<T = any> {
	type: WSMessageType;
	payload: T;
	timestamp: string;
}

// Estados de conexión
export enum ConnectionState {
	CONNECTING = "connecting",
	CONNECTED = "connected",
	DISCONNECTED = "disconnected",
	RECONNECTING = "reconnecting",
	ERROR = "error",
	AUTHENTICATED = "authenticated", // Estado para la autenticación
}

// Opciones de configuración
export interface WebSocketOptions {
	autoReconnect?: boolean;
	reconnectInterval?: number;
	maxReconnectAttempts?: number;
	debug?: boolean;
}

// Tipo de callback para los listeners
export type MessageListener<T = any> = (message: WSMessage<T>) => void;
export type StateChangeListener = (state: ConnectionState) => void;

// Tipo de log para solucionar errores de TypeScript
type LogLevel = "info" | "error" | "debug";

/**
 * Servicio que gestiona la conexión Socket.IO
 */
class WebSocketService {
	private socket: Socket | null = null;
	private messageListeners: Map<WSMessageType, Set<MessageListener>> = new Map();
	private stateListeners: Set<StateChangeListener> = new Set();
	private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
	private userId: string | null = null;

	private options: WebSocketOptions = {
		autoReconnect: true,
		reconnectInterval: 3000,
		maxReconnectAttempts: 5,
		debug: true, // Establecido a true para facilitar depuración
	};

	/**
	 * Establece una conexión Socket.IO con el servidor
	 * @param userId ID del usuario para autenticación
	 * @param authToken Token de autenticación opcional
	 * @param customOptions Opciones personalizadas para la conexión
	 */
	public connect(userId?: string, authToken?: string, customOptions?: Partial<WebSocketOptions>): void {
		// Guardar el userId para autenticación
		if (userId) {
			this.userId = userId;
		}

		// Actualizar opciones si se proporcionan
		if (customOptions) {
			this.options = { ...this.options, ...customOptions };
		}

		// Si ya hay una conexión activa, cerrarla primero
		if (this.socket && this.socket.connected) {
			this.log("Cerrando conexión Socket.IO existente antes de crear una nueva");
			this.socket.disconnect();
		}

		// Actualizar estado
		this.updateConnectionState(ConnectionState.CONNECTING);

		try {
			// Construir opciones con token de autenticación si está disponible
			const options = {
				autoConnect: true,
				reconnection: this.options.autoReconnect,
				reconnectionAttempts: this.options.maxReconnectAttempts,
				reconnectionDelay: this.options.reconnectInterval,
				query: authToken ? { token: authToken } : undefined,
				transports: ["websocket", "polling"], // Asegura compatibilidad
			};

			// Crear nueva conexión Socket.IO
			this.socket = io(WS_BASE_URL, options);
			this.log(`Socket.IO inicializando con URL: ${WS_BASE_URL}`);

			// Configurar manejadores de eventos
			this.setupEventHandlers();

			this.log(`Intentando conectar a ${WS_BASE_URL}`);
		} catch (error) {
			this.logError("Error al iniciar conexión Socket.IO:", error);
			this.updateConnectionState(ConnectionState.ERROR);
		}
	}

	/**
	 * Autentica al usuario después de establecer la conexión
	 */
	private authenticateUser(): void {
		if (!this.socket || !this.userId) {
			this.log("No se puede autenticar: Socket no está conectado o falta userId", "error");
			return;
		}

		this.log(`Enviando autenticación para el usuario: ${this.userId}`);
		this.socket.emit("authenticate", this.userId);

		// Escuchar respuesta de autenticación
		this.socket.once("authenticated", (response) => {
			if (response && response.success) {
				this.log("Usuario autenticado correctamente");
				this.updateConnectionState(ConnectionState.AUTHENTICATED);
			} else {
				this.log("Error en la autenticación", "error");
				this.updateConnectionState(ConnectionState.ERROR);
			}
		});

		// Manejar error de autenticación
		this.socket.once("authentication_error", (errorMsg) => {
			this.log(`Error de autenticación: ${errorMsg}`, "error");
			this.updateConnectionState(ConnectionState.ERROR);
		});
	}

	/**
	 * Actualiza el ID del usuario (útil si cambia durante la sesión)
	 * @param userId Nuevo ID de usuario
	 */
	public updateUserId(userId: string): void {
		this.userId = userId;

		// Si ya estamos conectados, enviar la autenticación con el nuevo ID
		if (this.socket && this.socket.connected) {
			this.authenticateUser();
		}
	}

	/**
	 * Cierra la conexión Socket.IO
	 */
	public disconnect(): void {
		if (this.socket) {
			this.log("Cerrando conexión Socket.IO manualmente");
			this.socket.disconnect();
			this.socket = null;
			this.updateConnectionState(ConnectionState.DISCONNECTED);
		}
	}

	/**
	 * Envía un mensaje a través del Socket.IO
	 * @param type Tipo de mensaje
	 * @param payload Datos del mensaje
	 */
	public send<T>(type: WSMessageType, payload: T): boolean {
		if (!this.socket || !this.socket.connected) {
			this.log("No se puede enviar mensaje: Socket.IO no está conectado", "error");
			return false;
		}

		try {
			const message: WSMessage<T> = {
				type,
				payload,
				timestamp: new Date().toISOString(),
			};

			// En Socket.IO podemos usar tipos de evento para estructurar la comunicación
			this.socket.emit("message", message);
			return true;
		} catch (error) {
			this.logError("Error al enviar mensaje por Socket.IO:", error);
			return false;
		}
	}

	/**
	 * Suscribe a mensajes de un tipo específico
	 * @param type Tipo de mensaje a escuchar
	 * @param callback Función a ejecutar cuando se recibe un mensaje
	 */
	public subscribe<T = any>(type: WSMessageType, callback: MessageListener<T>): () => void {
		if (!this.messageListeners.has(type)) {
			this.messageListeners.set(type, new Set());
		}

		const listeners = this.messageListeners.get(type)!;
		listeners.add(callback as MessageListener);

		// Retornar función para cancelar suscripción
		return () => {
			if (this.messageListeners.has(type)) {
				const listeners = this.messageListeners.get(type)!;
				listeners.delete(callback as MessageListener);
			}
		};
	}

	/**
	 * Suscribe a cambios en el estado de la conexión
	 * @param callback Función a ejecutar cuando cambia el estado
	 */
	public subscribeToState(callback: StateChangeListener): () => void {
		this.stateListeners.add(callback);

		// Notificar estado actual inmediatamente
		callback(this.connectionState);

		// Retornar función para cancelar suscripción
		return () => {
			this.stateListeners.delete(callback);
		};
	}

	/**
	 * Obtiene el estado actual de la conexión
	 */
	public getConnectionState(): ConnectionState {
		return this.connectionState;
	}

	/**
	 * Verifica si la conexión está abierta y lista
	 */
	public isConnected(): boolean {
		return this.socket !== null && this.socket.connected;
	}

	/**
	 * Verifica si la conexión está autenticada
	 */
	public isAuthenticated(): boolean {
		return this.isConnected() && this.connectionState === ConnectionState.AUTHENTICATED;
	}

	/**
	 * Configura los manejadores de eventos del Socket.IO
	 */
	private setupEventHandlers(): void {
		if (!this.socket) return;

		this.socket.on("connect", () => {
			this.log("Conexión Socket.IO establecida");
			this.updateConnectionState(ConnectionState.CONNECTED);

			// Una vez conectado, intentar autenticar al usuario
			if (this.userId) {
				this.authenticateUser();
			}
		});

		this.socket.on("disconnect", (reason) => {
			this.log(`Conexión Socket.IO cerrada: Razón: ${reason}`);
			this.updateConnectionState(ConnectionState.DISCONNECTED);
		});

		this.socket.on("connect_error", (error) => {
			this.logError("Error en conexión Socket.IO:", error);
			this.updateConnectionState(ConnectionState.ERROR);
		});

		this.socket.on("reconnect_attempt", (attemptNumber) => {
			this.log(`Intento de reconexión ${attemptNumber}`);
			this.updateConnectionState(ConnectionState.RECONNECTING);
		});

		this.socket.on("reconnect", () => {
			this.log("Reconexión exitosa");
			// Después de reconectar, necesitamos autenticar de nuevo
			if (this.userId) {
				this.authenticateUser();
			}
		});

		// Escuchar eventos específicos del servidor
		this.socket.on("new_alert", (alert: Alert) => {
			this.log(`Nueva alerta recibida: ${alert.primaryText || "Sin título"}`);
			this.handleMessage({
				type: "NOTIFICATION",
				payload: alert,
				timestamp: new Date().toISOString(),
			});
		});

		this.socket.on("pending_alerts", (alerts: Alert[]) => {
			// Validar que realmente sea un array
			if (!Array.isArray(alerts)) {
				this.log("Se recibió 'pending_alerts' pero no es un array", "error");
				return;
			}

			this.log(`${alerts.length} alertas pendientes recibidas`);

			// Asegúrate de que cada elemento sea una alerta válida
			const validAlerts = alerts.filter((alert) => alert && typeof alert === "object" && (alert._id || alert.primaryText));

			this.log(`${validAlerts.length} alertas válidas de ${alerts.length} recibidas`);

			this.handleMessage({
				type: "NOTIFICATION",
				payload: { pendingAlerts: validAlerts },
				timestamp: new Date().toISOString(),
			});
		});

		// Escuchar mensajes genéricos
		this.socket.on("message", (message: WSMessage) => {
			try {
				this.handleMessage(message);
			} catch (error) {
				this.logError("Error al procesar mensaje recibido:", error);
			}
		});
	}

	/**
	 * Maneja los mensajes recibidos y los distribuye a los listeners
	 * @param message Mensaje recibido
	 */
	private handleMessage(message: WSMessage): void {
		this.log(`Mensaje recibido: ${message.type}`, "debug");

		// Notificar a todos los listeners de este tipo de mensaje
		if (this.messageListeners.has(message.type)) {
			const listeners = this.messageListeners.get(message.type)!;
			listeners.forEach((callback) => {
				try {
					callback(message);
				} catch (error) {
					this.logError(`Error en callback para mensaje ${message.type}:`, error);
				}
			});
		}

		// También notificar a los listeners de todos los mensajes (si existen)
		if (this.messageListeners.has("*" as WSMessageType)) {
			const listeners = this.messageListeners.get("*" as WSMessageType)!;
			listeners.forEach((callback) => {
				try {
					callback(message);
				} catch (error) {
					this.logError("Error en callback genérico:", error);
				}
			});
		}
	}

	/**
	 * Actualiza el estado de conexión y notifica a los listeners
	 * @param state Nuevo estado de conexión
	 */
	private updateConnectionState(state: ConnectionState): void {
		this.connectionState = state;

		// Notificar a todos los listeners de estado
		this.stateListeners.forEach((callback) => {
			try {
				callback(state);
			} catch (error) {
				this.logError("Error en callback de estado:", error);
			}
		});
	}

	/**
	 * Función de logging con niveles
	 * @param message Mensaje a registrar
	 * @param level Nivel de log
	 */
	private log(message: string, level: LogLevel = "info"): void {
		if (!this.options.debug && level === "debug") return;

		const prefix = "[Socket.IO]";

		switch (level) {
			case "error":
				console.error(`${prefix} ${message}`);
				break;
			case "debug":
				console.debug(`${prefix} ${message}`);
				break;
			default:
				console.log(`${prefix} ${message}`);
				break;
		}
	}

	/**
	 * Helper para manejar errores en log
	 * @param message Mensaje base
	 * @param error Error a registrar
	 */
	private logError(message: string, error: unknown): void {
		this.log(`${message} ${error instanceof Error ? error.message : String(error)}`, "error");
	}

	/**
	 * Comprueba el token de autenticación para ver si necesita actualización
	 * @returns Token actualizado si es necesario
	 */
	public static async refreshAuthToken(): Promise<string | null> {
		try {
			// Intenta obtener un token actualizado del servidor
			const response = await axios.post(
				`${API_BASE_URL}/api/auth/refresh-token`,
				{},
				{
					withCredentials: true,
				},
			);

			if (response.data && response.data.success) {
				return response.data.token || null;
			}

			return null;
		} catch (error) {
			console.error("Error al refrescar token para Socket.IO:", error);
			return null;
		}
	}
}

// Crear instancia singleton
const webSocketService = new WebSocketService();

export default webSocketService;
