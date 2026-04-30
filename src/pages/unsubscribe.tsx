import React from "react";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

// material-ui
import { Button, Box, Typography, Stack, CircularProgress, Container, Link, useTheme, useMediaQuery } from "@mui/material";

// iconsax
import { DirectSend, TickCircle, CloseCircle } from "iconsax-react";

// project-imports
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import MainCard from "components/MainCard";

const SUPPORT_EMAIL = "soporte@lawanalytics.app";

// ==============================|| UNSUBSCRIBE PAGE ||============================== //

const UnsubscribePage = () => {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState<boolean | null>(null);

	const email = searchParams.get("email");
	const category = searchParams.get("category");
	const template = searchParams.get("template");
	const campaign = searchParams.get("campaign");

	const handleUnsubscribe = async () => {
		if (!email) return;

		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (template) params.append("template", template);
			if (campaign) params.append("campaign", campaign);
			if (category) params.append("category", category);

			const url = `${import.meta.env.VITE_BASE_URL}/api/newsletter/${encodeURIComponent(email)}${
				params.toString() ? `?${params.toString()}` : ""
			}`;
			const response = await axios.delete(url, {
				withCredentials: true,
			});

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
		} finally {
			setLoading(false);
		}
	};

	// Empty state: no valid email param
	if (!email) {
		return (
			<Container
				maxWidth="sm"
				sx={{
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					py: 6,
				}}
			>
				<MainCard>
					<Stack alignItems="center" spacing={3} sx={{ p: matchDownSM ? 2 : 4 }}>
						<Box
							sx={{
								width: 72,
								height: 72,
								borderRadius: "50%",
								bgcolor: theme.palette.warning.lighter ?? "warning.light",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<DirectSend size={36} color={theme.palette.warning.main} variant="Bold" />
						</Box>

						<Typography variant="h3" align="center">
							No podemos procesar esta desuscripción
						</Typography>

						<Typography variant="body1" align="center" color="text.secondary">
							Necesitamos un enlace válido para identificar qué suscripción querés cancelar. Revisá el email que te enviamos y usá el link
							desde ahí, o contactanos si tenés problemas.
						</Typography>

						<Stack direction={matchDownSM ? "column" : "row"} spacing={2} justifyContent="center" sx={{ width: "100%" }}>
							<Button variant="contained" color="primary" onClick={() => navigate("/")}>
								Ir al inicio
							</Button>
							<Button variant="text" color="secondary" component={Link} href={`mailto:${SUPPORT_EMAIL}`}>
								Contactar a soporte
							</Button>
						</Stack>
					</Stack>
				</MainCard>
			</Container>
		);
	}

	return (
		<Container
			maxWidth="md"
			sx={{
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				py: 6,
			}}
		>
			<MainCard>
				<Stack alignItems="center" spacing={3} sx={{ p: matchDownSM ? 2 : 3 }}>
					<Typography variant="h2" align="center">
						Cancelar Suscripción
					</Typography>

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
						<Box sx={{ mt: 2, textAlign: "center" }}>
							<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
								<TickCircle size={48} color={theme.palette.success.main} variant="Bold" />
							</Box>
							<Typography color="success.main" variant="h5" align="center" gutterBottom>
								¡Desuscripción exitosa!
							</Typography>
							<Typography align="center">
								Tu correo {email} ha sido removido de nuestra lista{category ? ` para la categoría "${category}"` : ""}.
							</Typography>
						</Box>
					) : (
						<Box sx={{ mt: 2, textAlign: "center" }}>
							<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
								<CloseCircle size={48} color={theme.palette.error.main} variant="Bold" />
							</Box>
							<Typography color="error" variant="h5" align="center" gutterBottom>
								No se pudo completar la desuscripción
							</Typography>
							<Typography align="center">
								Por favor, intentá nuevamente más tarde o{" "}
								<Link href={`mailto:${SUPPORT_EMAIL}`} underline="hover">
									contactanos directamente
								</Link>
								.
							</Typography>
							<Button variant="outlined" color="primary" onClick={handleUnsubscribe} disabled={loading} sx={{ mt: 2 }}>
								Intentar nuevamente
							</Button>
						</Box>
					)}
				</Stack>
			</MainCard>
		</Container>
	);
};

export default UnsubscribePage;
