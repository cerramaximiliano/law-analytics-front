/**
 * Banner contextual que avisa al usuario que el portal SCBA no está
 * respondiendo. Se monta en páginas/modales donde el usuario podría intentar
 * conectar credenciales o sincronizar — fuera de esos contextos no aparece.
 *
 * Misma estética que <PjnMaintenanceAlert/> para que el sistema se sienta
 * coherente entre portales. Cambia el título y el copy interno.
 */

import { useState } from "react";
import { Box, Collapse, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ArrowDown2 } from "iconsax-react";
import { useScbaSiteStatus } from "hooks/useScbaSiteStatus";
import { STALE_AMBER, LIVE_PULSE_KEYFRAMES } from "themes/dashboardTokens";

interface ScbaMaintenanceAlertProps {
	/** Variante compacta — padding y typography más sutiles. Útil dentro de modales. */
	compact?: boolean;
	/** Texto adicional sobre qué acción específica está bloqueada en este contexto. */
	contextHint?: string;
	/** Si true, arranca expandido (con detalle visible). Por defecto false. */
	defaultExpanded?: boolean;
	/** Margen extra opcional. */
	sx?: object;
}

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

const ScbaMaintenanceAlert = ({ compact = false, contextHint, defaultExpanded = false, sx }: ScbaMaintenanceAlertProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { isDown, lastTransitionAt, message } = useScbaSiteStatus();
	const [expanded, setExpanded] = useState(defaultExpanded);

	if (!isDown) return null;

	const since = formatSince(lastTransitionAt);
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
							Portal de la SCBA no disponible
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
								Caído desde {since}
							</Typography>
						</Box>
						{hasExpandable && (
							<Tooltip title={expanded ? "Ocultar detalle" : "Ver detalle"} placement="top" arrow>
								<IconButton
									size="small"
									onClick={() => setExpanded((e) => !e)}
									aria-label={expanded ? "Ocultar detalle del incidente" : "Ver detalle del incidente"}
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
								La sincronización se reanudará automáticamente cuando el portal vuelva a responder.
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
										Detectado
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

export default ScbaMaintenanceAlert;
