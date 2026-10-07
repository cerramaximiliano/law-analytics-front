// Pista local de "este usuario pertenece a equipos". Permite al dashboard pedir sus
// estadísticas sin esperar a `getUserTeams` cuando el usuario NUNCA tuvo equipos (el
// caso de las cuentas nuevas). Si la pista falta o dice "sí", se espera al equipo como
// siempre. Es solo una optimización: no tiene efecto de seguridad.
const key = (userId: string) => `la_team_hint_${userId}`;

export const readTeamHint = (userId?: string): "teams" | "none" | null => {
	if (!userId) return null;
	try {
		const v = localStorage.getItem(key(userId));
		return v === "teams" || v === "none" ? v : null;
	} catch {
		return null;
	}
};

export const writeTeamHint = (userId: string | undefined, hasTeams: boolean): void => {
	if (!userId) return;
	try {
		localStorage.setItem(key(userId), hasTeams ? "teams" : "none");
	} catch {
		/* storage no disponible */
	}
};
