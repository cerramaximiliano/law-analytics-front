import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

// material-ui
import {
	Box,
	Button,
	ButtonBase,
	CircularProgress,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Typography,
	useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// icons
import { ArrowLeft2, ArrowRight, Clock, CloseCircle, Eye, EyeSlash, Lock1, TickCircle } from "iconsax-react";

// project-imports
import { dispatch } from "store";
import pjnCredentialsService from "api/pjnCredentials";
import scbaCredentialsService from "api/scbaCredentials";
import { pjnSyncStarted, pjnSyncCompleted, pjnSyncError, pjnSyncReset, pjnCredentialsInvalidated } from "store/reducers/pjnSync";
import { scbaSyncStarted, scbaSyncCompleted, scbaSyncError, scbaSyncReset, scbaCredentialsInvalidated } from "store/reducers/scbaSync";
import { getFoldersByUserId } from "store/reducers/folder";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";
import { pjnStatusNotice } from "utils/pjnBindingState";
import { scbaStatusNotice } from "utils/scbaBindingState";
import { trackActivity } from "utils/productAnalytics";
import ApiService from "store/reducers/ApiService";
import { useTeam } from "contexts/TeamContext";

import logoPJNacion from "assets/images/logos/logo_pj_nacion.png";
import logoMEV from "assets/images/logos/logo_pj_buenos_aires.svg";

// =============================================================================
// CONECTAR CUENTA — segundo modo de "Primera causa" (2026-10-13).
//
// Versión mínima de PjnAccountConnect / ScbaAccountConnect para el primer minuto:
// portal (PJN o SCBA), usuario y contraseña, y el avance de la sincronización en la
// misma pantalla. Reusa los servicios de credenciales; no reemplaza a los
// componentes completos (perfil y modal de alta siguen usándolos).
//
// La clave no se valida al vincular: la prueba el worker y, si el portal la rechaza,
// la credencial queda con syncStatus "error". Por eso el resultado sale del sondeo.
//
// Plan gratis (decisión del 13/10, opción A): se avisa ANTES de conectar que el plan
// sigue N causas y que el resto queda guardado; al final se muestra activas/guardadas.
// Los workers crean las excedentes archivadas con archivedReason "plan_limit".
// =============================================================================

export type Portal = "pjn" | "scba";

const POLL_INTERVAL_MS = 5_000;
const BACKGROUND_AFTER_MS = 3 * 60 * 1000; // pasado este tiempo se avisa que sigue en segundo plano
const STOP_POLL_AFTER_MS = 20 * 60 * 1000;

type Phase =
	| { kind: "form" }
	| { kind: "sending" }
	| { kind: "syncing"; found: number; done: number; background: boolean }
	| { kind: "done"; total: number }
	| { kind: "error"; message: string; invalidCredentials: boolean }
	| { kind: "already" };

const formatCuil = (value: string) => {
	const clean = value.replace(/\D/g, "").slice(0, 11);
	if (clean.length <= 2) return clean;
	if (clean.length <= 10) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
	return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
};

interface ConectarCuentaProps {
	initialPortal?: Portal;
	onBack: () => void;
	onSynced?: () => void; // para que el dashboard recargue sus datos
}

const ConectarCuenta: React.FC<ConectarCuentaProps> = ({ initialPortal = "pjn", onBack, onSynced }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));
	const navigate = useNavigate();
	const authUser = useSelector((state: any) => state.auth.user);
	const { getRequestHeaders } = useTeam();

	const [portal, setPortal] = useState<Portal>(initialPortal);
	const [user, setUser] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [touched, setTouched] = useState(false);
	const [phase, setPhase] = useState<Phase>({ kind: "form" });
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Tope de carpetas del plan y cuántas tiene ya (null = sin tope conocido o ilimitado).
	// Se consulta al hub: en el dashboard el plan no siempre está cargado en el store.
	const [planLimit, setPlanLimit] = useState<{ max: number; used: number } | null>(null);
	const maxFolders = planLimit?.max ?? null;
	useEffect(() => {
		let cancelled = false;
		ApiService.checkResourceLimit("folders", { headers: getRequestHeaders() })
			.then((r: any) => {
				const max = r?.data?.limit;
				if (!cancelled && r?.success && typeof max === "number" && max > 0 && max < 1000) {
					setPlanLimit({ max, used: Number(r.data.currentCount) || 0 });
				}
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const stopPolling = () => {
		if (pollRef.current) clearInterval(pollRef.current);
		pollRef.current = null;
	};
	useEffect(() => stopPolling, []);

	// Si ya tiene la cuenta de este portal conectada, no se ofrece el formulario.
	useEffect(() => {
		let cancelled = false;
		const service = portal === "pjn" ? pjnCredentialsService : scbaCredentialsService;
		(service.getCredentialsStatus() as Promise<any>)
			.then((r) => {
				if (!cancelled && r?.hasCredentials && r?.data && r.data.syncStatus !== "error") setPhase({ kind: "already" });
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
		};
	}, [portal]);

	const userClean = portal === "pjn" ? user.replace(/\D/g, "") : user.trim();
	const userError = (() => {
		if (!touched) return "";
		if (portal === "pjn") return /^\d{11}$/.test(userClean) ? "" : "El CUIL tiene 11 números";
		return /^\d{11}(@notificaciones\.scba\.gov\.ar)?$/.test(userClean) ? "" : "Tu CUIL o CUIL@notificaciones.scba.gov.ar";
	})();
	const passwordError = touched && !password ? "Escribí la contraseña del portal" : "";

	const refreshAfterSync = () => {
		const uid = authUser?._id || authUser?.id;
		if (uid) dispatch(getFoldersByUserId(uid, true) as any);
		onSynced?.();
	};

	const startPolling = () => {
		stopPolling();
		const startedAt = Date.now();
		const service = portal === "pjn" ? pjnCredentialsService : scbaCredentialsService;
		pollRef.current = setInterval(async () => {
			const elapsed = Date.now() - startedAt;
			try {
				const r: any = await service.getCredentialsStatus();
				const d = r?.data;
				if (d?.syncStatus === "completed") {
					stopPolling();
					const total =
						portal === "pjn"
							? d.stats?.totalCausasFound ?? d.foldersCreatedCount ?? 0
							: d.stats?.totalCausasFound ?? d.stats?.causasCreated ?? 0;
					if (portal === "pjn") dispatch(pjnSyncCompleted({ foldersCreated: d.foldersCreatedCount ?? total, newCausas: 0 }));
					else dispatch(scbaSyncCompleted({ foldersCreated: d.stats?.causasCreated ?? total, newCausas: 0 }));
					trackActivity("causa_link_success", {
						jurisdiction: portal,
						type: "account",
						mode: "connect",
						source: "primera_causa",
						count: total,
					});
					trackActivity("folder_create_complete", { mode: "connect", jurisdiction: portal, source: "primera_causa", count: total });
					refreshAfterSync();
					setPhase({ kind: "done", total });
					return;
				}
				if (d?.syncStatus === "error") {
					stopPolling();
					const notice = portal === "pjn" ? pjnStatusNotice(d) : scbaStatusNotice(d);
					const invalid = d.credentialInvalid === true || /credencial|contraseñ|usuario/i.test(notice || "");
					// Clave rechazada: el error se muestra en esta pantalla, así que se resetea el slice
					// en vez de marcar error (eso dispara además el aviso global y quedaba duplicado).
					if (invalid) dispatch(portal === "pjn" ? pjnSyncReset() : scbaSyncReset());
					else if (portal === "pjn") dispatch(pjnSyncError({ message: notice || "Error en la sincronización" }));
					else dispatch(scbaSyncError({ message: notice || "Error en la sincronización" }));
					trackActivity("causa_link_error", {
						jurisdiction: portal,
						type: "account",
						mode: "connect",
						source: "primera_causa",
						error_code: invalid ? "invalid_credentials" : "sync_error",
					});
					setPhase({
						kind: "error",
						invalidCredentials: invalid,
						// El texto del hub (pjnStatusNotice) está pensado para cuentas ya conectadas;
						// para el primer intento alcanza con uno corto.
						message: invalid
							? `El portal rechazó ${portal === "pjn" ? "el CUIL" : "el usuario"} o la contraseña. Revisalos y probá de nuevo.`
							: notice || "No pudimos traer tus causas. Probá de nuevo en un rato.",
					});
					return;
				}
				const p = d?.currentSyncProgress;
				const found = portal === "pjn" ? p?.totalExpected || d?.expectedCausasCount || 0 : p?.causasFound || 0;
				const done = portal === "pjn" ? p?.causasProcessed || d?.processedCausasCount || 0 : p?.causasProcessed || p?.causasCreated || 0;
				setPhase({ kind: "syncing", found, done, background: elapsed > BACKGROUND_AFTER_MS });
			} catch {
				/* reintenta en el próximo ciclo */
			}
			if (elapsed > STOP_POLL_AFTER_MS) stopPolling();
		}, POLL_INTERVAL_MS);
	};

	const handleSubmit = async () => {
		setTouched(true);
		const okUser = portal === "pjn" ? /^\d{11}$/.test(userClean) : /^\d{11}(@notificaciones\.scba\.gov\.ar)?$/.test(userClean);
		if (!okUser || !password) return;

		setPhase({ kind: "sending" });
		trackActivity("causa_link_start", { jurisdiction: portal, type: "account", mode: "connect", source: "primera_causa" });
		const r: any =
			portal === "pjn"
				? await pjnCredentialsService.linkCredentials(userClean, password)
				: await scbaCredentialsService.linkCredentials(userClean, password);

		if (!r?.success) {
			const maintenance = r?.code === "SCBA_MAINTENANCE";
			trackActivity("causa_link_error", {
				jurisdiction: portal,
				type: "account",
				mode: "connect",
				source: "primera_causa",
				error_code: maintenance ? "maintenance" : r?.code || "link_failed",
			});
			setPhase({
				kind: "error",
				invalidCredentials: false,
				message: maintenance
					? "El portal de la SCBA no está respondiendo ahora. Probá de nuevo en un rato."
					: r?.error || "No pudimos conectar tu cuenta. Probá de nuevo.",
			});
			return;
		}

		setPassword("");
		if (portal === "pjn") {
			dispatch(pjnSyncStarted({ progress: 0, message: "Sincronizando causas...", force: true }));
			dispatch(pjnCredentialsInvalidated());
		} else {
			dispatch(scbaSyncStarted({ progress: 0, message: "Sincronizando causas...", force: true }));
			dispatch(scbaCredentialsInvalidated());
		}
		setPhase({ kind: "syncing", found: 0, done: 0, background: false });
		startPolling();
	};

	// ── estilos ────────────────────────────────────────────────────────────────
	const border = `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`;
	const primaryBtn = {
		minHeight: 52,
		fontSize: "1rem",
		fontWeight: 600,
		borderRadius: 2,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		boxShadow: "none",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.9), boxShadow: "none" },
	};
	const stickyBar = {
		position: { xs: "sticky", sm: "static" } as any,
		bottom: 0,
		zIndex: 2,
		mx: { xs: -0.5, sm: 0 },
		pl: { xs: 0.5, sm: 0 },
		pr: { xs: "72px", sm: 0 },
		pt: 1.5,
		pb: { xs: "calc(12px + env(safe-area-inset-bottom))", sm: 0 },
		bgcolor: { xs: theme.palette.background.default, sm: "transparent" },
	};
	const portalName = portal === "pjn" ? "el PJN" : "la SCBA";
	const planLine =
		maxFolders !== null ? `Tu plan sigue ${maxFolders} causas: las demás quedan guardadas y se activan al pasar a un plan pago.` : null;

	const backLink = (
		<Button
			onClick={() => {
				stopPolling();
				onBack();
			}}
			startIcon={<ArrowLeft2 size={16} />}
			sx={{ textTransform: "none", color: "text.secondary", px: 0, minHeight: 40, mb: 1 }}
		>
			Cargar una causa por número
		</Button>
	);

	// ── estados de resultado ───────────────────────────────────────────────────
	if (phase.kind !== "form" && phase.kind !== "sending") {
		let icon: React.ReactNode;
		let title: string;
		let body: React.ReactNode;
		let actions: React.ReactNode;

		if (phase.kind === "syncing") {
			const pct = phase.found > 0 ? Math.min(100, Math.round((phase.done / phase.found) * 100)) : null;
			icon = phase.background ? (
				<Clock size={40} variant="Bulk" color={STALE_AMBER} />
			) : (
				<CircularProgress size={40} thickness={3} sx={{ color: BRAND_BLUE }} />
			);
			title = phase.background ? "Sigue trayendo tus causas" : `Conectando con ${portalName}…`;
			body = (
				<>
					<Typography color="text.secondary">
						{phase.found > 0
							? `Encontramos ${phase.found} causas · procesadas ${phase.done}`
							: "Entramos al portal con tu usuario y buscamos tus causas. Puede tardar unos minutos."}
					</Typography>
					{pct !== null && (
						<Box sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: alpha(BRAND_BLUE, 0.12), overflow: "hidden" }}>
							<Box sx={{ width: `${pct}%`, height: "100%", bgcolor: BRAND_BLUE, transition: "width .4s ease" }} />
						</Box>
					)}
					{phase.background && (
						<Typography color="text.secondary" sx={{ mt: 1.5 }}>
							Sigue en segundo plano: podés usar la app y te avisamos cuando termine.
						</Typography>
					)}
				</>
			);
			actions = phase.background ? (
				<Button fullWidth variant="contained" sx={primaryBtn} onClick={() => navigate("/apps/folders/list")}>
					Ver mis causas
				</Button>
			) : null;
		} else if (phase.kind === "done") {
			// Lugar libre en el plan al momento de conectar (las que ya tenía cuentan)
			const libres = planLimit ? Math.max(0, planLimit.max - planLimit.used) : null;
			const activas = libres !== null ? Math.min(phase.total, libres) : phase.total;
			const guardadas = Math.max(0, phase.total - activas);
			icon = <TickCircle size={40} variant="Bulk" color={LIVE_GREEN} />;
			title = phase.total > 0 ? `Listo: ${phase.total} ${phase.total === 1 ? "causa" : "causas"}` : "Cuenta conectada";
			body =
				phase.total === 0 ? (
					<Typography color="text.secondary">
						No encontramos causas en {portalName} con tu usuario. Cuando aparezca una nueva, la sumamos sola.
					</Typography>
				) : guardadas > 0 ? (
					<>
						<Typography sx={{ fontWeight: 600 }}>
							{activas} activas · {guardadas} guardadas
						</Typography>
						<Typography color="text.secondary" sx={{ mt: 0.5 }}>
							Te avisamos de cada movimiento en las activas. Las guardadas se activan al pasar a un plan pago.
						</Typography>
					</>
				) : (
					<Typography color="text.secondary">Ya las estamos siguiendo: te avisamos de cada movimiento nuevo.</Typography>
				);
			actions = (
				<>
					<Button
						fullWidth
						variant="contained"
						sx={primaryBtn}
						endIcon={<ArrowRight size={18} />}
						onClick={() => navigate("/apps/folders/list")}
					>
						Ver mis causas
					</Button>
					{guardadas > 0 && (
						<Button fullWidth sx={{ mt: 1, minHeight: 48, textTransform: "none" }} onClick={() => navigate("/suscripciones/tables")}>
							Ver planes
						</Button>
					)}
				</>
			);
		} else if (phase.kind === "already") {
			icon = <TickCircle size={40} variant="Bulk" color={LIVE_GREEN} />;
			title = `Tu cuenta de ${portalName} ya está conectada`;
			body = <Typography color="text.secondary">Tus causas se sincronizan solas.</Typography>;
			actions = (
				<Button fullWidth variant="contained" sx={primaryBtn} onClick={() => navigate("/apps/folders/list")}>
					Ver mis causas
				</Button>
			);
		} else {
			icon = <CloseCircle size={40} variant="Bulk" color={theme.palette.error.main} />;
			title = phase.invalidCredentials ? "No pudimos entrar al portal" : "No se pudo conectar";
			body = <Typography color="text.secondary">{phase.message}</Typography>;
			actions = (
				<Button fullWidth variant="contained" sx={primaryBtn} onClick={() => setPhase({ kind: "form" })}>
					{phase.invalidCredentials ? "Revisar usuario y contraseña" : "Volver a intentar"}
				</Button>
			);
		}

		return (
			<Box sx={{ pt: { xs: 1, sm: 1 }, pb: 4 }}>
				{phase.kind !== "syncing" && backLink}
				<Stack spacing={2} alignItems="flex-start">
					{icon}
					<Typography variant="h3" sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" }, fontWeight: 700, lineHeight: 1.2 }}>
						{title}
					</Typography>
					<Box sx={{ width: "100%" }}>{body}</Box>
					{actions && <Box sx={{ width: "100%", pt: 1 }}>{actions}</Box>}
				</Stack>
			</Box>
		);
	}

	// ── formulario ─────────────────────────────────────────────────────────────
	const sending = phase.kind === "sending";
	const inputSx = { "& .MuiInputBase-input": { fontSize: "1.1rem", py: 1.6 } };
	const submitButton = (
		<Button
			fullWidth
			variant="contained"
			sx={{ ...primaryBtn, minHeight: { xs: 52, sm: 56 } }}
			disabled={sending}
			onClick={handleSubmit}
			endIcon={sending ? <CircularProgress size={18} color="inherit" /> : <ArrowRight size={18} />}
		>
			{sending ? "Conectando…" : isSmUp ? "Conectar y traer mis causas" : "Traer mis causas"}
		</Button>
	);

	return (
		<Box sx={{ pt: { xs: 1, sm: 1 } }}>
			{backLink}
			<Typography variant="h3" sx={{ fontSize: { xs: "1.6rem", sm: "1.9rem" }, fontWeight: 700, lineHeight: 1.2 }}>
				Traé todas tus causas
			</Typography>
			<Typography color="text.secondary" sx={{ mt: 1, mb: { xs: 3, sm: 2.5 } }}>
				Conectamos tu cuenta del portal y las sumamos solas, con sus movimientos.
			</Typography>

			<Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, maxWidth: { sm: 420 } }}>
				{(
					[
						{ key: "pjn", label: "PJN", logo: logoPJNacion, logoBg: "#232D4F" },
						{ key: "scba", label: "SCBA", logo: logoMEV, logoBg: "#FFFFFF" },
					] as const
				).map((p) => {
					const active = p.key === portal;
					return (
						<ButtonBase
							key={p.key}
							disabled={sending}
							aria-pressed={active}
							onClick={() => {
								setPortal(p.key);
								setUser("");
								setTouched(false);
							}}
							sx={{
								gap: 1,
								minHeight: 56,
								borderRadius: 2,
								border: active ? `2px solid ${BRAND_BLUE}` : border,
								bgcolor: active ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.06) : theme.palette.background.paper,
							}}
						>
							<Box
								component="img"
								src={p.logo}
								alt=""
								sx={{ width: 28, height: 28, objectFit: "contain", borderRadius: 1, bgcolor: p.logoBg, p: 0.25 }}
							/>
							<Typography sx={{ fontWeight: active ? 700 : 500 }}>{p.label}</Typography>
						</ButtonBase>
					);
				})}
			</Box>

			<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: { xs: 2, sm: 1 }, mt: { xs: 3, sm: 2.5 } }}>
				<Box>
					<Typography sx={{ fontWeight: 600, mb: 1 }}>{portal === "pjn" ? "CUIL" : "Domicilio electrónico"}</Typography>
					<TextField
						fullWidth
						value={portal === "pjn" ? formatCuil(user) : user}
						onChange={(e) => setUser(portal === "pjn" ? e.target.value.replace(/\D/g, "").slice(0, 11) : e.target.value)}
						placeholder={portal === "pjn" ? "20-12345678-9" : "20123456789@notificaciones.scba.gov.ar"}
						inputProps={{
							inputMode: portal === "pjn" ? "numeric" : "email",
							autoComplete: "username",
							"aria-label": portal === "pjn" ? "CUIL" : "Domicilio electrónico",
						}}
						error={!!userError}
						helperText={userError || (portal === "scba" ? "O solo tu CUIL" : " ")}
						disabled={sending}
						sx={inputSx}
					/>
				</Box>
				<Box>
					<Typography sx={{ fontWeight: 600, mb: 1 }}>Contraseña del portal</Typography>
					<TextField
						fullWidth
						type={showPassword ? "text" : "password"}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						inputProps={{ autoComplete: "current-password", "aria-label": "Contraseña del portal" }}
						error={!!passwordError}
						helperText={passwordError || " "}
						disabled={sending}
						sx={inputSx}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSubmit();
						}}
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<IconButton
										aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
										onClick={() => setShowPassword((v) => !v)}
										edge="end"
									>
										{showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
									</IconButton>
								</InputAdornment>
							),
						}}
					/>
				</Box>
			</Box>

			<Stack spacing={1} sx={{ mt: 1 }}>
				<Stack direction="row" spacing={1} alignItems="flex-start">
					<Lock1 size={16} color={theme.palette.text.secondary as string} style={{ marginTop: 3, flexShrink: 0 }} />
					<Typography variant="body2" color="text.secondary">
						Se guarda cifrada y solo se usa para leer tus causas. Podés desconectarla cuando quieras.
					</Typography>
				</Stack>
				{planLine && (
					<Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
						{planLine}
					</Typography>
				)}
			</Stack>

			{isSmUp ? <Box sx={{ mt: 2.5, maxWidth: 420 }}>{submitButton}</Box> : <Box sx={stickyBar}>{submitButton}</Box>}
			<Box sx={{ mb: 4 }} />
		</Box>
	);
};

export default ConectarCuenta;
