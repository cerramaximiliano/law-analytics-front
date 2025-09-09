/**
 * Mapa de mensajes de error del servidor a mensajes amigables para el usuario
 */

interface ErrorMapping {
	[key: string]: string;
}

// Mapeo de mensajes de error específicos
const errorMappings: ErrorMapping = {
	// Autenticación y autorización
	"No token, authorization denied": "Sesión expirada. Por favor, inicia sesión nuevamente.",
	"Token is not valid": "Sesión inválida. Por favor, inicia sesión nuevamente.",
	"Token has expired": "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
	"jwt expired": "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
	"jwt malformed": "Sesión inválida. Por favor, inicia sesión nuevamente.",
	"Unauthorized": "No tienes autorización para realizar esta acción.",
	"Access denied": "Acceso denegado.",
	"Invalid credentials": "Credenciales incorrectas.",
	"User not found": "Usuario no encontrado.",
	"Invalid password": "Contraseña incorrecta.",
	"Email not verified": "Por favor, verifica tu correo electrónico.",
	
	// Suscripciones y pagos
	"No active subscription": "No tienes una suscripción activa.",
	"Payment failed": "El pago no pudo procesarse. Por favor, verifica tu método de pago.",
	"Subscription expired": "Tu suscripción ha expirado.",
	"Payment method required": "Se requiere un método de pago.",
	"Card declined": "Tarjeta rechazada. Por favor, usa otro método de pago.",
	"Insufficient funds": "Fondos insuficientes.",
	
	// Límites y cuotas
	"Folder limit reached": "Has alcanzado el límite de carpetas de tu plan.",
	"Contact limit reached": "Has alcanzado el límite de contactos de tu plan.",
	"Storage limit exceeded": "Has excedido tu límite de almacenamiento.",
	"Rate limit exceeded": "Demasiadas solicitudes. Por favor, espera un momento.",
	
	// Validación de datos
	"Email already exists": "Este correo electrónico ya está registrado.",
	"Invalid email format": "Formato de correo electrónico inválido.",
	"Password too weak": "La contraseña es muy débil. Usa al menos 8 caracteres.",
	"Required field missing": "Faltan campos requeridos.",
	"Invalid data format": "Formato de datos inválido.",
	
	// Errores de red y servidor
	"Network error": "Error de conexión. Por favor, verifica tu internet.",
	"Server error": "Error del servidor. Por favor, intenta más tarde.",
	"Service unavailable": "Servicio no disponible temporalmente.",
	"Database connection failed": "Error de conexión con la base de datos.",
	"Internal server error": "Error interno del servidor.",
	"Request timeout": "La solicitud tardó demasiado. Por favor, intenta nuevamente.",
	
	// Operaciones CRUD
	"Resource not found": "Recurso no encontrado.",
	"Cannot delete resource": "No se puede eliminar este recurso.",
	"Cannot update resource": "No se puede actualizar este recurso.",
	"Duplicate entry": "Ya existe un registro con estos datos.",
	"Operation failed": "La operación falló. Por favor, intenta nuevamente.",
	
	// Archivos y documentos
	"File too large": "El archivo es demasiado grande.",
	"Invalid file type": "Tipo de archivo no permitido.",
	"File upload failed": "Error al cargar el archivo.",
	"File not found": "Archivo no encontrado.",
	
	// Permisos y roles
	"Permission denied": "No tienes permisos para realizar esta acción.",
	"Admin access required": "Se requiere acceso de administrador.",
	"Invalid role": "Rol inválido.",
	
	// Sesión y estado
	"Session expired": "Tu sesión ha expirado.",
	"Invalid session": "Sesión inválida.",
	"Already logged in": "Ya has iniciado sesión.",
	"Not logged in": "No has iniciado sesión.",
	
	// Validación de negocio
	"Cannot process request": "No se puede procesar la solicitud.",
	"Invalid operation": "Operación inválida.",
	"Business rule violation": "Esta operación viola las reglas del negocio.",
};

// Patrones regex para mensajes más genéricos
const errorPatterns: Array<{ pattern: RegExp; message: string }> = [
	{ pattern: /token/i, message: "Problema con la sesión. Por favor, inicia sesión nuevamente." },
	{ pattern: /unauthorized|auth/i, message: "No tienes autorización para realizar esta acción." },
	{ pattern: /payment|billing|stripe/i, message: "Error en el proceso de pago. Por favor, intenta nuevamente." },
	{ pattern: /limit|quota|exceed/i, message: "Has alcanzado el límite de tu plan." },
	{ pattern: /network|connection/i, message: "Error de conexión. Por favor, verifica tu internet." },
	{ pattern: /server|internal/i, message: "Error del servidor. Por favor, intenta más tarde." },
	{ pattern: /not found|404/i, message: "Recurso no encontrado." },
	{ pattern: /duplicate|already exists/i, message: "Este registro ya existe." },
	{ pattern: /invalid|validation/i, message: "Los datos proporcionados no son válidos." },
	{ pattern: /permission|forbidden|403/i, message: "No tienes permisos para realizar esta acción." },
	{ pattern: /expired/i, message: "Ha expirado. Por favor, intenta nuevamente." },
	{ pattern: /failed/i, message: "La operación falló. Por favor, intenta nuevamente." },
];

