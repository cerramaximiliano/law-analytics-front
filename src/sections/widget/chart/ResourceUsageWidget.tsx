import { useEffect, useState } from "react";
import { Box, Stack, Typography, LinearProgress, Chip, Skeleton, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { FolderOpen, Profile2User, Calculator, StatusUp, TickCircle, Add, ArrowRight2 } from "iconsax-react";
import { useSelector, dispatch } from "store";
import { fetchUserStats } from "store/reducers/userStats";
import { cleanPlanDisplayName } from "utils/planPricingUtils";
import { useNavigate } from "react-router-dom";
import pjnCredentialsService from "api/pjnCredentials";
import scbaCredentialsService from "api/scbaCredentials";
import logoPJBuenosAires from "assets/images/logos/logo_pj_buenos_aires.svg";
import { BRAND_BLUE } from "themes/dashboardTokens";

// ==============================|| CONSTANTS ||============================== //

const PJN_LOGO_URL = "https://res.cloudinary.com/dqyoeolib/image/upload/v1746884259/xndhymcmzv3kk0f62v0y.png";
const CABA_LOGO_URL = "https://res.cloudinary.com/dqyoeolib/image/upload/v1770081495/ChatGPT_Image_2_feb_2026_09_44_56_p.m._ymi66g.png";

// ==============================|| TYPES ||============================== //

type ResourceType = "folders" | "contacts" | "calculators";

interface ResourceUsageBarProps {
	resourceType: ResourceType;
	compact?: boolean;
	barWidth?: number;
	onCabaClick?: () => void;
	onBaClick?: () => void;
	/** Deshabilita el padding horizontal interno cuando el contenedor padre ya provee el suyo. */
	disableContainerPadding?: boolean;
}

interface ResourceUsageWidgetProps {
	title?: string;
}

// Estado funcional de la pill — define la afordancia y el indicador visual.
//   "connected"    → la cuenta está sincronizada (PJN/SCBA). Check verde.
//   "disconnected" → la cuenta es conectable pero no está conectada (PJN/SCBA sin login). Dot ámbar.
//   "shortcut"     → no hay concepto de cuenta para esta jurisdicción (EJE/CABA);
//                    la pill es un atajo para cargar una causa individual. Ícono "+".
//   "loading"      → estado de carga inicial de credenciales.
type JurisdictionState = "connected" | "disconnected" | "shortcut" | "loading";

interface JurisdictionPillProps {
	logoSrc: string;
	alt: string;
	logoBg: string;
	label: string;
	tooltip: string;
	state: JurisdictionState;
	onClick?: () => void;
}

// ==============================|| HELPERS ||============================== //

const RESOURCE_CONFIG: Record<ResourceType, { label: string; icon: React.ReactNode }> = {
	folders: { label: "Carpetas", icon: <FolderOpen variant="Bold" size={18} /> },
	contacts: { label: "Contactos", icon: <Profile2User variant="Bold" size={18} /> },
	calculators: { label: "Calculadoras", icon: <Calculator variant="Bold" size={18} /> },
};

const getUsageColor = (percentage: number): "primary" | "warning" | "error" => {
	if (percentage < 80) return "primary";
	if (percentage < 100) return "warning";
	return "error";
};

// ==============================|| JURISDICTION PILL ||============================== //
// Pill horizontal con logo + label + indicador de estado. Reemplaza al antiguo
// JudicialBadge (tile 26x26 con label minúsculo abajo) que se veía amontonado
// en mobile cuando se acumulan varias jurisdicciones.
// Pensada para escalar: nuevas jurisdicciones se suman con la misma forma.

const JurisdictionPill = ({ logoSrc, alt, logoBg, label, tooltip, state, onClick }: JurisdictionPillProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isInteractive = !!onClick;
	const isConnected = state === "connected";

	// Indicador a la derecha — distingue funcionalmente las pills:
	//   connected: tilde verde (cuenta sincronizada)
	//   disconnected: dot ámbar (cuenta conectable, falta login)
	//   shortcut: ícono "+" brand (no es cuenta, es atajo para agregar causa)
	//   loading: dot neutro animado
	const indicator = (() => {
		if (state === "connected") {
			return <TickCircle size={14} variant="Bold" color={theme.palette.success.main} />;
		}
		if (state === "disconnected") {
			return (
				<Box
					aria-hidden
					sx={{
						width: 7,
						height: 7,
						borderRadius: "50%",
						bgcolor: theme.palette.warning.main,
						opacity: 0.85,
						flexShrink: 0,
					}}
				/>
			);
		}
		if (state === "shortcut") {
			return (
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: 14,
						height: 14,
						color: alpha(BRAND_BLUE, isDark ? 0.85 : 0.7),
					}}
				>
					<Add size={14} variant="Bold" />
				</Box>
			);
		}
		// loading
		return (
			<Box
				aria-hidden
				sx={{
					width: 7,
					height: 7,
					borderRadius: "50%",
					bgcolor: alpha(theme.palette.text.primary, 0.2),
					flexShrink: 0,
				}}
			/>
		);
	})();

	return (
		<Tooltip title={tooltip} arrow placement="top">
			<Box
				component={isInteractive ? "button" : "div"}
				onClick={onClick}
				aria-label={tooltip}
				sx={{
					display: "inline-flex",
					alignItems: "center",
					gap: 0.875,
					// minWidth uniforme — todas las pills se ven como mini-cards del
					// mismo ancho. Se expanden si la sigla es más larga (futuras
					// jurisdicciones). 100px cubre cómodo "CABA" + logo + estado.
					minWidth: 100,
					height: 34,
					px: 1.125,
					borderRadius: 1.25,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.16)}`,
					bgcolor: isConnected
						? alpha(BRAND_BLUE, isDark ? 0.14 : 0.06)
						: theme.palette.background.paper,
					cursor: isInteractive ? "pointer" : "default",
					transition: "background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease",
					flexShrink: 0,
					font: "inherit",
					textAlign: "left",
					appearance: "none",
					"&:hover": isInteractive
						? {
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.09),
								borderColor: alpha(BRAND_BLUE, isDark ? 0.42 : 0.28),
						  }
						: {},
					"&:active": isInteractive ? { transform: "scale(0.97)" } : {},
					"&:focus-visible": {
						outline: `2px solid ${alpha(BRAND_BLUE, 0.45)}`,
						outlineOffset: 2,
					},
				}}
			>
				{/* Logo (mantiene el bg-color original del organismo para reconocimiento) */}
				<Box
					sx={{
						width: 22,
						height: 22,
						borderRadius: 0.625,
						backgroundColor: logoBg,
						border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.06)}`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						p: "2px",
						flexShrink: 0,
					}}
				>
					<img src={logoSrc} alt={alt} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
				</Box>

				<Typography
					sx={{
						fontSize: "0.78rem",
						fontWeight: 600,
						letterSpacing: "0.01em",
						color: "text.primary",
						lineHeight: 1,
						fontVariantNumeric: "tabular-nums",
					}}
				>
					{label}
				</Typography>

				{/* Indicador pinneado a la derecha con ml: auto — garantiza que la
				    pill se vea uniforme aunque la sigla sea más corta. */}
				<Box sx={{ display: "flex", alignItems: "center", ml: "auto" }}>{indicator}</Box>
			</Box>
		</Tooltip>
	);
};

