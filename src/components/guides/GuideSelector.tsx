import { useState } from "react";

// material-ui
import { Typography, Box, Dialog, DialogTitle, DialogContent, Grid, Card, CardContent } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import { PopupTransition } from "components/@extended/Transitions";
import GuideLaboral from "./GuideLaboral";
import GuideIntereses from "./GuideIntereses";
import { Calculator, Coin, Warning2 } from "iconsax-react";

// ==============================|| COMPONENTE SELECTOR DE GUÍAS ||============================== //

interface GuideSelectorProps {
	open: boolean;
	onClose: () => void;
}

const GuideSelector: React.FC<GuideSelectorProps> = ({ open, onClose }) => {
	const theme = useTheme();
	const [guideLaboralOpen, setGuideLaboralOpen] = useState(false);
	const [guideInteresesOpen, setGuideInteresesOpen] = useState(false);

	const handleOpenGuideLaboral = () => {
		onClose();
		setGuideLaboralOpen(true);
	};

	const handleOpenGuideIntereses = () => {
		onClose();
		setGuideInteresesOpen(true);
	};

	return (
		<>
			<Dialog
				open={open}
				onClose={onClose}
				maxWidth="sm"
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
						<Grid item xs={12} md={6}>
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
						<Grid item xs={12} md={6}>
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
					</Grid>
				</DialogContent>
			</Dialog>

			{/* Importamos y renderizamos los componentes de guía */}
			<GuideLaboral open={guideLaboralOpen} onClose={() => setGuideLaboralOpen(false)} />
			<GuideIntereses open={guideInteresesOpen} onClose={() => setGuideInteresesOpen(false)} />
		</>
	);
};

export default GuideSelector;
