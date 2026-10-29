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

/** Owner primero, después los miembros activos. */
export function getTeamAssignees(team: Team | null | undefined): TeamAssignee[] {
	if (!team) return [];
	const result: TeamAssignee[] = [];
	const seen = new Set<string>();

	const owner = toAssignee(team.owner, team.ownerInfo || {}, true);
	if (owner) {
		result.push(owner);
		seen.add(owner.id);
	}

	for (const member of team.members || []) {
		if (member.status && member.status !== "active") continue;
		const assignee = toAssignee(member.userId, member, false);
		if (!assignee || seen.has(assignee.id)) continue;
		seen.add(assignee.id);
		result.push(assignee);
	}

	return result;
}

/** Resuelve ids de `assignedTo` contra el equipo; los ids desconocidos quedan como "Miembro". */
export function resolveAssignees(ids: string[] | undefined, assignees: TeamAssignee[]): TeamAssignee[] {
	if (!ids || ids.length === 0) return [];
	const byId = new Map(assignees.map((a) => [a.id, a]));
	return ids.map((id) => byId.get(id) || { id, name: "Miembro", initials: "M", isOwner: false });
}
