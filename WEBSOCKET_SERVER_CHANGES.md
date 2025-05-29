# 🔄 CAMBIOS NECESARIOS EN EL SERVIDOR WEBSOCKET

## 📋 Resumen de Cambios en el Cliente

En el frontend hemos cambiado de:

```javascript
// ANTES - Token en query params (INSEGURO)
const options = {
	query: { token: authToken },
	transports: ["websocket", "polling"],
};
```

A:

```javascript
// AHORA - Autenticación con cookies
const options = {
	withCredentials: true,
	auth: {
		userId: this.userId,
	},
	transports: ["websocket"],
	secure: process.env.NODE_ENV === "production",
};
```

## 🛠️ Cambios Necesarios en el Servidor

### 1. **Configuración de Socket.IO con CORS y Cookies**

```javascript
// server.js o donde configures Socket.IO
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const io = new Server(server, {
	cors: {
		origin: process.env.CLIENT_URL || "http://localhost:3000",
		credentials: true, // IMPORTANTE: Permitir cookies
		methods: ["GET", "POST"],
	},
	// Solo permitir WebSocket, no polling
	transports: ["websocket"],
});
```

### 2. **Middleware de Autenticación para Socket.IO**

```javascript
// Middleware para parsear cookies en Socket.IO
io.use(async (socket, next) => {
	try {
		// Obtener cookies del handshake
		const cookies = socket.handshake.headers.cookie;

		if (!cookies) {
			return next(new Error("No se encontraron cookies"));
		}

		// Parsear cookies manualmente o usar cookie-parser
		const parsedCookies = parseCookies(cookies);
		const token = parsedCookies.auth_token; // o el nombre de tu cookie

		if (!token) {
			return next(new Error("Token de autenticación no encontrado"));
		}

		// Verificar el token JWT
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// Obtener userId del auth object (nuevo método)
		const { userId } = socket.handshake.auth;

		// Verificar que el userId coincida con el del token
		if (decoded.userId !== userId) {
			return next(new Error("Usuario no autorizado"));
		}

		// Adjuntar información del usuario al socket
		socket.userId = decoded.userId;
		socket.user = decoded;

		next();
	} catch (error) {
		console.error("Error de autenticación WebSocket:", error);
		next(new Error("Error de autenticación"));
	}
});

// Función helper para parsear cookies
function parseCookies(cookieString) {
	const cookies = {};
	cookieString.split(";").forEach((cookie) => {
		const [name, value] = cookie.trim().split("=");
		cookies[name] = decodeURIComponent(value);
	});
	return cookies;
}
```

### 3. **Manejo de Conexiones Autenticadas**

```javascript
io.on("connection", (socket) => {
	console.log(`Usuario ${socket.userId} conectado`);

	// Unir al usuario a su room personal
	socket.join(`user_${socket.userId}`);

	// Ya no necesitas el evento 'authenticate'
	// El usuario ya está autenticado al conectarse

	// Emitir confirmación de conexión
	socket.emit("authenticated", {
		userId: socket.userId,
		message: "Conexión autenticada exitosamente",
	});

	// Resto de tu lógica...
});
```

### 4. **Actualizar Endpoints HTTP para Cookies**

Si aún no lo has hecho, asegúrate de que tu servidor HTTP esté configurado para cookies:

```javascript
// Configuración de Express
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// Configurar CORS
app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:3000",
		credentials: true, // Permitir cookies
		methods: ["GET", "POST", "PUT", "DELETE"],
		allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
	}),
);

// Cookie parser
app.use(cookieParser());

// Al hacer login, setear cookie httpOnly
app.post("/api/auth/login", async (req, res) => {
	try {
		// ... validación de credenciales ...

		const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

		// Setear cookie httpOnly
		res.cookie("auth_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
		});

		res.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
			},
		});
	} catch (error) {
		res.status(401).json({ error: "Credenciales inválidas" });
	}
});

// Logout - limpiar cookie
app.post("/api/auth/logout", (req, res) => {
	res.clearCookie("auth_token");
	res.json({ success: true });
});
```

### 5. **Validación de Origen (Opcional pero Recomendado)**

```javascript
io.use((socket, next) => {
	const origin = socket.handshake.headers.origin;

	// Lista de orígenes permitidos
	const allowedOrigins = [process.env.CLIENT_URL, "https://tudominio.com", "https://www.tudominio.com"];

	if (!allowedOrigins.includes(origin)) {
		return next(new Error("Origen no permitido"));
	}

	next();
});
```

## 🔐 Seguridad Adicional

### 1. **Rate Limiting**

```javascript
const rateLimit = new Map();

io.use((socket, next) => {
	const ip = socket.handshake.address;
	const now = Date.now();
	const windowMs = 60 * 1000; // 1 minuto
	const maxConnections = 5;

	if (!rateLimit.has(ip)) {
		rateLimit.set(ip, []);
	}

	const timestamps = rateLimit.get(ip).filter((t) => now - t < windowMs);

	if (timestamps.length >= maxConnections) {
		return next(new Error("Demasiadas conexiones"));
	}

	timestamps.push(now);
	rateLimit.set(ip, timestamps);

	next();
});
```

### 2. **Logs de Auditoría**

```javascript
io.on("connection", (socket) => {
	// Log de conexión
	logAudit({
		event: "websocket_connect",
		userId: socket.userId,
		ip: socket.handshake.address,
		timestamp: new Date(),
	});

	socket.on("disconnect", (reason) => {
		// Log de desconexión
		logAudit({
			event: "websocket_disconnect",
			userId: socket.userId,
			reason: reason,
			timestamp: new Date(),
		});
	});
});
```

## 📝 Checklist de Implementación

- [ ] Actualizar configuración de Socket.IO con CORS y credentials
- [ ] Implementar middleware de autenticación con cookies
- [ ] Eliminar código legacy que usa query params
- [ ] Actualizar eventos de autenticación
- [ ] Configurar cookies httpOnly en endpoints HTTP
- [ ] Probar conexión con el nuevo método
- [ ] Implementar rate limiting
- [ ] Agregar logs de auditoría

## 🧪 Pruebas

Para verificar que todo funciona:

1. **Verificar cookies en el navegador:**

   - Abrir DevTools > Application > Cookies
   - Buscar la cookie `auth_token`
   - Verificar que tenga flags: HttpOnly, Secure (en prod), SameSite

2. **Verificar WebSocket:**

   - En Network > WS, verificar que se envían cookies
   - No debe haber token en la URL
   - La conexión debe autenticarse automáticamente

3. **Probar reconexión:**
   - Desconectar/reconectar red
   - El WebSocket debe reconectarse automáticamente
   - No debe pedir re-autenticación

## ⚠️ Notas Importantes

1. **NUNCA** envíes tokens en query params o como parte de la URL
2. **SIEMPRE** usa cookies httpOnly para tokens de autenticación
3. **VERIFICA** el origen de las conexiones en producción
4. **IMPLEMENTA** rate limiting para prevenir ataques
5. **REGISTRA** todas las conexiones para auditoría
