# 🔐 MANEJO DE TOKENS CADUCOS EN WEBSOCKET

## 📊 El Problema

WebSocket mantiene una conexión persistente. Una vez autenticada, la conexión permanece abierta indefinidamente, incluso si:

- El token JWT expira
- El usuario cierra sesión en otra pestaña
- Los permisos del usuario cambian
- La sesión es revocada por el admin

## 🎯 Soluciones Recomendadas

### 1. **Verificación Periódica del Token (RECOMENDADO)**

```javascript
// websocket.js - Servidor
function setupWebSocket(io) {
	// Map para almacenar timers de verificación
	const verificationTimers = new Map();

	io.on("connection", (socket) => {
		// Verificar token cada 5 minutos
		const verificationInterval = setInterval(async () => {
			try {
				// Obtener token actualizado
				const token = await getUpdatedToken(socket);

				if (!token) {
					socket.emit("auth_expired", {
						reason: "Token no encontrado",
					});
					socket.disconnect(true);
					return;
				}

				// Verificar validez
				const decoded = jwt.verify(token, process.env.JWT_SECRET);

				// Verificar que el usuario siga activo
				const user = await User.findById(decoded.userId);
				if (!user || !user.isActive) {
					socket.emit("auth_expired", {
						reason: "Usuario inactivo",
					});
					socket.disconnect(true);
					return;
				}

				logger.info(`Token verificado para usuario ${socket.userId}`);
			} catch (error) {
				logger.error(`Token expirado para socket ${socket.id}: ${error.message}`);
				socket.emit("auth_expired", {
					reason: "Token expirado",
					error: error.message,
				});
				socket.disconnect(true);
			}
		}, 5 * 60 * 1000); // 5 minutos

		// Guardar el timer
		verificationTimers.set(socket.id, verificationInterval);

		// Limpiar al desconectar
		socket.on("disconnect", () => {
			clearInterval(verificationTimers.get(socket.id));
			verificationTimers.delete(socket.id);
		});
	});
}
```

### 2. **Heartbeat con Re-autenticación**

```javascript
// websocket.js - Servidor
io.on("connection", (socket) => {
	let lastPing = Date.now();

	// Cliente debe enviar ping con token cada 30 segundos
	socket.on("ping", async (data) => {
		try {
			const { token } = data;

			// Verificar token
			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			lastPing = Date.now();
			socket.emit("pong", {
				timestamp: lastPing,
				tokenValid: true,
			});
		} catch (error) {
			socket.emit("pong", {
				timestamp: Date.now(),
				tokenValid: false,
				error: "Token inválido",
			});

			// Dar 10 segundos para re-autenticarse
			setTimeout(() => {
				if (Date.now() - lastPing > 40000) {
					socket.disconnect(true);
				}
			}, 10000);
		}
	});

	// Verificar heartbeat
	const heartbeatInterval = setInterval(() => {
		if (Date.now() - lastPing > 60000) {
			// 60 segundos sin ping
			logger.warn(`Desconectando socket ${socket.id} por inactividad`);
			socket.disconnect(true);
		}
	}, 30000);

	socket.on("disconnect", () => {
		clearInterval(heartbeatInterval);
	});
});
```

### 3. **Eventos de Sesión Global**

```javascript
// Cuando un usuario cierra sesión o su token es revocado
async function revokeUserSession(userId) {
	// Desconectar todas las conexiones WebSocket del usuario
	const io = global.io;

	// Obtener todos los sockets del usuario
	const sockets = await io.in(`user-${userId}`).fetchSockets();

	// Desconectar cada socket
	for (const socket of sockets) {
		socket.emit("session_revoked", {
			reason: "Sesión cerrada",
		});
		socket.disconnect(true);
	}

	logger.info(`Sesión revocada para usuario ${userId}, ${sockets.length} conexiones cerradas`);
}

// Llamar cuando:
// - Usuario hace logout
// - Admin suspende cuenta
// - Token es comprometido
```

