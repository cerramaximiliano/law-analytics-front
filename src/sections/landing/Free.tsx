import React from "react";
import { Link as RouterLink } from "react-router-dom";
// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, Button, Container, Grid, Typography } from "@mui/material";

// project-imports
import FadeInWhenVisible from "./Animation";
import { useLandingAnalytics } from "hooks/useLandingAnalytics";
// assets
import { ExportSquare } from "iconsax-react";

// ==============================|| LANDING - FreePage ||============================== //

const FreePage = () => {
	const theme = useTheme();
	const { trackPruebaPagarCTA } = useLandingAnalytics();

	return (
		<Container>
			<Grid container spacing={3} alignItems="center" justifyContent="center" sx={{ mt: { md: 10, xs: 2.5 }, mb: { md: 10, xs: 2.5 } }}>
				<Grid item xs={12} md={8}>
					<FadeInWhenVisible>
						<Grid container spacing={2} justifyContent="center">
							<Grid item xs={12}>
								<Typography variant="h2">
									<Box
										component="span"
										sx={{
											color: theme.palette.primary.main,
										}}
									>
										PRUEBA{" "}
									</Box>
									ANTES DE PAGAR
								</Typography>
							</Grid>
							<Grid item xs={12}>
								<Typography>Accede a múltiples recursos gratuitos.</Typography>
							</Grid>
						</Grid>
					</FadeInWhenVisible>
				</Grid>
				<Grid item xs={12} md={4}>
					<FadeInWhenVisible>
						<Grid container spacing={2} justifyContent="end" alignItems="center">
							<Grid item>
								<Button
									variant="contained"
									color="primary"
									size="large"
									startIcon={<ExportSquare />}
									component={RouterLink}
									to="/register"
									onClick={trackPruebaPagarCTA}
								>
									Registrarse Gratis
								</Button>
							</Grid>
						</Grid>
					</FadeInWhenVisible>
				</Grid>
			</Grid>
		</Container>
	);
};
export default FreePage;
