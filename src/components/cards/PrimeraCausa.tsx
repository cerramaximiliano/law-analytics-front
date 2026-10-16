import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// material-ui
import { Box, Button, ButtonBase, CircularProgress, Link, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// icons
import { ArrowRight, CloseCircle, Clock, InfoCircle, SearchNormal1, TickCircle } from "iconsax-react";

// project-imports
import { dispatch } from "store";
import { addFolder, getFolderById } from "store/reducers/folder";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE, LIVE_GREEN, LIVE_PULSE_KEYFRAMES, STALE_AMBER } from "themes/dashboardTokens";
import { formatFolderName } from "utils/formatFolderName";
import { trackActivity } from "utils/productAnalytics";
import {
	OTHER_NUMBER_MAX_DIGITS,
	PJN_NUMBER_MAX_DIGITS,
	EXPEDIENTE_MIN_YEAR,
	isValidExpedienteNumber,
	isValidExpedienteYear,
	parseExpedienteInput,
} from "utils/expedienteInput";
import CausaSelector from "sections/apps/folders/CausaSelector";
import ConectarCuenta, { Portal } from "./ConectarCuenta";

// assets — mismos logos que el checklist
import logoPJNacion from "assets/images/logos/logo_pj_nacion.png";
import logoMEV from "assets/images/logos/logo_pj_buenos_aires.svg";
import logoPJCatamarca from "assets/images/logos/logo_pj_catamarca.png";
import logoPJMendoza from "assets/images/logos/logo_pj_mendoza.png";

const LOGO_EJE = "https://res.cloudinary.com/dqyoeolib/image/upload/v1770081495/ChatGPT_Image_2_feb_2026_09_44_56_p.m._ymi66g.png";
const LOGO_SALTA =
	"https://res.cloudinary.com/dqyoeolib/image/upload/v1779137783/ChatGPT_Image_18_may_2026__05_52_35_p.m.-removebg-preview_bngpqd.png";

// =============================================================================
// PRIMERA CAUSA — primer minuto después del registro (2026-10-13).
//
// Reemplaza al checklist mientras el usuario no tiene carpetas. Una sola acción:
// elegir el poder judicial, escribir número y año, y ver la causa encontrada.
// Sin credenciales: conectar la cuenta del portal se ofrece DESPUÉS del primer
// resultado. Origen: de 8 usuarios que abrían el modal de alta (7 en móvil) solo
// 2 lo completaban; el CTA del checklist llevaba a "Conectar mi cuenta" (CUIL +
// clave) en un diálogo que no entra en el teléfono.
// Ver la-ads/analysis/2026-10-13-primer-minuto-lectura-y-propuesta.md
// =============================================================================

type PowerKey = "pjn" | "eje" | "mev" | "pjsalta" | "pjmendoza" | "pjcatamarca";

interface Power {
	key: PowerKey;
	label: string;
	portal: string; // para el texto "Buscando en ..."
	logo: string;
	logoBg: string;
	iol?: boolean; // portales provinciales IOL: el verifier corre de 8 a 20 hs
}

const POWERS: Power[] = [
	{ key: "pjn", label: "Nación (PJN)", portal: "el Poder Judicial de la Nación", logo: logoPJNacion, logoBg: "#232D4F" },
	{ key: "eje", label: "CABA", portal: "el EJE de la Ciudad", logo: LOGO_EJE, logoBg: "#FFFFFF" },
	{ key: "mev", label: "Buenos Aires", portal: "la MEV", logo: logoMEV, logoBg: "#FFFFFF" },
	{ key: "pjsalta", label: "Salta", portal: "el Poder Judicial de Salta", logo: LOGO_SALTA, logoBg: "#FFFFFF", iol: true },
	{ key: "pjmendoza", label: "Mendoza", portal: "el Poder Judicial de Mendoza", logo: logoPJMendoza, logoBg: "#FFFFFF", iol: true },
	{ key: "pjcatamarca", label: "Catamarca", portal: "el Poder Judicial de Catamarca", logo: logoPJCatamarca, logoBg: "#FFFFFF", iol: true },
];

