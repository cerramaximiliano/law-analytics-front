import React from "react";
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
	// Definimos un objeto base con traducciones explícitas para los elementos del menú
	// que necesitan aparecer capitalizados
	const baseMessages = {
		// Elementos del menú principal que deben estar capitalizados
		aplicaciones: "Aplicaciones",
		causas: "Carpetas",
		carpetas: "Carpetas",
		cálculos: "Cálculos",
		calendario: "Calendario",
		contactos: "Contactos",
		intereses: "Intereses",
		laboral: "Laboral",
		civil: "Civil",
		perfil: "Perfil",
		usuario: "Usuario",
		cuenta: "Cuenta",
	};

	// Creamos un proxy que primero busca en el objeto baseMessages,
	// y si no lo encuentra, devuelve el ID capitalizado
	const messagesProxy = new Proxy(baseMessages, {
		get: (target, prop) => {
			// Primero verificamos si existe una traducción explícita
			if (typeof prop === "string" && prop in target) {
				return target[prop as keyof typeof target];
			}

			// Si no existe, capitalizamos el ID
			if (typeof prop === "string") {
				return capitalizeFirstLetter(prop);
			}

			return String(prop);
		},
	});

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
			}}
		>
			{children}
		</IntlProvider>
	);
};

export default Locales;
