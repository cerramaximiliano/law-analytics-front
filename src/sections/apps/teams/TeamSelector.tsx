// sections/apps/teams/TeamSelector.tsx
import { useState } from "react";
import { Box, Button, Menu, MenuItem, ListItemIcon, ListItemText, Typography, Divider, Avatar } from "@mui/material";
import { ArrowDown2, People, TickCircle } from "iconsax-react";
import { useTeam } from "contexts/TeamContext";
import { Team } from "types/teams";
import RoleBadge from "./RoleBadge";

interface TeamSelectorProps {
	compact?: boolean;
	showRoleBadge?: boolean;
}

export default function TeamSelector({ compact = false, showRoleBadge = true }: TeamSelectorProps) {
	const { teams, activeTeam, userRole, hasMultipleTeams, setActiveTeam } = useTeam();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		// Only open menu if there are multiple teams
		if (hasMultipleTeams) {
			setAnchorEl(event.currentTarget);
		}
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleSelectTeam = (team: Team) => {
		setActiveTeam(team);
		handleClose();
	};

	// Don't show if no teams
	if (teams.length === 0) {
		return null;
	}

	// If only one team, show it without dropdown
	if (!hasMultipleTeams && activeTeam) {
		return (
			<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				<Button
					variant="contained"
					color="primary"
					startIcon={<People size={18} />}
					size={compact ? "small" : "medium"}
					sx={{
						minWidth: compact ? 120 : 180,
						justifyContent: "flex-start",
						cursor: "default",
						"&:hover": {
							bgcolor: "primary.main",
						},
					}}
					disableRipple
				>
					<Typography
						variant="body2"
						noWrap
						sx={{
							maxWidth: compact ? 80 : 140,
							fontWeight: 500,
						}}
					>
						{activeTeam.name}
					</Typography>
				</Button>
				{showRoleBadge && userRole && <RoleBadge role={userRole} size="small" variant="outlined" />}
			</Box>
		);
	}

	// Multiple teams - show dropdown
	return (
		<Box>
			<Button
				variant="contained"
				color="primary"
				onClick={handleClick}
				endIcon={<ArrowDown2 size={16} />}
				startIcon={<People size={18} />}
				size={compact ? "small" : "medium"}
				sx={{
					minWidth: compact ? 120 : 180,
					justifyContent: "space-between",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
					<Typography
						variant="body2"
						noWrap
						sx={{
							maxWidth: compact ? 80 : 140,
							fontWeight: 500,
						}}
					>
						{activeTeam?.name || "Seleccionar equipo"}
					</Typography>
					{showRoleBadge && userRole && <RoleBadge role={userRole} size="small" variant="outlined" />}
				</Box>
			</Button>

			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				PaperProps={{
					sx: { minWidth: 220, maxWidth: 320 },
				}}
			>
				{/* Teams header */}
				<Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, display: "block" }}>
					Cambiar equipo
				</Typography>

				<Divider sx={{ my: 0.5 }} />

				{/* Team options */}
				{teams.map((team) => {
					const isSelected = activeTeam?._id === team._id;
					return (
						<MenuItem key={team._id} onClick={() => handleSelectTeam(team)} selected={isSelected}>
							<ListItemIcon>
								<Avatar
									sx={{
										width: 28,
										height: 28,
										fontSize: 12,
										bgcolor: isSelected ? "primary.main" : "grey.400",
									}}
								>
									{(team.name || "??").substring(0, 2).toUpperCase()}
								</Avatar>
							</ListItemIcon>
							<ListItemText primary={team.name} secondary={`${(team.members?.length || 0) + 1} miembros`} />
							{isSelected && <TickCircle size={18} color="green" />}
						</MenuItem>
					);
				})}
			</Menu>
		</Box>
	);
}
