import React from "react";
// material-ui
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { alpha } from "@mui/material/styles";
import { Grid, Stack, Typography, Snackbar, Alert, Skeleton, Fade, CircularProgress, Box } from "@mui/material";

// project-imports
import EcommerceDataCard from "components/cards/statistics/WidgetDataCard";
import BarsDataWidget from "sections/widget/chart/BarsDataWidget";
import ErrorStateCard from "components/ErrorStateCard";
import OnboardingChecklist, { useJudicialConnectionState } from "components/cards/OnboardingChecklist";

import RepeatCustomerRate from "sections/widget/chart/FoldersDataRate";
import FinancialWidget from "sections/widget/chart/FinancialWidget";
import ActiveFoldersWidget from "sections/widget/chart/ActiveFoldersWidget";

import AssignUsers from "sections/widget/chart/TaskWidget";
import UpcomingMovementEventsWidget from "sections/widget/chart/UpcomingMovementEventsWidget";
import StorageWidget from "sections/widget/chart/StorageWidget";
import ResourceUsageWidget from "sections/widget/chart/ResourceUsageWidget";

// assets
import { Calendar, CloudChange } from "iconsax-react";
import WelcomeBanner from "sections/dashboard/default/WelcomeBanner";
import { useSelector, dispatch } from "store";
import { getUnifiedStats } from "store/reducers/unifiedStats";
import { fetchUserStats } from "store/reducers/userStats";
import { DashboardStats } from "types/unified-stats";
import ApiService, { OnboardingSignals, OnboardingStatus } from "store/reducers/ApiService";
import { BRAND_BLUE } from "themes/dashboardTokens";

// hooks
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffectiveUser } from "hooks/useEffectiveUser";
import { useUpcomingDeadlines } from "hooks/useUpcomingDeadlines";

// Key para sessionStorage (evitar multiples incrementos por sesion)
const ONBOARDING_SESSION_KEY = "onboarding_session_checked";

// Key para el override de la vista del banner (solo admin, ver useEffect abajo)
const ONBOARDING_OVERRIDE_KEY = "dashboard_onboarding_override";

// ==============================|| DASHBOARD - DEFAULT ||============================== //