// ==============================|| FOLDERS SYNC BADGES (NAMED EXPORT) ||============================== //

export const FoldersSyncBadges = ({ onCabaClick, onBaClick }: { onCabaClick?: () => void; onBaClick?: () => void } = {}) => {
	const navigate = useNavigate();
	const [pjnSynced, setPjnSynced] = useState<boolean | null>(null);
	const [scbaSynced, setScbaSynced] = useState<boolean | null>(null);

	useEffect(() => {
		pjnCredentialsService
			.getCredentialsStatus()
			.then((response) => {
				setPjnSynced(!!(response.success && response.hasCredentials && response.data?.isValid));
			})
			.catch(() => {
				setPjnSynced(false);
			});

		scbaCredentialsService
			.getCredentialsStatus()
			.then((response) => {
				// Sincronizada + válida + vigente:
				// enabled (el usuario no la deshabilitó), no expirada, verified
				// (worker pudo loguear al menos una vez) y última sync completada.
				const data = response.data;
				setScbaSynced(
					!!(
						response.success &&
						response.hasCredentials &&
						data &&
						data.enabled === true &&
						data.isExpired === false &&
						data.verified === true &&
						data.syncStatus === "completed"
					),
				);
			})
			.catch(() => {
				setScbaSynced(false);
			});
	}, []);

	const pjnTooltip =
		pjnSynced === null
			? "PJN · Poder Judicial de la Nación — Cargando estado…"
			: pjnSynced
			? "PJN · Cuenta conectada — Click para administrar"
			: "PJN · Cuenta no conectada — Click para conectar y sincronizar tus causas";

	const scbaTooltip =
		scbaSynced === null
			? "BA · Buenos Aires — Cargando estado…"
			: scbaSynced
			? "BA · Cuenta conectada — Click para administrar"
			: onBaClick
			? "BA · Cuenta no conectada — Click para agregar una causa del Poder Judicial de la Provincia"
			: "BA · Buenos Aires — No conectada";

	const pjnState: JurisdictionState = pjnSynced === null ? "loading" : pjnSynced ? "connected" : "disconnected";
	const scbaState: JurisdictionState = scbaSynced === null ? "loading" : scbaSynced ? "connected" : "disconnected";

	return (
		<Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap>
			<JurisdictionPill
				logoSrc={PJN_LOGO_URL}
				alt="PJN"
				logoBg="#222E43"
				label="PJN"
				tooltip={pjnTooltip}
				state={pjnState}
				onClick={() => navigate("/apps/profiles/account/pjn")}
			/>
			<JurisdictionPill
				logoSrc={logoPJBuenosAires}
				alt="PJ Buenos Aires"
				logoBg="#f8f8f8"
				label="BA"
				tooltip={scbaTooltip}
				state={scbaState}
				onClick={onBaClick}
			/>
			<JurisdictionPill
				logoSrc={CABA_LOGO_URL}
				alt="PJ CABA"
				logoBg="#f8f8f8"
				label="CABA"
				tooltip={
					onCabaClick
						? "CABA · Ciudad de Buenos Aires — Click para agregar una causa individual"
						: "CABA · Ciudad de Buenos Aires"
				}
				state="shortcut"
				onClick={onCabaClick}
			/>
		</Stack>
	);
};

