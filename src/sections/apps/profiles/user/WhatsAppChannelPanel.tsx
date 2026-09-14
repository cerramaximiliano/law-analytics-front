import { useEffect, useRef, useState } from "react";

// material-ui
import { Box, Button, Checkbox, Chip, CircularProgress, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import OtpInput from "react18-input-otp";

// project-imports
import ApiService, { PhoneApiResponse, PhoneStatus } from "store/reducers/ApiService";
import { BRAND_BLUE } from "themes/dashboardTokens";

/**
 * Alta del canal WhatsApp dentro de Configuración → Canales.
 *
 * Dos modos, los decide el backend (`availability.mode`):
 *  - inbound (default): "Verificar por WhatsApp" abre un chat con nuestro número
 *    y un mensaje ya escrito con el código; al enviarlo, el número queda
 *    verificado y el consentimiento registrado. El panel consulta el estado
 *    hasta ver la verificación.
 *  - outbound: recibe un código de 6 dígitos y lo tipea + checkbox de consentimiento.
 *
 * El switch del canal vive en TabSettings; este panel le avisa cada cambio de
 * estado con `onStatusChange`.
 */

interface Props {
	disabled?: boolean;
	/** El padre decide si la opción se muestra (piloto: sin inscripción y sin número, no); el panel igual carga el estado */
	hidden?: boolean;
	containerSx?: SxProps<Theme>;
	onStatusChange?: (status: PhoneStatus) => void;
}

type Feedback = { kind: "success" | "error" | "info"; text: string } | null;
type Step = "idle" | "code" | "inbound";

const RESEND_COOLDOWN_SECONDS = 60;
const INBOUND_POLL_MS = 4_000;
const INBOUND_POLL_TIMEOUT_MS = 10 * 60_000;

const toStatus = (res: PhoneApiResponse): PhoneStatus => ({
	phone: res.phone ?? null,
	phoneVerified: res.phoneVerified === true,
	phoneVerifiedAt: res.phoneVerifiedAt ?? null,
	whatsappOptIn: {
		accepted: res.whatsappOptIn?.accepted === true,
		acceptedAt: res.whatsappOptIn?.acceptedAt ?? null,
		revokedAt: res.whatsappOptIn?.revokedAt ?? null,
	},
	channelEnabled: res.channelEnabled === true,
	pendingVerification: res.pendingVerification ?? null,
	availability: res.availability,
	enrollment: res.enrollment,
});

const responseMessage = (res: PhoneApiResponse, fallback: string) => res.message || res.error || fallback;

const PLANS_PATH = "/apps/profiles/account/subscription?source=whatsapp_channel";

const formatDate = (iso: string | null | undefined) => {
	if (!iso) return "";
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const WhatsAppChannelPanel = ({ disabled = false, hidden = false, containerSx, onStatusChange }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState<PhoneStatus | null>(null);
	const [step, setStep] = useState<Step>("idle");
	const [phone, setPhone] = useState("");
	const [code, setCode] = useState("");
	const [waLink, setWaLink] = useState<string | null>(null);
	const [acceptOptIn, setAcceptOptIn] = useState(false);
	const [busy, setBusy] = useState(false);
	const [feedback, setFeedback] = useState<Feedback>(null);
	const [cooldown, setCooldown] = useState(0);
	const [confirmRemove, setConfirmRemove] = useState(false);
	const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const applyStatus = (next: PhoneStatus) => {
		setStatus(next);
		onStatusChange?.(next);
	};

	const stopPolling = () => {
		if (pollRef.current) clearInterval(pollRef.current);
		pollRef.current = null;
	};

	const startCooldown = (seconds: number) => {
		if (cooldownRef.current) clearInterval(cooldownRef.current);
		setCooldown(seconds);
		cooldownRef.current = setInterval(() => {
			setCooldown((prev) => {
				if (prev <= 1) {
					if (cooldownRef.current) clearInterval(cooldownRef.current);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	// Modo inbound: mientras el usuario envía el mensaje desde WhatsApp, se
	// consulta el estado hasta ver el número verificado.
	const startPolling = () => {
		stopPolling();
		const deadline = Date.now() + INBOUND_POLL_TIMEOUT_MS;
		pollRef.current = setInterval(async () => {
			if (Date.now() > deadline) {
				stopPolling();
				setFeedback({
					kind: "info",
					text: "No vimos tu mensaje todavía. Si ya lo enviaste, actualizá la página; si no, generá un link nuevo.",
				});
				return;
			}
			const res = await ApiService.getPhoneStatus();
			if (!res.success) return;
			const next = toStatus(res);
			if (next.phoneVerified) {
				stopPolling();
				applyStatus(next);
				setStep("idle");
				setWaLink(null);
				setFeedback({ kind: "success", text: "Número verificado. Vas a recibir las novedades de tus causas por WhatsApp." });
			}
		}, INBOUND_POLL_MS);
	};

	useEffect(() => {
		let active = true;
		(async () => {
			const res = await ApiService.getPhoneStatus();
			if (!active) return;
			if (res.success) {
				const next = toStatus(res);
				applyStatus(next);
				if (next.pendingVerification) {
					setPhone(next.pendingVerification.phone);
					if (next.pendingVerification.mode === "inbound") {
						// Puede que ya haya enviado el mensaje: escuchar sin pedir otro link.
						setStep("inbound");
						startPolling();
					} else {
						setStep("code");
					}
				}
			} else {
				setFeedback({ kind: "error", text: responseMessage(res, "No pudimos cargar el estado de WhatsApp") });
			}
			setLoading(false);
		})();
		return () => {
			active = false;
			if (cooldownRef.current) clearInterval(cooldownRef.current);
			stopPolling();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const available = status?.availability?.available === true;
	const inboundMode = status?.availability?.mode !== "outbound";
	const verified = status?.phoneVerified === true && !!status?.phone;
	const optInActive = verified && status?.whatsappOptIn.accepted && !status?.whatsappOptIn.revokedAt;
	// Gating por plan (lo decide el backend): con acceso perdido no se puede
	// verificar ni re-activar; si ya está verificado, los avisos quedan en pausa.
	const enrollment = status?.enrollment;
	const accessLost = enrollment?.reason === "trial_expired" || enrollment?.reason === "plan_required";
	const canAct = available && !accessLost;

	const handleStart = async () => {
		setBusy(true);
		setFeedback(null);
		const res = await ApiService.startPhoneVerification(phone);
		setBusy(false);
		if (res.success) {
			startCooldown(RESEND_COOLDOWN_SECONDS);
			if (res.mode === "inbound" && res.waLink) {
				setWaLink(res.waLink);
				setStep("inbound");
				startPolling();
				setFeedback(null);
			} else {
				setStep("code");
				setCode("");
				setFeedback({ kind: "success", text: responseMessage(res, "Te enviamos un código por WhatsApp") });
			}
			return;
		}
		if (res.code === "COOLDOWN" && res.retryAfterSeconds) startCooldown(res.retryAfterSeconds);
		setFeedback({ kind: "error", text: responseMessage(res, "No pudimos iniciar la verificación") });
	};

	const handleConfirm = async () => {
		setBusy(true);
		setFeedback(null);
		const res = await ApiService.confirmPhoneVerification(code, acceptOptIn);
		setBusy(false);
		if (res.success) {
			applyStatus(toStatus(res));
			setStep("idle");
			setCode("");
			setAcceptOptIn(false);
			setFeedback({ kind: "success", text: responseMessage(res, "Número verificado") });
			return;
		}
		if (["EXPIRED", "TOO_MANY_ATTEMPTS", "NO_PENDING"].includes(res.code || "")) {
			setStep("idle");
			setCode("");
		}
		setFeedback({ kind: "error", text: responseMessage(res, "No pudimos confirmar el código") });
	};

	const handleOptIn = async () => {
		setBusy(true);
		setFeedback(null);
		const res = await ApiService.acceptWhatsappOptIn();
		setBusy(false);
		if (res.success) applyStatus(toStatus(res));
		setFeedback({
			kind: res.success ? "success" : "error",
			text: responseMessage(res, res.success ? "Avisos activados" : "No pudimos activar los avisos"),
		});
	};

	const handleRemove = async () => {
		setBusy(true);
		setFeedback(null);
		const res = await ApiService.removePhone();
		setBusy(false);
		setConfirmRemove(false);
		if (res.success) {
			applyStatus(toStatus(res));
			setStep("idle");
			setPhone("");
		}
		setFeedback({
			kind: res.success ? "info" : "error",
			text: responseMessage(res, res.success ? "Número eliminado" : "No pudimos quitar el número"),
		});
	};

	const resetToIdle = () => {
		stopPolling();
		setStep("idle");
		setCode("");
		setWaLink(null);
		setFeedback(null);
	};

	// ── estilos (mismo lenguaje que TabSettings) ──────────────────────────
	const inputSx = {
		"& .MuiOutlinedInput-root": {
			borderRadius: 1,
			fontSize: "0.82rem",
			"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
			"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
			"&.Mui-focused fieldset": { borderColor: BRAND_BLUE, borderWidth: 1 },
		},
	};
	const primaryBtnSx = {
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		borderRadius: 1.25,
		boxShadow: "none",
		px: 2,
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};
	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		color: "text.secondary",
		borderRadius: 1.25,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		px: 1.5,
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04), borderColor: alpha(BRAND_BLUE, 0.28) },
	};
	const smallText = { fontSize: "0.76rem", color: "text.secondary", letterSpacing: "-0.005em" };
	const feedbackColor =
		feedback?.kind === "error" ? theme.palette.error.main : feedback?.kind === "success" ? theme.palette.success.main : BRAND_BLUE;

	if (hidden) return null;

	if (loading) {
		return (
			<Box sx={containerSx}>
				<Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
					<CircularProgress size={16} sx={{ color: BRAND_BLUE }} />
					<Typography sx={smallText}>Cargando estado de WhatsApp…</Typography>
				</Stack>
			</Box>
		);
	}

	return (
		<Box sx={containerSx}>
			<Stack spacing={1.25}>
				{/* Estado actual */}
				{verified ? (
					<Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
						<Typography sx={{ fontSize: "0.86rem", fontWeight: 600, color: "text.primary" }}>{status?.phone}</Typography>
						<Chip
							size="small"
							label="Verificado"
							sx={{
								height: 20,
								fontSize: "0.68rem",
								fontWeight: 600,
								bgcolor: alpha(theme.palette.success.main, 0.12),
								color: theme.palette.success.dark,
							}}
						/>
						{optInActive ? (
							<Chip
								size="small"
								label="Avisos activados"
								sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, bgcolor: alpha(BRAND_BLUE, 0.1), color: BRAND_BLUE }}
							/>
						) : (
							<Chip size="small" label="Avisos desactivados" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600 }} />
						)}
					</Stack>
				) : (
					<Typography sx={smallText}>
						Recibí un aviso breve por WhatsApp con las carpetas que tienen novedades, además del email. Nunca reemplaza al correo.
					</Typography>
				)}

				{/* Acceso por plan: prueba disponible / vigente / vencida, o plan requerido */}
				{enrollment?.reason === "trial_available" && !verified && (
					<Typography sx={smallText}>
						Incluido en los planes Estándar, Pro y Premium. Con el plan gratuito podés probarlo{" "}
						{enrollment.trialDays ? `${enrollment.trialDays} días` : "por un tiempo"} desde que verificás tu número.
					</Typography>
				)}
				{enrollment?.reason === "trial" && enrollment.trial?.endsAt && (
					<Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
						<Chip
							size="small"
							label={`Prueba gratis hasta el ${formatDate(enrollment.trial.endsAt)}`}
							sx={{
								height: 20,
								fontSize: "0.68rem",
								fontWeight: 600,
								bgcolor: alpha(theme.palette.warning.main, 0.14),
								color: theme.palette.warning.dark,
							}}
						/>
						<Typography sx={smallText}>
							Después sigue con un plan Estándar o superior.{" "}
							<Typography component="a" href={PLANS_PATH} sx={{ ...smallText, color: BRAND_BLUE, fontWeight: 600, textDecoration: "none" }}>
								Ver planes
							</Typography>
						</Typography>
					</Stack>
				)}
				{accessLost && (
					<Stack spacing={0.75}>
						<Typography sx={{ ...smallText, color: theme.palette.warning.dark }}>
							{enrollment?.reason === "trial_expired"
								? `Tu período de prueba de WhatsApp terminó${enrollment.trial?.endsAt ? ` el ${formatDate(enrollment.trial.endsAt)}` : ""}.`
								: "Los avisos por WhatsApp están incluidos en los planes Estándar, Pro y Premium."}{" "}
							{verified ? "Los avisos por WhatsApp quedan en pausa (el email sigue llegando)." : ""} Para seguir usándolo pasá a un plan
							pago.
						</Typography>
						<Box>
							<Button size="small" component="a" href={PLANS_PATH} sx={primaryBtnSx}>
								Ver planes
							</Button>
						</Box>
					</Stack>
				)}

				{status?.availability && !available && !verified && !accessLost && (
					<Typography sx={{ ...smallText, color: theme.palette.warning.dark }}>
						La verificación por WhatsApp todavía no está disponible. Vas a poder cargar tu número cuando activemos el canal.
					</Typography>
				)}

				{/* Paso 1: número */}
				{!verified && !accessLost && step === "idle" && (
					<Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
						<TextField
							id="whatsapp-phone"
							size="small"
							placeholder="+54 9 11 5555 5555"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							disabled={disabled || busy || !canAct}
							helperText="Con código de país"
							sx={{ ...inputSx, flex: 1, "& .MuiFormHelperText-root": { fontSize: "0.68rem", mx: 0.5 } }}
						/>
						<Button
							size="small"
							onClick={handleStart}
							disabled={disabled || busy || !canAct || phone.trim().length < 8}
							sx={{ ...primaryBtnSx, alignSelf: { xs: "flex-start", sm: "center" }, mb: { sm: 2.5 } }}
						>
							{busy ? "Un momento…" : inboundMode ? "Verificar por WhatsApp" : "Enviar código"}
						</Button>
					</Stack>
				)}

				{/* Paso 2 (inbound): el usuario envía el mensaje prellenado desde su WhatsApp */}
				{!verified && step === "inbound" && (
					<Stack spacing={1.25}>
						<Typography sx={{ fontSize: "0.82rem", color: "text.primary" }}>
							Tocá el botón: se abre WhatsApp con un mensaje ya escrito para <strong>{phone}</strong>. Enviálo y volvé a esta pantalla.
						</Typography>
						<Typography sx={smallText}>
							Al enviar ese mensaje aceptás recibir por WhatsApp los avisos de novedades de tus causas. Podés darte de baja cuando quieras
							respondiendo BAJA.
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
							{waLink ? (
								<Button size="small" component="a" href={waLink} target="_blank" rel="noopener noreferrer" sx={primaryBtnSx}>
									Abrir WhatsApp
								</Button>
							) : (
								<Button size="small" onClick={handleStart} disabled={disabled || busy || cooldown > 0 || !available} sx={primaryBtnSx}>
									{cooldown > 0 ? `Generar link en ${cooldown}s` : "Generar link de verificación"}
								</Button>
							)}
							<Stack direction="row" spacing={0.75} alignItems="center">
								<CircularProgress size={12} sx={{ color: BRAND_BLUE }} />
								<Typography sx={smallText}>Esperando tu mensaje…</Typography>
							</Stack>
						</Stack>
						<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
							{waLink && (
								<Button size="small" onClick={handleStart} disabled={disabled || busy || cooldown > 0 || !available} sx={ghostBtnSx}>
									{cooldown > 0 ? `Nuevo link en ${cooldown}s` : "Generar otro link"}
								</Button>
							)}
							<Button size="small" onClick={resetToIdle} disabled={busy} sx={ghostBtnSx}>
								Cambiar número
							</Button>
						</Stack>
					</Stack>
				)}

				{/* Paso 2 (outbound): código + consentimiento */}
				{!verified && step === "code" && (
					<Stack spacing={1.25}>
						<Typography sx={smallText}>
							Ingresá el código que te llegó por WhatsApp al <strong>{phone}</strong>.
						</Typography>
						<Box sx={{ maxWidth: 320 }}>
							<OtpInput
								value={code}
								onChange={(value: string) => setCode(value)}
								numInputs={6}
								isInputNum
								isDisabled={disabled || busy}
								containerStyle={{ justifyContent: "space-between" }}
								inputStyle={{
									width: "100%",
									margin: "2px",
									padding: "8px 0",
									fontSize: "1rem",
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.3 : 0.2)}`,
									borderRadius: 6,
									background: "transparent",
									color: theme.palette.text.primary,
								}}
								focusStyle={{ outline: "none", border: `1px solid ${BRAND_BLUE}`, boxShadow: `0 0 0 2px ${alpha(BRAND_BLUE, 0.2)}` }}
							/>
						</Box>
						<FormControlLabel
							control={
								<Checkbox
									id="whatsapp-opt-in"
									size="small"
									checked={acceptOptIn}
									onChange={(e) => setAcceptOptIn(e.target.checked)}
									disabled={disabled || busy}
									sx={{ color: alpha(BRAND_BLUE, isDark ? 0.4 : 0.32), "&.Mui-checked": { color: BRAND_BLUE } }}
								/>
							}
							label={
								<Typography sx={{ fontSize: "0.78rem", color: "text.primary" }}>
									Acepto recibir por WhatsApp los avisos de novedades de mis causas. Puedo darme de baja cuando quiera respondiendo BAJA.
								</Typography>
							}
							sx={{ alignItems: "flex-start", ml: 0, "& .MuiCheckbox-root": { pt: 0.25 } }}
						/>
						<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
							<Button
								size="small"
								onClick={handleConfirm}
								disabled={disabled || busy || code.length !== 6 || !acceptOptIn}
								sx={primaryBtnSx}
							>
								{busy ? "Confirmando…" : "Confirmar"}
							</Button>
							<Button size="small" onClick={handleStart} disabled={disabled || busy || cooldown > 0 || !available} sx={ghostBtnSx}>
								{cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar código"}
							</Button>
							<Button size="small" onClick={resetToIdle} disabled={busy} sx={ghostBtnSx}>
								Cambiar número
							</Button>
						</Stack>
					</Stack>
				)}

				{/* Verificado: reactivar tras una baja / quitar número */}
				{verified && (
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
						{!optInActive && (
							<Button size="small" onClick={handleOptIn} disabled={disabled || busy || accessLost} sx={primaryBtnSx}>
								{busy ? "Activando…" : "Volver a recibir avisos"}
							</Button>
						)}
						{confirmRemove ? (
							<>
								<Button
									size="small"
									onClick={handleRemove}
									disabled={disabled || busy}
									sx={{ ...ghostBtnSx, color: theme.palette.error.main }}
								>
									{busy ? "Quitando…" : "Sí, quitar el número"}
								</Button>
								<Button size="small" onClick={() => setConfirmRemove(false)} disabled={busy} sx={ghostBtnSx}>
									Cancelar
								</Button>
							</>
						) : (
							<Button size="small" onClick={() => setConfirmRemove(true)} disabled={disabled || busy} sx={ghostBtnSx}>
								Quitar número
							</Button>
						)}
					</Stack>
				)}

				{feedback && (
					<Typography role={feedback.kind === "error" ? "alert" : "status"} sx={{ fontSize: "0.76rem", color: feedbackColor }}>
						{feedback.text}
					</Typography>
				)}
			</Stack>
		</Box>
	);
};

export default WhatsAppChannelPanel;
