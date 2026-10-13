import React, { useEffect, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import axios from "axios";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Container,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Grid,
	Link,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

// third-party
import { motion } from "framer-motion";

// project imports
import MainCard from "components/MainCard";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";
import useAuth from "hooks/useAuth";
import {
	ACCOUNT_DELETION_CONFIRM_WORD,
	ACCOUNT_DELETION_GRACE_DAYS,
	ACCOUNT_DELETION_PATH,
	formatDeletionDate,
	getErrorCode,
} from "utils/accountDeletion";

// assets
import { Trash } from "iconsax-react";

// Mantener en sync con privacy-policy.tsx
const BRAND_BLUE = "#3A7BFF";
const SUPPORT_EMAIL = "soporte@lawanalytics.app";

const DELETED_ITEMS = [
	"Tu cuenta y tu perfil (nombre, email, foto, preferencias y sesiones).",
	"Tus carpetas y todo lo que cargaste en ellas.",
	"Tareas, eventos de agenda, notas y contactos.",
	"Cálculos guardados y documentos o escritos que hayas subido o generado.",
	"Las credenciales de portales judiciales vinculadas (PJN, SCBA, MEV y otros) y la sincronización de tus causas.",
	"Tu suscripción: se cancela y no se te vuelve a cobrar.",
];

const KEPT_ITEMS = [
	"La información de causas judiciales que proviene de fuentes públicas (los portales del Poder Judicial) no es un dato tuyo: deja de estar asociada a tu cuenta, pero puede seguir en nuestra base porque pertenece a registros públicos.",
	"Los registros de pagos y facturación que la normativa fiscal o contable nos obligue a conservar, solo durante el plazo legal y exclusivamente para ese fin.",
	"Copias de seguridad, que se sobrescriben en ciclos periódicos; tus datos desaparecen de ellas cuando completan su ciclo.",
];

const AccountDeletionPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const location = useLocation();
	const { isLoggedIn, isInitialized, user, clearLocalSession } = useAuth();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [confirmText, setConfirmText] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [dialogError, setDialogError] = useState<string | null>(null);
	// Fecha programada (de la respuesta del POST o del GET de estado).
	const [scheduledFor, setScheduledFor] = useState<string | null>(null);
	const [justRequested, setJustRequested] = useState(false);

	// Las cuentas creadas con Google no tienen contraseña.
	const needsPassword = user?.authProvider !== "google";

	// Con sesión: consultar si ya hay una eliminación pedida.
	useEffect(() => {
		if (!isLoggedIn) return;
		let cancelled = false;
		axios
			.get<{ requested: boolean; deletionScheduledFor?: string }>(`${import.meta.env.VITE_BASE_URL}/api/auth/account-deletion`)
			.then((res) => {
				if (!cancelled && res.data?.requested) setScheduledFor(res.data.deletionScheduledFor || "");
			})
			.catch(() => {
				// Sin estado: se ofrece el botón normalmente.
			});
		return () => {
			cancelled = true;
		};
	}, [isLoggedIn]);

	const openDialog = () => {
		setConfirmText("");
		setPassword("");
		setDialogError(null);
		setDialogOpen(true);
	};

	const canSubmit = confirmText.trim().toUpperCase() === ACCOUNT_DELETION_CONFIRM_WORD && (!needsPassword || password.length > 0) && !submitting;

	const handleConfirm = async () => {
		if (!canSubmit) return;
		setSubmitting(true);
		setDialogError(null);
		try {
			const res = await axios.post<{ success: boolean; deletionScheduledFor?: string }>(
				`${import.meta.env.VITE_BASE_URL}/api/auth/account-deletion`,
				{ confirm: ACCOUNT_DELETION_CONFIRM_WORD, ...(needsPassword ? { password } : {}) },
			);
			if (!res.data?.success) throw new Error("not-success");
			setScheduledFor(res.data.deletionScheduledFor || "");
			setJustRequested(true);
			setDialogOpen(false);
			// El hub revocó todas las sesiones: cerramos la local sin llamar a /logout.
			clearLocalSession();
		} catch (err: any) {
			const code = getErrorCode(err);
			if (code === "INVALID_PASSWORD") {
				setDialogError("La contraseña no es correcta.");
			} else if (err?.response?.status === 401) {
				setDialogError("Tu sesión expiró. Volvé a iniciar sesión e intentá de nuevo.");
			} else {
				setDialogError(err?.response?.data?.message || `No pudimos procesar el pedido. Intentá de nuevo o escribinos a ${SUPPORT_EMAIL}.`);
			}
		} finally {
			setSubmitting(false);
		}
	};

	const bodySx = {
		fontSize: "0.95rem",
		lineHeight: 1.65,
		color: theme.palette.text.primary,
		maxWidth: "70ch",
	};

	const linkSx = {
		color: BRAND_BLUE,
		fontWeight: 500,
		textDecoration: "none",
		"&:hover": { textDecoration: "underline" },
	};

	const sectionHeading = (text: string, id?: string) => (
		<Typography
			id={id}
			variant="h3"
			sx={{
				scrollMarginTop: { xs: 88, md: 104 },
				mt: 4,
				mb: 1.5,
				fontSize: { xs: "1.2rem", sm: "1.4rem" },
				fontWeight: 600,
				letterSpacing: "-0.015em",
				lineHeight: 1.2,
				color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
			}}
		>
			{text}
		</Typography>
	);

	const bulletList = (items: React.ReactNode[]) => (
		<Box
			component="ul"
			sx={{
				pl: 3,
				maxWidth: "70ch",
				mb: 2,
				"& li": { fontSize: "0.95rem", lineHeight: 1.65, mb: 0.75, color: theme.palette.text.primary },
			}}
		>
			{items.map((item, i) => (
				<li key={i}>{item}</li>
			))}
		</Box>
	);

	const scheduledLabel = formatDeletionDate(scheduledFor || undefined);
	const loginHref = `/login?redirect=${encodeURIComponent(location.pathname || ACCOUNT_DELETION_PATH)}`;

	const renderWebAction = () => {
		if (scheduledFor !== null) {
			return (
				<Alert severity={justRequested ? "success" : "info"} sx={{ maxWidth: "70ch" }}>
					<Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
						{justRequested ? "Recibimos tu pedido de eliminación." : "Tu cuenta ya tiene una eliminación programada."}
					</Typography>
					<Typography variant="body2">
						{scheduledLabel ? `Tu cuenta y tus datos se eliminarán definitivamente el ${scheduledLabel}.` : "Tu cuenta y tus datos se eliminarán definitivamente en 30 días."}{" "}
						{justRequested ? "Cerramos tu sesión en todos los dispositivos. " : ""}
						Si cambiás de idea, iniciá sesión antes de esa fecha y elegí «Cancelar eliminación».
					</Typography>
				</Alert>
			);
		}
		if (!isInitialized) {
			return (
				<Box sx={{ py: 1 }} aria-busy="true">
					<CircularProgress size={22} />
				</Box>
			);
		}
		if (isLoggedIn) {
			return (
				<Stack spacing={1.5} alignItems="flex-start">
					<Typography sx={bodySx}>
						Tenés la sesión iniciada como <strong>{user?.email}</strong>.
					</Typography>
					<Button
						variant="contained"
						color="error"
						startIcon={<Trash size={16} variant="Linear" />}
						onClick={openDialog}
						sx={{ textTransform: "none" }}
					>
						Eliminar mi cuenta
					</Button>
				</Stack>
			);
		}
		return (
			<Stack spacing={1.5} alignItems="flex-start">
				<Typography sx={bodySx}>Para pedirla desde la web, primero tenés que iniciar sesión con la cuenta que querés eliminar.</Typography>
				<Button component={RouterLink} to={loginHref} variant="contained" sx={{ textTransform: "none" }}>
					Iniciar sesión para continuar
				</Button>
			</Stack>
		);
	};

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 6, md: 10 }, position: "relative", overflow: "hidden" }}>
			<PageBackground variant="light" />
			<Container sx={{ position: "relative", zIndex: 1, px: { xs: 2, sm: 3 } }}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<CustomBreadcrumbs items={[{ title: "Inicio", to: "/" }, { title: "Eliminar cuenta" }]} />
						<Box
							sx={{
								mt: { xs: 2, md: 3 },
								mb: { xs: 3, md: 5 },
								pb: { xs: 3, md: 4 },
								borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
							}}
						>
							<motion.div
								initial={{ opacity: 0, y: 24 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ type: "spring", stiffness: 150, damping: 30 }}
							>
								<Typography
									variant="h1"
									sx={{
										fontSize: { xs: "1.85rem", sm: "2.5rem", md: "3rem" },
										fontWeight: 600,
										lineHeight: 1.08,
										letterSpacing: "-0.025em",
										textWrap: "balance",
										mb: 1.5,
										color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
									}}
								>
									Eliminar tu cuenta de Law||Analytics
								</Typography>
								<Typography sx={{ fontSize: "0.98rem", color: theme.palette.text.secondary, maxWidth: "70ch" }}>
									Podés pedir la eliminación de tu cuenta y de tus datos en cualquier momento, desde la app, desde la web o por email.
									Te contamos qué se borra, qué se conserva y cuánto tarda.
								</Typography>
							</motion.div>
						</Box>
					</Grid>

					<Grid item xs={12} md={10} lg={9}>
						<MainCard sx={{ overflow: "hidden" }}>
							{sectionHeading("Cómo funciona", "como-funciona")}
							<Typography paragraph sx={bodySx}>
								Cuando pedís la eliminación, cerramos tu sesión en todos los dispositivos y programamos el borrado definitivo para dentro
								de <strong>{ACCOUNT_DELETION_GRACE_DAYS} días</strong>. Durante ese plazo tu cuenta queda inaccesible, pero no se borra
								nada. Si cambiás de idea, iniciá sesión con tu email y contraseña (o con Google) y elegí{" "}
								<strong>«Cancelar eliminación»</strong>: tu cuenta vuelve a quedar como estaba.
							</Typography>
							<Typography paragraph sx={bodySx}>
								Pasados los {ACCOUNT_DELETION_GRACE_DAYS} días, la eliminación es definitiva y no se puede deshacer.
							</Typography>

							{sectionHeading("Qué se elimina", "que-se-elimina")}
							{bulletList(DELETED_ITEMS)}

							{sectionHeading("Qué se conserva", "que-se-conserva")}
							{bulletList(KEPT_ITEMS)}

							<Divider sx={{ my: 4, borderColor: alpha(theme.palette.divider, 0.6) }} />

							{sectionHeading("Cómo pedirla", "como-pedirla")}

							<Typography variant="h4" sx={{ mt: 2.5, mb: 1, fontSize: "1.05rem", fontWeight: 600 }}>
								Desde la app de Android
							</Typography>
							<Typography paragraph sx={bodySx}>
								Abrí la app, entrá a <strong>Más → Cuenta → Eliminar cuenta</strong> y seguí los pasos.
							</Typography>

							<Typography variant="h4" sx={{ mt: 2.5, mb: 1, fontSize: "1.05rem", fontWeight: 600 }}>
								Desde la web
							</Typography>
							<Box sx={{ mb: 2 }}>{renderWebAction()}</Box>

							<Typography variant="h4" sx={{ mt: 2.5, mb: 1, fontSize: "1.05rem", fontWeight: 600 }}>
								Por email
							</Typography>
							<Typography paragraph sx={bodySx}>
								Escribinos a{" "}
								<Link href={`mailto:${SUPPORT_EMAIL}?subject=Eliminar%20mi%20cuenta`} sx={linkSx}>
									{SUPPORT_EMAIL}
								</Link>{" "}
								<strong>desde el email asociado a tu cuenta</strong>, con el asunto «Eliminar mi cuenta». Lo usamos para verificar que
								el pedido viene de vos; te confirmamos por la misma vía la fecha de eliminación.
							</Typography>

							<Divider sx={{ my: 4, borderColor: alpha(theme.palette.divider, 0.6) }} />

							<Typography sx={{ ...bodySx, color: theme.palette.text.secondary, fontSize: "0.88rem" }}>
								Más información sobre cómo tratamos tus datos en la{" "}
								<Link component={RouterLink} to="/privacy-policy" sx={linkSx}>
									Política de Privacidad
								</Link>
								.
							</Typography>
						</MainCard>
					</Grid>
				</Grid>
			</Container>

			<Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="xs" fullWidth>
				<DialogTitle sx={{ fontWeight: 600 }}>¿Eliminar tu cuenta?</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ pt: 0.5 }}>
						<Typography variant="body2">
							Vamos a cerrar tu sesión en todos los dispositivos y a eliminar tu cuenta y tus datos dentro de {ACCOUNT_DELETION_GRACE_DAYS}{" "}
							días. Hasta entonces podés cancelarlo volviendo a iniciar sesión.
						</Typography>
						<TextField
							label={`Escribí ${ACCOUNT_DELETION_CONFIRM_WORD} para confirmar`}
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							autoComplete="off"
							disabled={submitting}
							fullWidth
							autoFocus
						/>
						{needsPassword && (
							<TextField
								label="Tu contraseña"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoComplete="current-password"
								disabled={submitting}
								fullWidth
							/>
						)}
						{dialogError && <Alert severity="error">{dialogError}</Alert>}
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setDialogOpen(false)} disabled={submitting} sx={{ textTransform: "none" }}>
						Cancelar
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={handleConfirm}
						disabled={!canSubmit}
						startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
						sx={{ textTransform: "none" }}
					>
						{submitting ? "Procesando..." : "Eliminar mi cuenta"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default AccountDeletionPage;
