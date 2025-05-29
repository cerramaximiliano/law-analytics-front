# 🚨 PLAN DE ACCIÓN: VULNERABILIDADES CRÍTICAS

## 📋 ÍNDICE DE VULNERABILIDADES CRÍTICAS

1. [Exposición de Credenciales y Datos Sensibles](#1-exposición-de-credenciales)
2. [Falta de Protección CSRF](#2-protección-csrf)
3. [Validación Solo en Frontend](#3-validación-frontend)
4. [Configuración Insegura de APIs](#4-configuración-apis)

---

## 1. EXPOSICIÓN DE CREDENCIALES Y DATOS SENSIBLES <a name="1-exposición-de-credenciales"></a>

### 🎯 Objetivo

Eliminar todas las credenciales hardcodeadas y migrar el almacenamiento de tokens a un método seguro.

### 📍 Archivos Afectados

- `src/config.ts`
- `src/sections/auth/auth-forms/AuthCodeVerification.tsx`
- `src/contexts/ServerContext.tsx`
- `src/store/reducers/WebSocketService.ts`

### 🛠️ SOLUCIÓN PASO A PASO

#### Paso 1: Eliminar Credenciales de Desarrollo (INMEDIATO)

**Archivo: `src/config.ts`**

```typescript
// ELIMINAR estas líneas:
// export const DEV_EMAIL = process.env.REACT_APP_DEV_EMAIL || "";
// export const DEV_PASSWORD = process.env.REACT_APP_DEV_PASSWORD || "";

// Si necesitas autocompletar en desarrollo, usa una extensión del navegador
// o crea un script de desarrollo separado que NO se suba al repositorio
```

**Archivo: `src/sections/auth/auth-forms/AuthLogin.tsx`**

```typescript
// BUSCAR y ELIMINAR:
// Si hay referencias a DEV_EMAIL o DEV_PASSWORD, eliminarlas
// Por ejemplo:
// defaultValue: DEV_EMAIL // ELIMINAR
// defaultValue: DEV_PASSWORD // ELIMINAR
```

#### Paso 2: Migrar localStorage a Cookies Seguras

**Crear nuevo servicio: `src/services/secureStorage.ts`**

```typescript
import Cookies from "js-cookie";

interface SecureStorageOptions {
	expires?: number; // días
	secure?: boolean;
	sameSite?: "strict" | "lax" | "none";
}

class SecureStorageService {
	private readonly defaultOptions: SecureStorageOptions = {
		expires: 7, // 7 días por defecto
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	};

	// Almacenar token de forma segura
	setAuthToken(token: string, remember: boolean = false): void {
		const options = {
			...this.defaultOptions,
			expires: remember ? 30 : 1, // 30 días si "recordar", 1 día si no
			httpOnly: false, // No podemos setear httpOnly desde JS
		};

		// IMPORTANTE: El backend debe setear la cookie httpOnly
		// Este es solo un fallback temporal
		Cookies.set("auth_token_temp", token, options);
	}

	// Obtener token
	getAuthToken(): string | undefined {
		return Cookies.get("auth_token_temp");
	}

	// Eliminar token
	removeAuthToken(): void {
		Cookies.remove("auth_token_temp");
	}

	// Para datos no sensibles, usar sessionStorage
	setSessionData(key: string, value: any): void {
		sessionStorage.setItem(key, JSON.stringify(value));
	}

	getSessionData(key: string): any {
		const data = sessionStorage.getItem(key);
		return data ? JSON.parse(data) : null;
	}

	clearSession(): void {
		sessionStorage.clear();
		this.removeAuthToken();
	}
}

export default new SecureStorageService();
```

**Actualizar `src/sections/auth/auth-forms/AuthCodeVerification.tsx`**

```typescript
import secureStorage from "services/secureStorage";

// REEMPLAZAR:
// localStorage.setItem("reset_code", otp);
// localStorage.setItem("reset_email", values.email);

// CON:
// Usar sessionStorage para datos temporales no sensibles
secureStorage.setSessionData("reset_email", values.email);
// NUNCA almacenar el código OTP en el cliente
// El código debe validarse directamente con el backend
```

**Actualizar `src/contexts/ServerContext.tsx`**

```typescript
import secureStorage from "services/secureStorage";

// REEMPLAZAR:
// localStorage.setItem("googleToken", credential);

// CON:
// Enviar el token al backend para que lo almacene de forma segura
const response = await axios.post("/api/auth/google", {
	credential,
});
// El backend debe responder seteando una cookie httpOnly
```

#### Paso 3: Asegurar WebSocket

**Actualizar `src/store/reducers/WebSocketService.ts`**

```typescript
// REEMPLAZAR:
// const url = `${WS_BASE_URL}/socket.io/?userId=${userId}&token=${authToken}`;

// CON:
connect(userId: string) {
  const socket = io(WS_BASE_URL, {
    withCredentials: true, // Usar cookies para autenticación
    auth: {
      userId
      // El token se enviará automáticamente via cookie
    },
    transports: ['websocket'],
    secure: true
  });
}
```

### ✅ Checklist de Verificación

- [ ] Eliminar DEV_EMAIL y DEV_PASSWORD de config.ts
- [ ] Eliminar referencias a estas constantes en todos los archivos
- [ ] Crear servicio secureStorage.ts
- [ ] Migrar todos los localStorage.setItem de tokens
- [ ] Actualizar WebSocket para usar cookies
- [ ] Verificar que no queden tokens en localStorage con las DevTools

---

## 2. PROTECCIÓN CSRF <a name="2-protección-csrf"></a>

### 🎯 Objetivo

Implementar protección CSRF en todas las peticiones que modifiquen estado.

### 📍 Archivos Afectados

- `src/utils/axios.ts`
- `src/store/reducers/ApiService.ts`
- Todos los formularios que hacen POST/PUT/DELETE

### 🛠️ SOLUCIÓN PASO A PASO

#### Paso 1: Configurar Axios para CSRF

**Actualizar `src/utils/axios.ts`**

```typescript
import axios from "axios";
import secureStorage from "../services/secureStorage";

const axiosInstance = axios.create({
	baseURL: process.env.REACT_APP_BASE_URL || "",
	timeout: 30000,
	withCredentials: true, // Importante para CSRF
});

// Función para obtener CSRF token
function getCsrfToken(): string | null {
	// Opción 1: Desde meta tag
	const metaTag = document.querySelector('meta[name="csrf-token"]');
	if (metaTag) {
		return metaTag.getAttribute("content");
	}

	// Opción 2: Desde cookie (el backend debe setearla)
	const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
	return match ? match[1] : null;
}

// Request interceptor para agregar CSRF token
axiosInstance.interceptors.request.use(
	(config) => {
		// Agregar CSRF token a requests que modifican estado
		const csrfMethods = ["post", "put", "patch", "delete"];
		if (config.method && csrfMethods.includes(config.method.toLowerCase())) {
			const csrfToken = getCsrfToken();
			if (csrfToken) {
				config.headers["X-CSRF-Token"] = csrfToken;
			}
		}

		// Agregar auth token desde cookie segura
		const authToken = secureStorage.getAuthToken();
		if (authToken) {
			config.headers.Authorization = `Bearer ${authToken}`;
		}

		return config;
	},
	(error) => Promise.reject(error),
);

// Response interceptor para manejar errores
axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			// Token expirado o inválido
			secureStorage.clearSession();
			window.location.href = "/login";
		} else if (error.response?.status === 403) {
			// CSRF token inválido
			console.error("CSRF token validation failed");
			// Intentar obtener nuevo token
			window.location.reload();
		}
		return Promise.reject(error);
	},
);

export default axiosInstance;
```

#### Paso 2: Actualizar index.html para CSRF

**Archivo: `public/index.html`**

```html
<!DOCTYPE html>
<html lang="es">
	<head>
		<!-- Agregar después de otros meta tags -->
		<meta name="csrf-token" content="%REACT_APP_CSRF_TOKEN%" />
		<!-- El backend debe inyectar el token real aquí -->
	</head>
</html>
```

#### Paso 3: Crear Hook para CSRF en Formularios

**Crear `src/hooks/useCsrfToken.ts`**

```typescript
import { useEffect, useState } from "react";

export const useCsrfToken = () => {
	const [csrfToken, setCsrfToken] = useState<string>("");

	useEffect(() => {
		// Obtener CSRF token al montar componente
		const fetchCsrfToken = async () => {
			try {
				const response = await fetch("/api/csrf-token", {
					credentials: "include",
				});
				const data = await response.json();
				setCsrfToken(data.csrfToken);
			} catch (error) {
				console.error("Failed to fetch CSRF token:", error);
			}
		};

		fetchCsrfToken();
	}, []);

	return csrfToken;
};
```

#### Paso 4: Implementar en Formularios

**Ejemplo en `src/pages/admin/users/AddUserModal.tsx`**

```typescript
import { useCsrfToken } from "hooks/useCsrfToken";

const AddUserModal = () => {
	const csrfToken = useCsrfToken();

	const handleSubmit = async (values: FormValues) => {
		try {
			// El CSRF token se enviará automáticamente via axios interceptor
			const response = await axios.post("/api/users", values);
			// ...
		} catch (error) {
			// ...
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			{/* Para formularios HTML tradicionales (no recomendado en React) */}
			<input type="hidden" name="_csrf" value={csrfToken} />
			{/* ... resto del formulario ... */}
		</form>
	);
};
```

### ✅ Checklist de Verificación

- [ ] Configurar axios interceptor para CSRF
- [ ] Agregar meta tag en index.html
- [ ] Crear hook useCsrfToken
- [ ] Verificar que todas las peticiones POST/PUT/DELETE incluyen el token
- [ ] Probar que el backend valida el token correctamente

---

## 3. VALIDACIÓN SOLO EN FRONTEND <a name="3-validación-frontend"></a>

### 🎯 Objetivo

Asegurar que toda validación del frontend se replique en el backend.

### 📍 Archivos a Documentar

- Todos los esquemas Yup
- Formularios de autenticación
- Formularios de administración

### 🛠️ SOLUCIÓN PASO A PASO

#### Paso 1: Crear Servicio de Validación Compartido

**Crear `src/utils/validation/sharedValidation.ts`**

```typescript
// Reglas de validación compartidas entre frontend y backend
export const ValidationRules = {
	password: {
		minLength: 8,
		maxLength: 128,
		pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
		message: "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial",
	},
	email: {
		pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
		maxLength: 255,
		message: "Ingrese un email válido",
	},
	username: {
		minLength: 3,
		maxLength: 30,
		pattern: /^[a-zA-Z0-9_-]+$/,
		message: "El usuario solo puede contener letras, números, guiones y guiones bajos",
	},
	phone: {
		pattern: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
		message: "Ingrese un número de teléfono válido",
	},
};

// Validación de tipos de archivo
export const FileValidation = {
	allowedMimeTypes: {
		images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
		documents: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
	},
	maxFileSize: 5 * 1024 * 1024, // 5MB
	validateFile(file: File, type: "images" | "documents"): string | null {
		if (!this.allowedMimeTypes[type].includes(file.type)) {
			return `Tipo de archivo no permitido. Tipos permitidos: ${this.allowedMimeTypes[type].join(", ")}`;
		}
		if (file.size > this.maxFileSize) {
			return `El archivo excede el tamaño máximo de ${this.maxFileSize / 1024 / 1024}MB`;
		}
		return null;
	},
};
```

#### Paso 2: Documentar Validaciones para Backend

**Crear `src/utils/validation/BACKEND_VALIDATION_REQUIREMENTS.md`**

```markdown
# REQUISITOS DE VALIDACIÓN BACKEND

Este documento lista TODAS las validaciones que DEBEN implementarse en el backend.

## 1. AUTENTICACIÓN

### Login

- **email**:
  - Requerido
  - Formato email válido
  - Máximo 255 caracteres
- **password**:
  - Requerido
  - Máximo 255 caracteres

### Registro

- **email**:
  - Requerido
  - Formato email válido
  - Único en base de datos
  - Máximo 255 caracteres
- **password**:
  - Requerido
  - Mínimo 8 caracteres
  - Debe contener: 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
  - Máximo 128 caracteres
- **firstName**:
  - Requerido
  - Máximo 50 caracteres
  - Solo letras y espacios
- **lastName**:
  - Requerido
  - Máximo 50 caracteres
  - Solo letras y espacios

### Cambio de Contraseña

- **currentPassword**:
  - Requerido
  - Debe coincidir con la contraseña actual del usuario
- **newPassword**:
  - Requerido
  - Mismas reglas que registro
  - No puede ser igual a la contraseña actual

## 2. ADMINISTRACIÓN DE USUARIOS

### Crear Usuario

- Todas las validaciones de registro
- **role**:
  - Requerido
  - Debe ser uno de: ['USER_ROLE', 'ADMIN_ROLE']
- **status**:
  - Requerido
  - Debe ser uno de: ['active', 'inactive', 'suspended']

## 3. CALCULADORAS

### Cálculo de Intereses

- **capital**:
  - Requerido
  - Número positivo
  - Máximo 999999999.99
- **fechaInicio**:
  - Requerido
  - Fecha válida
  - No puede ser futura
- **fechaFin**:
  - Requerido
  - Fecha válida
  - Debe ser posterior a fechaInicio
- **tasa**:
  - Requerido
  - Número entre 0 y 100

## 4. SUBIDA DE ARCHIVOS

- **Tipo MIME**: Validar contenido real, no solo extensión
- **Tamaño**: Máximo 5MB
- **Antivirus**: Escanear antes de almacenar
- **Nombres**: Sanitizar nombres de archivo
```

#### Paso 3: Implementar Validación con Sanitización

**Actualizar `src/sections/auth/auth-forms/AuthRegister.tsx`**

```typescript
import DOMPurify from "dompurify";
import { ValidationRules } from "utils/validation/sharedValidation";

const validationSchema = Yup.object().shape({
	firstName: Yup.string()
		.max(50)
		.required("El nombre es requerido")
		.test("sanitize", "Nombre inválido", (value) => {
			if (!value) return false;
			const sanitized = DOMPurify.sanitize(value);
			return sanitized === value && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value);
		}),
	email: Yup.string().email("Debe ser un email válido").max(ValidationRules.email.maxLength).required("El email es requerido"),
	password: Yup.string()
		.min(ValidationRules.password.minLength)
		.max(ValidationRules.password.maxLength)
		.matches(ValidationRules.password.pattern, ValidationRules.password.message)
		.required("La contraseña es requerida"),
});

// En el handleSubmit
const handleSubmit = async (values: FormValues) => {
	try {
		// Sanitizar datos antes de enviar
		const sanitizedValues = {
			firstName: DOMPurify.sanitize(values.firstName.trim()),
			lastName: DOMPurify.sanitize(values.lastName.trim()),
			email: values.email.toLowerCase().trim(),
			password: values.password, // Nunca sanitizar contraseñas
		};

		await dispatch(register(sanitizedValues));
	} catch (error) {
		// ...
	}
};
```

### ✅ Checklist de Verificación

- [ ] Crear archivo de validaciones compartidas
- [ ] Documentar TODAS las validaciones para el backend
- [ ] Agregar sanitización en el frontend
- [ ] Verificar que el backend implementa todas las validaciones
- [ ] Probar bypass de validación con Postman/curl

---

## 4. CONFIGURACIÓN INSEGURA DE APIs <a name="4-configuración-apis"></a>

### 🎯 Objetivo

Eliminar URLs hardcodeadas y asegurar configuración correcta según ambiente.

### 📍 Archivos Afectados

- `src/config.ts`
- `src/utils/axios.ts`
- `src/store/reducers/sessionService.ts`
- `.env` files

### 🛠️ SOLUCIÓN PASO A PASO

#### Paso 1: Refactorizar config.ts

**Actualizar `src/config.ts`**

```typescript
// Función helper para validar URLs
const validateUrl = (url: string | undefined, name: string): string => {
	if (!url) {
		throw new Error(`${name} no está configurado. Verifique las variables de entorno.`);
	}

	// En producción, forzar HTTPS
	if (process.env.NODE_ENV === "production") {
		if (!url.startsWith("https://")) {
			throw new Error(`${name} debe usar HTTPS en producción`);
		}
	}

	// Validar formato de URL
	try {
		new URL(url);
	} catch {
		throw new Error(`${name} no es una URL válida: ${url}`);
	}

	return url;
};

// Configuración de APIs
export const API_CONFIG = {
	BASE_URL: validateUrl(process.env.REACT_APP_BASE_URL, "API_BASE_URL"),
	WS_URL: validateUrl(process.env.REACT_APP_WS_URL, "WS_URL"),
	TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || "30000", 10),
	RETRY_ATTEMPTS: parseInt(process.env.REACT_APP_RETRY_ATTEMPTS || "3", 10),
};

// Configuración de ambiente
export const ENV_CONFIG = {
	IS_PRODUCTION: process.env.NODE_ENV === "production",
	IS_DEVELOPMENT: process.env.NODE_ENV === "development",
	IS_TEST: process.env.NODE_ENV === "test",
	VERSION: process.env.REACT_APP_VERSION || "development",
	BUILD_DATE: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
};

// Configuración de seguridad
export const SECURITY_CONFIG = {
	ENABLE_DEVTOOLS: process.env.REACT_APP_ENABLE_DEVTOOLS === "true" && !ENV_CONFIG.IS_PRODUCTION,
	LOG_LEVEL: process.env.REACT_APP_LOG_LEVEL || (ENV_CONFIG.IS_PRODUCTION ? "error" : "debug"),
	SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
};

// NO incluir credenciales de ningún tipo
// ELIMINAR: DEV_EMAIL, DEV_PASSWORD, etc.
```

#### Paso 2: Crear Archivos de Entorno Seguros

**Crear `.env.example`**

```bash
# API Configuration
REACT_APP_BASE_URL=https://api.lawanalytics.com
REACT_APP_WS_URL=wss://ws.lawanalytics.com
REACT_APP_API_TIMEOUT=30000
REACT_APP_RETRY_ATTEMPTS=3

# App Configuration
REACT_APP_VERSION=1.0.0
REACT_APP_BUILD_DATE=

# Security
REACT_APP_ENABLE_DEVTOOLS=false
REACT_APP_LOG_LEVEL=error
REACT_APP_SENTRY_DSN=

# Features
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_GOOGLE_ANALYTICS_ID=
```

**Actualizar `.env.development`**

```bash
# Development Environment
REACT_APP_BASE_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
REACT_APP_API_TIMEOUT=60000
REACT_APP_RETRY_ATTEMPTS=1

# Development Tools
REACT_APP_ENABLE_DEVTOOLS=true
REACT_APP_LOG_LEVEL=debug

# Deshabilitado en desarrollo
REACT_APP_SENTRY_DSN=
REACT_APP_ENABLE_ANALYTICS=false
```

#### Paso 3: Actualizar Referencias a Config

**Actualizar `src/utils/axios.ts`**

```typescript
import axios from "axios";
import { API_CONFIG, SECURITY_CONFIG } from "../config";

const axiosInstance = axios.create({
	baseURL: API_CONFIG.BASE_URL,
	timeout: API_CONFIG.TIMEOUT,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

// Agregar retry logic
axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const config = error.config;

		// Retry logic para errores de red
		if (error.code === "ECONNABORTED" || !error.response) {
			config.__retryCount = config.__retryCount || 0;

			if (config.__retryCount < API_CONFIG.RETRY_ATTEMPTS) {
				config.__retryCount++;

				// Espera exponencial
				const delay = Math.min(1000 * Math.pow(2, config.__retryCount), 10000);
				await new Promise((resolve) => setTimeout(resolve, delay));

				return axiosInstance(config);
			}
		}

		// Log de errores según nivel configurado
		if (SECURITY_CONFIG.LOG_LEVEL === "debug") {
			console.error("API Error:", error);
		}

		return Promise.reject(error);
	},
);

export default axiosInstance;
```

#### Paso 4: Script de Validación de Entorno

**Crear `scripts/validate-env.js`**

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Variables requeridas
const requiredEnvVars = ["REACT_APP_BASE_URL", "REACT_APP_WS_URL"];

// Validar archivo .env
function validateEnvFile(envPath) {
	if (!fs.existsSync(envPath)) {
		console.error(`❌ Archivo ${envPath} no encontrado`);
		return false;
	}

	const envContent = fs.readFileSync(envPath, "utf8");
	const envVars = {};

	envContent.split("\n").forEach((line) => {
		const match = line.match(/^([^#=]+)=(.*)$/);
		if (match) {
			envVars[match[1].trim()] = match[2].trim();
		}
	});

	let hasErrors = false;

	requiredEnvVars.forEach((varName) => {
		if (!envVars[varName]) {
			console.error(`❌ ${varName} no está definido`);
			hasErrors = true;
		} else if (varName.includes("URL")) {
			try {
				new URL(envVars[varName]);
				console.log(`✅ ${varName}: ${envVars[varName]}`);
			} catch {
				console.error(`❌ ${varName} no es una URL válida: ${envVars[varName]}`);
				hasErrors = true;
			}
		}
	});

	// Verificar que no haya localhost en producción
	if (envPath.includes("production")) {
		Object.entries(envVars).forEach(([key, value]) => {
			if (value.includes("localhost") || value.includes("127.0.0.1")) {
				console.error(`❌ ${key} contiene localhost en producción!`);
				hasErrors = true;
			}
		});
	}

	return !hasErrors;
}

// Ejecutar validación
const envFile = process.argv[2] || ".env";
const isValid = validateEnvFile(envFile);

if (!isValid) {
	console.error("\n❌ Validación de entorno falló");
	process.exit(1);
} else {
	console.log("\n✅ Validación de entorno exitosa");
}
```

**Agregar a `package.json`**

```json
{
	"scripts": {
		"validate:env": "node scripts/validate-env.js",
		"validate:env:prod": "node scripts/validate-env.js .env.production",
		"prebuild": "npm run validate:env:prod",
		"prestart": "npm run validate:env"
	}
}
```

### ✅ Checklist de Verificación

- [ ] Refactorizar config.ts con validación de URLs
- [ ] Crear archivos .env.example y .env.development
- [ ] Actualizar todas las referencias a configuración
- [ ] Crear script de validación de entorno
- [ ] Agregar validación pre-build y pre-start
- [ ] Verificar que no quedan URLs hardcodeadas

---

## 📊 RESUMEN Y PRIORIZACIÓN

### Orden de Implementación Recomendado:

1. **DÍA 1 - Mañana:**

   - [ ] Eliminar credenciales hardcodeadas (1-2 horas)
   - [ ] Configurar entornos seguros (2-3 horas)

2. **DÍA 1 - Tarde:**

   - [ ] Implementar almacenamiento seguro de tokens (3-4 horas)

3. **DÍA 2 - Mañana:**

   - [ ] Configurar CSRF protection (2-3 horas)
   - [ ] Actualizar formularios principales (2-3 horas)

4. **DÍA 2 - Tarde:**

   - [ ] Documentar validaciones para backend (2 horas)
   - [ ] Implementar sanitización (2 horas)

5. **DÍA 3:**
   - [ ] Testing completo de todas las implementaciones
   - [ ] Documentación para el equipo

### 🚨 IMPORTANTE:

- No deployar a producción hasta completar TODOS estos puntos
- Cada cambio debe ser probado exhaustivamente
- Coordinar con el equipo de backend para los cambios necesarios
- Mantener comunicación constante sobre el progreso

### 📞 Soporte:

Si encuentras algún problema durante la implementación, documéntalo en este archivo y busca ayuda inmediata del equipo de seguridad.