// ==============================|| RESOURCE USAGE BAR (NAMED EXPORT) ||============================== //

export const ResourceUsageBar = ({
	resourceType,
	compact = false,
	barWidth,
	onCabaClick,
	onBaClick,
	disableContainerPadding = false,
}: ResourceUsageBarProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const containerPx = disableContainerPadding ? 0 : compact ? { xs: 2, sm: 3 } : 0;
	const containerPy = disableContainerPadding ? 0 : compact ? 1 : 0;
	const userStats = useSelector((state) => state.userStats.data);
	const loading = useSelector((state) => state.userStats.loading);

	// Self-fetch si no hay datos disponibles
	useEffect(() => {
		if (!userStats?.planInfo && !loading) {
			dispatch(fetchUserStats() as any);
		}
	}, [userStats?.planInfo, loading]);

	const config = RESOURCE_CONFIG[resourceType];
	const count = userStats?.counts?.[resourceType] ?? 0;
	const limit = userStats?.planInfo?.limits?.[resourceType] ?? 0;
	const isUnlimited = limit === 0;
	const percentage = isUnlimited ? 0 : Math.min((count / limit) * 100, 100);
	const color = getUsageColor(percentage);
	const isFolders = resourceType === "folders";

	// Skeleton mientras carga
	if (loading && !userStats?.planInfo) {
		return (
			<Box sx={{ px: containerPx, py: containerPy }}>
				<Stack direction="row" alignItems="center" spacing={1.5}>
					<Skeleton variant="circular" width={18} height={18} />
					<Skeleton variant="text" width={70} />
					<Skeleton variant="rectangular" height={compact ? 9 : 10} sx={{ flex: 1, borderRadius: 1.25 }} />
					<Skeleton variant="text" width={50} />
				</Stack>
			</Box>
		);
	}

	// No mostrar si no hay datos de plan
	if (!userStats?.planInfo) return null;

	return (
		<Box sx={{ px: containerPx, py: containerPy }}>
			<Stack direction="row" alignItems="center" spacing={1.5}>
				<Box sx={{ color: isUnlimited ? theme.palette.text.secondary : theme.palette[color].main, display: "flex" }}>{config.icon}</Box>
				<Typography variant="caption" sx={{ fontWeight: 500, minWidth: 85 }}>
					{config.label}
				</Typography>
				{isUnlimited ? (
					<Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
						Ilimitado
					</Typography>
				) : (
					<>
						<Tooltip
							title={`${isFolders ? "Carpetas activas del plan" : config.label}: ${count} de ${limit} (${Math.round(percentage)}%)`}
							placement="top"
						>
							<LinearProgress
								variant="determinate"
								value={percentage}
								color={color}
								aria-label={isFolders ? `Carpetas activas del plan: ${count} de ${limit}` : `${config.label}: ${count} de ${limit}`}
								aria-valuenow={count}
								aria-valuemin={0}
								aria-valuemax={limit}
								sx={{
									flex: 1,
									// Subimos altura de 6→9 en compact para que tenga más presencia
									// visual incluso cuando la columna del header queda angosta.
									height: compact ? 9 : 10,
									borderRadius: 1.25,
									minWidth: 80,
									backgroundColor: alpha(theme.palette.text.primary, isDark ? 0.18 : 0.08),
									"& .MuiLinearProgress-bar": {
										borderRadius: 1.25,
									},
								}}
							/>
						</Tooltip>
						<Tooltip title={isFolders ? "Carpetas activas del plan" : config.label} placement="top">
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ minWidth: 55, textAlign: "right", cursor: "default", fontVariantNumeric: "tabular-nums" }}
							>
								{count} / {limit}
							</Typography>
						</Tooltip>
					</>
				)}
			</Stack>

			{/* Sync pills jurisdiccionales — fila propia debajo de la barra. Mantiene
			    el agrupamiento visual (mismo card) sin amontonar todo en una sola
			    línea. Escala bien cuando se sumen más jurisdicciones. */}
			{isFolders && compact && (
				<Box sx={{ mt: 1.25, display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
					<FoldersSyncBadges onCabaClick={onCabaClick} onBaClick={onBaClick} />
				</Box>
			)}
		</Box>
	);
};

