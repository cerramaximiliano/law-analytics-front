import React, { useMemo } from "react";
import { Avatar, AvatarGroup, Chip, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useTeam } from "contexts/TeamContext";
import { getTeamAssignees, resolveAssignees } from "utils/teamAssignees";
import { BRAND_BLUE } from "themes/dashboardTokens";

interface Props {
	ids?: string[];
	variant?: "avatars" | "chips";
	max?: number;
}

// Muestra los responsables de una tarea resueltos contra el equipo activo.
// Vacío → "Sin asignar" en gris.
const TaskAssignees = ({ ids, variant = "avatars", max = 4 }: Props) => {
	const { activeTeam } = useTeam();
	const assignees = useMemo(() => resolveAssignees(ids, getTeamAssignees(activeTeam)), [ids, activeTeam]);

	if (assignees.length === 0) {
		return (
			<Typography component="span" sx={{ fontSize: "0.8rem", color: "text.disabled", fontStyle: "italic" }}>
				Sin asignar
			</Typography>
		);
	}

	if (variant === "chips") {
		return (
			<Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
				{assignees.map((a) => (
					<Tooltip key={a.id} title={a.email && a.email !== a.name ? `${a.name} · ${a.email}` : a.name}>
						<Chip
							size="small"
							variant="outlined"
							label={a.name}
							avatar={
								<Avatar src={a.avatar} sx={{ bgcolor: alpha(BRAND_BLUE, 0.16), color: BRAND_BLUE, fontSize: "0.6rem", fontWeight: 700 }}>
									{a.initials}
								</Avatar>
							}
						/>
					</Tooltip>
				))}
			</Stack>
		);
	}

	return (
		<AvatarGroup
			max={max}
			sx={{
				justifyContent: "flex-end",
				"& .MuiAvatar-root": {
					width: 28,
					height: 28,
					fontSize: "0.68rem",
					fontWeight: 700,
					bgcolor: alpha(BRAND_BLUE, 0.16),
					color: BRAND_BLUE,
					border: `2px solid ${alpha(BRAND_BLUE, 0.12)}`,
				},
			}}
		>
			{assignees.map((a) => (
				<Tooltip key={a.id} title={a.email && a.email !== a.name ? `${a.name} · ${a.email}` : a.name}>
					<Avatar src={a.avatar} alt={a.name}>
						{a.initials}
					</Avatar>
				</Tooltip>
			))}
		</AvatarGroup>
	);
};

export default TaskAssignees;