/**
 * Convierte un mensaje de error del servidor en un mensaje amigable para el usuario
 * @param serverMessage El mensaje de error original del servidor
 * @param defaultMessage Mensaje por defecto si no se encuentra mapeo
 * @returns Mensaje amigable para mostrar al usuario
 */
export function getFriendlyErrorMessage(
	serverMessage: string | undefined | null,
	defaultMessage: string = "Ha ocurrido un error. Por favor, intenta nuevamente."
): string {
	// Si no hay mensaje, retornar el mensaje por defecto
	if (!serverMessage) {
		return defaultMessage;
	}

	// Normalizar el mensaje (trim y lowercase para comparación)
	const normalizedMessage = serverMessage.trim();
	
	// Buscar coincidencia exacta primero (case-insensitive)
	for (const [key, value] of Object.entries(errorMappings)) {
		if (normalizedMessage.toLowerCase() === key.toLowerCase()) {
			return value;
		}
	}
	
	// Buscar coincidencias parciales en el mensaje
	for (const [key, value] of Object.entries(errorMappings)) {
		if (normalizedMessage.toLowerCase().includes(key.toLowerCase())) {
			return value;
		}
	}
	
	// Buscar patrones regex
	for (const { pattern, message } of errorPatterns) {
		if (pattern.test(normalizedMessage)) {
			return message;
		}
	}
	
	// Si el mensaje es muy técnico (contiene stack trace, etc), no mostrarlo
	if (normalizedMessage.includes("at ") || normalizedMessage.includes("Error:")) {
		return defaultMessage;
	}
	
	// Si el mensaje es muy largo, probablemente sea técnico
	if (normalizedMessage.length > 200) {
		return defaultMessage;
	}
	
	// Retornar el mensaje original si parece ser amigable
	// (empieza con mayúscula y no contiene términos técnicos)
	const technicalTerms = ["undefined", "null", "NaN", "stack", "trace", "exception"];
	const containsTechnicalTerms = technicalTerms.some(term => 
		normalizedMessage.toLowerCase().includes(term)
	);
	
	if (!containsTechnicalTerms && normalizedMessage[0] === normalizedMessage[0].toUpperCase()) {
		return normalizedMessage;
	}
	
	// En cualquier otro caso, retornar el mensaje por defecto
	return defaultMessage;
}

/**
 * Obtiene un mensaje amigable basado en el código de estado HTTP
 * @param statusCode Código de estado HTTP
 * @returns Mensaje amigable para el usuario
 */
export function getFriendlyErrorMessageByStatus(statusCode: number): string {
	switch (statusCode) {
		case 400:
			return "Solicitud incorrecta. Por favor, verifica los datos ingresados.";
		case 401:
			return "Sesión expirada. Por favor, inicia sesión nuevamente.";
		case 403:
			return "No tienes permisos para realizar esta acción.";
		case 404:
			return "Recurso no encontrado.";
		case 409:
			return "Conflicto con el estado actual. El recurso ya existe o está en uso.";
		case 413:
			return "El archivo es demasiado grande.";
		case 422:
			return "Los datos proporcionados no son válidos.";
		case 429:
			return "Demasiadas solicitudes. Por favor, espera un momento.";
		case 500:
			return "Error interno del servidor. Por favor, intenta más tarde.";
		case 502:
			return "Error de conexión con el servidor.";
		case 503:
			return "Servicio no disponible temporalmente.";
		case 504:
			return "Tiempo de espera agotado. Por favor, intenta nuevamente.";
		default:
			if (statusCode >= 400 && statusCode < 500) {
				return "Error en la solicitud. Por favor, verifica los datos.";
			} else if (statusCode >= 500) {
				return "Error del servidor. Por favor, intenta más tarde.";
			}
			return "Ha ocurrido un error. Por favor, intenta nuevamente.";
	}
}

/**
 * Extrae y formatea el mensaje de error de una respuesta de axios
 * @param error Error de axios o cualquier error
 * @returns Mensaje amigable para el usuario
 */
export function extractErrorMessage(error: any): string {
	// Si es un error de axios
	if (error?.response) {
		const { data, status } = error.response;
		
		// Intentar obtener el mensaje del servidor
		let serverMessage = data?.message || data?.error || data?.msg;
		
		// Si data es un string, usarlo como mensaje
		if (typeof data === "string") {
			serverMessage = data;
		}
		
		// Si hay un mensaje del servidor, convertirlo a amigable
		if (serverMessage) {
			return getFriendlyErrorMessage(serverMessage);
		}
		
		// Si no hay mensaje, usar el código de estado
		return getFriendlyErrorMessageByStatus(status);
	}
	
	// Si es un error de red
	if (error?.request && !error?.response) {
		return "Error de conexión. Por favor, verifica tu internet.";
	}
	
	// Si es un error con mensaje
	if (error?.message) {
		return getFriendlyErrorMessage(error.message);
	}
	
	// Error desconocido
	return "Ha ocurrido un error inesperado. Por favor, intenta nuevamente.";
}