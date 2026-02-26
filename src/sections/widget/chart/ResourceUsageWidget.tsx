import { useEffect } from "react";
import { Box, Stack, Typography, LinearProgress, Chip, Skeleton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { FolderOpen, Profile2User, Calculator, StatusUp } from "iconsax-react";
import { useSelector, dispatch } from "store";
import { fetchUserStats } from "store/reducers/userStats";
import { cleanPlanDisplayName } from "utils/planPricingUtils";
import { useNavigate } from "react-router-dom";

// ==============================|| TYPES ||============================== //

type ResourceType = "folders" | "contacts" | "calculators";

interface ResourceUsageBarProps {
	resourceType: ResourceType;
	compact?: boolean;
}

interface ResourceUsageWidgetProps {
	title?: string;
}

// ==============================|| HELPERS ||============================== //

const RESOURCE_CONFIG: Record<ResourceType, { label: string; icon: React.ReactNode }> = {
	folders: { label: "Carpetas", icon: <FolderOpen variant="Bold" size={18} /> },
	contacts: { label: "Contactos", icon: <Profile2User variant="Bold" size={18} /> },
	calculators: { label: "Calculadoras", icon: <Calculator variant="Bold" size={18} /> },
};

const getUsageColor = (percentage: number): "primary" | "warning" | "error" => {
	if (percentage < 60) return "primary";
	if (percentage < 80) return "warning";
	return "error";
};

// ==============================|| RESOURCE USAGE BAR (NAMED EXPORT) ||============================== //

export const ResourceUsageBar = ({ resourceType, compact = false }: ResourceUsageBarProps) => {
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

	// Skeleton mientras carga
	if (loading && !userStats?.planInfo) {
		return (
			<Box sx={{ px: compact ? 2 : 0, py: compact ? 1 : 0 }}>
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
		<Box sx={{ px: compact ? 2 : 0, py: compact ? 1 : 0 }}>
			<Stack direction="row" alignItems="center" spacing={1.5}>
				<Box sx={{ color: isUnlimited ? theme.palette.text.secondary : theme.palette[color].main, display: "flex" }}>
					{config.icon}
				</Box>
				<Typography variant="caption" sx={{ fontWeight: 500, minWidth: 85 }}>
					{config.label}
				</Typography>
				{isUnlimited ? (
					<Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
						Ilimitado
					</Typography>
				) : (
					<>
						<LinearProgress
							variant="determinate"
							value={percentage}
							color={color}
							sx={{
								flex: 1,
								height: compact ? 6 : 8,
								borderRadius: 1,
								backgroundColor: theme.palette.grey[300],
								"& .MuiLinearProgress-bar": {
									borderRadius: 1,
								},
							}}
						/>
						<Typography variant="caption" color="text.secondary" sx={{ minWidth: 55, textAlign: "right" }}>
							{count} / {limit}
						</Typography>
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
