import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

// material-ui
import { Button, Box, Typography, Stack, CircularProgress, Container, useTheme, useMediaQuery } from "@mui/material";

// project-imports
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import LogoMain from "components/logo/LogoMain";
import MainCard from "components/MainCard";

// ==============================|| UNSUBSCRIBE PAGE ||============================== //

const UnsubscribePage = () => {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState<boolean | null>(null);

	const email = searchParams.get("email");
	const category = searchParams.get("category");

	const handleUnsubscribe = async () => {
		if (!email) return;

		setLoading(true);
		try {
			const response = await axios.delete(`/api/newsletter/${encodeURIComponent(email)}`);

			if (response.data.success) {
				setSuccess(true);
				dispatch(
					openSnackbar({
						open: true,
						message: "Te has desuscrito exitosamente",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: true,
					}),
				);
			} else {
				setSuccess(false);
				dispatch(
					openSnackbar({
						open: true,
						message: response.data.message || "No se pudo procesar tu solicitud",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: true,
					}),
				);
			}
		} catch (error) {
			setSuccess(false);
			dispatch(
				openSnackbar({
					open: true,
					message: "Ocurrió un error al procesar tu solicitud",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: true,
				}),
			);
			console.error("Error unsubscribing:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
			<Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
				<LogoMain />
			</Box>

			<MainCard>
				<Stack alignItems="center" spacing={3} sx={{ p: matchDownSM ? 2 : 3 }}>
					<Typography variant="h2" align="center">
						Cancelar Suscripción
					</Typography>

					{!email ? (
						<Typography color="error" align="center">
							No se proporcionó una dirección de correo electrónico válida.
						</Typography>
					) : (
						<>
							<Typography variant="body1" align="center">
								Estás a punto de cancelar la suscripción de <strong>{email}</strong>
								{category && ` a los correos de la categoría "${category}"`}.
							</Typography>

							{success === null ? (
								<Button
									variant="contained"
									color="primary"
									onClick={handleUnsubscribe}
									disabled={loading}
									startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
									sx={{ mt: 2 }}
								>
									{loading ? "Procesando..." : "Confirmar Desuscripción"}
								</Button>
							) : success ? (
								<Box sx={{ mt: 2 }}>
									<Typography color="success.main" variant="h5" align="center" gutterBottom>
										¡Desuscripción exitosa!
									</Typography>
									<Typography align="center">
										Tu correo {email} ha sido removido de nuestra lista{category ? ` para la categoría "${category}"` : ""}.
									</Typography>
								</Box>
							) : (
								<Box sx={{ mt: 2 }}>
									<Typography color="error" variant="h5" align="center" gutterBottom>
										No se pudo completar la desuscripción
									</Typography>
									<Typography align="center">Por favor, intenta nuevamente más tarde o contáctanos directamente.</Typography>
									<Button variant="outlined" color="primary" onClick={handleUnsubscribe} disabled={loading} sx={{ mt: 2 }}>
										Intentar nuevamente
									</Button>
								</Box>
							)}
						</>
					)}
				</Stack>
			</MainCard>
		</Container>
	);
};

export default UnsubscribePage;
