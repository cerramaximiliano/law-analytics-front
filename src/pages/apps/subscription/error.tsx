import React from "react";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Button, Box, Container, Grid, Stack, Typography, useMediaQuery, Card, CardContent } from "@mui/material";

// icons
import { CloseCircle, ArrowLeft, RefreshSquare, MessageQuestion } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// ==============================|| SUBSCRIPTION ERROR ||============================== //

const SubscriptionError = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const [supportModalOpen, setSupportModalOpen] = useState(false);

	useEffect(() => {
		dispatch(
			openSnackbar({
				open: true,
				message: "Error al procesar el pago. No se realizó ningún cargo.",
				variant: "alert",
				alert: {
					color: "error",
				},
				close: false,
			}),
		);
	}, []);

	return (
		<Container>
			<Grid
				container
				spacing={3}
				alignItems="center"
				justifyContent="center"
				sx={{
					minHeight: "calc(100vh - 240px)",
					mt: { xs: 4, md: 8 },
				}}
			>
				<Grid item xs={12} md={8} lg={6}>
					<MainCard>
						<CardContent sx={{ p: { xs: 3, md: 5 } }}>
							{/* Icono centrado */}
							<Box sx={{ textAlign: "center", mb: 3 }}>
								<CloseCircle size={64} variant="Bulk" color={theme.palette.error.main} />
							</Box>

							{/* Título principal */}
							<Typography variant="h2" align="center" gutterBottom sx={{ mb: 2 }}>
								Error en el proceso de pago
							</Typography>

							{/* Descripción */}
							<Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 4 }}>
								No pudimos procesar tu pago. No se ha realizado ningún cargo a tu tarjeta.
							</Typography>

							{/* Información adicional */}
							<Card
								variant="outlined"
								sx={{
									mb: 4,
									bgcolor: theme.palette.grey[50],
									borderColor: theme.palette.grey[300],
								}}
							>
								<CardContent>
									<Typography variant="h5" gutterBottom>
										Posibles causas:
									</Typography>
									<Typography variant="body2" color="textSecondary" paragraph>
										• Información de pago incorrecta
									</Typography>
									<Typography variant="body2" color="textSecondary" paragraph>
										• Fondos insuficientes en la tarjeta
									</Typography>
									<Typography variant="body2" color="textSecondary" paragraph>
										• Límite de transacciones alcanzado
									</Typography>
									<Typography variant="body2" color="textSecondary">
										• Problema temporal con el procesador de pagos
									</Typography>
								</CardContent>
							</Card>

							{/* Botones de acción */}
							<Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
								<Button
									component={RouterLink}
									to="/suscripciones/tables"
									variant="contained"
									color="primary"
									size="large"
									fullWidth={matchDownSM}
									startIcon={<RefreshSquare size={20} />}
								>
									Intentar Nuevamente
								</Button>

								<Button
									onClick={() => navigate("/dashboard/default")}
									variant="outlined"
									color="secondary"
									size="large"
									fullWidth={matchDownSM}
									startIcon={<ArrowLeft size={20} />}
								>
									Volver al Dashboard
								</Button>
							</Stack>

							{/* Link de soporte */}
							<Box sx={{ textAlign: "center", mt: 3 }}>
								<Button
									variant="text"
									color="primary"
									size="small"
									startIcon={<MessageQuestion size={16} />}
									onClick={() => setSupportModalOpen(true)}
								>
									¿Necesitas ayuda? Contactar soporte
								</Button>
							</Box>
						</CardContent>
					</MainCard>
				</Grid>
			</Grid>

			{/* Modal de soporte */}
			<SupportModal open={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
		</Container>
	);
};

export default SubscriptionError;
