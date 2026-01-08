import React from "react";
// material-ui
import { Grid, Typography, Button, Stack, Box, Link, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project import
import MainCard from "components/MainCard";

// assets
import cardBack from "assets/images/widget/img-dropbox-bg.svg";
import WelcomeImage from "assets/images/analytics/welcome-banner.png";

// icons
import { Add } from "iconsax-react";

// types
import { ThemeMode } from "types/config";

// hooks
import { useNavigate } from "react-router-dom";

interface WelcomeBannerProps {
	showOnboarding?: boolean;
	userName?: string;
	onDismiss?: () => void;
	sessionCount?: number;
	maxSessions?: number;
}

// ==============================|| ANALYTICS - WELCOME ||============================== //

const WelcomeBanner = ({ showOnboarding = false, userName, onDismiss, sessionCount = 0, maxSessions = 5 }: WelcomeBannerProps) => {
	const theme = useTheme();
	const navigate = useNavigate();

	const handleCreateFolder = () => {
		navigate("/apps/folders/list?onboarding=true");
	};

	// Contenido para usuarios nuevos (onboarding)
	if (showOnboarding) {
		return (
			<MainCard
				border={false}
				sx={{
					color: "common.white",
					bgcolor: theme.palette.mode === ThemeMode.DARK ? "primary.400" : "primary.darker",
					position: "relative",
					"&:after": {
						content: '""',
						backgroundImage: `url(${cardBack})`,
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 1,
						opacity: 0.5,
						backgroundPosition: "bottom right",
						backgroundSize: "100%",
						backgroundRepeat: "no-repeat",
					},
				}}
			>
				<Grid container>
					<Grid item md={6} sm={6} xs={12}>
						<Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ padding: { xs: 2, sm: 3 } }}>
							<Typography variant="h2" color={theme.palette.background.paper} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
								{userName ? `Bienvenido, ${userName}` : "Bienvenido a Law||Analytics"}
							</Typography>
							<Typography variant="h6" color={theme.palette.background.paper} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
								Comienza creando tu primera carpeta. Es el corazon de Law||Analytics: desde ahi gestionas documentos,
								calculos y vencimientos.
							</Typography>
							<Box sx={{ pt: { xs: 1, sm: 1.5 } }}>
								<Button
									variant="contained"
									color="secondary"
									onClick={handleCreateFolder}
									startIcon={<Add />}
									size="large"
									sx={{
										zIndex: 2,
										bgcolor: "background.paper",
										color: "primary.darker",
										textTransform: "none",
										"&:hover": {
											bgcolor: "grey.100",
										},
									}}
								>
									Crear mi primera carpeta
								</Button>
							</Box>
							<Typography
								variant="caption"
								color={theme.palette.background.paper}
								sx={{ opacity: 0.8, mt: 0.5, display: { xs: "none", sm: "block" } }}
							>
								Organiza un expediente en menos de 1 minuto
							</Typography>
						</Stack>
					</Grid>
					<Grid item sm={6} xs={12} sx={{ display: { xs: "none", sm: "initial" } }}>
						<Stack sx={{ position: "relative", pr: { sm: 3, md: 8 }, zIndex: 2 }} justifyContent="center" alignItems="flex-end">
							<img src={WelcomeImage} alt="Welcome" width="200px" />
						</Stack>
					</Grid>
				</Grid>

				{/* Link para descartar onboarding */}
				{onDismiss && (
					<Box
						sx={{
							position: "absolute",
							bottom: 8,
							right: 16,
							zIndex: 3,
						}}
					>
						<Tooltip title="Podes volver a ver esta guia desde Ayuda" placement="top" arrow>
							<Link
								component="button"
								variant="caption"
								onClick={onDismiss}
								sx={{
									color: "rgba(255, 255, 255, 0.55)",
									textDecoration: "none",
									cursor: "pointer",
									fontSize: "0.7rem",
									transition: "all 0.2s ease",
									"&:hover": {
										color: "rgba(255, 255, 255, 0.85)",
										textDecoration: "underline",
										textUnderlineOffset: "2px",
									},
								}}
							>
								No mostrar esta guia nuevamente
							</Link>
						</Tooltip>
					</Box>
				)}
			</MainCard>
		);
	}

	// Contenido normal para usuarios con recursos
	return (
		<MainCard
			border={false}
			sx={{
				color: "common.white",
				bgcolor: theme.palette.mode === ThemeMode.DARK ? "primary.400" : "primary.darker",
				"&:after": {
					content: '""',
					backgroundImage: `url(${cardBack})`,
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					zIndex: 1,
					opacity: 0.5,
					backgroundPosition: "bottom right",
					backgroundSize: "100%",
					backgroundRepeat: "no-repeat",
				},
			}}
		>
			<Grid container>
				<Grid item md={6} sm={6} xs={12}>
					<Stack spacing={2} sx={{ padding: 3 }}>
						<Typography variant="h2" color={theme.palette.background.paper}>
							Explore las Herramientas Legales
						</Typography>
						<Typography variant="h6" color={theme.palette.background.paper}>
							Utilice todo el potencial disponible en Law||Analytics y supere todos los limites.
						</Typography>
						<Box sx={{ pt: 1.5 }}>
							<Button
								variant="outlined"
								color="secondary"
								href="/suscripciones/tables"
								sx={{
									color: "background.paper",
									borderColor: theme.palette.background.paper,
									zIndex: 2,
									"&:hover": {
										color: "background.paper",
										borderColor: theme.palette.background.paper,
										bgcolor: "primary.main",
									},
								}}
								target="_self"
							>
								Planes Exclusivos
							</Button>
						</Box>
					</Stack>
				</Grid>
				<Grid item sm={6} xs={12} sx={{ display: { xs: "none", sm: "initial" } }}>
					<Stack sx={{ position: "relative", pr: { sm: 3, md: 8 }, zIndex: 2 }} justifyContent="center" alignItems="flex-end">
						<img src={WelcomeImage} alt="Welcome" width="200px" />
					</Stack>
				</Grid>
			</Grid>
		</MainCard>
	);
};

export default WelcomeBanner;
