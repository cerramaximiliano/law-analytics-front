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
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "calc(100vh - 180px)",
			}}
		>
			<Container maxWidth="sm">
				<MainCard>
					<CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
						{/* Icono centrado */}
						<Box sx={{ textAlign: "center", mb: { xs: 1, sm: 1.5 } }}>
							<CloseCircle size={matchDownSM ? 48 : 56} variant="Bulk" color={theme.palette.error.main} />
						</Box>

						{/* Título principal */}
						<Typography variant={matchDownSM ? "h4" : "h3"} align="center" gutterBottom sx={{ mb: 0.5 }}>
							Error en el proceso de pago
						</Typography>

						{/* Descripción */}
						<Typography variant="body1" align="center" color="textSecondary" sx={{ mb: { xs: 1.5, sm: 2 } }}>
							No pudimos procesar tu pago. No se ha realizado ningún cargo a tu tarjeta.
						</Typography>

						{/* Información adicional */}
						<Card
							variant="outlined"
							sx={{
								mb: { xs: 1.5, sm: 2 },
								bgcolor: theme.palette.grey[50],
								borderColor: theme.palette.grey[300],
							}}
						>
							<CardContent sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1.5, sm: 2 } }}>
								<Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
									Posibles causas:
								</Typography>
								<Stack spacing={0.5} sx={{ ml: 1 }}>
									<Typography variant="body2" color="textSecondary">
										• Información de pago incorrecta
									</Typography>
									<Typography variant="body2" color="textSecondary">
										• Fondos insuficientes en la tarjeta
									</Typography>
									<Typography variant="body2" color="textSecondary">
										• Límite de transacciones alcanzado
									</Typography>
									<Typography variant="body2" color="textSecondary">
										• Problema temporal con el procesador de pagos
									</Typography>
								</Stack>
							</CardContent>
						</Card>

						{/* Botones de acción */}
						<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center" sx={{ mb: { xs: 1.5, sm: 2 } }}>
							<Button
								component={RouterLink}
								to="/suscripciones/tables"
								variant="contained"
								color="primary"
								size={matchDownSM ? "medium" : "large"}
								fullWidth={matchDownSM}
								startIcon={<RefreshSquare size={20} />}
							>
								Intentar Nuevamente
							</Button>

							<Button
								onClick={() => navigate("/dashboard/default")}
								variant="outlined"
								color="secondary"
								size={matchDownSM ? "medium" : "large"}
								fullWidth={matchDownSM}
								startIcon={<ArrowLeft size={20} />}
							>
								Volver al Dashboard
							</Button>
						</Stack>

						{/* Link de soporte */}
						<Box sx={{ textAlign: "center" }}>
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
			</Container>

			{/* Modal de soporte */}
			<SupportModal open={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
		</Box>
	);
};

export default SubscriptionError;
