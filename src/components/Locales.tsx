import { ReactNode } from "react";

// third-party
import { IntlProvider } from "react-intl";

// ==============================|| LOCALIZATION SIMPLIFIED ||============================== //

interface Props {
	children: ReactNode;
}

/**
 * Convierte la primera letra de un string a mayúscula
 * @param str String a capitalizar
 * @returns String con la primera letra en mayúscula
 */
const capitalizeFirstLetter = (str: string): string => {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
};

// Este componente proporciona un IntlProvider simplificado que usa los mismos IDs como mensajes
// eliminando completamente la necesidad de archivos de traducción
const Locales = ({ children }: Props) => {
	// Creamos un proxy que devuelve el mismo ID cuando se solicita una traducción,
	// pero con la primera letra capitalizada
	const messagesProxy = new Proxy(
		{},
		{
			get: (_target, prop) => {
				// Devuelve el mismo ID como valor de traducción pero con la primera letra en mayúscula
				if (typeof prop === "string") {
					return capitalizeFirstLetter(prop);
				}
				return String(prop);
			},
		},
	);

	return (
		<IntlProvider
			locale="es"
			defaultLocale="es"
			messages={messagesProxy as Record<string, string>}
			onError={(err) => {
				// Ignorar errores de traducción faltante
				if (err.code === "MISSING_TRANSLATION") {
					return;
				}
				console.error(err);
			}}
		>
			{children}
		</IntlProvider>
	);
};

export default Locales;