// ==============================|| RESOURCE USAGE WIDGET (DEFAULT EXPORT) ||============================== //

const ResourceUsageWidget = ({ title = "Uso de Recursos" }: ResourceUsageWidgetProps) => {
	const navigate = useNavigate();
	const userStats = useSelector((state) => state.userStats.data);
	const loading = useSelector((state) => state.userStats.loading);

	// Self-fetch si no hay datos disponibles
	useEffect(() => {
		if (!userStats?.planInfo && !loading) {
			dispatch(fetchUserStats() as any);
		}
	}, [userStats?.planInfo, loading]);

	// Calcular si algún recurso está en zona crítica
	const resources: ResourceType[] = ["folders", "contacts", "calculators"];
	const maxPercentage = resources.reduce((max, type) => {
		const count = userStats?.counts?.[type] ?? 0;
		const limit = userStats?.planInfo?.limits?.[type] ?? 0;
		if (limit === 0) return max;
		return Math.max(max, Math.min((count / limit) * 100, 100));
	}, 0);
	const headerColor = getUsageColor(maxPercentage);

	// Skeleton mientras carga
	if (loading && !userStats?.planInfo) {
		return (
			<MainCard>
				<Stack spacing={2}>
					<Stack direction="row" alignItems="center" spacing={2}>
						<Skeleton variant="rounded" width={40} height={40} />
						<Skeleton variant="text" width={120} />
					</Stack>
					{[0, 1, 2].map((i) => (
						<Stack key={i} direction="row" alignItems="center" spacing={1.5}>
							<Skeleton variant="circular" width={18} height={18} />
							<Skeleton variant="text" width={70} />
							<Skeleton variant="rectangular" height={8} sx={{ flex: 1, borderRadius: 1 }} />
							<Skeleton variant="text" width={50} />
						</Stack>
					))}
				</Stack>
			</MainCard>
		);
	}

	if (!userStats?.planInfo) return null;

	const anyNearLimit = maxPercentage >= 80;

	return (
		<MainCard>
			<Stack spacing={2}>
				{/* Header */}
				<Stack direction="row" alignItems="center" justifyContent="space-between">
					<Stack direction="row" alignItems="center" spacing={2}>
						<Avatar variant="rounded" color={headerColor}>
							<StatusUp />
						</Avatar>
						<Stack spacing={0.5}>
							<Typography variant="subtitle1">{title}</Typography>
							{userStats.planInfo.planName && (
								<Typography variant="caption" color="text.secondary">
									{cleanPlanDisplayName(userStats.planInfo.planName)}
								</Typography>
							)}
						</Stack>
					</Stack>
					{anyNearLimit && (
						<Chip
							label="Mejorar plan"
							color="warning"
							size="small"
							variant="outlined"
							onClick={() => navigate("/suscripciones/tables")}
							sx={{ cursor: "pointer" }}
						/>
					)}
				</Stack>

				{/* Barras de recursos */}
				{resources.map((type) => (
					<ResourceUsageBar key={type} resourceType={type} />
				))}
			</Stack>
		</MainCard>
	);
};

export default ResourceUsageWidget;
