// sections/apps/profiles/account/TabRole.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Grid, IconButton, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Add, Crown, InfoCircle, Logout, People, Trash, UserSquare, Warning2 } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import { GuideTeams } from "components/guides";
import { useTeam, useTeamsFeature } from "contexts/TeamContext";
import { useDispatch } from "store";
import { fetchCurrentSubscription } from "store/reducers/auth";
import {
	TeamSelector,
	InviteMembersForm,
	MembersTable,
	PendingInvitationsList,
	CreateTeamDialog,
	LeaveTeamDialog,
	TeamSettingsCard,
	RoleBadge,
} from "sections/apps/teams";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// ==============================|| ACCOUNT PROFILE - ROLE (TEAMS) ||============================== //

const TabRole = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const {
		teams,
		activeTeam,
		userRole,
		isLoading,
		isInitialized,
		isAdmin,
		isOwner,
		canManageMembers,
		hasMultipleTeams,
		refreshTeams,
		refreshActiveTeam,
	} = useTeam();
	const { isTeamsEnabled, maxTeamMembers, planName } = useTeamsFeature();

	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showLeaveDialog, setShowLeaveDialog] = useState(false);
	const [guideOpen, setGuideOpen] = useState(false);

	useEffect(() => {
		dispatch(fetchCurrentSubscription(true) as any);
	}, [dispatch]);

	const getRoleLabel = (role: string | null) => {
		switch (role) {
			case "owner":
				return "Propietario";
			case "admin":
				return "Administrador";
			case "editor":
				return "Editor";
			case "viewer":
				return "Solo lectura";
			default:
				return "Miembro";
		}
	};

	// ── Brand helpers ─────────────────────────────────────────────────────────
	const errorColor = theme.palette.error.main;

	const brandPrimarySx = {
		minWidth: 130,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};
	const destructiveBtnSx = {
		minWidth: 130,
		textTransform: "none" as const,
		bgcolor: errorColor,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(errorColor, 0.88), boxShadow: "none" },
	};
	const destructiveGhostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: errorColor,
		borderRadius: 1.25,
		border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.22)}`,
		px: 1.75,
		py: 0.5,
		fontSize: "0.78rem",
		"&:hover": {
			bgcolor: alpha(errorColor, isDark ? 0.14 : 0.08),
			borderColor: alpha(errorColor, isDark ? 0.5 : 0.36),
		},
	};
	const iconBtnSx = {
		width: 30,
		height: 30,
		borderRadius: 1,
		color: "text.secondary",
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
	};

	const SectionCard = ({
		eyebrow,
		title,
		subtitle,
		icon,
		rightSlot,
		children,
		tone = "primary",
	}: {
		eyebrow: string;
		title: string;
		subtitle?: string;
		icon: React.ReactNode;
		rightSlot?: React.ReactNode;
		children: React.ReactNode;
		tone?: "primary" | "error";
	}) => {
		const color = tone === "error" ? errorColor : BRAND_BLUE;
		return (
			<Box
				sx={{
					borderRadius: 2,
					border: `1px solid ${alpha(color, isDark ? 0.18 : 0.1)}`,
					bgcolor: "background.paper",
					overflow: "hidden",
					height: "100%",
				}}
			>
				<Box
					sx={{
						px: { xs: 2, sm: 2.5 },
						py: 1.5,
						bgcolor: alpha(color, isDark ? 0.05 : 0.025),
						borderBottom: `1px solid ${alpha(color, isDark ? 0.16 : 0.1)}`,
					}}
				>
					<Stack direction="row" spacing={1.25} alignItems="center">
						<Box
							sx={{
								width: 32,
								height: 32,
								borderRadius: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(color, isDark ? 0.16 : 0.08),
								border: `1px solid ${alpha(color, isDark ? 0.28 : 0.18)}`,
								color,
								flexShrink: 0,
							}}
						>
							{icon}
						</Box>
						<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
							<Stack direction="row" spacing={0.625} alignItems="center">
								<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: color }} />
								<Typography
									sx={{
										fontSize: "0.6rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									{eyebrow}
								</Typography>
							</Stack>
							<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>{title}</Typography>
							{subtitle && (
								<Typography sx={{ fontSize: "0.74rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{subtitle}</Typography>
							)}
						</Stack>
						{rightSlot}
					</Stack>
				</Box>
				<Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
			</Box>
		);
	};

	// ── Loading skeleton ──────────────────────────────────────────────────────

	if (!isInitialized || isLoading) {
		return (
			<Grid container spacing={2.5}>
				<Grid item xs={12}>
					<Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Stack direction="row" alignItems="center" spacing={1.5}>
								<Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: 1 }} />
								<Skeleton variant="text" width={180} height={20} />
							</Stack>
							<Skeleton variant="rounded" width={120} height={30} />
						</Stack>
					</Box>
				</Grid>

				<Grid item xs={12} md={8}>
					<SectionCard
						eyebrow="Equipo"
						title="Miembros"
						icon={<People size={16} variant="Bulk" />}
					>
						<Stack spacing={2}>
							{[1, 2, 3].map((i) => (
								<Stack key={i} direction="row" alignItems="center" spacing={2}>
									<Skeleton variant="circular" width={32} height={32} />
									<Box sx={{ flex: 1 }}>
										<Skeleton variant="text" width="60%" height={18} />
										<Skeleton variant="text" width="40%" height={14} />
									</Box>
									<Skeleton variant="rounded" width={80} height={22} />
								</Stack>
							))}
						</Stack>
					</SectionCard>
				</Grid>

				<Grid item xs={12} md={4}>
					<SectionCard
						eyebrow="Invitar"
						title="Nuevo miembro"
						icon={<Add size={16} variant="Linear" />}
					>
						<Stack spacing={2}>
							<Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: 1.25 }} />
							<Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: 1.25 }} />
							<Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: 1.25 }} />
						</Stack>
					</SectionCard>
				</Grid>
			</Grid>
		);
	}

	const isTeamMember = teams.length > 0 && !isOwner && activeTeam;

	// Usuario miembro de equipo (no owner)
	if (isTeamMember && !isLoading) {
		const roleMessage =
			userRole === "viewer"
				? " Tu rol de Solo Lectura te permite ver los recursos pero no modificarlos."
				: userRole === "editor"
				? " Tu rol de Editor te permite ver y editar recursos, pero no eliminarlos."
				: userRole === "admin"
				? " Tu rol de Administrador te permite gestionar recursos y miembros del equipo."
				: "";

		return (
			<>
				<Box
					sx={{
						position: "relative",
						overflow: "hidden",
						borderRadius: 2,
						p: { xs: 3, md: 4 },
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
					}}
				>
					<Box
						sx={{
							position: "absolute",
							top: -80,
							right: -60,
							width: 320,
							height: 320,
							borderRadius: "50%",
							background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
							pointerEvents: "none",
						}}
					/>
					<Box
						sx={{
							position: "absolute",
							inset: 0,
							backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 1px, transparent 1px)`,
							backgroundSize: "22px 22px",
							maskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
							WebkitMaskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
							opacity: 0.55,
							pointerEvents: "none",
						}}
					/>

					<Stack spacing={2.5} alignItems="center" sx={{ position: "relative" }}>
						<Box
							sx={{
								width: 64,
								height: 64,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							<UserSquare size={30} variant="Bulk" />
						</Box>

						<Stack spacing={0.5} alignItems="center">
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
								<Typography
									sx={{
										fontSize: "0.62rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Miembro de equipo
								</Typography>
							</Stack>
							<Stack direction="row" alignItems="center" spacing={0.875}>
								<Typography
									sx={{
										fontSize: { xs: "1.25rem", md: "1.4rem" },
										fontWeight: 600,
										letterSpacing: "-0.015em",
										color: "text.primary",
										textAlign: "center",
									}}
								>
									Sos parte de {activeTeam?.name}
								</Typography>
								<Tooltip title="Ver guía de equipos">
									<IconButton onClick={() => setGuideOpen(true)} sx={iconBtnSx}>
										<InfoCircle size={16} variant="Bulk" />
									</IconButton>
								</Tooltip>
							</Stack>
						</Stack>

						<Box
							sx={{
								width: "100%",
								maxWidth: 520,
								p: 2,
								borderRadius: 1.5,
								bgcolor: "background.paper",
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
							}}
						>
							<Stack spacing={1.25}>
								{[
									{ label: "Equipo", value: activeTeam?.name, icon: <People size={14} variant="Bulk" color={BRAND_BLUE} /> },
									{
										label: "Tu rol",
										value: userRole ? <RoleBadge role={userRole} /> : getRoleLabel(userRole),
										icon: <UserSquare size={14} variant="Bulk" color={BRAND_BLUE} />,
									},
									...(activeTeam?.description
										? [{ label: "Descripción", value: activeTeam.description, icon: <InfoCircle size={14} variant="Bulk" color={BRAND_BLUE} /> }]
										: []),
									{
										label: "Miembros",
										value: `${(activeTeam?.members?.length || 0) + 1} ${(activeTeam?.members?.length || 0) + 1 === 1 ? "miembro" : "miembros"}`,
										icon: <People size={14} variant="Bulk" color={BRAND_BLUE} />,
									},
								].map((row, i, arr) => (
									<Stack
										key={i}
										direction="row"
										justifyContent="space-between"
										alignItems="center"
										sx={{ pb: i < arr.length - 1 ? 1.25 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.06)}` : "none" }}
									>
										<Stack direction="row" spacing={0.75} alignItems="center">
											{row.icon}
											<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
												{row.label}
											</Typography>
										</Stack>
										{typeof row.value === "string" ? (
											<Typography sx={{ fontSize: "0.82rem", color: "text.primary", fontWeight: 500, textAlign: "right", maxWidth: 300 }}>
												{row.value}
											</Typography>
										) : (
											row.value
										)}
									</Stack>
								))}
							</Stack>
						</Box>

						<Box
							sx={{
								p: 1.75,
								borderRadius: 1.25,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
								maxWidth: 520,
							}}
						>
							<Stack direction="row" spacing={1} alignItems="flex-start">
								<InfoCircle size={16} variant="Bulk" color={BRAND_BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
								<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
									Como miembro del equipo, tenés acceso a los recursos compartidos según tu rol.{roleMessage}
								</Typography>
							</Stack>
						</Box>

						<Button startIcon={<Logout size={15} variant="Linear" />} onClick={() => setShowLeaveDialog(true)} sx={destructiveGhostBtnSx}>
							Abandonar equipo
						</Button>
					</Stack>
				</Box>

				<LeaveTeamDialog open={showLeaveDialog} onClose={() => setShowLeaveDialog(false)} onSuccess={() => refreshTeams()} />
				<GuideTeams open={guideOpen} onClose={() => setGuideOpen(false)} />
			</>
		);
	}

	// No tiene feature teams habilitada
	if (!isTeamsEnabled) {
		return (
			<>
				<Box
					sx={{
						position: "relative",
						overflow: "hidden",
						borderRadius: 2,
						p: { xs: 3, md: 4 },
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
						textAlign: "center",
					}}
				>
					<Box
						sx={{
							position: "absolute",
							top: -80,
							left: "50%",
							transform: "translateX(-50%)",
							width: 360,
							height: 360,
							borderRadius: "50%",
							background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)} 0%, transparent 70%)`,
							pointerEvents: "none",
						}}
					/>
					<Stack spacing={2} alignItems="center" sx={{ position: "relative" }}>
						<Box
							sx={{
								width: 64,
								height: 64,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							<People size={28} variant="Bulk" />
						</Box>
						<Stack direction="row" alignItems="center" spacing={0.75}>
							<Typography sx={{ fontSize: "1.2rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
								Gestión de equipos
							</Typography>
							<Tooltip title="Ver guía de equipos">
								<IconButton onClick={() => setGuideOpen(true)} sx={iconBtnSx}>
									<InfoCircle size={16} variant="Bulk" />
								</IconButton>
							</Tooltip>
						</Stack>
						<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", maxWidth: 520, letterSpacing: "-0.005em", textWrap: "pretty" }}>
							La funcionalidad de equipos te permite invitar colaboradores y compartir recursos como causas, contactos, cálculos y más.
						</Typography>

						<Box
							sx={{
								p: 2,
								mt: 1,
								borderRadius: 1.5,
								bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.05),
								border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
								maxWidth: 520,
								width: "100%",
							}}
						>
							<Stack direction="row" spacing={1} alignItems="flex-start">
								<Warning2 size={16} variant="Bulk" color={STALE_AMBER} style={{ marginTop: 2, flexShrink: 0 }} />
								<Stack spacing={0.5} sx={{ textAlign: "left" }}>
									<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>
										Tu plan actual (
										<Box component="span" sx={{ fontWeight: 600 }}>
											{planName}
										</Box>
										) no incluye gestión de equipos. Mejorá a Estándar o Premium para acceder.
									</Typography>
									<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
										Estándar: hasta 5 miembros · Premium: hasta 20 miembros.
									</Typography>
								</Stack>
							</Stack>
						</Box>

						<Button variant="contained" onClick={() => navigate("/suscripciones/tables")} sx={brandPrimarySx}>
							Ver planes
						</Button>
					</Stack>
				</Box>

				<GuideTeams open={guideOpen} onClose={() => setGuideOpen(false)} />
			</>
		);
	}

	// Tiene feature pero no tiene equipos todavía
	if (teams.length === 0 && !isLoading) {
		return (
			<>
				<Box
					sx={{
						position: "relative",
						overflow: "hidden",
						borderRadius: 2,
						p: { xs: 3, md: 4 },
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
						textAlign: "center",
					}}
				>
					<Box
						sx={{
							position: "absolute",
							top: -80,
							left: "50%",
							transform: "translateX(-50%)",
							width: 360,
							height: 360,
							borderRadius: "50%",
							background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)} 0%, transparent 70%)`,
							pointerEvents: "none",
						}}
					/>
					<Stack spacing={2} alignItems="center" sx={{ position: "relative" }}>
						<Box
							sx={{
								width: 64,
								height: 64,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							<People size={28} variant="Bulk" />
						</Box>
						<Stack direction="row" alignItems="center" spacing={0.75}>
							<Typography sx={{ fontSize: "1.2rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
								Creá tu primer equipo
							</Typography>
							<Tooltip title="Ver guía de equipos">
								<IconButton onClick={() => setGuideOpen(true)} sx={iconBtnSx}>
									<InfoCircle size={16} variant="Bulk" />
								</IconButton>
							</Tooltip>
						</Stack>
						<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", maxWidth: 520, letterSpacing: "-0.005em", textWrap: "pretty" }}>
							Creá un equipo para invitar colaboradores y compartir recursos. Podés tener hasta {maxTeamMembers} miembros en tu plan{" "}
							{planName}.
						</Typography>

						<Button
							variant="contained"
							onClick={() => setShowCreateDialog(true)}
							startIcon={<Add size={16} variant="Linear" />}
							sx={brandPrimarySx}
						>
							Crear equipo
						</Button>
					</Stack>
				</Box>

				<CreateTeamDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} onSuccess={() => refreshTeams()} />
				<GuideTeams open={guideOpen} onClose={() => setGuideOpen(false)} />
			</>
		);
	}

	// Tiene equipo y es admin/owner
	return (
		<Grid container spacing={2.5}>
			{/* Header del equipo */}
			<Grid item xs={12}>
				<Box
					sx={{
						p: 2,
						borderRadius: 2,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
					}}
				>
					<Stack
						direction={{ xs: "column", sm: "row" }}
						justifyContent="space-between"
						alignItems={{ xs: "stretch", sm: "center" }}
						spacing={1.5}
					>
						<Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
							<Box
								sx={{
									width: 36,
									height: 36,
									borderRadius: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
									color: BRAND_BLUE,
									flexShrink: 0,
								}}
							>
								<People size={18} variant="Bulk" />
							</Box>
							<Stack spacing={0.125} sx={{ minWidth: 0 }}>
								<Stack direction="row" spacing={0.625} alignItems="center">
									<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
									<Typography
										sx={{
											fontSize: "0.6rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											color: "text.secondary",
										}}
									>
										Equipo activo
									</Typography>
								</Stack>
								<Stack direction="row" spacing={0.875} alignItems="center" sx={{ minWidth: 0 }}>
									{hasMultipleTeams ? (
										<TeamSelector showRoleBadge={false} />
									) : (
										<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
											{activeTeam?.name}
										</Typography>
									)}
									{isOwner && <Crown size={14} variant="Bulk" color={STALE_AMBER} />}
									<Tooltip title="Ver guía de equipos">
										<IconButton onClick={() => setGuideOpen(true)} sx={iconBtnSx}>
											<InfoCircle size={14} variant="Bulk" />
										</IconButton>
									</Tooltip>
								</Stack>
								{activeTeam?.description && (
									<Typography
										sx={{
											fontSize: "0.74rem",
											color: "text.secondary",
											letterSpacing: "-0.005em",
											display: { xs: "none", md: "block" },
										}}
									>
										{activeTeam.description}
									</Typography>
								)}
							</Stack>
						</Stack>

						<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
							{userRole && (
								<Stack direction="row" alignItems="center" spacing={0.625}>
									<Typography
										sx={{
											fontSize: "0.62rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											color: "text.secondary",
										}}
									>
										Rol
									</Typography>
									<RoleBadge role={userRole} />
								</Stack>
							)}
							<Box
								sx={{
									px: 1.25,
									py: 0.75,
									borderRadius: 1,
									bgcolor: alpha(LIVE_GREEN, isDark ? 0.12 : 0.06),
									border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.26 : 0.16)}`,
									minWidth: 86,
									textAlign: "center",
								}}
							>
								<Typography
									sx={{
										fontSize: "0.95rem",
										fontWeight: 700,
										letterSpacing: "-0.015em",
										color: LIVE_GREEN,
										fontVariantNumeric: "tabular-nums",
										lineHeight: 1.1,
									}}
								>
									{(activeTeam?.members?.length || 0) + 1}/{maxTeamMembers}
								</Typography>
								<Typography
									sx={{
										fontSize: "0.58rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Miembros
								</Typography>
							</Box>
							{!isOwner && (
								<Button startIcon={<Logout size={14} variant="Linear" />} onClick={() => setShowLeaveDialog(true)} sx={destructiveGhostBtnSx}>
									Salir
								</Button>
							)}
						</Stack>
					</Stack>
				</Box>
			</Grid>

			{/* Miembros */}
			<Grid item xs={12} md={canManageMembers ? 8 : 12}>
				<SectionCard eyebrow="Composición" title="Miembros del equipo" icon={<People size={16} variant="Bulk" />}>
					<MembersTable onMemberUpdated={refreshActiveTeam} />
				</SectionCard>
			</Grid>

			{/* Invitar */}
			{canManageMembers && (
				<Grid item xs={12} md={4}>
					<InviteMembersForm onSuccess={refreshActiveTeam} />
				</Grid>
			)}

			{/* Invitaciones */}
			<Grid item xs={12} md={isAdmin ? 6 : 12}>
				<PendingInvitationsList onInvitationUpdated={refreshActiveTeam} />
			</Grid>

			{/* Configuración del equipo */}
			{isAdmin && (
				<Grid item xs={12} md={6}>
					<TeamSettingsCard onUpdated={refreshActiveTeam} />
				</Grid>
			)}

			{/* Zona de peligro */}
			<Grid item xs={12}>
				<Box
					sx={{
						p: 2,
						borderRadius: 2,
						border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.22)}`,
						bgcolor: alpha(errorColor, isDark ? 0.05 : 0.025),
					}}
				>
					<Stack
						direction={{ xs: "column", sm: "row" }}
						alignItems={{ xs: "stretch", sm: "center" }}
						justifyContent="space-between"
						spacing={1.25}
					>
						<Stack direction="row" spacing={1.25} alignItems="center">
							<Box
								sx={{
									width: 32,
									height: 32,
									borderRadius: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(errorColor, isDark ? 0.16 : 0.08),
									border: `1px solid ${alpha(errorColor, isDark ? 0.28 : 0.18)}`,
									color: errorColor,
									flexShrink: 0,
								}}
							>
								<Warning2 size={16} variant="Bulk" />
							</Box>
							<Stack spacing={0.125}>
								<Stack direction="row" spacing={0.625} alignItems="center">
									<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: errorColor }} />
									<Typography
										sx={{
											fontSize: "0.6rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											color: errorColor,
										}}
									>
										Zona de riesgo
									</Typography>
								</Stack>
								<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
									{isOwner
										? "Eliminar el equipo removerá a todos los miembros y perderás el acceso compartido."
										: "Al salir perderás acceso a los recursos compartidos del equipo."}
								</Typography>
							</Stack>
						</Stack>
						<Button
							variant="contained"
							onClick={() => setShowLeaveDialog(true)}
							startIcon={isOwner ? <Trash size={14} variant="Linear" /> : <Logout size={14} variant="Linear" />}
							sx={destructiveBtnSx}
						>
							{isOwner ? "Eliminar equipo" : "Abandonar equipo"}
						</Button>
					</Stack>
				</Box>
			</Grid>

			<LeaveTeamDialog open={showLeaveDialog} onClose={() => setShowLeaveDialog(false)} onSuccess={() => refreshTeams()} />
			<GuideTeams open={guideOpen} onClose={() => setGuideOpen(false)} />
		</Grid>
	);
};

export default TabRole;
