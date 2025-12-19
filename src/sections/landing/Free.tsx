import React from "react";
import { Link as RouterLink } from "react-router-dom";
// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, Button, Container, Grid, Typography } from "@mui/material";

// project-imports
import FadeInWhenVisible from "./Animation";
import { useLandingAnalytics } from "hooks/useLandingAnalytics";

// ==============================|| LANDING - FreePage ||============================== //

const FreePage = () => {
	const theme = useTheme();
	const { trackPruebaPagarCTA } = useLandingAnalytics();

	return (
		<Box
			sx={{
				bgcolor: theme.palette.mode === "dark" ? theme.palette.grey[900] : theme.palette.primary.lighter,
				py: { xs: 8, md: 12 },
			}}
		>
			<Container>
				<FadeInWhenVisible>
					<Grid container spacing={3} justifyContent="center" alignItems="center">
						<Grid item xs={12}>
							<Box sx={{ textAlign: "center", maxWidth: 700, mx: "auto" }}>
								{/* Título */}
								<Typography
									variant="h2"
									sx={{
										mb: 3,
										fontWeight: 700,
										color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
									}}
								>
									Probá LawAnalytics gratis y dejá de trabajar a mano
								</Typography>

								{/* Subtítulo */}
								<Typography
									variant="h5"
									sx={{
										mb: 1,
										color: theme.palette.text.secondary,
										fontWeight: 400,
									}}
								>
									Accedé a todas las herramientas durante la prueba.
								</Typography>
								<Typography
									variant="h5"
									sx={{
										mb: 5,
										color: theme.palette.text.secondary,
										fontWeight: 400,
									}}
								>
									Sin tarjeta. Sin compromiso.
								</Typography>

								{/* CTA Button */}
								<Button
									variant="contained"
									color="primary"
									size="large"
									component={RouterLink}
									to="/register"
									onClick={trackPruebaPagarCTA}
									sx={{
										px: 6,
										py: 2,
										fontSize: "1.1rem",
										fontWeight: 600,
										borderRadius: 2,
										boxShadow: theme.shadows[4],
										"&:hover": {
											boxShadow: theme.shadows[8],
											transform: "translateY(-2px)",
										},
										transition: "all 0.2s ease-in-out",
									}}
								>
									Probar gratis ahora
								</Button>

								{/* Microcopy */}
								<Typography
									variant="body2"
									sx={{
										mt: 2,
										color: theme.palette.text.secondary,
									}}
								>
									Registrate en menos de 1 minuto
								</Typography>
							</Box>
						</Grid>
					</Grid>
				</FadeInWhenVisible>
			</Container>
		</Box>
	);
};
export default FreePage;
