// Mapeo de variables internas a nombres amigables para el usuario
export const variableDisplayNames: Record<string, string> = {
	// Contact variables
	"contact.name": "NOMBRE_CLIENTE",
	"contact.lastName": "APELLIDO_CLIENTE",
	"contact.document": "DNI_CLIENTE",
	"contact.address": "DIRECCION_CLIENTE",
	"contact.city": "CIUDAD_CLIENTE",
	"contact.state": "PROVINCIA_CLIENTE",
	"contact.phone": "TELEFONO_CLIENTE",
	"contact.email": "EMAIL_CLIENTE",
	"contact.role": "ROL_CONTACTO",
	
	// Folder variables
	"folder.folderName": "NOMBRE_CARPETA",
	"folder.materia": "MATERIA",
	"folder.judFolder.numberJudFolder": "NUMERO_EXPEDIENTE",
	"folder.judFolder.radicacion": "RADICACION",
	"folder.judFolder.juzgado": "JUZGADO",
	"folder.judFolder.secretaria": "SECRETARIA",
	
	// User/Lawyer variables
	"user.firstName": "NOMBRE_ABOGADO",
	"user.lastName": "APELLIDO_ABOGADO",
	"user.email": "EMAIL_ABOGADO",
	"user.skill.registrationNumber": "MATRICULA_ABOGADO",
	"user.skill.name": "COLEGIO_ABOGADO",
	"user.skill.electronicAddress": "DOMICILIO_ELECTRONICO",
	"user.skill.taxCondition": "CONDICION_TRIBUTARIA",
	"user.skill.taxCode": "CUIT_ABOGADO",
	
	// Date variables
	"currentDate": "FECHA_ACTUAL",
	"currentYear": "AÑO_ACTUAL",
	"currentMonth": "MES_ACTUAL",
	"currentDay": "DIA_ACTUAL",
};

// Función para obtener el nombre amigable de una variable
export function getVariableDisplayName(variablePath: string): string {
	return variableDisplayNames[variablePath] || variablePath.toUpperCase().replace(/\./g, "_");
}

// Función para convertir placeholders [] a formato {{}} con nombres amigables
export function standardizePlaceholders(content: string): string {
	// Mapeo de placeholders antiguos a nuevos
	const placeholderMap: Record<string, string> = {
		// Contact placeholders
		"[NOMBRE DEL CLIENTE]": "{{NOMBRE_CLIENTE}}",
		"[APELLIDO DEL CLIENTE]": "{{APELLIDO_CLIENTE}}",
		"[DNI DEL CLIENTE]": "{{DNI_CLIENTE}}",
		"[NOMBRE Y APELLIDO DEL CLIENTE]": "{{NOMBRE_CLIENTE}} {{APELLIDO_CLIENTE}}",
		"[NÚMERO DE DOCUMENTO]": "{{DNI_CLIENTE}}",
		"[DIRECCIÓN]": "{{DIRECCION_CLIENTE}}",
		"[CIUDAD]": "{{CIUDAD_CLIENTE}}",
		"[PROVINCIA]": "{{PROVINCIA_CLIENTE}}",
		"[CONTACT CITY]": "{{CIUDAD_CLIENTE}}",
		"[CONTACT STATE]": "{{PROVINCIA_CLIENTE}}",
		
		// Generic contact placeholders
		"[NOMBRE_CONTACTO]": "{{NOMBRE_CLIENTE}}",
		"[APELLIDO_CONTACTO]": "{{APELLIDO_CLIENTE}}",
		"[DNI_CONTACTO]": "{{DNI_CLIENTE}}",
		"[DIRECCION_CONTACTO]": "{{DIRECCION_CLIENTE}}",
		"[CIUDAD_CONTACTO]": "{{CIUDAD_CLIENTE}}",
		"[PROVINCIA_CONTACTO]": "{{PROVINCIA_CLIENTE}}",
		
		// Other placeholders
		"[CARPETA]": "{{NOMBRE_CARPETA}}",
		"[MATERIA]": "{{MATERIA}}",
		"[EXPEDIENTE]": "{{NUMERO_EXPEDIENTE}}",
	};
	
	// Reemplazar todos los placeholders conocidos
	let standardizedContent = content;
	for (const [oldPlaceholder, newPlaceholder] of Object.entries(placeholderMap)) {
		standardizedContent = standardizedContent.replace(new RegExp(escapeRegExp(oldPlaceholder), "g"), newPlaceholder);
	}
	
	// Reemplazar cualquier placeholder restante que siga el formato [ALGO]
	standardizedContent = standardizedContent.replace(/\[([^\]]+)\]/g, (match, p1) => {
		// Convertir el contenido a mayúsculas y reemplazar espacios con guiones bajos
		const normalized = p1.toUpperCase().replace(/\s+/g, "_");
		return `{{${normalized}}}`;
	});
	
	return standardizedContent;
}

// Función para escapar caracteres especiales en regex
function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Función para reemplazar variables con placeholders amigables cuando faltan datos
export function replaceWithFriendlyPlaceholders(content: string, missingVariables: string[]): string {
	let processedContent = content;
	
	// Primero estandarizar cualquier placeholder antiguo
	processedContent = standardizePlaceholders(processedContent);
	
	// Luego reemplazar las variables faltantes con sus placeholders amigables
	for (const variable of missingVariables) {
		const displayName = getVariableDisplayName(variable);
		// Reemplazar {{variable.path}} con {{DISPLAY_NAME}}
		const regex = new RegExp(`{{${escapeRegExp(variable)}}}`, "g");
		processedContent = processedContent.replace(regex, `{{${displayName}}}`);
	}
	
	return processedContent;
}