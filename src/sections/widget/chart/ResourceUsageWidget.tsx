import { useEffect, useState } from "react";
import { Box, Stack, Typography, LinearProgress, Chip, Skeleton, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { FolderOpen, Profile2User, Calculator, StatusUp, TickCircle } from "iconsax-react";
import { useSelector, dispatch } from "store";
import { fetchUserStats } from "store/reducers/userStats";
import { cleanPlanDisplayName } from "utils/planPricingUtils";
import { useNavigate } from "react-router-dom";
import pjnCredentialsService from "api/pjnCredentials";
import scbaCredentialsService from "api/scbaCredentials";
import logoPJBuenosAires from "assets/images/logos/logo_pj_buenos_aires.svg";

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
}

interface ResourceUsageWidgetProps {
	title?: string;
}

interface JudicialBadgeProps {
	logoSrc: string;
	alt: string;
	bgColor: string;
	label: string;
	tooltip: string;
	synced?: boolean | null;
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

// ==============================|| JUDICIAL BADGE ||============================== //

const JudicialBadge = ({ logoSrc, alt, bgColor, label, tooltip, synced = null, onClick }: JudicialBadgeProps) => {
	const theme = useTheme();
	return (
		<Tooltip title={tooltip} arrow placement="top">
			<Stack
				alignItems="center"
				spacing={0.25}
				onClick={onClick}
				aria-label={tooltip}
				role={onClick ? "button" : undefined}
				tabIndex={onClick ? 0 : undefined}
				onKeyDown={
					onClick
						? (e) => {
								if (e.key === "Enter" || e.key === " ") onClick();
						  }
						: undefined
				}
				sx={{ cursor: onClick ? "pointer" : "default", flexShrink: 0 }}
			>
				<Box sx={{ position: "relative" }}>
					<Box
						sx={{
							width: 26,
							height: 26,
							borderRadius: 0.75,
							backgroundColor: bgColor,
							border: "1px solid",
							borderColor: "divider",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							p: "3px",
						}}
					>
						<img src={logoSrc} alt={alt} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
					</Box>
					{synced === true && (
						<Box
							sx={{
								position: "absolute",
								bottom: -3,
								right: -3,
								width: 11,
								height: 11,
								borderRadius: "50%",
								backgroundColor: theme.palette.background.paper,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<TickCircle size={11} variant="Bold" color={theme.palette.success.main} />
						</Box>
					)}
				</Box>
				<Typography
					sx={{
						fontSize: "0.55rem",
						fontWeight: 600,
						lineHeight: 1,
						color: theme.palette.text.secondary,
						letterSpacing: "0.02em",
						userSelect: "none",
					}}
				>
					{label}
				</Typography>
			</Stack>
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
			? "PJN - Poder Judicial de la Nación — Cargando estado..."
			: pjnSynced
			? "PJN - Poder Judicial de la Nación — Sincronizado"
			: "PJN - Poder Judicial de la Nación — No sincronizado. Click para conectar";

	const scbaTooltip =
		scbaSynced === null
			? "BA - Buenos Aires — Cargando estado..."
			: scbaSynced
			? "BA - Buenos Aires — Poder Judicial de la Provincia de Buenos Aires — Sincronizado"
			: onBaClick
			? "BA - Buenos Aires — No sincronizado. Click para agregar causa del Poder Judicial de la Provincia"
			: "BA - Buenos Aires — Poder Judicial de la Provincia de Buenos Aires — No sincronizado";

	return (
		<Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap>
			<JudicialBadge
				logoSrc={PJN_LOGO_URL}
				alt="PJN"
				bgColor="#222E43"
				label="PJN"
				tooltip={pjnTooltip}
				synced={pjnSynced}
				onClick={() => navigate("/apps/profiles/account/pjn")}
			/>
			<JudicialBadge
				logoSrc={logoPJBuenosAires}
				alt="PJ Buenos Aires"
				bgColor="#f8f8f8"
				label="BA"
				tooltip={scbaTooltip}
				synced={scbaSynced}
				onClick={onBaClick}
			/>
			<JudicialBadge
				logoSrc={CABA_LOGO_URL}
				alt="PJ CABA"
				bgColor="#f8f8f8"
				label="CABA"
				tooltip={
					onCabaClick
						? "CABA - Ciudad de Buenos Aires — Click para agregar causa del Poder Judicial"
						: "CABA - Ciudad de Buenos Aires — Poder Judicial de la Ciudad de Buenos Aires"
				}
				onClick={onCabaClick}
			/>
		</Stack>
	);
};

// ==============================|| RESOURCE USAGE BAR (NAMED EXPORT) ||============================== //

export const ResourceUsageBar = ({ resourceType, compact = false, barWidth, onCabaClick, onBaClick }: ResourceUsageBarProps) => {
	const theme = useTheme();
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
			<Box sx={{ px: compact ? { xs: 2, sm: 3 } : 0, py: compact ? 1 : 0 }}>
				<Stack direction="row" alignItems="center" spacing={1.5}>
					<Skeleton variant="circular" width={18} height={18} />
					<Skeleton variant="text" width={70} />
					<Skeleton variant="rectangular" height={compact ? 6 : 8} sx={{ flex: 1, borderRadius: 1 }} />
					<Skeleton variant="text" width={50} />
				</Stack>
			</Box>
		);
	}

	// No mostrar si no hay datos de plan
	if (!userStats?.planInfo) return null;

	return (
		<Box sx={{ px: compact ? { xs: 2, sm: 3 } : 0, py: compact ? 1 : 0 }}>
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
									flex: compact && isFolders && barWidth ? "0 0 auto" : 1,
									width: compact && isFolders && barWidth ? barWidth : undefined,
									height: compact ? 6 : 8,
									borderRadius: 1,
									backgroundColor: theme.palette.grey[300],
									"& .MuiLinearProgress-bar": {
										borderRadius: 1,
									},
								}}
							/>
						</Tooltip>
						<Tooltip title={isFolders ? "Carpetas activas del plan" : config.label} placement="top">
							<Typography variant="caption" color="text.secondary" sx={{ minWidth: 55, textAlign: "right", cursor: "default" }}>
								{count} / {limit}
							</Typography>
						</Tooltip>
					</>
				)}
				{isFolders && compact && (
					<>
						<Box sx={{ width: "2px", height: "28px", bgcolor: "grey.300", borderRadius: 1 }} />
						<FoldersSyncBadges onCabaClick={onCabaClick} onBaClick={onBaClick} />
					</>
				)}
			</Stack>
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
