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
import target from "assets/images/analytics/target.svg";

// ==============================|| SUBSCRIPTION SUCCESS ||============================== //

const SubscriptionSuccess = () => {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

	useEffect(() => {
		dispatch(
			openSnackbar({
				open: true,
				message: "¡Suscripción completada exitosamente!",
				variant: "alert",
				alert: {
					color: "success",
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
										bgcolor: theme.palette.mode === "dark" ? "primary.400" : "primary.lighter",
										textAlign: "center",
										borderRadius: 2,
									}}
								>
									<img src={target} alt="Success" style={{ maxWidth: "100%", height: "auto" }} />
								</Box>
							</Grid>
							<Grid item xs={12} sm={7}>
								<Stack spacing={2.5} alignItems={matchDownSM ? "center" : "flex-start"}>
									<Typography variant="h1" color="success.main">
										¡Suscripción Exitosa!
									</Typography>
									<Typography align={matchDownSM ? "center" : "left"}>
										Tu suscripción ha sido procesada correctamente. Ya puedes disfrutar de todos los beneficios de tu nuevo plan.
									</Typography>
									<Stack direction="row" spacing={2} mt={3}>
										<Button component={RouterLink} to="/dashboard/default" variant="contained" color="primary">
											Ir al Dashboard
										</Button>
										<Button component={RouterLink} to="/apps/profiles/account/settings" variant="outlined" color="secondary">
											Ver mi Plan
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

export default SubscriptionSuccess;
