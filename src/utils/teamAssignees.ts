import { Team } from "types/teams";

// Resuelve el owner y los miembros activos del equipo a una lista uniforme de
// "asignables" para el campo Responsables de las tareas. El hub popula
// `owner` y `members[].userId` con { _id, firstName, lastName, email, avatar },
// pero los tipos del front los declaran como string: acá se contemplan ambos
// casos (objeto poblado o id pelado).

export interface TeamAssignee {
	id: string;
	name: string; // nombre completo, o el email si no hay nombre, o "Miembro"
	email?: string;
	avatar?: string;
	initials: string;
	isOwner: boolean;
	/** Integrante real o invitación (previsto / invitado) asignable como responsable de carpetas. */
	kind?: "member" | "invitation";
	/** Solo para kind = "invitation". */
	invitationStatus?: "draft" | "pending";
}

/** Etiqueta corta para un asignable que todavía no es integrante. */
export function assigneeTag(a: TeamAssignee | undefined | null): string {
	if (!a || a.kind !== "invitation") return "";
	return a.invitationStatus === "draft" ? "previsto" : "invitado";
}

export interface GetTeamAssigneesOptions {
	/**
	 * Incluye previstos (borradores) e invitados con invitación vigente. Solo para
	 * responsables de CARPETAS (el hub los canjea por el usuario al aceptar); tareas y
	 * eventos no los admiten.
	 */
	includeInvitations?: boolean;
}

type PopulatedUser = { _id?: string; firstName?: string; lastName?: string; email?: string; avatar?: string };

function initialsFrom(name?: string, email?: string): string {
	const base = (name || "").trim();
	if (base) {
		const parts = base.split(/\s+/).filter(Boolean);
		const first = parts[0]?.[0] || "";
		const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
		return (first + last).toUpperCase();
	}
	const local = (email || "").split("@")[0];
	return local ? local.slice(0, 2).toUpperCase() : "?";
}

function toAssignee(raw: unknown, fallback: Partial<PopulatedUser>, isOwner: boolean): TeamAssignee | null {
	const populated: PopulatedUser | null = raw && typeof raw === "object" ? (raw as PopulatedUser) : null;
	const id = populated?._id || (typeof raw === "string" ? raw : undefined);
	if (!id) return null;

	const firstName = populated?.firstName || fallback.firstName || "";
	const lastName = populated?.lastName || fallback.lastName || "";
	const email = populated?.email || fallback.email || undefined;
	const avatar = populated?.avatar || fallback.avatar || undefined;
	const fullName = `${firstName} ${lastName}`.trim();
	const name = fullName || email || "Miembro";

	return { id: String(id), name, email, avatar, initials: initialsFrom(fullName, email), isOwner };
}

/** Owner primero, después los miembros activos; con `includeInvitations`, previstos e invitados al final. */
export function getTeamAssignees(team: Team | null | undefined, options: GetTeamAssigneesOptions = {}): TeamAssignee[] {
	if (!team) return [];
	const result: TeamAssignee[] = [];
	const seen = new Set<string>();

	const owner = toAssignee(team.owner, team.ownerInfo || {}, true);
	if (owner) {
		result.push({ ...owner, kind: "member" });
		seen.add(owner.id);
	}

	for (const member of team.members || []) {
		if (member.status && member.status !== "active") continue;
		const assignee = toAssignee(member.userId, member, false);
		if (!assignee || seen.has(assignee.id)) continue;
		seen.add(assignee.id);
		result.push({ ...assignee, kind: "member" });
	}

	if (options.includeInvitations) {
		const now = Date.now();
		for (const inv of team.invitations || []) {
			const vigente = inv.status === "draft" || (inv.status === "pending" && (!inv.expiresAt || new Date(inv.expiresAt).getTime() > now));
			if (!vigente || !inv._id || seen.has(inv._id)) continue;
			seen.add(inv._id);
			const name = (inv.displayName || "").trim() || inv.email;
			result.push({
				id: inv._id,
				name,
				email: inv.email,
				initials: initialsFrom(inv.displayName || "", inv.email),
				isOwner: false,
				kind: "invitation",
				invitationStatus: inv.status === "draft" ? "draft" : "pending",
			});
		}
	}

	return result;
}

/** Resuelve ids de `assignedTo` contra el equipo; los ids desconocidos quedan como "Miembro". */
export function resolveAssignees(ids: string[] | undefined, assignees: TeamAssignee[]): TeamAssignee[] {
	if (!ids || ids.length === 0) return [];
	const byId = new Map(assignees.map((a) => [a.id, a]));
	return ids.map((id) => byId.get(id) || { id, name: "Miembro", initials: "M", isOwner: false });
}