// Cámaras PJN habilitadas para el alta individual (mismas que automaticStep).
const PJN_FUEROS = [
	{ code: "1", label: "Civil", fuero: "Civil" },
	{ code: "7", label: "Trabajo", fuero: "Laboral" },
	{ code: "5", label: "Seg. social", fuero: "Seguridad Social" },
	{ code: "10", label: "Comercial", fuero: "Comercial" },
];

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

type Phase =
	| { kind: "form" }
	| { kind: "sending" }
	| { kind: "searching"; folder: any; timedOut: boolean }
	| { kind: "found"; folder: any }
	| { kind: "selection"; folder: any }
	| { kind: "not_found"; folder: any }
	| { kind: "error"; message: string };

// Estado de verificación de una carpeta (mismo criterio que details.tsx).
const folderOutcome = (folder: any): "found" | "selection" | "not_found" | "searching" => {
	const status = folder?.causaAssociationStatus;
	if (status === "pending_selection") return "selection";
	if (folder?.causaVerified === true && folder?.causaIsValid === true) return "found";
	if (status === "failed" || (folder?.causaVerified === true && folder?.causaIsValid === false)) return "not_found";
	return "searching";
};

interface PrimeraCausaProps {
	userName?: string;
	preferredJurisdiction?: string | null; // key del catálogo (pjn, eje, mev, ...)
	onExplore: () => void; // "Explorar primero": vuelve al dashboard con el checklist
	onFolderCreated?: () => void;
}

