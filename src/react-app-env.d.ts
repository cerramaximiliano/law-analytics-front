/// <reference types="react-scripts" />

// Extender el objeto Window global para incluir nuestra flag personalizada
interface Window {
	FORCE_CLOSE_ALL_MODALS?: boolean;
}
