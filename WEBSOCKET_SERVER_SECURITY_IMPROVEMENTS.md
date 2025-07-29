# 🔐 MEJORAS DE SEGURIDAD PARA EL SERVIDOR WEBSOCKET

## 🚨 Problemas Actuales

1. **Sin validación de token**: Cualquiera puede conectarse y autenticarse con cualquier userId
2. **CORS muy permisivo**: Acepta conexiones de cualquier origen
3. **Sin rate limiting**: Vulnerable a ataques de fuerza bruta
4. **Sin validación de origen**: No verifica de dónde vienen las conexiones

## 🛡️ Mejoras Recomendadas

### 1. **Configurar CORS Correctamente**

```javascript
// app.js
const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:3000", "https://tudominio.com", "https://www.tudominio.com"];

const io = socketIO(server, {
	cors: {
		origin: (origin, callback) => {
			// Permitir requests sin origin (ej: Postman) solo en desarrollo
			if (!origin && process.env.NODE_ENV === "development") {
				return callback(null, true);
			}

			if (allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("No permitido por CORS"));
			}
		},
		credentials: true,
		methods: ["GET", "POST"],
	},
});
```

### 2. **Agregar Middleware de Autenticación con JWT**

```javascript
// websocket.js - Agregar al inicio
const jwt = require("jsonwebtoken");

// Modificar setupWebSocket
function setupWebSocket(io) {
	// Middleware de autenticación
	io.use(async (socket, next) => {
		try {
			// Obtener token de las cookies o del auth header
			const token = extractToken(socket);

			if (!token) {
				return next(new Error("Token no proporcionado"));
			}

			// Verificar el token
			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			// Adjuntar información del usuario al socket
			socket.userId = decoded.userId;
			socket.userRole = decoded.role;

			logger.info(`Usuario ${decoded.userId} pre-autenticado`);
			next();
		} catch (error) {
			logger.error(`Error de autenticación: ${error.message}`);
			next(new Error("Autenticación fallida"));
		}
	});

	io.on("connection", (socket) => {
		logger.info(`Usuario ${socket.userId} conectado: ${socket.id}`);

		// Ya no necesitas el evento authenticate
		// El usuario ya está autenticado

		// Automáticamente unir al usuario a su room
		socket.join(`user-${socket.userId}`);

		// Guardar la conexión
		if (connectedUsers.has(socket.userId)) {
			connectedUsers.get(socket.userId).add(socket.id);
		} else {
			connectedUsers.set(socket.userId, new Set([socket.id]));
		}

		// Notificar al cliente que está autenticado
		socket.emit("authenticated", {
			success: true,
			userId: socket.userId,
		});

		// Enviar alertas pendientes
		sendPendingAlerts(socket.userId);

		// Manejar desconexión
		socket.on("disconnect", () => {
			// ... código existente ...
		});
	});
}

// Función helper para extraer token
function extractToken(socket) {
	// Opción 1: De las cookies
	const cookies = socket.handshake.headers.cookie;
	if (cookies) {
		const tokenCookie = cookies.split(";").find((c) => c.trim().startsWith("auth_token="));
		if (tokenCookie) {
			return tokenCookie.split("=")[1];
		}
	}

	// Opción 2: Del objeto auth (nuevo método del cliente)
	if (socket.handshake.auth && socket.handshake.auth.token) {
		return socket.handshake.auth.token;
	}

	return null;
}
```

### 3. **Agregar Rate Limiting**

```javascript
// websocket.js - Agregar rate limiting
const rateLimitMap = new Map();

io.use((socket, next) => {
	const ip = socket.handshake.address;
	const now = Date.now();
	const windowMs = 60 * 1000; // 1 minuto
	const maxAttempts = 10;

	if (!rateLimitMap.has(ip)) {
		rateLimitMap.set(ip, []);
	}

	const attempts = rateLimitMap.get(ip).filter((timestamp) => now - timestamp < windowMs);

	if (attempts.length >= maxAttempts) {
		logger.warn(`Rate limit excedido para IP: ${ip}`);
		return next(new Error("Demasiados intentos de conexión"));
	}

	attempts.push(now);
	rateLimitMap.set(ip, attempts);

	next();
});
```

