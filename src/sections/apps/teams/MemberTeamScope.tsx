// sections/apps/teams/MemberTeamScope.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Skeleton, Stack, Typography } from "@mui/material";
import { Eye, Notification } from "iconsax-react";

import { useSelector } from "store";
import { useTeam } from "contexts/TeamContext";

type Visibility = { defaultMode: "todo" | "propio"; members: { userId: string; mode: "todo" | "propio" }[] };
type Notifications = {
	defaultPolicy: "todos" | "responsables";
	members: { userId: string; mode: "segun_carpeta" | "todo" | "solo_lo_mio" }[];
};

// Para un miembro (sin gestión del equipo): qué ve y cómo le llegan los avisos, según lo que
// configuraron el propietario o un administrador en «Qué ve cada integrante» y «Avisos del equipo».
export default function MemberTeamScope() {
	const { activeTeam } = useTeam();
	const { user } = useSelector((state) => state.auth);
	const groupId = activeTeam?._id;
	const myId = user?._id ? String(user._id) : "";

	const [vis, setVis] = useState<Visibility | null>(null);
	const [notif, setNotif] = useState<Notifications | null>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		if (!groupId) return;
		let cancelled = false;
		const headers = { "X-Group-Id": groupId };
		const base = `${import.meta.env.VITE_BASE_URL}/api/groups/${groupId}`;
		Promise.all([axios.get(`${base}/visibility-settings`, { headers }), axios.get(`${base}/notification-settings`, { headers })])
			.then(([v, n]) => {
				if (cancelled) return;
				setVis(v.data?.settings || null);
				setNotif(n.data?.settings || null);
			})
			.catch(() => {
				if (!cancelled) setFailed(true);
			});
		return () => {
			cancelled = true;
		};
	}, [groupId]);

	if (!activeTeam || failed) return null;
	if (!vis || !notif) return <Skeleton variant="rounded" height={64} sx={{ maxWidth: 520, width: "100%" }} />;

	const visMode = vis.members.find((m) => String(m.userId) === myId)?.mode || vis.defaultMode;
	const notifMode = notif.members.find((m) => String(m.userId) === myId)?.mode || "segun_carpeta";

	const veo =
		visMode === "propio"
			? "Solo lo tuyo: las carpetas donde sos responsable o que creaste, tus tareas y los eventos de esas carpetas."
			: "Todo el equipo: todas las carpetas, tareas y eventos.";
	const avisos =
		notifMode === "todo"
			? "Todos los avisos del equipo."
			: notifMode === "solo_lo_mio"
			? "Solo los de las carpetas donde sos responsable."
			: notif.defaultPolicy === "responsables"
			? "Según cada carpeta; por defecto, los de las carpetas donde sos responsable."
			: "Según cada carpeta; por defecto, los de todas las carpetas.";

	const row = (icon: JSX.Element, label: string, text: string) => (
		<Stack direction="row" spacing={1} alignItems="flex-start">
			<Box sx={{ mt: "2px", flexShrink: 0 }}>{icon}</Box>
			<Typography sx={{ fontSize: "0.82rem" }}>
				<Box component="span" sx={{ fontWeight: 600 }}>
					{label}
				</Box>{" "}
				{text}
			</Typography>
		</Stack>
	);

	return (
		<Stack spacing={1} sx={{ maxWidth: 520, width: "100%", textAlign: "left" }}>
			{row(<Eye size={16} />, "Qué ves:", veo)}
			{row(<Notification size={16} />, "Tus avisos:", avisos)}
			{visMode === "propio" && (
				<Typography variant="caption" color="text.secondary">
					Lo configuran el propietario o un administrador del equipo.
				</Typography>
			)}
		</Stack>
	);
}
