import React from "react";
import { useNavigate } from "react-router-dom";
import { alpha, Box, ButtonBase, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { Lock1 } from "iconsax-react";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";
import {
	getPjnBindingState,
	PJN_BINDING_COPY,
	PJN_BINDING_LABEL,
	pjnCredErrorCopy,
	pjnFailedCopy,
	PJN_PROFILE_PATH,
} from "utils/pjnBindingState";
import { getScbaBindingState, SCBA_BINDING_COPY, SCBA_BINDING_LABEL, SCBA_PROFILE_PATH } from "utils/scbaBindingState";
import { MEV_CRED_LABEL, MEV_CRED_MESSAGE, MEV_PROFILE_PATH, mevCredIssue } from "utils/mevCredential";
// Logos de portal: URLs de Cloudinary para PJN / EJE / PJ Salta y archivos locales para
// SCBA+MEV (comparten el logo de Buenos Aires) / PJ Catamarca / PJ Mendoza.
import logoPJBuenosAires from "assets/images/logos/logo_pj_buenos_aires.svg";
import logoPJCatamarca from "assets/images/logos/logo_pj_catamarca.png";
import logoPJMendoza from "assets/images/logos/logo_pj_mendoza.png";

const PJN_LOGO_URL = "https://res.cloudinary.com/dqyoeolib/image/upload/v1746884259/xndhymcmzv3kk0f62v0y.png";
const EJE_LOGO_URL = "https://res.cloudinary.com/dqyoeolib/image/upload/v1770081495/ChatGPT_Image_2_feb_2026_09_44_56_p.m._ymi66g.png";
const PJSALTA_LOGO_URL =
	"https://res.cloudinary.com/dqyoeolib/image/upload/v1779137783/ChatGPT_Image_18_may_2026__05_52_35_p.m.-removebg-preview_bngpqd.png";

/**
 * Ícono del portal de la carpeta con el estado de vinculación superpuesto. Compartido por la card
 * mobile y la celda Carátula del desktop (2026-09-29) y ÚNICA señal de estado de la fila: los
 * íconos sueltos que antes iban a la derecha de la carátula (credencial rechazada, reservada,
 * revocada, fuera del listado, credencial MEV) se quitaron por redundantes; su tooltip y su
 * acción viven acá.
 *
 * Tamaño (accesibilidad): logo 28 px en desktop / 32 px en mobile; indicador 16/18 px con glifo
 * propio por estado (tilde, advertencia, candado) para no depender solo del color. En mobile el
 * área táctil es de 44 px (mínimo del theme para IconButton) y el tooltip abre al tocar.
 */
export function FolderSourceBadge({
	folder,
	pjnCredErrorActive,
	scbaCredErrorActive,
	showLabel = false,
	onActivate,
}: {
	folder: any;
	pjnCredErrorActive: boolean;
	scbaCredErrorActive: boolean;
	/** Detalle de carpeta: etiqueta corta a la izquierda del badge cuando el estado requiere atención. */
	showLabel?: boolean;
	/** Acción propia del contexto (ej. desvincular en el detalle); tiene prioridad sobre la ruta del estado. */
	onActivate?: (kind: string) => void;
}) {
	const theme = useTheme();
	const navigate = useNavigate();
	const mobile = useMediaQuery(theme.breakpoints.down("sm"));
	const sourceKind = folder.pjn
		? "pjn"
		: folder.mev
		? "mev"
		: folder.eje
		? "eje"
		: folder.scba
		? "scba"
		: folder.pjsalta
		? "pjsalta"
		: folder.pjcatamarca
		? "pjcatamarca"
		: folder.pjmendoza
		? "pjmendoza"
		: null;
	const sourceMeta: { label: string; logo: string; bg: string } | null = !sourceKind
		? null
		: sourceKind === "pjn"
		? { label: "PJN", logo: PJN_LOGO_URL, bg: "#222E43" }
		: sourceKind === "scba" || sourceKind === "mev"
		? { label: sourceKind === "scba" ? "SCBA" : "MEV", logo: logoPJBuenosAires, bg: "#f8f8f8" }
		: sourceKind === "eje"
		? { label: "EJE", logo: EJE_LOGO_URL, bg: "#ffffff" }
		: sourceKind === "pjsalta"
		? { label: "PJ Salta", logo: PJSALTA_LOGO_URL, bg: "#ffffff" }
		: sourceKind === "pjcatamarca"
		? { label: "PJ Catamarca", logo: logoPJCatamarca, bg: "#ffffff" }
		: { label: "PJ Mendoza", logo: logoPJMendoza, bg: "#ffffff" };
	type Glyph = "ok" | "warn" | "lock";
	type Status = { accent: string; tooltip: string; glyph: Glyph; to?: string; label?: string };
	const st = (accent: string, tooltip: string, glyph: Glyph, to?: string, label?: string): Status => ({
		accent,
		tooltip,
		glyph,
		to,
		label,
	});
	// "PJN — Pendiente de verificación" → "Pendiente de verificación" (las etiquetas largas llevan la fuente como prefijo).
	const short = (l: string) => l.replace(/^PJ? ?[A-Za-z]* — |^[A-Z][A-Za-z ]* — /, "");
	const RED = theme.palette.error.main;
	const sourceStatus: Status | null = !sourceKind
		? null
		: sourceKind === "pjn"
		? (() => {
				const state = getPjnBindingState(folder, { credError: pjnCredErrorActive });
				if (state === "ok") return st(LIVE_GREEN, PJN_BINDING_COPY.ok, "ok");
				// Credencial rechazada: copy por carpeta (pública sigue / reservada no); lleva al perfil.
				if (state === "cred_error")
					return st(STALE_AMBER, pjnCredErrorCopy(folder), "warn", PJN_PROFILE_PATH, short(PJN_BINDING_LABEL.cred_error));
				if (state === "reserved_covered") return st(LIVE_GREEN, PJN_BINDING_COPY.reserved_covered, "lock");
				if (state === "revoked") return st(STALE_AMBER, PJN_BINDING_COPY.revoked, "lock", undefined, short(PJN_BINDING_LABEL.revoked));
				if (state === "reserved") return st(RED, PJN_BINDING_COPY.reserved, "warn", undefined, short(PJN_BINDING_LABEL.reserved));
				if (state === "failed")
					return st(RED, pjnFailedCopy(folder) || "Vinculación fallida", "warn", undefined, short(PJN_BINDING_LABEL.failed));
				return st(
					STALE_AMBER,
					(state && PJN_BINDING_COPY[state]) || "Requiere atención",
					"warn",
					undefined,
					state ? short(PJN_BINDING_LABEL[state]) : "Requiere atención",
				);
		  })()
		: sourceKind === "scba"
		? (() => {
				const state = getScbaBindingState(folder, { credError: scbaCredErrorActive });
				if (state !== "ok")
					return st(
						STALE_AMBER,
						(state && SCBA_BINDING_COPY[state]) || "Requiere atención",
						"warn",
						state === "cred_error" ? SCBA_PROFILE_PATH : undefined,
						state ? short(SCBA_BINDING_LABEL[state]) : "Requiere atención",
					);
				// Auditoría 2026-10-16: con la credencial y la lista en orden, el ícono quedaba verde
				// aunque la Carátula dijera "Seleccionar expediente", "Asociación fallida" o
				// "Pendiente de verificación". Misma cadena que el resto de las jurisdicciones.
				if (folder.causaAssociationStatus === "pending_selection")
					return st(STALE_AMBER, "Elegí el expediente correcto", "warn", undefined, "Elegir expediente");
				if (folder.causaAssociationStatus === "failed" || (folder.causaVerified === true && folder.causaIsValid === false))
					return st(
						RED,
						folder.causaAssociationError ? `Vinculación fallida: ${folder.causaAssociationError}` : "Vinculación fallida",
						"warn",
						undefined,
						"Vinculación fallida",
					);
				if (folder.causaVerified !== true)
					return st(STALE_AMBER, "Verificando la causa en el portal", "warn", undefined, "Pendiente de verificación");
				return st(LIVE_GREEN, SCBA_BINDING_COPY.ok, "ok");
		  })()
		: sourceKind === "mev"
		? (() => {
				const issue = mevCredIssue(folder);
				if (issue) return st(STALE_AMBER, MEV_CRED_MESSAGE[issue] || "Requiere atención", "warn", MEV_PROFILE_PATH, MEV_CRED_LABEL[issue]);
				// Auditoría 2026-10-16: pendiente, selección múltiple y "ya no en la lista" quedaban en
				// verde aunque la Carátula mostrara el chip correspondiente (T20: selección antes que lista).
				if (folder.causaAssociationStatus === "pending_selection")
					return st(STALE_AMBER, "Elegí el expediente correcto", "warn", undefined, "Elegir expediente");
				if (folder.source === "mev-login" && folder.listRemoved === true && folder.listRemovedSource === "mev")
					return st(
						STALE_AMBER,
						"Esta causa ya no aparece en tu lista de Mis Causas del portal MEV. Puede haber sido archivada o desvinculada por el tribunal.",
						"warn",
						undefined,
						"Ya no en la lista",
					);
				if (folder.causaAssociationStatus === "failed" || (folder.causaVerified === true && folder.causaIsValid === false))
					return st(
						RED,
						folder.causaAssociationError ? `Vinculación fallida: ${folder.causaAssociationError}` : "Vinculación fallida",
						"warn",
						undefined,
						"Vinculación fallida",
					);
				if (folder.causaVerified !== true)
					return st(STALE_AMBER, "Verificando la causa en el portal", "warn", undefined, "Pendiente de verificación");
				return st(LIVE_GREEN, "Vinculado con MEV", "ok");
		  })()
		: folder.causaAssociationStatus === "pending_selection"
		? st(STALE_AMBER, "Elegí el expediente correcto", "warn", undefined, "Elegir expediente")
		: folder.listRemoved === true && ["pjsalta", "pjcatamarca", "pjmendoza"].includes(folder.listRemovedSource || "")
		? st(
				STALE_AMBER,
				`El expediente dejó de aparecer en el portal del ${sourceMeta?.label}. Puede haber sido archivado, reservado o movido de organismo.`,
				"warn",
				undefined,
				"Ya no en el portal",
		  )
		: folder.causaAssociationStatus === "failed" || (folder.causaVerified === true && folder.causaIsValid === false)
		? st(
				RED,
				folder.causaAssociationError ? `Vinculación fallida: ${folder.causaAssociationError}` : "Vinculación fallida",
				"warn",
				undefined,
				"Vinculación fallida",
		  )
		: folder.causaVerified !== true
		? st(STALE_AMBER, "Verificando la causa en el portal", "warn", undefined, "Pendiente de verificación")
		: st(LIVE_GREEN, `Vinculado con ${sourceMeta?.label}`, "ok");
	if (!sourceMeta) return null;

	const logo = mobile ? 32 : 28;
	const dot = mobile ? 20 : 18;
	const glyph = mobile ? 12 : 11;
	// Glifos de trazo simple: a este tamaño los íconos rellenos (TickCircle/Warning2 Bold) se
	// leen como una mancha blanca. El candado sí se distingue relleno.
	const glyphEl =
		sourceStatus?.glyph === "lock" ? (
			<Lock1 size={glyph} variant="Bold" color="#fff" />
		) : sourceStatus?.glyph === "ok" ? (
			<svg width={glyph} height={glyph} viewBox="0 0 12 12" aria-hidden>
				<path d="M2.6 6.3l2.2 2.2 4.6-4.9" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		) : (
			<svg width={glyph} height={glyph} viewBox="0 0 12 12" aria-hidden>
				<path d="M6 2.4v4.4" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
				<circle cx="6" cy="9.4" r="1.2" fill="#fff" />
			</svg>
		);
	const kindAction = !!onActivate && !!sourceStatus && !sourceStatus.to;
	const clickable = !!sourceStatus?.to || kindAction;
	const accion = clickable ? (mobile ? " · Tocá para resolverlo" : " · Clic para resolverlo") : "";
	const titulo = sourceStatus ? `${sourceMeta.label} — ${sourceStatus.tooltip}${accion}` : sourceMeta.label;
	const badge = (
		<Tooltip title={titulo} enterTouchDelay={0} leaveTouchDelay={5000}>
			<ButtonBase
				aria-label={titulo}
				onClick={(e) => {
					e.stopPropagation();
					if (sourceStatus?.to) navigate(sourceStatus.to);
					else if (kindAction && sourceKind) onActivate?.(sourceKind);
				}}
				sx={{
					position: "relative",
					flexShrink: 0,
					borderRadius: "50%",
					// Área táctil: 44 px en mobile (WCAG 2.5.5 / mínimo del theme), 32 px en desktop.
					minWidth: mobile ? 44 : 32,
					minHeight: mobile ? 44 : 32,
					m: mobile ? -0.75 : -0.25,
					cursor: clickable ? "pointer" : "default",
					"&:focus-visible": { outline: `2px solid ${BRAND_BLUE}`, outlineOffset: 1 },
				}}
			>
				<Box sx={{ position: "relative", display: "inline-flex" }}>
					<Box
						sx={{
							width: logo,
							height: logo,
							borderRadius: "50%",
							overflow: "hidden",
							bgcolor: sourceMeta.bg,
							border: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.4 : 0.25)}`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Box component="img" src={sourceMeta.logo} alt="" sx={{ width: "74%", height: "74%", objectFit: "contain" }} />
					</Box>
					{sourceStatus && (
						<Box
							aria-hidden
							sx={{
								position: "absolute",
								bottom: -3,
								right: -4,
								width: dot,
								height: dot,
								borderRadius: "50%",
								bgcolor: sourceStatus.accent,
								border: `2px solid ${theme.palette.background.paper}`,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{glyphEl}
						</Box>
					)}
				</Box>
			</ButtonBase>
		</Tooltip>
	);
	const etiqueta = showLabel && sourceStatus?.label ? sourceStatus.label : null;
	if (!etiqueta) return badge;
	const acc = sourceStatus!.accent;
	return (
		<Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25 }}>
			<Box
				data-testid="folder-source-label"
				sx={{
					display: "inline-flex",
					alignItems: "center",
					height: 32,
					px: 1.25,
					borderRadius: 1,
					fontSize: "0.74rem",
					fontWeight: 600,
					letterSpacing: "-0.005em",
					whiteSpace: "nowrap",
					color: acc,
					bgcolor: alpha(acc, theme.palette.mode === "dark" ? 0.14 : 0.08),
					border: `1px solid ${alpha(acc, theme.palette.mode === "dark" ? 0.32 : 0.22)}`,
				}}
			>
				{etiqueta}
			</Box>
			{badge}
		</Box>
	);
}