const DashboardDefault = () => {
	const navigate = useNavigate();

	// Override de la vista del WelcomeBanner para preview/dev. Solo lo usan
	// usuarios ADMIN_ROLE. Persiste en sessionStorage entre refreshes/navegación
	// dentro de la sesión del tab.
	//   ?onboarding=force → fuerza el hero onboarding
	//   ?onboarding=skip  → fuerza el billboard default
	//   ?onboarding=clear → limpia el override
	//   sin param          → usa el override de sessionStorage si existe, o el estado real
	const [searchParams, setSearchParams] = useSearchParams();
	const [onboardingOverride, setOnboardingOverride] = useState<"force" | "skip" | null>(() => {
		if (typeof window === "undefined") return null;
		const stored = sessionStorage.getItem(ONBOARDING_OVERRIDE_KEY);
		return stored === "force" || stored === "skip" ? stored : null;
	});

	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "error" | "success" }>({
		open: false,
		message: "",
		severity: "error",
	});

	// Estado de onboarding obtenido del backend
	const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
	const [onboardingSignals, setOnboardingSignals] = useState<OnboardingSignals | null>(null);
	const [onboardingLoading, setOnboardingLoading] = useState(true);
	const [isDismissing, setIsDismissing] = useState(false);

	// Ref para evitar doble fetch
	const onboardingFetched = useRef(false);

	const user = useSelector((state) => state.auth.user);
	const personalUserId = user?._id; // For personal features like onboarding
	const isAdmin = user?.role === "ADMIN_ROLE";

	// Get effective user for team-aware data fetching
	const { effectiveUserId, isReady: isTeamReady } = useEffectiveUser();

	// Fuente de verdad EN VIVO de los vencimientos — compartida con el widget de
	// lista y la card de Vencimientos 7/15/30. La KPI "Próximos vencimientos" de
	// abajo lee de acá (antes leía dashboardData.deadlines.nextWeek, que estaba
	// cacheado 24 h y bugueado a 0 por un mismatch de claves en el backend).
	const { counts: deadlineCounts } = useUpcomingDeadlines();

	// Sync del query param al sessionStorage + state. Solo admin.
	useEffect(() => {
		if (!isAdmin) return;
		const param = searchParams.get("onboarding");
		if (param === "force" || param === "skip") {
			sessionStorage.setItem(ONBOARDING_OVERRIDE_KEY, param);
			setOnboardingOverride(param);
		} else if (param === "clear") {
			sessionStorage.removeItem(ONBOARDING_OVERRIDE_KEY);
			setOnboardingOverride(null);
			// Limpia el param de la URL así no se re-aplica al refrescar
			searchParams.delete("onboarding");
			setSearchParams(searchParams, { replace: true });
		}
	}, [searchParams, isAdmin, setSearchParams]);

	const clearOnboardingOverride = () => {
		sessionStorage.removeItem(ONBOARDING_OVERRIDE_KEY);
		setOnboardingOverride(null);
		searchParams.delete("onboarding");
		setSearchParams(searchParams, { replace: true });
	};

	// Obtener datos del store unificado
	const { data: unifiedData, isLoading, error, lastUpdated, isInitialized } = useSelector((state) => state.unifiedStats);
	const dashboardData = unifiedData?.dashboard || null;

	// Cargar estado de onboarding del backend. Onboarding es una feature
	// personal, usa personalUserId. La primera llamada de la sesión del navegador
	// cuenta como sesión de onboarding (incrementa el contador); al volver al
	// dashboard dentro de la misma sesión (después de crear un contacto, vincular
	// una causa, etc.) se usa `peek` para refrescar estado y señales sin contarla.
	// Antes se servía el cache de sessionStorage y los steps quedaban viejos.
	useEffect(() => {
		const fetchOnboarding = async () => {
			if (!personalUserId || onboardingFetched.current) return;

			// Marcar como fetched para evitar dobles llamadas
			onboardingFetched.current = true;

			const sessionKey = `${ONBOARDING_SESSION_KEY}_${personalUserId}`;
			const dataKey = `onboarding_data_${personalUserId}`;
			const sessionChecked = !!sessionStorage.getItem(sessionKey);

			try {
				setOnboardingLoading(true);
				const response = (await ApiService.getOnboardingStatus({ peek: sessionChecked })) as any;
				if (response.success && response.onboarding) {
					setOnboardingStatus(response.onboarding);
					setOnboardingSignals(response.signals || null);
					sessionStorage.setItem(sessionKey, "true");
					sessionStorage.setItem(dataKey, JSON.stringify(response.onboarding));
				}
			} catch (err) {
				console.error("Error al obtener estado de onboarding:", err);
				// Sin backend: usar el último estado conocido de la sesión (sin señales)
				const cachedData = sessionStorage.getItem(dataKey);
				if (cachedData) setOnboardingStatus(JSON.parse(cachedData));
			} finally {
				setOnboardingLoading(false);
			}
		};

		fetchOnboarding();
	}, [personalUserId]);

	// Determinar si mostrar onboarding.
	// Cambio vs versión anterior: ya NO se apaga por umbral de sesiones ni por
	// "ya creó una carpeta". El checklist nuevo (OnboardingChecklist) tiene 4
	// pasos y el principal — vincular cuenta del Poder Judicial — recién aparece
	// recién después de crear la primera carpeta. Se oculta solo cuando:
	//   1. El user lo dismissa explícitamente (link "Ocultar guía"), o
	//   2. El backend marca onboardingComplete=true (al alcanzar 4/4 el componente
	//      lo dispara via ApiService.updateOnboarding({step: 'first_feature'})).
	const showOnboarding = useMemo(() => {
		// Override (state hidratado desde sessionStorage + query param) — solo admin.
		if (isAdmin) {
			if (onboardingOverride === "force") return true;
			if (onboardingOverride === "skip") return false;
		}

		if (onboardingStatus?.onboardingComplete || onboardingStatus?.dismissed) {
			return false;
		}

		if (!dashboardData) {
			return false;
		}

		return true;
	}, [onboardingStatus, dashboardData, onboardingOverride, isAdmin]);

	// Estado combinado de carga (ambos deben estar listos)
	const isFullyLoading = isLoading || onboardingLoading;

	const hasFolders = (dashboardData?.folders?.total || 0) > 0;

	// Estado de cred judicial (PJN/SCBA/MEV). Skip si el onboarding no se va a
	// mostrar — evita requests inútiles en cada carga del dashboard del user
	// que ya completó/dismissó el flow. Se basa en showOnboarding (y no en
	// complete/dismissed) para que la vista forzada de admin también lo consulte.
	const skipJudicialFetch = !showOnboarding || onboardingLoading;
	const judicialState = useJudicialConnectionState(skipJudicialFetch);

	// Nombre del usuario para el banner
	const userName = user?.firstName || user?.name?.split(" ")[0] || "";

	// Funcion para descartar el onboarding
	const handleDismissOnboarding = useCallback(async () => {
		try {
			setIsDismissing(true);
			const response = (await ApiService.dismissOnboarding()) as any;
			if (response.success && response.onboarding) {
				// Actualizar estado local
				setOnboardingStatus(response.onboarding);
				// Actualizar cache en sessionStorage
				if (personalUserId) {
					sessionStorage.setItem(`onboarding_data_${personalUserId}`, JSON.stringify(response.onboarding));
				}
				setSnackbar({
					open: true,
					message: "No volverás a ver esta guía de inicio",
					severity: "success",
				});
			}
		} catch (err) {
			console.error("Error al descartar onboarding:", err);
			setSnackbar({
				open: true,
				message: "Error al actualizar preferencias",
				severity: "error",
			});
		} finally {
			setIsDismissing(false);
		}
	}, [personalUserId]);

	// Cargar datos del dashboard usando el store unificado
	// Usa effectiveUserId (owner's userId en modo equipo) para mostrar datos del equipo
	useEffect(() => {
		if (effectiveUserId && isTeamReady && !isInitialized) {
			dispatch(getUnifiedStats(effectiveUserId, "dashboard,folders"));
		}
	}, [effectiveUserId, isTeamReady, isInitialized]);

	// Cargar datos de userStats para el widget de almacenamiento
	// Nota: userStats es personal, no del equipo
	useEffect(() => {
		if (personalUserId) {
			dispatch(fetchUserStats());
		}
	}, [personalUserId]);

	// Manejar errores
	useEffect(() => {
		if (error) {
			setSnackbar({ open: true, message: error, severity: "error" });
		}
	}, [error]);

	// Funcion para cerrar el snackbar
	const handleCloseSnackbar = () => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	const calculateTrend = (dataKey: keyof DashboardStats["trends"]) => {
		// Verificar si dashboardData existe
		const trendData = dashboardData?.trends?.[dataKey];

		// Check if trendData is an array with at least 2 items
		if (!dashboardData || !dashboardData.trends || !trendData || !Array.isArray(trendData) || trendData.length < 2) {
			return { direction: "up", percentage: 0 };
		}

		const currentMonth = trendData[0].count;
		const previousMonth = trendData[1].count;

		if (previousMonth === 0) return { direction: "up", percentage: 100 };

		// Calcular el porcentaje de cambio como numero
		const changePercentageValue = ((currentMonth - previousMonth) / previousMonth) * 100;
		// Formatear para mostrar
		const changePercentageFormatted = changePercentageValue.toFixed(1);

		// Determinar la direccion usando el valor numerico
		const direction = changePercentageValue >= 0 ? "up" : "down";

		return {
			direction,
			percentage: Math.abs(parseFloat(changePercentageFormatted)),
		};
	};

	// Solo calcular tendencias si hay datos
	const foldersTrend = dashboardData ? calculateTrend("newFolders") : { direction: "up", percentage: 0 };

	// Funcion para reintentar la carga
	// Usa effectiveUserId (owner's userId en modo equipo) para mantener consistencia
	// Debe pedir las mismas secciones que el initial load — un fetch parcial wipea
	// el resto de state.data y los widgets de folders quedan en "Sin datos".
	const handleRetry = () => {
		if (effectiveUserId && isTeamReady) {
			dispatch(getUnifiedStats(effectiveUserId, "dashboard,folders", true));
		}
	};

	// Renderizar skeleton loader para las tarjetas
	const renderSkeletonCards = () => (
		<>
			{[1, 2, 3, 4].map((item) => (
				<Grid item xs={12} sm={6} lg={3} key={item}>
					<Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1.5 }} />
				</Grid>
			))}
			<Grid item xs={12} md={6} lg={5}>
				<Skeleton variant="rectangular" height={420} sx={{ borderRadius: 1.5 }} />
			</Grid>
			<Grid item xs={12} md={6} lg={4}>
				<Skeleton variant="rectangular" height={420} sx={{ borderRadius: 1.5 }} />
			</Grid>
			<Grid item xs={12} md={6} lg={3}>
				<Stack spacing={3}>
					<Skeleton variant="rectangular" height={170} sx={{ borderRadius: 1.5 }} />
					<Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1.5 }} />
					<Skeleton variant="rectangular" height={70} sx={{ borderRadius: 1.5 }} />
				</Stack>
			</Grid>
		</>
	);

	// Determinar tipo de error para el componente ErrorStateCard
	const getErrorType = () => {
		if (error?.includes("sesion") || error?.includes("autorizado")) return "permission";
		if (error?.includes("conectar") || error?.includes("conexion")) return "connection";
		if (error?.includes("404") || error?.includes("encontrado")) return "notFound";
		return "general";
	};

	// Renderizar el dashboard
	return (
		<>
			<Grid container rowSpacing={4.5} columnSpacing={2.75}>
				{/* Chip indicador admin — solo visible cuando hay override activo */}
				{isAdmin && onboardingOverride && (
					<Grid item xs={12} sx={{ pb: 0 }}>
						<Box
							sx={{
								display: "inline-flex",
								alignItems: "center",
								gap: 1,
								px: 1.5,
								py: 0.5,
								borderRadius: 1,
								bgcolor: (t) => alpha(BRAND_BLUE, t.palette.mode === "dark" ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, 0.32)}`,
							}}
						>
							<Box
								aria-hidden
								sx={{
									width: 7,
									height: 7,
									borderRadius: "50%",
									bgcolor: BRAND_BLUE,
								}}
							/>
							<Typography
								sx={{
									fontSize: "0.72rem",
									fontWeight: 600,
									letterSpacing: "0.02em",
									color: BRAND_BLUE,
									fontVariantNumeric: "tabular-nums",
								}}
							>
								Vista forzada: onboarding={onboardingOverride}
							</Typography>
							<Box
								component="button"
								onClick={clearOnboardingOverride}
								sx={{
									ml: 0.5,
									fontSize: "0.7rem",
									fontWeight: 600,
									color: BRAND_BLUE,
									textDecoration: "underline",
									textUnderlineOffset: "2px",
									background: "none",
									border: "none",
									cursor: "pointer",
									p: 0,
									"&:hover": { opacity: 0.7 },
								}}
							>
								Limpiar
							</Box>
						</Box>
					</Grid>
				)}

				{/* Header del dashboard: WelcomeBanner (variante default) cuando NO hay
				    onboarding. Cuando hay onboarding, el OnboardingChecklist se
				    renderiza más abajo dentro del bloque condicional y reemplaza al
				    banner — sin esto saldrían dos hero rows uno arriba del otro. */}
				{!showOnboarding && (
					<Grid item xs={12}>
						{isFullyLoading ? (
							<Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1.5 }} />
						) : (
							<Fade in={!isFullyLoading} timeout={300}>
								<div>
									<WelcomeBanner showOnboarding={false} userName={userName} />
								</div>
							</Fade>
						)}
						{lastUpdated && !isFullyLoading && !error && (
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{
									display: "flex",
									justifyContent: "flex-end",
									mt: 1,
								}}
							>
								Última actualización:{" "}
								{new Date(lastUpdated).toLocaleString("es-AR", {
									day: "2-digit",
									month: "2-digit",
									year: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</Typography>
						)}
					</Grid>
				)}

				{/* Overlay de loading cuando se esta descartando */}
				{isDismissing && (
					<Grid item xs={12}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								py: 4,
							}}
						>
							<CircularProgress size={32} />
							<Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
								Actualizando preferencias...
							</Typography>
						</Box>
					</Grid>
				)}

				{/* Contenido del dashboard - skeleton mientras carga */}
				{isFullyLoading && !isDismissing && renderSkeletonCards()}

				{/* Mostrar error si existe */}
				{error && !isFullyLoading && !isDismissing && (
					<Grid item xs={12}>
						<ErrorStateCard
							type={getErrorType()}
							onRetry={handleRetry}
							title={
								error.includes("sesion")
									? "Sesion expirada"
									: error.includes("permisos")
									? "Acceso restringido"
									: error.includes("conectar")
									? "Sin conexion al servidor"
									: undefined
							}
						/>
					</Grid>
				)}

				{/* Mostrar onboarding checklist para usuarios sin onboarding completado.
				    Si el user ya creó carpeta (step 1 done), el checklist sigue
				    visible empujando al step #2 — conectar cuenta judicial — que
				    es el cuello de botella real (0% activación a 90 días). */}
				{!isFullyLoading && !error && dashboardData && showOnboarding && !isDismissing && !judicialState.loading && (
					<Fade in timeout={400}>
						<Grid container item spacing={2.75}>
							{/* Checklist full-width. Si el user ya tiene carpetas, el
							    dashboard completo se renderiza debajo (O2, 2026-09-12): antes
							    el checklist lo reemplazaba y, como no se podía completar, el
							    user nunca volvía a ver KPIs, tareas ni vencimientos. */}
							<Grid item xs={12}>
								<OnboardingChecklist
									userId={personalUserId}
									userName={userName}
									hasFolders={hasFolders}
									hasPjnCredentials={judicialState.hasPjnCredentials}
									hasScbaCredentials={judicialState.hasScbaCredentials}
									hasMevCredentials={judicialState.hasMevCredentials}
									hasLinkedFolders={(onboardingSignals?.linkedFolders || 0) > 0}
									hasContacts={(onboardingSignals?.contacts || 0) > 0}
									hasDeadlines={(onboardingSignals?.deadlines || 0) > 0}
									onDismiss={handleDismissOnboarding}
								/>
							</Grid>
						</Grid>
					</Fade>
				)}

				{/* Datos normales: sin onboarding, o con onboarding si el user ya tiene
				    carpetas (el checklist queda arriba). Sin carpetas el dashboard está
				    vacío y el checklist ocupa toda la vista. */}
				{!isFullyLoading && !error && dashboardData && (!showOnboarding || hasFolders) && !isDismissing && (
					<Fade in timeout={400}>
						<Grid container item spacing={2.75}>
							{/* row 1 - Mostrar estadisticas clave del dashboard */}
							<Grid item xs={12} sm={6} lg={3}>
								<FinancialWidget foldersTrend={foldersTrend} />
							</Grid>

							<Grid item xs={12} sm={6} lg={3}>
								<ActiveFoldersWidget />
							</Grid>

							<Grid item xs={12} sm={6} lg={3}>
								<EcommerceDataCard
									title="Tareas pendientes"
									count={(dashboardData?.tasks?.pending || 0).toString()}
									color="success"
									iconPrimary={<Calendar size={20} variant="Bulk" />}
									onClick={() => navigate("/tareas")}
									percentage={
										<Typography
											variant="caption"
											sx={{
												color: "text.secondary",
												fontVariantNumeric: "tabular-nums",
												letterSpacing: "-0.005em",
											}}
										>
											{dashboardData?.tasks?.completed || 0} completadas · {dashboardData?.tasks?.overdue || 0} vencidas
										</Typography>
									}
								>
									<BarsDataWidget color={BRAND_BLUE} data={dashboardData?.trends?.tasks?.map((item) => item.count) || undefined} />
								</EcommerceDataCard>
							</Grid>

							<Grid item xs={12} sm={6} lg={3}>
								<EcommerceDataCard
									title="Próximos vencimientos"
									count={(deadlineCounts.total || 0).toString()}
									color="error"
									iconPrimary={<CloudChange size={20} variant="Bulk" />}
									onClick={() => navigate("/apps/calendar")}
									percentage={
										<Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
											Vencimientos y audiencias agendados
										</Typography>
									}
								>
									<BarsDataWidget color={BRAND_BLUE} data={dashboardData?.trends?.deadlines?.map((item) => item.count) || undefined} />
								</EcommerceDataCard>
							</Grid>

							{/* row 2 — tres columnas:
							    · izquierda (lg=5): el chart principal de distribución
							    · centro (lg=4): "Próximos vencimientos" (la lista) — único
							      widget de vencimientos del dashboard; su contador vive en la
							      KPI de la fila 1, que muestra el mismo total
							    · derecha (lg=3): stack de utilidades (recursos / storage / tareas) */}
							<Grid item xs={12} md={6} lg={5}>
								<RepeatCustomerRate />
							</Grid>
							<Grid item xs={12} md={6} lg={4}>
								<UpcomingMovementEventsWidget />
							</Grid>
							<Grid item xs={12} md={6} lg={3}>
								<Stack spacing={3}>
									<ResourceUsageWidget />
									<StorageWidget />
									<AssignUsers />
								</Stack>
							</Grid>
						</Grid>
					</Fade>
				)}
			</Grid>

			{/* Agregar Snackbar para mostrar mensajes */}
			<Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
				<Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</>
	);
};

export default DashboardDefault;
