/**
 * Banner contextual que avisa al usuario que el portal del PJN está en
 * mantenimiento. Se monta en páginas/modales donde el usuario podría
 * intentar sincronizar o vincular causas — fuera de esos contextos no
 * tiene por qué aparecer.
 *
 * Diseño brand-aware:
 *  - Container tintado ámbar con live-dot pulsante (mismo patrón del banner
 *    "Pendientes/Inválidas" de /apps/folders/list).
 *  - Collapse por defecto: muestra solo título + fecha de inicio +
 *    contextHint (la info accionable). El detalle (descripción genérica +
 *    cita literal del PJN) se expande con un toggle "Ver más".
 *  - Pensado para encajar en modales/steppers sin forzar scroll.
 */

import { useState } from "react";
import { Box, Collapse, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ArrowDown2 } from "iconsax-react";
import { usePjnSiteStatus } from "hooks/usePjnSiteStatus";
import { STALE_AMBER, LIVE_PULSE_KEYFRAMES } from "themes/dashboardTokens";

interface PjnMaintenanceAlertProps {
	/** Variante compacta — padding y typography más sutiles. Útil dentro de modales. */
	compact?: boolean;
	/** Texto adicional sobre qué acción específica está bloqueada en este contexto. */
	contextHint?: string;
	/** Si true, arranca expandido (con detalle visible). Por defecto false. */
	defaultExpanded?: boolean;
	/** Margen extra opcional. */
	sx?: object;
}

// Formato corto y legible: "16 may · 09:46". 24h evita "a. m. / p. m." que
// rompe el rítmo tipográfico.
function formatSince(iso: string | null): string {
	if (!iso) return "—";
	try {
		const date = new Date(iso);
		const fechaParte = date.toLocaleDateString("es-AR", {
			timeZone: "America/Argentina/Buenos_Aires",
			day: "2-digit",
			month: "short",
		});
		const horaParte = date.toLocaleTimeString("es-AR", {
			timeZone: "America/Argentina/Buenos_Aires",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		return `${fechaParte.replace(/\.$/, "")} · ${horaParte}`;
	} catch {
		return iso;
	}
}

const PjnMaintenanceAlert = ({ compact = false, contextHint, defaultExpanded = false, sx }: PjnMaintenanceAlertProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { isInMaintenance, maintenanceSince, message } = usePjnSiteStatus();
	const [expanded, setExpanded] = useState(defaultExpanded);

	if (!isInMaintenance) return null;

	const since = formatSince(maintenanceSince);
	// Si no hay nada que expandir (ni mensaje PJN), no mostramos el toggle.
	const hasExpandable = Boolean(message);

	return (
		<Box
			role="status"
			aria-live="polite"
			sx={{
				position: "relative",
				overflow: "hidden",
				borderRadius: 1.5,
				border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
				bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.05),
				px: compact ? { xs: 1.5, sm: 1.75 } : { xs: 2, sm: 2.5 },
				py: compact ? { xs: 1.25, sm: 1.5 } : { xs: 1.5, sm: 1.75 },
				...LIVE_PULSE_KEYFRAMES,
				...sx,
			}}
		>
			<Stack direction="row" spacing={1.5} alignItems="flex-start">
				{/* Dot ámbar con pulso */}
				<Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0, mt: compact ? 0.5 : 0.75 }}>
					<Box
						sx={{
							width: compact ? 7 : 8,
							height: compact ? 7 : 8,
							borderRadius: "50%",
							bgcolor: STALE_AMBER,
							zIndex: 1,
						}}
					/>
					<Box
						aria-hidden
						sx={{
							position: "absolute",
							inset: 0,
							borderRadius: "50%",
							bgcolor: STALE_AMBER,
							opacity: 0.5,
							animation: "la-live-pulse 2.4s ease-out infinite",
						}}
					/>
				</Box>

				<Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
					{/* Header: title + chip "Desde …" + toggle */}
					<Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
						<Typography
							sx={{
								fontSize: compact ? { xs: "0.875rem", sm: "0.92rem" } : { xs: "0.95rem", sm: "1rem" },
								fontWeight: 600,
								letterSpacing: "-0.01em",
								lineHeight: 1.25,
								color: "text.primary",
							}}
						>
							Portal del PJN en mantenimiento
						</Typography>
						<Box
							sx={{
								display: "inline-flex",
								alignItems: "center",
								px: 0.875,
								py: 0.25,
								borderRadius: 0.75,
								bgcolor: alpha(STALE_AMBER, isDark ? 0.22 : 0.14),
								border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.4 : 0.28)}`,
							}}
						>
							<Typography
								sx={{
									fontSize: "0.65rem",
									fontWeight: 600,
									letterSpacing: "0.04em",
									color: STALE_AMBER,
									fontVariantNumeric: "tabular-nums",
									lineHeight: 1,
								}}
							>
								Desde {since}
							</Typography>
						</Box>
						{/* Toggle expand — solo si hay contenido extra para mostrar */}
						{hasExpandable && (
							<Tooltip title={expanded ? "Ocultar detalle" : "Ver detalle"} placement="top" arrow>
								<IconButton
									size="small"
									onClick={() => setExpanded((e) => !e)}
									aria-label={expanded ? "Ocultar detalle del mantenimiento" : "Ver detalle del mantenimiento"}
									aria-expanded={expanded}
									sx={{
										ml: "auto",
										color: STALE_AMBER,
										padding: 0.25,
										transition: "background-color 0.15s ease, transform 0.2s ease",
										transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
										"&:hover": { bgcolor: alpha(STALE_AMBER, isDark ? 0.16 : 0.1) },
									}}
								>
									<ArrowDown2 size={14} variant="Bold" />
								</IconButton>
							</Tooltip>
						)}
					</Stack>

					{/* Context hint — info accionable, siempre visible si se pasa */}
					{contextHint && (
						<Typography
							sx={{
								fontSize: compact ? "0.78rem" : "0.82rem",
								color: "text.primary",
								fontWeight: 500,
								lineHeight: 1.45,
								textWrap: "pretty",
							}}
						>
							{contextHint}
						</Typography>
					)}

					{/* Sección expandible: descripción + cita PJN */}
					<Collapse in={expanded} timeout={200}>
						<Stack
							spacing={0.625}
							sx={{
								mt: 0.625,
								pt: 0.625,
								borderTop: `1px dashed ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
							}}
						>
							<Typography
								sx={{
									fontSize: compact ? "0.78rem" : "0.8rem",
									color: "text.secondary",
									lineHeight: 1.5,
									textWrap: "pretty",
								}}
							>
								La sincronización se reanudará automáticamente cuando el servicio vuelva.
							</Typography>

							{message && (
								<Stack direction="row" spacing={0.875} alignItems="flex-start" sx={{ mt: 0.25 }}>
									<Typography
										component="span"
										sx={{
											fontSize: "0.62rem",
											fontWeight: 600,
											letterSpacing: "0.1em",
											textTransform: "uppercase",
											color: "text.secondary",
											flexShrink: 0,
											mt: 0.25,
										}}
									>
										PJN dice
									</Typography>
									<Typography
										component="span"
										sx={{
											fontSize: "0.78rem",
											color: "text.secondary",
											fontFamily: '"JetBrains Mono", "Menlo", "Consolas", monospace',
											lineHeight: 1.4,
											wordBreak: "break-word",
										}}
									>
										&ldquo;{message}&rdquo;
									</Typography>
								</Stack>
							)}
						</Stack>
					</Collapse>
				</Stack>
			</Stack>
		</Box>
	);
};

export default PjnMaintenanceAlert;
