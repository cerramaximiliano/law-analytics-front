// sections/apps/teams/RoleBadge.tsx
import { Chip, ChipProps } from "@mui/material";
import { TeamRole, ROLE_CONFIG } from "types/teams";

interface RoleBadgeProps {
	role: TeamRole | "owner";
	size?: "small" | "medium";
	variant?: ChipProps["variant"];
}

export default function RoleBadge({ role, size = "small", variant = "filled" }: RoleBadgeProps) {
	const config = ROLE_CONFIG[role];

	if (!config) {
		return null;
	}

	return (
		<Chip
			label={config.label}
			color={config.color}
			size={size}
			variant={variant}
			sx={{
				fontWeight: 500,
				minWidth: 90,
			}}
		/>
	);
}
