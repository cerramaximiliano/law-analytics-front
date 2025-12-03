/**
 * Configuración de tamaños estimados de documentos para el cálculo de storage.
 *
 * Estos valores deben coincidir con los del backend (law-analytics-server/config/storageConfig.js)
 * para mantener consistencia en las actualizaciones optimistas.
 *
 * NOTA: Solo los elementos ARCHIVADOS cuentan para el storage del usuario.
 * Los elementos activos no consumen cuota de almacenamiento.
 */

export const STORAGE_CONFIG = {
	// Tamaños base de documentos en bytes
	documentSizes: {
		// Contacto simple con datos básicos (nombre, email, teléfono, dirección)
		contact: 2048, // 2 KB

		// Carpeta/Causa básica sin vinculación judicial
		folder: 10240, // 10 KB

		// Carpeta/Causa vinculada a sistema judicial (PJN, MEV, etc.)
		// Incluye datos adicionales de la causa, movimientos cacheados, metadata judicial
		folderLinked: 51200, // 50 KB

		// Calculadora con fórmulas, variables y configuraciones
		calculator: 5120, // 5 KB
	},

	// Configuración de límites por defecto (en bytes)
	defaultLimits: {
		storage: 52428800, // 50 MB para plan gratuito
	},
} as const;

export type StorageDocumentType = "contact" | "folder" | "folderLinked" | "calculator";

/**
 * Interfaz para datos de folder que determinan si está vinculado a una causa.
 * Es flexible para aceptar diferentes estructuras de FolderData.
 */
export interface FolderLinkInfo {
	causaId?: string | null;
	causaIsValid?: boolean;
	// pjn puede ser un objeto con datos o un booleano (legacy) o undefined
	pjn?:
		| {
				number?: string;
				expediente?: string;
		  }
		| boolean
		| null;
	// mev puede ser un objeto con datos o un booleano (legacy) o undefined
	mev?:
		| {
				number?: string;
				expediente?: string;
		  }
		| boolean
		| null;
	judFolder?: Record<string, unknown> | null;
}

/**
 * Determina si un folder está vinculado a una causa judicial.
 * Un folder se considera vinculado si tiene causaId válido y causaIsValid es true,
 * o si tiene datos de PJN o MEV asociados.
 *
 * @param folder - Datos del folder con información de vinculación
 * @returns true si el folder está vinculado a una causa
 */
export const isFolderLinkedToCausa = (folder: FolderLinkInfo | null | undefined): boolean => {
	if (!folder) return false;

	// Verificar vinculación por causaId y causaIsValid
	if (folder.causaId && folder.causaIsValid === true) {
		return true;
	}

	// Verificar vinculación PJN (Poder Judicial de la Nación)
	// pjn puede ser un objeto con datos o un booleano true (legacy)
	if (folder.pjn) {
		if (typeof folder.pjn === "boolean") {
			// Si es true, está vinculado (formato legacy)
			if (folder.pjn === true) {
				return true;
			}
		} else if (typeof folder.pjn === "object") {
			// Si es un objeto, verificar que tenga datos
			if (folder.pjn.number || folder.pjn.expediente) {
				return true;
			}
		}
	}

	// Verificar vinculación MEV (Mesa de Entradas Virtual - Buenos Aires)
	// mev puede ser un objeto con datos o un booleano true (legacy)
	if (folder.mev) {
		if (typeof folder.mev === "boolean") {
			// Si es true, está vinculado (formato legacy)
			if (folder.mev === true) {
				return true;
			}
		} else if (typeof folder.mev === "object") {
			// Si es un objeto, verificar que tenga datos
			if (folder.mev.number || folder.mev.expediente) {
				return true;
			}
		}
	}

	// Verificar campo judFolder (datos judiciales adicionales)
	if (folder.judFolder && typeof folder.judFolder === "object") {
		if (Object.keys(folder.judFolder).length > 0) {
			return true;
		}
	}

	return false;
};

/**
 * Obtiene el tamaño estimado de un documento según su tipo.
 *
 * @param documentType - Tipo de documento ('contact', 'folder', 'folderLinked', 'calculator')
 * @returns Tamaño en bytes
 */
export const getDocumentSize = (documentType: StorageDocumentType): number => {
	return STORAGE_CONFIG.documentSizes[documentType] || 0;
};

/**
 * Obtiene el tamaño estimado de un folder, considerando si está vinculado a una causa.
 *
 * @param folder - Datos del folder con información de vinculación (opcional)
 * @returns Tamaño en bytes
 */
export const getFolderSize = (folder?: FolderLinkInfo | null): number => {
	if (folder && isFolderLinkedToCausa(folder)) {
		return STORAGE_CONFIG.documentSizes.folderLinked;
	}
	return STORAGE_CONFIG.documentSizes.folder;
};