## 💻 Implementación en el Cliente (Frontend)

```javascript
// WebSocketService.ts
class WebSocketService {
    private heartbeatInterval?: NodeJS.Timeout;
    private reconnectAttempts = 0;

    private setupEventHandlers(): void {
        // Manejar expiración de autenticación
        this.socket.on('auth_expired', (data) => {
            this.log('Autenticación expirada:', data.reason);

            // Intentar renovar token
            this.attemptTokenRefresh();
        });

        // Manejar revocación de sesión
        this.socket.on('session_revoked', (data) => {
            this.log('Sesión revocada:', data.reason);

            // Limpiar y redirigir a login
            secureStorage.clearSession();
            window.location.href = '/login';
        });

        // Configurar heartbeat
        this.socket.on('connect', () => {
            this.startHeartbeat();
        });

        // Manejar pong
        this.socket.on('pong', (data) => {
            if (!data.tokenValid) {
                this.log('Token inválido en heartbeat');
                this.attemptTokenRefresh();
            }
        });
    }

    private startHeartbeat(): void {
        // Limpiar interval existente
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Enviar ping cada 30 segundos
        this.heartbeatInterval = setInterval(async () => {
            try {
                // Obtener token actual (de cookie o refresh)
                const token = await this.getCurrentToken();

                this.socket.emit('ping', {
                    token,
                    timestamp: Date.now()
                });
            } catch (error) {
                this.logError('Error en heartbeat:', error);
            }
        }, 30000);
    }

    private async attemptTokenRefresh(): Promise<void> {
        try {
            // Intentar refrescar token via HTTP
            const response = await axios.post('/api/auth/refresh-token');

            if (response.data.success) {
                // Reconectar con nuevo token
                this.reconnect();
            } else {
                // Redirigir a login
                window.location.href = '/login';
            }
        } catch (error) {
            this.logError('Error al refrescar token:', error);
            window.location.href = '/login';
        }
    }

    private async getCurrentToken(): Promise<string> {
        // Obtener token de cookie o solicitar nuevo
        const token = secureStorage.getAuthToken();

        if (!token) {
            // Intentar obtener nuevo token
            const response = await axios.get('/api/auth/current-token');
            return response.data.token;
        }

        return token;
    }
}
```

## 🎯 Estrategia Recomendada

### Para Tu Caso Específico:

1. **Corto Plazo**: Implementar heartbeat con verificación

   - Fácil de implementar
   - Compatible con tu arquitectura actual
   - Mínimo impacto en rendimiento

2. **Mediano Plazo**: Agregar eventos de sesión global

   - Permite cerrar sesiones remotamente
   - Mejor control de seguridad

3. **Largo Plazo**: Considerar tokens de corta duración
   - Tokens que expiran en 15-30 minutos
   - Refresh automático transparente

## 🔧 Configuración Sugerida

```javascript
// Variables de entorno
WS_HEARTBEAT_INTERVAL = 30000; // 30 segundos
WS_TOKEN_CHECK_INTERVAL = 300000; // 5 minutos
WS_MAX_TOKEN_AGE = 3600000; // 1 hora
WS_DISCONNECT_TIMEOUT = 60000; // 1 minuto sin heartbeat
```

## ⚠️ Consideraciones Importantes

1. **Balance Seguridad vs Performance**

   - Verificar muy seguido impacta performance
   - Verificar muy poco deja ventanas de seguridad

2. **Experiencia de Usuario**

   - Reconexión automática transparente
   - Notificaciones claras si requiere re-login

3. **Sincronización con HTTP**
   - WebSocket debe respetar logout HTTP
   - Compartir estado de sesión

## 📈 Métricas a Monitorear

- Frecuencia de tokens expirados
- Tiempo promedio de reconexión
- Fallos de heartbeat
- Sesiones zombie (conectadas pero inválidas)
