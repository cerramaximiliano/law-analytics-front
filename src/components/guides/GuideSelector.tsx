import React, { useState } from "react";

// material-ui
import { Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project imports
import { PopupTransition } from "components/@extended/Transitions";
import GuideLaboral from "./GuideLaboral";
import GuideIntereses from "./GuideIntereses";
import GuideFolders from "./GuideFolders";
import GuideContacts from "./GuideContacts";
import GuideCalendar from "./GuideCalendar";
import GuideBooking from "./GuideBooking";
import GuideTasks from "./GuideTasks";
import GuideTeams from "./GuideTeams";
import {
	Calculator,
	Coin,
	BookSquare,
	FolderOpen,
	ProfileCircle,
	Calendar,
	CalendarTick,
	Task,
	People,
	ArrowRight2,
} from "iconsax-react";
import { BRAND_BLUE } from "themes/dashboardTokens";

// ==============================|| COMPONENTE SELECTOR DE GUÍAS ||============================== //

interface GuideSelectorProps {
	open: boolean;
	onClose: () => void;
}

interface GuideOption {
	key: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	open: boolean;
	onClick: () => void;
}

const GuideSelector: React.FC<GuideSelectorProps> = ({ open, onClose }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const [guideLaboralOpen, setGuideLaboralOpen] = useState(false);
	const [guideInteresesOpen, setGuideInteresesOpen] = useState(false);
	const [guideFoldersOpen, setGuideFoldersOpen] = useState(false);
	const [guideContactsOpen, setGuideContactsOpen] = useState(false);
	const [guideCalendarOpen, setGuideCalendarOpen] = useState(false);
	const [guideBookingOpen, setGuideBookingOpen] = useState(false);
	const [guideTasksOpen, setGuideTasksOpen] = useState(false);
	const [guideTeamsOpen, setGuideTeamsOpen] = useState(false);

	const openGuide = (setter: (v: boolean) => void) => {
		onClose();
		setter(true);
	};

	const guides: GuideOption[] = [
		{
			key: "laboral",
			title: "Guía Laboral",
			description: "Indemnizaciones, despidos y liquidaciones",
			icon: <Calculator size={18} variant="Bulk" />,
			open: guideLaboralOpen,
			onClick: () => openGuide(setGuideLaboralOpen),
		},
		{
			key: "intereses",
			title: "Guía Intereses",
			description: "Tasas, métodos y exportación de cálculos",
			icon: <Coin size={18} variant="Bulk" />,
			open: guideInteresesOpen,
			onClick: () => openGuide(setGuideInteresesOpen),
		},
		{
			key: "folders",
			title: "Guía Carpetas",
			description: "Crear, importar, vincular y archivar carpetas",
			icon: <FolderOpen size={18} variant="Bulk" />,
			open: guideFoldersOpen,
			onClick: () => openGuide(setGuideFoldersOpen),
		},
		{
			key: "contacts",
			title: "Guía Contactos",
			description: "Clientes, oponentes, testigos y vinculación",
			icon: <ProfileCircle size={18} variant="Bulk" />,
			open: guideContactsOpen,
			onClick: () => openGuide(setGuideContactsOpen),
		},
		{
			key: "calendar",
			title: "Guía Calendario",
			description: "Eventos, recordatorios y vencimientos",
			icon: <Calendar size={18} variant="Bulk" />,
			open: guideCalendarOpen,
			onClick: () => openGuide(setGuideCalendarOpen),
		},
		{
			key: "booking",
			title: "Guía de Citas",
			description: "Configurá el booking online para tus clientes",
			icon: <CalendarTick size={18} variant="Bulk" />,
			open: guideBookingOpen,
			onClick: () => openGuide(setGuideBookingOpen),
		},
		{
			key: "tasks",
			title: "Guía de Tareas",
			description: "Crear, priorizar y organizar pendientes",
			icon: <Task size={18} variant="Bulk" />,
			open: guideTasksOpen,
			onClick: () => openGuide(setGuideTasksOpen),
		},
		{
			key: "teams",
			title: "Guía de Equipos",
			description: "Trabajá colaborativamente con tu equipo",
			icon: <People size={18} variant="Bulk" />,
			open: guideTeamsOpen,
			onClick: () => openGuide(setGuideTeamsOpen),
		},
	];

	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		px: 2,
		py: 0.875,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
	};

	return (
		<>
			<Dialog
				open={open}
				onClose={onClose}
				maxWidth="md"
				fullWidth
				TransitionComponent={PopupTransition}
				PaperProps={{
					sx: {
						borderRadius: 2,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
						boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
						overflow: "hidden",
					},
				}}
			>
				{/* Header brand */}
				<DialogTitle
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1.25,
						px: 2.5,
						py: 1.75,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
						borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
					}}
				>
					<Box
						sx={{
							width: 32,
							height: 32,
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
						<BookSquare size={18} variant="Bulk" />
					</Box>
					<Stack spacing={0.125} sx={{ minWidth: 0, flex: 1 }}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{
									fontSize: "0.6rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								Centro de ayuda
							</Typography>
						</Stack>
						<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
							Elegí una guía
						</Typography>
						<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
							Aprendé a usar cada módulo de Law Analytics
						</Typography>
					</Stack>
				</DialogTitle>

				<DialogContent sx={{ p: 2.5 }}>
					<Grid container spacing={1.5}>
						{guides.map((guide) => (
							<Grid item xs={12} sm={6} key={guide.key}>
								<Box
									role="button"
									onClick={guide.onClick}
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1.5,
										p: 1.5,
										borderRadius: 1.25,
										cursor: "pointer",
										bgcolor: theme.palette.background.paper,
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
										height: "100%",
										transition: "all 180ms ease",
										"&:hover": {
											borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
										},
									}}
								>
									<Box
										sx={{
											width: 40,
											height: 40,
											borderRadius: 1,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
											color: BRAND_BLUE,
											flexShrink: 0,
										}}
									>
										{guide.icon}
									</Box>
									<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
										<Typography
											sx={{
												fontSize: "0.88rem",
												fontWeight: 600,
												color: "text.primary",
												letterSpacing: "-0.005em",
												lineHeight: 1.3,
											}}
										>
											{guide.title}
										</Typography>
										<Typography
											sx={{
												fontSize: "0.72rem",
												color: "text.secondary",
												letterSpacing: "-0.005em",
												lineHeight: 1.4,
											}}
										>
											{guide.description}
										</Typography>
									</Stack>
									<Box
										sx={{
											width: 24,
											height: 24,
											borderRadius: 0.75,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
											color: BRAND_BLUE,
											flexShrink: 0,
										}}
									>
										<ArrowRight2 size={12} variant="Bulk" />
									</Box>
								</Box>
							</Grid>
						))}
					</Grid>
				</DialogContent>

				<DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
					<Button onClick={onClose} sx={ghostBtnSx}>
						Cerrar
					</Button>
				</DialogActions>
			</Dialog>

			{/* Modales de guía */}
			<GuideLaboral open={guideLaboralOpen} onClose={() => setGuideLaboralOpen(false)} />
			<GuideIntereses open={guideInteresesOpen} onClose={() => setGuideInteresesOpen(false)} />
			<GuideFolders open={guideFoldersOpen} onClose={() => setGuideFoldersOpen(false)} />
			<GuideContacts open={guideContactsOpen} onClose={() => setGuideContactsOpen(false)} />
			<GuideCalendar open={guideCalendarOpen} onClose={() => setGuideCalendarOpen(false)} />
			<GuideBooking open={guideBookingOpen} onClose={() => setGuideBookingOpen(false)} />
			<GuideTasks open={guideTasksOpen} onClose={() => setGuideTasksOpen(false)} />
			<GuideTeams open={guideTeamsOpen} onClose={() => setGuideTeamsOpen(false)} />
		</>
	);
};

export default GuideSelector;