const PrimeraCausa: React.FC<PrimeraCausaProps> = ({ userName, preferredJurisdiction, onExplore, onFolderCreated }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	// En pantallas anchas el formulario se compacta (poderes en una fila, botón junto al año)
	// para que "Buscar mi causa" quede a la vista sin desplazarse.
	const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));
	const navigate = useNavigate();
	const { getUserIdForResource, getTeamIdForResource, getRequestHeaders } = useTeam();

	const initialPower = POWERS.find((p) => p.key === preferredJurisdiction)?.key || "pjn";
	const [power, setPower] = useState<PowerKey>(initialPower);
	const [pjnCode, setPjnCode] = useState<string>("");
	const [number, setNumber] = useState("");
	const [year, setYear] = useState("");
	const [touched, setTouched] = useState(false);
	const [phase, setPhase] = useState<Phase>({ kind: "form" });
	const [selectorOpen, setSelectorOpen] = useState(false);
	// Segundo modo: conectar la cuenta del portal (PJN o SCBA) y traer todas las causas.
	const [connectPortal, setConnectPortal] = useState<Portal | null>(null);
	const startedRef = useRef(false);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const selected = POWERS.find((p) => p.key === power)!;
	const currentYear = new Date().getFullYear();
	// PJN: ningún expediente válido supera los 6 dígitos (ver utils/expedienteInput.ts).
	const maxDigits = power === "pjn" ? PJN_NUMBER_MAX_DIGITS : OTHER_NUMBER_MAX_DIGITS;
	const numberError = touched && !isValidExpedienteNumber(number, maxDigits) ? `Solo números, hasta ${maxDigits} cifras` : "";
	const yearError = touched && !isValidExpedienteYear(year) ? `Año de 4 cifras, entre ${EXPEDIENTE_MIN_YEAR} y ${currentYear}` : "";
	const pjnError = touched && power === "pjn" && !pjnCode ? "Elegí el fuero" : "";
	const canSubmit = power !== "mev";

	// Primera interacción real (no al montar): así folder_create_start mide intención.
	const markStart = useCallback((jurisdiction: PowerKey) => {
		if (startedRef.current) return;
		startedRef.current = true;
		trackActivity("folder_create_start", { mode: "link", jurisdiction, source: "primera_causa" });
	}, []);

	const stopPolling = () => {
		if (pollRef.current) clearInterval(pollRef.current);
		pollRef.current = null;
	};
	useEffect(() => stopPolling, []);

	const settle = useCallback(
		(folder: any) => {
			const outcome = folderOutcome(folder);
			if (outcome === "searching") return false;
			stopPolling();
			if (outcome === "found") {
				trackActivity("causa_link_success", { jurisdiction: power, source: "primera_causa" });
				setPhase({ kind: "found", folder });
			} else if (outcome === "selection") {
				trackActivity("causa_link_success", { jurisdiction: power, source: "primera_causa", status: "pending_selection" });
				setPhase({ kind: "selection", folder });
			} else {
				trackActivity("causa_link_error", { jurisdiction: power, source: "primera_causa", error_code: "not_found" });
				setPhase({ kind: "not_found", folder });
			}
			return true;
		},
		[power],
	);

	const startPolling = useCallback(
		(folder: any) => {
			stopPolling();
			const startedAt = Date.now();
			setPhase({ kind: "searching", folder, timedOut: false });
			pollRef.current = setInterval(async () => {
				const res: any = await dispatch(getFolderById(folder._id, true));
				if (res?.success && res.folder && settle(res.folder)) return;
				if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
					stopPolling();
					trackActivity("causa_link_error", { jurisdiction: power, source: "primera_causa", error_code: "timeout" });
					setPhase({ kind: "searching", folder: res?.folder || folder, timedOut: true });
				}
			}, POLL_INTERVAL_MS);
		},
		[settle, power],
	);

	const handleSubmit = async () => {
		setTouched(true);
		markStart(power);
		if (!canSubmit) return;
		if (!isValidExpedienteNumber(number, maxDigits) || !isValidExpedienteYear(year)) return;
		if (power === "pjn" && !pjnCode) return;

		const userId = getUserIdForResource();
		const groupId = getTeamIdForResource();
		const base: Record<string, any> = {
			userId,
			...(groupId && { groupId }),
			folderName: "Pendiente",
			materia: "Sin definir",
			orderStatus: "Sin definir",
			status: "Nueva",
			source: "auto",
			entryMethod: "automatic",
			judicialPower: power,
			initialDateFolder: new Date().toLocaleDateString("es-AR"),
			expedientNumber: number,
			expedientYear: year,
		};
		let body: Record<string, any>;
		if (power === "pjn") {
			const f = PJN_FUEROS.find((x) => x.code === pjnCode)!;
			body = {
				...base,
				judicialPower: "nacional",
				pjn: true,
				pjnCode,
				folderJuris: pjnCode,
				folderJurisItem: pjnCode,
				folderFuero: f.fuero,
				description: "Expediente importado desde el Poder Judicial de la Nación",
			};
		} else if (power === "eje") {
			body = {
				...base,
				judicialPower: "caba",
				eje: true,
				ejeSearchType: "expediente",
				description: `Expediente importado desde EJE - Poder Judicial de la Ciudad de Buenos Aires (Expediente: ${number}/${year})`,
			};
		} else {
			const name = power === "pjsalta" ? "salta" : power === "pjmendoza" ? "mendoza" : "catamarca";
			body = {
				...base,
				judicialPower: name,
				[power]: true,
				[`${power}SearchType`]: "expediente",
				description: `Expediente importado desde ${selected.portal} (Expediente: ${number}/${year})`,
			};
		}

		setPhase({ kind: "sending" });
		const res: any = await dispatch(addFolder(body as any, { headers: getRequestHeaders() }));
		if (!res?.success || !res.folder) {
			trackActivity("causa_link_error", { jurisdiction: power, source: "primera_causa", error_code: "create_failed" });
			setPhase({ kind: "error", message: res?.message || "No pudimos cargar la causa. Probá de nuevo en un momento." });
			return;
		}
		trackActivity("folder_create_complete", { mode: "link", jurisdiction: power, source: "primera_causa" });
		onFolderCreated?.();
		if (!settle(res.folder)) startPolling(res.folder);
	};

	const reset = () => {
		stopPolling();
		setNumber("");
		setYear("");
		setTouched(false);
		setPhase({ kind: "form" });
	};

	// ── estilos compartidos ───────────────────────────────────────────────────
	const border = `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`;
	const shell = {
		width: "100%",
		maxWidth: { xs: 560, md: 860 },
		mx: "auto",
		px: { xs: 0.5, sm: 0 },
	};
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
	// En el teléfono el botón principal queda fijo abajo (no lo tapa el teclado
	// gracias a que el contenido es corto y el sticky respeta el safe-area).
	const stickyBar = {
		position: { xs: "sticky", sm: "static" } as any,
		bottom: 0,
		zIndex: 2,
		mx: { xs: -0.5, sm: 0 },
		pl: { xs: 0.5, sm: 0 },
		// deja libre la esquina del botón flotante de ayuda (56 px + margen)
		pr: { xs: "72px", sm: 0 },
		pt: 1.5,
		pb: { xs: "calc(12px + env(safe-area-inset-bottom))", sm: 0 },
		bgcolor: { xs: theme.palette.background.default, sm: "transparent" },
	};

	// ── conectar cuenta ───────────────────────────────────────────────────────
	if (connectPortal) {
		return (
			<Box sx={{ ...shell, pt: { xs: 2, sm: 2 } }}>
				<ConectarCuenta initialPortal={connectPortal} onBack={() => setConnectPortal(null)} onSynced={onFolderCreated} />
			</Box>
		);
	}
	const openConnect = (p: Portal) => {
		stopPolling();
		setPhase({ kind: "form" });
		setConnectPortal(p);
	};

	// ── resultado ─────────────────────────────────────────────────────────────
	if (phase.kind !== "form" && phase.kind !== "sending") {
		const folder = (phase as any).folder;
		const caratula = folder?.folderName && folder.folderName !== "Pendiente" ? formatFolderName(folder.folderName) : null;
		const goToFolder = () => folder?._id && navigate(`/apps/folders/details/${folder._id}`);

		let icon: React.ReactNode;
		let title: string;
		let body: React.ReactNode;
		let actions: React.ReactNode;

		if (phase.kind === "found") {
			icon = <TickCircle size={40} variant="Bulk" color={LIVE_GREEN} />;
			title = "La encontramos";
			body = (
				<>
					{caratula && (
						<Typography sx={{ fontWeight: 600, fontSize: "1.05rem", lineHeight: 1.35, wordBreak: "break-word" }}>{caratula}</Typography>
					)}
					<Typography color="text.secondary" sx={{ mt: 1 }}>
						Ya la estamos siguiendo: te avisamos de cada movimiento nuevo.
					</Typography>
				</>
			);
			actions = (
				<>
					<Button fullWidth variant="contained" sx={primaryBtn} endIcon={<ArrowRight size={18} />} onClick={goToFolder}>
						Ver la causa y sus movimientos
					</Button>
					{power === "pjn" || power === "mev" ? (
						<Box sx={{ mt: 2, p: 2, borderRadius: 2, border, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04) }}>
							<Typography sx={{ fontWeight: 600 }}>¿Tenés más causas en {power === "pjn" ? "el PJN" : "la Provincia"}?</Typography>
							<Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
								Conectá tu cuenta del portal y traemos todas juntas, sin cargarlas una por una.
							</Typography>
							<Button
								sx={{ mt: 1.5, textTransform: "none", fontWeight: 600, minHeight: 44, px: 0 }}
								onClick={() => openConnect(power === "pjn" ? "pjn" : "scba")}
								endIcon={<ArrowRight size={16} />}
							>
								Conectar mi cuenta
							</Button>
						</Box>
					) : (
						<Button fullWidth sx={{ mt: 1, minHeight: 48, textTransform: "none" }} onClick={reset}>
							Cargar otra causa
						</Button>
					)}
				</>
			);
		} else if (phase.kind === "selection") {
			icon = <SearchNormal1 size={40} variant="Bulk" color={BRAND_BLUE} />;
			title = "Hay más de una causa con ese número";
			body = <Typography color="text.secondary">Elegí la tuya de la lista y la empezamos a seguir.</Typography>;
			actions = (
				<Button fullWidth variant="contained" sx={primaryBtn} onClick={() => setSelectorOpen(true)}>
					Elegir mi causa
				</Button>
			);
		} else if (phase.kind === "not_found") {
			icon = <CloseCircle size={40} variant="Bulk" color={theme.palette.error.main} />;
			title = "No la encontramos";
			body = (
				<Typography color="text.secondary">
					No aparece en {selected.portal} o no es de acceso público. Revisá el número y el año
					{power === "pjn" ? ", y el fuero" : ""}.
				</Typography>
			);
			actions = (
				<>
					<Button fullWidth variant="contained" sx={primaryBtn} onClick={reset}>
						Probar con otro número
					</Button>
					{power === "pjn" && (
						<Button fullWidth sx={{ mt: 1, minHeight: 48, textTransform: "none" }} onClick={() => openConnect("pjn")}>
							Es reservada: conectar mi cuenta del PJN
						</Button>
					)}
				</>
			);
		} else if (phase.kind === "searching") {
			icon = phase.timedOut ? (
				<Clock size={40} variant="Bulk" color={STALE_AMBER} />
			) : (
				<Box sx={{ position: "relative", width: 40, height: 40, display: "grid", placeItems: "center" }}>
					<CircularProgress size={40} thickness={3} sx={{ color: BRAND_BLUE }} />
				</Box>
			);
			title = phase.timedOut ? "Sigue buscando" : `Buscando en ${selected.portal}…`;
			body = (
				<Typography color="text.secondary">
					{phase.timedOut
						? selected.iol
							? "El portal provincial se consulta de 8 a 20 hs. Te avisamos apenas aparezca; podés seguir usando la app."
							: "Está tardando más de lo habitual. Te avisamos apenas aparezca; podés seguir usando la app."
						: "Suele tardar menos de un minuto. No hace falta que hagas nada."}
				</Typography>
			);
			actions = phase.timedOut ? (
				<>
					<Button fullWidth variant="contained" sx={primaryBtn} onClick={goToFolder}>
						Ver la carpeta
					</Button>
					<Button fullWidth sx={{ mt: 1, minHeight: 48, textTransform: "none" }} onClick={onExplore}>
						Explorar la app mientras tanto
					</Button>
				</>
			) : (
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						color: "text.secondary",
						fontSize: "0.85rem",
						"@keyframes la-pulse": LIVE_PULSE_KEYFRAMES,
					}}
				>
					<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: LIVE_GREEN, animation: "la-pulse 1.6s ease-in-out infinite" }} />
					Expediente {number}/{year}
				</Box>
			);
		} else {
			icon = <InfoCircle size={40} variant="Bulk" color={theme.palette.error.main} />;
			title = "No pudimos cargarla";
			body = <Typography color="text.secondary">{phase.message}</Typography>;
			actions = (
				<Button fullWidth variant="contained" sx={primaryBtn} onClick={() => setPhase({ kind: "form" })}>
					Volver a intentar
				</Button>
			);
		}

		return (
			<Box sx={{ ...shell, pt: { xs: 3, sm: 5 }, pb: 4 }}>
				<Stack spacing={2} alignItems="flex-start">
					{icon}
					<Typography variant="h3" sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" }, fontWeight: 700, lineHeight: 1.2 }}>
						{title}
					</Typography>
					<Box sx={{ width: "100%" }}>{body}</Box>
					<Box sx={{ width: "100%", pt: 1 }}>{actions}</Box>
				</Stack>
				{phase.kind === "selection" && folder?._id && (
					<CausaSelector
						open={selectorOpen}
						onClose={() => setSelectorOpen(false)}
						folderId={folder._id}
						folderName={folder.folderName || ""}
						onCausaSelected={() => {
							setSelectorOpen(false);
							startPolling(folder);
						}}
						onSelectionCancelled={() => setSelectorOpen(false)}
					/>
				)}
			</Box>
		);
	}

	// ── formulario ────────────────────────────────────────────────────────────
	const sending = phase.kind === "sending";
	const inputSx = { "& .MuiInputBase-input": { fontSize: "1.15rem", py: 1.75 } };
	const submitButton = (
		<Button
			fullWidth
			variant="contained"
			sx={{ ...primaryBtn, minHeight: { xs: 52, sm: 58 } }}
			disabled={sending}
			onClick={handleSubmit}
			endIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SearchNormal1 size={18} />}
		>
			{sending ? "Buscando…" : "Buscar mi causa"}
		</Button>
	);

	return (
		<Box sx={{ ...shell, pt: { xs: 2, sm: 2 } }}>
			<Typography variant="h3" sx={{ fontSize: { xs: "1.6rem", sm: "1.9rem" }, fontWeight: 700, lineHeight: 1.2 }}>
				{userName ? `${userName}, ¿qué causa querés seguir?` : "¿Qué causa querés seguir?"}
			</Typography>
			<Typography color="text.secondary" sx={{ mt: 1 }}>
				Con el número la encontramos en el portal y te avisamos de cada movimiento. Sin claves ni contraseñas.
			</Typography>
			<Link
				component="button"
				underline="hover"
				onClick={() => openConnect("pjn")}
				sx={{ mt: 1, mb: { xs: 3, sm: 2.5 }, display: "block", fontWeight: 500, color: BRAND_BLUE, textAlign: "left", lineHeight: 1.5 }}
			>
				¿Usás el portal del PJN o la SCBA? Traé todas tus causas de una vez <ArrowRight size={15} style={{ verticalAlign: "-2px" }} />
			</Link>

			{/* Poder judicial: grilla 3x2 de botones grandes (dedo), sin desplegables */}
			<Typography sx={{ fontWeight: 600, mb: 1 }}>¿Dónde tramita?</Typography>
			<Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, 1fr)", md: "repeat(6, 1fr)" }, gap: 1 }}>
				{POWERS.map((p) => {
					const active = p.key === power;
					return (
						<ButtonBase
							key={p.key}
							disabled={sending}
							onClick={() => {
								setPower(p.key);
								markStart(p.key);
							}}
							aria-pressed={active}
							sx={{
								flexDirection: "column",
								gap: 0.75,
								py: 1.5,
								px: 0.5,
								minHeight: { xs: 84, md: 76 },
								borderRadius: 2,
								border: active ? `2px solid ${BRAND_BLUE}` : border,
								bgcolor: active ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.06) : theme.palette.background.paper,
								transition: "border-color .15s, background-color .15s",
							}}
						>
							<Box
								component="img"
								src={p.logo}
								alt=""
								sx={{ width: 32, height: 32, objectFit: "contain", borderRadius: 1, bgcolor: p.logoBg, p: 0.25 }}
							/>
							<Typography sx={{ fontSize: "0.8rem", fontWeight: active ? 700 : 500, lineHeight: 1.15, textAlign: "center" }}>
								{p.label}
							</Typography>
						</ButtonBase>
					);
				})}
			</Box>

			{power === "mev" ? (
				<Box sx={{ mt: 3, p: 2, borderRadius: 2, border }}>
					<Typography sx={{ fontWeight: 600 }}>En la Provincia hace falta tu usuario del portal</Typography>
					<Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
						La MEV y la SCBA no muestran expedientes sin usuario. Conectá tu cuenta y traemos tus causas, o cargá una con tu usuario de la
						MEV.
					</Typography>
					<Stack spacing={1} sx={{ mt: 2 }}>
						<Button fullWidth variant="contained" sx={primaryBtn} onClick={() => openConnect("scba")} endIcon={<ArrowRight size={18} />}>
							Conectar mi cuenta SCBA
						</Button>
						<Button
							fullWidth
							sx={{ minHeight: 48, textTransform: "none" }}
							onClick={() => navigate("/apps/folders/list?onboarding=true&action=create&jurisdiction=MEV")}
						>
							Cargar una causa con mi usuario de la MEV
						</Button>
					</Stack>
				</Box>
			) : (
				<>
					{power === "pjn" && (
						<>
							<Typography sx={{ fontWeight: 600, mt: { xs: 3, sm: 2.5 }, mb: 1 }}>Fuero</Typography>
							<Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1 }}>
								{PJN_FUEROS.map((f) => {
									const active = f.code === pjnCode;
									return (
										<ButtonBase
											key={f.code}
											disabled={sending}
											onClick={() => {
												setPjnCode(f.code);
												markStart("pjn");
											}}
											aria-pressed={active}
											sx={{
												minHeight: 48,
												borderRadius: 2,
												border: active ? `2px solid ${BRAND_BLUE}` : border,
												bgcolor: active ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.06) : theme.palette.background.paper,
												fontSize: "0.95rem",
												fontWeight: active ? 700 : 500,
											}}
										>
											{f.label}
										</ButtonBase>
									);
								})}
							</Box>
							{pjnError && (
								<Typography color="error" variant="caption" sx={{ mt: 0.5, display: "block" }}>
									{pjnError}
								</Typography>
							)}
						</>
					)}

					<Typography sx={{ fontWeight: 600, mt: { xs: 3, sm: 2.5 }, mb: 1 }}>Número de expediente</Typography>
					<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1.6fr 1fr", sm: "1.4fr 1fr 1.4fr" }, gap: 1, alignItems: "start" }}>
						<TextField
							value={number}
							onChange={(e) => {
								// Si pegan "69520/15" o "CNT 40791/2026", separamos número y año en vez de
								// fusionarlos (antes la barra se descartaba en silencio → "6952015").
								const parsed = parseExpedienteInput(e.target.value, maxDigits);
								setNumber(parsed.number);
								if (parsed.split) {
									if (parsed.year) setYear(parsed.year);
									trackActivity("expediente_input_split", {
										jurisdiction: power,
										source: "primera_causa",
										mode: parsed.year ? "number_year" : "number_only",
										count: parsed.number.length,
									});
								}
								markStart(power);
							}}
							placeholder="Ej. 45218"
							inputProps={{ inputMode: "numeric", pattern: "[0-9]*", "aria-label": "Número", autoComplete: "off" }}
							error={!!numberError}
							helperText={numberError || "Número (o número/año)"}
							disabled={sending}
							sx={inputSx}
						/>
						<TextField
							value={year}
							onChange={(e) => {
								setYear(e.target.value.replace(/\D/g, "").slice(0, 4));
								markStart(power);
							}}
							placeholder={String(currentYear - 1)}
							inputProps={{ inputMode: "numeric", pattern: "[0-9]*", "aria-label": "Año", autoComplete: "off" }}
							error={!!yearError}
							helperText={yearError || "Año"}
							disabled={sending}
							sx={inputSx}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSubmit();
							}}
						/>
						{isSmUp && submitButton}
					</Box>
					{selected.iol && (
						<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
							Si el mismo número existe en varios juzgados, te mostramos la lista para que elijas.
						</Typography>
					)}
				</>
			)}

			{canSubmit && !isSmUp && <Box sx={stickyBar}>{submitButton}</Box>}

			<Stack
				direction={{ xs: "column", sm: "row" }}
				spacing={{ xs: 1.5, sm: 3 }}
				alignItems="center"
				justifyContent="center"
				sx={{ mt: { xs: 3, sm: 2.5 }, mb: 4 }}
			>
				<Link
					component="button"
					underline="hover"
					color="text.secondary"
					onClick={() => navigate("/apps/folders/list?onboarding=true&action=create")}
				>
					Prefiero cargarla a mano
				</Link>
				<Link component="button" underline="hover" color="text.secondary" onClick={onExplore}>
					Explorar la app primero
				</Link>
			</Stack>
		</Box>
	);
};

export default PrimeraCausa;