### 4. **Validar Mensajes del Cliente**

```javascript
// Agregar validación para eventos del cliente
socket.use((packet, next) => {
	const [eventName, data] = packet;

	// Lista blanca de eventos permitidos
	const allowedEvents = ["ping", "request_alerts", "mark_read"];

	if (!allowedEvents.includes(eventName)) {
		logger.warn(`Evento no permitido: ${eventName} de usuario ${socket.userId}`);
		return next(new Error("Evento no permitido"));
	}

	// Validar estructura de datos según el evento
	if (!validateEventData(eventName, data)) {
		return next(new Error("Datos inválidos"));
	}

	next();
});
```

### 5. **Logs de Auditoría**

```javascript
// Agregar logging detallado
function logConnection(socket, event, details = {}) {
	const logEntry = {
		timestamp: new Date().toISOString(),
		event: event,
		userId: socket.userId,
		socketId: socket.id,
		ip: socket.handshake.address,
		userAgent: socket.handshake.headers["user-agent"],
		...details,
	};

	logger.info("WebSocket Event:", logEntry);

	// Opcional: Guardar en base de datos para auditoría
	// await AuditLog.create(logEntry);
}

// Usar en eventos importantes
io.on("connection", (socket) => {
	logConnection(socket, "connected");

	socket.on("disconnect", (reason) => {
		logConnection(socket, "disconnected", { reason });
	});
});
```

## 🔄 Migración Gradual

Para no romper la funcionalidad actual, puedes implementar estos cambios gradualmente:

### Fase 1: Logging y Monitoreo

1. Agregar logs detallados
2. Monitorear patrones de uso actual
3. Identificar clientes legítimos

### Fase 2: Validación Suave

1. Implementar validación de token pero no rechazar conexiones
2. Solo loggear advertencias
3. Notificar a clientes sobre futura obligatoriedad

### Fase 3: Enforcement

1. Activar rechazo de conexiones sin token válido
2. Implementar rate limiting estricto
3. Restringir CORS a dominios específicos

## 📝 Ejemplo de Implementación Gradual

```javascript
// websocket.js - Validación suave
io.use(async (socket, next) => {
	try {
		const token = extractToken(socket);

		if (!token) {
			logger.warn(`Conexión sin token desde ${socket.handshake.address}`);
			// En fase 1: Permitir conexión pero marcar como no autenticada
			socket.isAuthenticated = false;
			return next();
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		socket.userId = decoded.userId;
		socket.isAuthenticated = true;

		next();
	} catch (error) {
		logger.error(`Token inválido: ${error.message}`);
		socket.isAuthenticated = false;

		// En fase 1: Permitir conexión
		if (process.env.ENFORCE_AUTH !== "true") {
			return next();
		}

		// En fase 3: Rechazar conexión
		next(new Error("Autenticación fallida"));
	}
});

io.on("connection", (socket) => {
	if (!socket.isAuthenticated) {
		// Permitir solo eventos limitados
		socket.on("authenticate", handleLegacyAuth);
		return;
	}

	// Cliente autenticado - funcionalidad completa
	setupAuthenticatedSocket(socket);
});
```

## ⚠️ Consideraciones Importantes

1. **Compatibilidad**: Asegúrate de que los cambios sean compatibles con todos tus clientes
2. **Testing**: Prueba exhaustivamente antes de activar validaciones estrictas
3. **Monitoreo**: Implementa alertas para detectar problemas de conexión
4. **Documentación**: Actualiza la documentación para los desarrolladores del cliente

## 🚀 Beneficios

1. **Seguridad**: Solo usuarios autenticados pueden conectarse
2. **Trazabilidad**: Logs detallados de todas las conexiones
3. **Control**: Puedes revocar acceso por usuario o IP
4. **Rendimiento**: Menos conexiones no autorizadas
