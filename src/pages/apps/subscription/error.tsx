import React from "react";
import { useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Button, Box, Container, Grid, Stack, Typography, useMediaQuery } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// assets
import reader from "assets/images/analytics/reader.svg";

// ==============================|| SUBSCRIPTION ERROR ||============================== //

const SubscriptionError = () => {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

	useEffect(() => {
		dispatch(
			openSnackbar({
				open: true,
				message: "Hubo un problema al procesar tu suscripción",
				variant: "alert",
				alert: {
					color: "error",
				},
				close: false,
			}),
		);
	}, []);

	return (
		<Container fixed>
			<Grid container spacing={4} alignItems="center" justifyContent="center" sx={{ minHeight: "calc(100vh - 200px)" }}>
				<Grid item xs={12} md={8}>
					<MainCard>
						<Grid container spacing={4} alignItems="center">
							<Grid item xs={12} sm={5}>
								<Box
									sx={{
										p: 4,
										bgcolor: theme.palette.mode === "dark" ? "error.400" : "error.lighter",
										textAlign: "center",
										borderRadius: 2,
									}}
								>
									<img src={reader} alt="Error" style={{ maxWidth: "100%", height: "auto" }} />
								</Box>
							</Grid>
							<Grid item xs={12} sm={7}>
								<Stack spacing={2.5} alignItems={matchDownSM ? "center" : "flex-start"}>
									<Typography variant="h1" color="error.main">
										Error de Suscripción
									</Typography>
									<Typography align={matchDownSM ? "center" : "left"}>
										Ha ocurrido un problema al procesar tu suscripción. No se ha realizado ningún cargo. Por favor intenta nuevamente o
										contacta a soporte si el problema persiste.
									</Typography>
									<Stack direction="row" spacing={2} mt={3}>
										<Button component={RouterLink} to="/suscripciones/tables" variant="contained" color="primary">
											Volver a Planes
										</Button>
									</Stack>
								</Stack>
							</Grid>
						</Grid>
					</MainCard>
				</Grid>
			</Grid>
		</Container>
	);
};

export default SubscriptionError;
