import { useState } from "react";

// material-ui
import { Typography, Box, Dialog, DialogTitle, DialogContent, Grid, Card, CardContent } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import { PopupTransition } from "components/@extended/Transitions";
import GuideLaboral from "./GuideLaboral";
import GuideIntereses from "./GuideIntereses";
import GuideFolders from "./GuideFolders";
import GuideContacts from "./GuideContacts";
import GuideCalendar from "./GuideCalendar";
import GuideBooking from "./GuideBooking";
import { Calculator, Coin, Warning2, FolderOpen, ProfileCircle, Calendar, CalendarTick } from "iconsax-react";

// ==============================|| COMPONENTE SELECTOR DE GUÍAS ||============================== //

interface GuideSelectorProps {
	open: boolean;
	onClose: () => void;
}

const GuideSelector: React.FC<GuideSelectorProps> = ({ open, onClose }) => {
	const theme = useTheme();
	const [guideLaboralOpen, setGuideLaboralOpen] = useState(false);
	const [guideInteresesOpen, setGuideInteresesOpen] = useState(false);
	const [guideFoldersOpen, setGuideFoldersOpen] = useState(false);
	const [guideContactsOpen, setGuideContactsOpen] = useState(false);
	const [guideCalendarOpen, setGuideCalendarOpen] = useState(false);
	const [guideBookingOpen, setGuideBookingOpen] = useState(false);

	const handleOpenGuideLaboral = () => {
		onClose();
		setGuideLaboralOpen(true);
	};

	const handleOpenGuideIntereses = () => {
		onClose();
		setGuideInteresesOpen(true);
	};

	const handleOpenGuideFolders = () => {
		onClose();
		setGuideFoldersOpen(true);
	};

	const handleOpenGuideContacts = () => {
		onClose();
		setGuideContactsOpen(true);
	};

	const handleOpenGuideCalendar = () => {
		onClose();
		setGuideCalendarOpen(true);
	};

	const handleOpenGuideBooking = () => {
		onClose();
		setGuideBookingOpen(true);
	};

	return (
		<>
			<Dialog
				open={open}
				onClose={onClose}
				maxWidth="lg"
				fullWidth
				TransitionComponent={PopupTransition}
				sx={{ "& .MuiDialog-paper": { borderRadius: "12px" } }}
			>
				<DialogTitle
					sx={{
						borderBottom: `1px solid ${theme.palette.divider}`,
						p: 2,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Box display="flex" alignItems="center">
						<Warning2 variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.primary.main }} />
						<Typography variant="h3">Selecciona una Guía</Typography>
					</Box>
				</DialogTitle>
				<DialogContent sx={{ p: 3 }}>
					<Grid container spacing={3} sx={{ mt: 1 }}>
						<Grid item xs={12} sm={6} md={4}>
							<Card
								sx={{
									cursor: "pointer",
									transition: "all 0.3s",
									"&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
									height: "100%",
								}}
								onClick={handleOpenGuideLaboral}
							>
								<CardContent sx={{ p: 3, textAlign: "center" }}>
									<Calculator size={64} variant="Bulk" style={{ color: theme.palette.primary.main, marginBottom: "16px" }} />
									<Typography variant="h4" gutterBottom>
										Guía Laboral
									</Typography>
									<Typography variant="body2" color="text.secondary">
										Aprende a usar la calculadora para indemnizaciones laborales, despidos y liquidaciones.
									</Typography>
								</CardContent>
							</Card>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Card
								sx={{
									cursor: "pointer",
									transition: "all 0.3s",
									"&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
									height: "100%",
								}}
								onClick={handleOpenGuideIntereses}
							>
								<CardContent sx={{ p: 3, textAlign: "center" }}>
									<Coin size={64} variant="Bulk" style={{ color: theme.palette.success.main, marginBottom: "16px" }} />
									<Typography variant="h4" gutterBottom>
										Guía Intereses
									</Typography>
									<Typography variant="body2" color="text.secondary">
										Aprende a calcular intereses con distintas tasas para tus procesos legales.
									</Typography>
								</CardContent>
							</Card>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Card
								sx={{
									cursor: "pointer",
									transition: "all 0.3s",
									"&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
									height: "100%",
								}}
								onClick={handleOpenGuideFolders}
							>
								<CardContent sx={{ p: 3, textAlign: "center" }}>
									<FolderOpen size={64} variant="Bulk" style={{ color: theme.palette.warning.main, marginBottom: "16px" }} />
									<Typography variant="h4" gutterBottom>
										Guía Carpetas
									</Typography>
									<Typography variant="body2" color="text.secondary">
										Aprende a organizar y gestionar carpetas para tus expedientes legales.
									</Typography>
								</CardContent>
							</Card>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Card
								sx={{
									cursor: "pointer",
									transition: "all 0.3s",
									"&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
									height: "100%",
								}}
								onClick={handleOpenGuideContacts}
							>
								<CardContent sx={{ p: 3, textAlign: "center" }}>
									<ProfileCircle size={64} variant="Bulk" style={{ color: theme.palette.secondary.main, marginBottom: "16px" }} />
									<Typography variant="h4" gutterBottom>
										Guía Contactos
									</Typography>
									<Typography variant="body2" color="text.secondary">
										Aprende a gestionar tus contactos y clientes en el sistema.
									</Typography>
								</CardContent>
							</Card>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Card
								sx={{
									cursor: "pointer",
									transition: "all 0.3s",
									"&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
									height: "100%",
								}}
								onClick={handleOpenGuideCalendar}
							>
								<CardContent sx={{ p: 3, textAlign: "center" }}>
									<Calendar size={64} variant="Bulk" style={{ color: theme.palette.info.main, marginBottom: "16px" }} />
									<Typography variant="h4" gutterBottom>
										Guía Calendario
									</Typography>
									<Typography variant="body2" color="text.secondary">
										Aprende a gestionar eventos y agenda en tu calendario legal.
									</Typography>
								</CardContent>
							</Card>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Card
								sx={{
									cursor: "pointer",
									transition: "all 0.3s",
									"&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
									height: "100%",
								}}
								onClick={handleOpenGuideBooking}
							>
								<CardContent sx={{ p: 3, textAlign: "center" }}>
									<CalendarTick size={64} variant="Bulk" style={{ color: theme.palette.error.main, marginBottom: "16px" }} />
									<Typography variant="h4" gutterBottom>
										Guía de Citas
									</Typography>
									<Typography variant="body2" color="text.secondary">
										Aprende a configurar y gestionar el sistema de citas online para tus clientes.
									</Typography>
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>

			{/* Importamos y renderizamos los componentes de guía */}
			<GuideLaboral open={guideLaboralOpen} onClose={() => setGuideLaboralOpen(false)} />
			<GuideIntereses open={guideInteresesOpen} onClose={() => setGuideInteresesOpen(false)} />
			<GuideFolders open={guideFoldersOpen} onClose={() => setGuideFoldersOpen(false)} />
			<GuideContacts open={guideContactsOpen} onClose={() => setGuideContactsOpen(false)} />
			<GuideCalendar open={guideCalendarOpen} onClose={() => setGuideCalendarOpen(false)} />
			<GuideBooking open={guideBookingOpen} onClose={() => setGuideBookingOpen(false)} />
		</>
	);
};

export default GuideSelector;
