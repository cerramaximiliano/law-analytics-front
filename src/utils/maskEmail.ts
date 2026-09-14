// ==============================|| UTILITY - MASK EMAIL ||============================== //

/**
 * Masks an email address for display: primera letra + asteriscos hasta @, dominio completo.
 * Ejemplo: "usuario@dominio.com" → "u*****@dominio.com"
 * Si el email es inválido o vacío, devuelve null.
 */
export const maskEmail = (email: string): string | null => {
	if (!email) return null;
	const atIndex = email.indexOf("@");
	if (atIndex <= 0) return null;

	const local = email.slice(0, atIndex);
	const domain = email.slice(atIndex); // incluye el @

	const masked = local[0] + "*".repeat(Math.max(local.length - 1, 4));
	return masked + domain;
};
