import React from "react";
import { useState, useEffect } from "react";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
	Box,
	Button,
	Grid,
	Stack,
	Typography,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogActions,
	Radio,
	RadioGroup,
	FormControl,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	IconButton,
} from "@mui/material";

// icons
import { CloseSquare, Lock, People, Crown, InfoCircle, Warning2 } from "iconsax-react";

// project-imports
import PlanCard from "components/cards/PlanCard";
import ApiService, { Plan, ResourceLimit, PlanFeature } from "store/reducers/ApiService";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import TabLegalDocuments from "./TabPanel";
import { getPlanPricing, getBillingPeriodText, getCurrentEnvironment, cleanPlanDisplayName } from "utils/planPricingUtils";
import { useTeam } from "contexts/TeamContext";
import { ROLE_CONFIG } from "types/teams";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// ==============================|| PRICING ||============================== //

// Interfaz para las opciones de downgrade
interface DowngradeOption {
	type: string;
	description: string;
}

const Pricing = () => {
	const theme = useTheme();

	// Team context - para mostrar información apropiada a miembros del equipo
	const { isTeamMode, activeTeam, userRole, isOwner, ownerSubscription } = useTeam();
	const isTeamMember = isTeamMode && !isOwner;

	const [timePeriod, setTimePeriod] = useState(true); // true = mensual, false = anual
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
	const [currentSubscription, setCurrentSubscription] = useState<{
		plan: string;
		cancelAtPeriodEnd?: boolean;
		currentPeriodEnd?: string;
	} | null>(null);
	const isDevelopment = getCurrentEnvironment() === "development";
	// Estado para el diálogo de documentos legales
	const [legalDocsDialogOpen, setLegalDocsDialogOpen] = useState(false);
	// Estado para el diálogo de opciones de downgrade
	const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
	const [downgradeOptions, setDowngradeOptions] = useState<DowngradeOption[]>([]);
	const [selectedOption, setSelectedOption] = useState<string>("");
	const [targetPlanId, setTargetPlanId] = useState<string>("");
	const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null); // Para tracking del plan siendo procesado
	// Estado para el diálogo de confirmación de cancelación
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [cancelLoading, setCancelLoading] = useState(false);
	// Estado para manejar la reactivación de suscripción
	const [reactivating, setReactivating] = useState(false);

	// Función helper para actualizar el estado de la suscripción sin recargar la página
	const updateSubscriptionState = (newPlanId: string, subscriptionData?: { cancelAtPeriodEnd?: boolean; currentPeriodEnd?: string }) => {
		// Actualizar el plan actual
		setCurrentPlanId(newPlanId);

		// Actualizar los datos de la suscripción
		setCurrentSubscription((prev) => ({
			plan: newPlanId,
			cancelAtPeriodEnd: subscriptionData?.cancelAtPeriodEnd ?? prev?.cancelAtPeriodEnd ?? false,
			currentPeriodEnd: subscriptionData?.currentPeriodEnd ?? prev?.currentPeriodEnd,
		}));
	};

	// Obtener los planes al cargar el componente
	useEffect(() => {
		const fetchPlans = async () => {
			try {
				setLoading(true);
				const response = await ApiService.getPublicPlans();
				if (response.success && response.data) {
					setPlans(response.data);
				} else {
					setError("No se pudieron cargar los planes");
				}

				// Obtener la suscripción actual del usuario
				try {
					const subscriptionResponse = await ApiService.getCurrentSubscription();
					// Hacer una aserción de tipo para decirle a TypeScript que la estructura es la esperada
					const responseData = subscriptionResponse as unknown as {
						success: boolean;
						subscription?: {
							plan: string;
							cancelAtPeriodEnd?: boolean;
							currentPeriodEnd?: string;
						};
					};

					if (responseData.success && responseData.subscription) {
						// Guardar toda la información de la suscripción
						setCurrentSubscription(responseData.subscription);
						// El planId está en el campo "plan" de la suscripción
						setCurrentPlanId(responseData.subscription.plan);
					}
				} catch (err) {
					// No mostramos error si falla esto, solo para el listado de planes
				}
			} catch (err) {
				setError("Error al cargar los planes. Por favor, intenta más tarde.");
			} finally {
				setLoading(false);
			}
		};

		fetchPlans();
	}, []);

	const handleSubscribe = async (planId: string, discountCode?: string) => {
		try {
			setLoadingPlanId(planId); // Activar loading para este plan

			// URLs de redirección según el resultado de la operación
			const successUrl = `${window.location.origin}/apps/subscription/success`;
			const errorUrl = `${window.location.origin}/apps/subscription/error`;
			//const cancelUrl = `${window.location.origin}/plans`;

			// Verificar si es un downgrade a plan gratuito
			const isDowngradeToFree = planId === "free" && currentPlanId && currentPlanId !== "free";

			// Si es un downgrade a plan gratuito, guardar el targetPlanId
			if (isDowngradeToFree) {
				setTargetPlanId(planId);
			}

			// Asegúrate de que la respuesta se reciba como cualquier tipo para acceder a sus propiedades
			const response = (await ApiService.subscribeToPlan(planId, successUrl, errorUrl, discountCode)) as any;

			// Si devuelve opciones, mostrar el diálogo
			if (response.success && response.options && response.options.length > 0) {
				setDowngradeOptions(response.options);
				setTargetPlanId(planId);
				setOptionsDialogOpen(true);
				return;
			}

			if (response.success && response.freePlan) {
				// Si está pendiente de cancelación
				if (response.pendingCancellation) {
					dispatch(
						openSnackbar({
							open: true,
							message: `Tu suscripción se cancelará automáticamente el ${new Date(
								response.currentPeriodEnd,
							).toLocaleDateString()}. Faltan ${response.remainingDays} días.`,
							variant: "alert",
							alert: {
								color: "success",
							},
							close: false,
						}),
					);
				}
				// Si fue un downgrade inmediato o ya estaba en plan gratuito
				else if (response.immediateDowngrade || response.alreadyFree) {
					dispatch(
						openSnackbar({
							open: true,
							message: response.message || "Tu plan ha sido actualizado a gratuito correctamente.",
							variant: "alert",
							alert: {
								color: "success",
							},
							close: false,
						}),
					);
				}
				// Cualquier otro caso de plan gratuito
				else {
					dispatch(
						openSnackbar({
							open: true,
							message: response.message || "Operación de plan gratuito completada.",
							variant: "alert",
							alert: {
								color: "success",
							},
							close: false,
						}),
					);
				}
				return; // Finalizamos la ejecución después de manejar el plan gratuito
			}

			// Manejo de planes pagos o respuestas normales
			if (response.success && response.url) {
				// Redirigir al usuario a la URL de checkout proporcionada por Stripe

				window.location.href = response.url;
			} else if (response.success && response.sessionId) {
				// En caso de que solo devuelva el sessionId sin URL

				alert("Proceso de suscripción iniciado. Serás redirigido a la página de pago.");
			}
			// Caso para suscripción pendiente de cancelación (no relacionado con plan gratuito)
			else if (response.success && response.pendingCancellation) {
				// Mostrar mensaje informativo
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Ya tienes una suscripción programada para cancelarse.",
						variant: "alert",
						alert: {
							color: "info",
						},
						close: false,
					}),
				);

				// Si hay opciones disponibles, mostrar diálogo
				if (response.options && response.options.length > 0) {
					setDowngradeOptions(response.options);
					setTargetPlanId(planId);
					setOptionsDialogOpen(true);
				}
			} else if (response.success) {
				// Respuesta exitosa sin URL ni sessionId - puede ser un cambio de plan con prorrateo
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Plan actualizado exitosamente.",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: false,
					}),
				);

				// Actualizar el estado con los datos de la respuesta (si están disponibles)
				if (response.newPlan) {
					updateSubscriptionState(response.newPlan, {
						cancelAtPeriodEnd: response.subscription?.cancelAtPeriodEnd ?? false,
						currentPeriodEnd: response.subscription?.currentPeriodEnd,
					});
				}
			} else {
				// Respuesta no exitosa

				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Error al iniciar el proceso de suscripción.",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: false,
					}),
				);
				// Registrar el intento fallido (fire-and-forget, no bloquea el redirect)
				ApiService.reportFailedCheckout(planId, response.message || "Respuesta no exitosa al iniciar el checkout");
				// Redireccionar a la página de error
				window.location.href = errorUrl;
			}
		} catch (error) {
			// handleAxiosError ya extrae error.response.data.message — preservar
			// el mensaje específico (ej. "Ya has usado este código..." cuando el
			// backend rechaza el discountCode con 400) en lugar de mostrar uno
			// genérico que esconde el motivo del fallo.
			const message =
				error instanceof Error && error.message
					? error.message
					: "Error al procesar la solicitud de suscripción. Por favor, intenta de nuevo más tarde.";
			dispatch(
				openSnackbar({
					open: true,
					message,
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
			// Registrar el intento fallido (fire-and-forget, no bloquea el flujo)
			ApiService.reportFailedCheckout(planId, message);
		} finally {
			setLoadingPlanId(null); // Limpiar loading al finalizar
		}
	};

	// Manejar cancelación para volver al plan Free
	const handleCancelToFree = async () => {
		try {
			setCancelLoading(true);

			// Llamar al servicio de API para cancelar la suscripción
			const response = (await ApiService.cancelSubscription(true)) as any;

			if (response.success) {
				// Cerrar el diálogo
				setCancelDialogOpen(false);

				// Mostrar mensaje de éxito
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Tu suscripción se cancelará al final del período actual y volverás al Plan Gratuito",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: false,
					}),
				);

				// Actualizar el estado para reflejar la cancelación programada
				// El plan sigue siendo el mismo, pero ahora está marcado para cancelarse
				if (currentPlanId) {
					updateSubscriptionState(currentPlanId, {
						cancelAtPeriodEnd: true,
						currentPeriodEnd: response.currentPeriodEnd,
					});
				}
			} else {
				// Cerrar el diálogo
				setCancelDialogOpen(false);

				// Mostrar error
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "No se pudo cancelar la suscripción",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: false,
					}),
				);
			}
		} catch (err: any) {
			// Cerrar el diálogo
			setCancelDialogOpen(false);

			// Manejar error específico de "No hay suscripción activa"
			const errorMessage = err.message || err.response?.data?.message || "Error al cancelar la suscripción";

			if (errorMessage.includes("No hay una suscripción activa") || errorMessage.includes("no encontrada")) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Ya estás en el Plan Gratuito. No hay ninguna suscripción de pago activa para cancelar.",
						variant: "alert",
						alert: {
							color: "info",
						},
						close: false,
					}),
				);

				// Actualizar el estado a plan gratuito
				updateSubscriptionState("free", { cancelAtPeriodEnd: false });
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: errorMessage,
						variant: "alert",
						alert: {
							color: "error",
						},
						close: false,
					}),
				);
			}
		} finally {
			setCancelLoading(false);
		}
	};

	// Manejar reactivación de suscripción cancelada
	const handleReactivateSubscription = async () => {
		try {
			setReactivating(true);

			// Llamar al servicio de API para cancelar el downgrade programado
			const response = await ApiService.cancelScheduledDowngrade();

			if (response.success) {
				// Mostrar mensaje de éxito
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Tu suscripción ha sido reactivada exitosamente",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: false,
					}),
				);

				// Actualizar el estado para quitar la marca de cancelación
				if (currentPlanId) {
					updateSubscriptionState(currentPlanId, {
						cancelAtPeriodEnd: false,
						currentPeriodEnd: response.currentPeriodEnd,
					});
				}
			} else {
				// Mostrar error
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "No se pudo reactivar la suscripción",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: false,
					}),
				);
			}
		} catch (err: any) {
			dispatch(
				openSnackbar({
					open: true,
					message: err.message || "Error al reactivar la suscripción",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
		} finally {
			setReactivating(false);
		}
	};

	// Procesar la opción seleccionada para el downgrade
	const handleOptionSelection = (optionType: string) => {
		setSelectedOption(optionType);
	};

	// Confirmar y procesar la opción de downgrade seleccionada
	const handleOptionConfirm = async () => {
		if (!selectedOption) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Por favor, selecciona una opción para continuar.",
					variant: "alert",
					alert: {
						color: "warning",
					},
					close: false,
				}),
			);
			return;
		}

		// Mostrar loader mientras se procesa
		setLoading(true);

		try {
			let response;

			// Llamar a la API correspondiente según la opción seleccionada
			switch (selectedOption) {
				case "cancel_downgrade":
					response = await ApiService.cancelScheduledDowngrade();
					break;
				case "immediate_change":
					response = await ApiService.changeImmediate(targetPlanId);
					break;
				case "change_after_current":
					response = await ApiService.scheduleChange(targetPlanId);
					break;
				default:
					throw new Error("Opción no reconocida");
			}

			// Cerrar el diálogo
			setOptionsDialogOpen(false);

			// Mostrar mensaje de éxito
			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Operación completada con éxito.",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: false,
					}),
				);

				// Actualizar el estado según la opción seleccionada
				if (selectedOption === "cancel_downgrade" && currentPlanId) {
					// Reactivar suscripción - quitar marca de cancelación
					updateSubscriptionState(currentPlanId, {
						cancelAtPeriodEnd: false,
						currentPeriodEnd: response.currentPeriodEnd,
					});
				} else if (selectedOption === "immediate_change" && response.newPlan) {
					// Cambio inmediato - actualizar al nuevo plan
					updateSubscriptionState(response.newPlan, {
						cancelAtPeriodEnd: response.subscription?.cancelAtPeriodEnd ?? false,
						currentPeriodEnd: response.subscription?.currentPeriodEnd,
					});
				} else if (selectedOption === "change_after_current" && currentPlanId) {
					// Cambio programado - el plan actual sigue igual pero está programado para cambiar
					updateSubscriptionState(currentPlanId, {
						cancelAtPeriodEnd: true,
						currentPeriodEnd: response.currentPeriodEnd,
					});
				}
			} else {
				throw new Error(response.message || "Error al procesar la solicitud");
			}
		} catch (error: any) {
			const backendMsg = error?.message && !/^Error al procesar/i.test(error.message) ? error.message : null;
			dispatch(
				openSnackbar({
					open: true,
					message: backendMsg || "Error al procesar la solicitud. Por favor, intenta nuevamente.",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
		} finally {
			setLoading(false);
		}
	};

	// Abrir el diálogo de documentos legales
	const handleOpenLegalDocs = () => {
		setLegalDocsDialogOpen(true);
	};

	// Cerrar el diálogo de documentos legales
	const handleCloseLegalDocs = () => {
		setLegalDocsDialogOpen(false);
	};

	// Verificar si un plan tiene una característica específica y obtener su valor
	const planFeatureValue = (plan: Plan, featureType: string) => {
		// Para límites de recursos
		const resource = plan.resourceLimits.find((r: ResourceLimit) => r.name === featureType);
		if (resource) {
			return `${resource.limit} ${resource.displayName}`;
		}

		// Para características booleanas
		const feature = plan.features.find((f: PlanFeature) => f.name === featureType);
		if (feature) {
			return feature.enabled ? feature.displayName || feature.description : null;
		}

		return null;
	};

	// Función para obtener el texto predeterminado para características deshabilitadas
	const getDefaultFeatureText = (featureType: string): string => {
		// Primero buscar si es un recurso en algún plan para obtener su displayName
		for (const plan of plans) {
			const resource = plan.resourceLimits.find((r: ResourceLimit) => r.name === featureType);
			if (resource) {
				return `0 ${resource.displayName}`;
			}
		}

		// Buscar si es una característica en algún plan para obtener su displayName o descripción
		for (const plan of plans) {
			const feature = plan.features.find((f: PlanFeature) => f.name === featureType);
			if (feature) {
				return feature.displayName || feature.description;
			}
		}

		// Si no se encuentra, capitalizar el tipo de característica
		return (
			featureType.charAt(0).toUpperCase() +
			featureType
				.slice(1)
				.replace(/([A-Z])/g, " $1")
				.trim()
		);
	};


	const isDark = theme.palette.mode === "dark";

	// Helpers brand reusables
	const dialogPaperSx = {
		borderRadius: 2,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
		overflow: "hidden",
	};
	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		px: 2,
		py: 0.75,
		transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
	};
	const brandPrimarySx = {
		minWidth: 130,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};
	const destructiveBtnSx = {
		minWidth: 130,
		textTransform: "none" as const,
		bgcolor: theme.palette.error.main,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(theme.palette.error.main, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(theme.palette.error.main, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};

	// Si está cargando, mostrar skeleton brand atmosférico
	if (loading) {
		return (
			<Stack spacing={2.5} sx={{ mt: 1 }}>
				{/* Header skeleton */}
				<Box
					sx={{
						position: "relative",
						overflow: "hidden",
						borderRadius: 2,
						p: { xs: 2, md: 2.5 },
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
					}}
				>
					<Box
						sx={{
							position: "absolute",
							top: -60,
							right: -40,
							width: 280,
							height: 280,
							borderRadius: "50%",
							background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
							pointerEvents: "none",
						}}
					/>
					<Box
						sx={{
							position: "absolute",
							inset: 0,
							backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 1px, transparent 1px)`,
							backgroundSize: "22px 22px",
							maskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
							WebkitMaskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
							opacity: 0.6,
							pointerEvents: "none",
						}}
					/>
					<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
						<Box
							sx={{
								width: 44,
								height: 44,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							<Crown size={22} variant="Bulk" />
						</Box>
						<Stack spacing={0.5}>
							<Box sx={{ width: 80, height: 8, borderRadius: 0.5, bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) }} />
							<Box sx={{ width: 200, height: 16, borderRadius: 0.5, bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.12) }} />
							<Box sx={{ width: 260, height: 10, borderRadius: 0.5, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) }} />
						</Stack>
					</Stack>
				</Box>

				{/* Plan cards skeleton */}
				<Grid container spacing={3}>
					{[0, 1, 2].map((i) => (
						<Grid item xs={12} sm={6} md={4} key={i}>
							<Box
								sx={{
									position: "relative",
									overflow: "hidden",
									p: 3,
									minHeight: 460,
									borderRadius: 2,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
									bgcolor: "background.paper",
								}}
							>
								{/* Pulse spotlight */}
								<Box
									sx={{
										position: "absolute",
										top: -40,
										right: -40,
										width: 200,
										height: 200,
										borderRadius: "50%",
										background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)} 0%, transparent 70%)`,
										animation: "planSkelPulse 1.8s ease-in-out infinite",
										animationDelay: `${i * 0.18}s`,
										pointerEvents: "none",
										"@keyframes planSkelPulse": {
											"0%, 100%": { opacity: 0.4 },
											"50%": { opacity: 1 },
										},
									}}
								/>
								<Stack spacing={2.5} sx={{ position: "relative" }}>
									<Stack spacing={1}>
										<Box sx={{ width: 80, height: 8, borderRadius: 0.5, bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) }} />
										<Box sx={{ width: 140, height: 22, borderRadius: 0.5, bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) }} />
										<Box sx={{ width: 100, height: 36, borderRadius: 0.5, bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.16) }} />
									</Stack>
									<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) }} />
									<Stack spacing={1.25}>
										{[0, 1, 2, 3, 4].map((j) => (
											<Stack key={j} direction="row" alignItems="center" spacing={1}>
												<Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.12), flexShrink: 0 }} />
												<Box sx={{ width: `${70 - j * 6}%`, height: 10, borderRadius: 0.5, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) }} />
											</Stack>
										))}
									</Stack>
									<Box sx={{ flex: 1 }} />
									<Box sx={{ width: "100%", height: 40, borderRadius: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1), mt: "auto" }} />
								</Stack>
							</Box>
						</Grid>
					))}
				</Grid>

				{/* Status indicator */}
				<Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ pt: 0.5 }}>
					<Box
						sx={{
							width: 5,
							height: 5,
							borderRadius: "50%",
							bgcolor: BRAND_BLUE,
							animation: "planDotPulse 1.4s ease-in-out infinite",
							"@keyframes planDotPulse": {
								"0%, 100%": { opacity: 0.3, transform: "scale(1)" },
								"50%": { opacity: 1, transform: "scale(1.2)" },
							},
						}}
					/>
					<Typography sx={{ fontSize: "0.72rem", letterSpacing: "0.04em", color: "text.secondary" }}>
						Cargando planes…
					</Typography>
				</Stack>
			</Stack>
		);
	}

	// Si hay error, mostrar mensaje brand-aware
	if (error) {
		const errorColor = theme.palette.error.main;
		return (
			<Stack spacing={2.5} sx={{ mt: 1 }}>
				<Box
					sx={{
						position: "relative",
						overflow: "hidden",
						borderRadius: 2,
						p: { xs: 3, md: 4 },
						bgcolor: alpha(errorColor, isDark ? 0.08 : 0.04),
						border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.22)}`,
						textAlign: "center",
					}}
				>
					<Box
						sx={{
							position: "absolute",
							top: -80,
							left: "50%",
							transform: "translateX(-50%)",
							width: 320,
							height: 320,
							borderRadius: "50%",
							background: `radial-gradient(circle, ${alpha(errorColor, isDark ? 0.18 : 0.1)} 0%, transparent 70%)`,
							pointerEvents: "none",
						}}
					/>
					<Stack spacing={1.5} alignItems="center" sx={{ position: "relative" }}>
						<Box
							sx={{
								width: 56,
								height: 56,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(errorColor, isDark ? 0.16 : 0.08),
								border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.2)}`,
								color: errorColor,
							}}
						>
							<Warning2 size={26} variant="Bulk" />
						</Box>
						<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
							No pudimos cargar los planes
						</Typography>
						<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", maxWidth: 420, textWrap: "pretty" }}>
							{error}
						</Typography>
					</Stack>
				</Box>
			</Stack>
		);
	}

	// Si el usuario es miembro de un equipo (no propietario), mostrar vista informativa
	if (isTeamMember && activeTeam) {
		const roleConfig = userRole ? ROLE_CONFIG[userRole as keyof typeof ROLE_CONFIG] : null;
		const planDisplayNames: Record<string, string> = {
			free: "Gratuito",
			standard: "Estándar",
			premium: "Premium",
		};
		const ownerPlanName = ownerSubscription?.planName
			? planDisplayNames[ownerSubscription.planName.toLowerCase()] || ownerSubscription.planName
			: "No disponible";

		return (
			<Grid container spacing={3} justifyContent="center" sx={{ mt: 1 }}>
				<Grid item xs={12} md={8} lg={6}>
					<Box
						sx={{
							position: "relative",
							overflow: "hidden",
							borderRadius: 2,
							p: { xs: 3, md: 4 },
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
						}}
					>
						{/* Radial blob */}
						<Box
							sx={{
								position: "absolute",
								top: -80,
								right: -60,
								width: 320,
								height: 320,
								borderRadius: "50%",
								background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
								pointerEvents: "none",
							}}
						/>
						{/* Dot grid */}
						<Box
							sx={{
								position: "absolute",
								inset: 0,
								backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 1px, transparent 1px)`,
								backgroundSize: "22px 22px",
								maskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
								WebkitMaskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
								opacity: 0.55,
								pointerEvents: "none",
							}}
						/>
						<Stack spacing={2.5} alignItems="center" sx={{ position: "relative" }}>
							{/* Icon ring */}
							<Box
								sx={{
									width: 64,
									height: 64,
									borderRadius: 1.5,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
									color: BRAND_BLUE,
								}}
							>
								<People size={30} variant="Bulk" />
							</Box>

							{/* Eyebrow + título */}
							<Stack spacing={0.5} alignItems="center">
								<Stack direction="row" spacing={0.75} alignItems="center">
									<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
									<Typography
										sx={{
											fontSize: "0.62rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											color: "text.secondary",
										}}
									>
										Miembro de equipo
									</Typography>
								</Stack>
								<Typography
									sx={{
										fontSize: { xs: "1.25rem", md: "1.4rem" },
										fontWeight: 600,
										letterSpacing: "-0.015em",
										color: "text.primary",
										textWrap: "balance",
										textAlign: "center",
									}}
								>
									Sos parte de {activeTeam.name}
								</Typography>
								{roleConfig && (
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											gap: 0.625,
											px: 0.875,
											py: 0.25,
											mt: 0.5,
											borderRadius: 0.75,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1),
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
										}}
									>
										<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
										<Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: BRAND_BLUE, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>
											{roleConfig.label}
										</Typography>
									</Box>
								)}
							</Stack>

							{/* Plan del equipo — bloque destacado */}
							<Box
								sx={{
									width: "100%",
									maxWidth: 320,
									p: 2,
									borderRadius: 1.5,
									bgcolor: alpha(LIVE_GREEN, isDark ? 0.1 : 0.05),
									border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.28 : 0.18)}`,
									textAlign: "center",
								}}
							>
								<Typography
									sx={{
										fontSize: "0.6rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
										mb: 0.5,
									}}
								>
									Plan del equipo
								</Typography>
								<Stack direction="row" spacing={0.875} alignItems="center" justifyContent="center">
									<Crown size={16} variant="Bulk" color={LIVE_GREEN} />
									<Typography
										sx={{
											fontSize: "1.15rem",
											fontWeight: 700,
											letterSpacing: "-0.015em",
											color: LIVE_GREEN,
										}}
									>
										{ownerPlanName}
									</Typography>
								</Stack>
							</Box>

							{/* Mensaje informativo brand */}
							<Box
								sx={{
									width: "100%",
									p: 1.75,
									borderRadius: 1.25,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
								}}
							>
								<Stack direction="row" spacing={1} alignItems="flex-start">
									<InfoCircle size={16} variant="Bulk" color={BRAND_BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
									<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
										Como miembro del equipo, tenés acceso a las funcionalidades del plan{" "}
										<Box component="span" sx={{ fontWeight: 600, color: BRAND_BLUE }}>
											{ownerPlanName}
										</Box>
										. La gestión del plan y la facturación son responsabilidad del propietario.
									</Typography>
								</Stack>
							</Box>

							<Typography
								sx={{
									fontSize: "0.72rem",
									color: "text.secondary",
									letterSpacing: "-0.005em",
									textAlign: "center",
									textWrap: "pretty",
								}}
							>
								Si necesitás cambios en el plan o más permisos, contactá al administrador de tu equipo.
							</Typography>
						</Stack>
					</Box>
				</Grid>
			</Grid>
		);
	}

	const tableSx = {
		"& .MuiTableHead-root .MuiTableCell-root": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
			color: "text.secondary",
			fontSize: "0.68rem",
			fontWeight: 600,
			letterSpacing: "0.06em",
			textTransform: "uppercase",
			borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
			py: 1.25,
		},
		"& .MuiTableBody-root .MuiTableCell-root": {
			borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.06)}`,
			fontSize: "0.78rem",
		},
	};

	return (
		<Stack spacing={2.5} sx={{ mt: 1 }}>
			{/* Header brand atmosférico */}
			<Box
				sx={{
					position: "relative",
					overflow: "hidden",
					borderRadius: 2,
					p: { xs: 2, md: 2.5 },
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
				}}
			>
				<Box
					sx={{
						position: "absolute",
						top: -60,
						right: -40,
						width: 280,
						height: 280,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
						pointerEvents: "none",
					}}
				/>
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 1px, transparent 1px)`,
						backgroundSize: "22px 22px",
						maskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
						WebkitMaskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
						opacity: 0.6,
						pointerEvents: "none",
					}}
				/>
				<Stack
					direction={{ xs: "column", md: "row" }}
					alignItems={{ xs: "flex-start", md: "center" }}
					spacing={{ xs: 1.5, md: 3 }}
					sx={{ position: "relative" }}
				>
					<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
						<Box
							sx={{
								width: 44,
								height: 44,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
								flexShrink: 0,
							}}
						>
							<Crown size={22} variant="Bulk" />
						</Box>
						<Stack spacing={0.25} sx={{ minWidth: 0 }}>
							<Stack direction="row" spacing={0.875} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
								<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
								<Typography
									sx={{
										fontSize: "0.62rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Planes y precios
								</Typography>
							</Stack>
							<Typography
								sx={{
									fontSize: { xs: "1.05rem", md: "1.25rem" },
									fontWeight: 600,
									letterSpacing: "-0.015em",
									color: "text.primary",
									textWrap: "balance",
								}}
							>
								Elegí el plan que se adapta a tu estudio
							</Typography>
							<Typography
								sx={{
									display: { xs: "none", md: "block" },
									fontSize: "0.82rem",
									color: "text.secondary",
									letterSpacing: "-0.005em",
									textWrap: "pretty",
								}}
							>
								Cambiá, mejorá o cancelá tu suscripción cuando quieras. Sin sorpresas.
							</Typography>
						</Stack>
					</Stack>

					{!isDevelopment && (
						<Box
							sx={{
								display: "inline-flex",
								alignItems: "center",
								gap: 0.625,
								px: 0.875,
								py: 0.25,
								borderRadius: 0.75,
								bgcolor: alpha(STALE_AMBER, isDark ? 0.16 : 0.1),
								border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
								flexShrink: 0,
							}}
						>
							<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: STALE_AMBER }} />
							<Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: STALE_AMBER, letterSpacing: "0.01em", lineHeight: 1 }}>
								Facturación anual · Próximamente
							</Typography>
						</Box>
					)}
				</Stack>
			</Box>

			{/* Tabla resumen para mobile — evita ~2800px de scroll vertical */}
			{plans.length > 0 && (
				<Box sx={{ display: { xs: "block", md: "none" } }}>
					<Box
						sx={{
							borderRadius: 1.5,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
							overflow: "hidden",
						}}
					>
						<TableContainer sx={{ overflowX: "auto" }}>
							<Table size="small" sx={tableSx}>
								<TableHead>
									<TableRow>
										<TableCell>Recurso</TableCell>
										{plans.map((p) => (
											<TableCell key={p.planId} align="center">
												<Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
													<span>{cleanPlanDisplayName(p.displayName)}</span>
													{currentPlanId === p.planId && (
														<Box
															sx={{
																px: 0.625,
																py: 0.125,
																borderRadius: 0.5,
																bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.12),
																border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.36 : 0.24)}`,
																color: BRAND_BLUE,
																fontSize: "0.6rem",
																fontWeight: 700,
																lineHeight: 1.4,
																textTransform: "none",
															}}
														>
															Actual
														</Box>
													)}
												</Stack>
											</TableCell>
										))}
									</TableRow>
								</TableHead>
								<TableBody>
								{(() => {
									// Recolectar los primeros 5 recursos visibles del plan más completo
									const currentEnv = import.meta.env.PROD ? "production" : "development";
									const isVisibleInCurrentEnv = (visibility: string | undefined) => {
										if (!visibility || visibility === "all") return true;
										if (visibility === "none") return false;
										return visibility === currentEnv;
									};
									const allResourceNames = Array.from(
										new Set(
											plans.flatMap((p) =>
												p.resourceLimits
													.filter((r) => isVisibleInCurrentEnv(r.visibility))
													.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
													.slice(0, 5)
													.map((r) => r.name),
											),
										),
									).slice(0, 5);
									return allResourceNames.map((resourceName) => (
										<TableRow key={resourceName}>
											<TableCell>{plans[0]?.resourceLimits.find((r) => r.name === resourceName)?.displayName ?? resourceName}</TableCell>
											{plans.map((p) => {
												const resource = p.resourceLimits.find((r) => r.name === resourceName);
												return (
													<TableCell key={p.planId} align="center">
														{resource ? resource.limit : "—"}
													</TableCell>
												);
											})}
										</TableRow>
									));
								})()}
							</TableBody>
						</Table>
					</TableContainer>
					</Box>
				</Box>
			)}

			<Grid container spacing={3} alignItems="stretch">
				{plans.map((plan) => {
					// Determinar si este es el plan activo del usuario
					const isCurrentPlan = currentPlanId === plan.planId;

					// Determinar si la suscripción ya está cancelada
					const isAlreadyCanceled = currentSubscription?.cancelAtPeriodEnd === true;

					// Determinar si es plan Free y hay otro plan activo (para el caso de downgrade)
					// Solo permitir cancelación si el usuario tiene un plan de pago activo (standard o premium)
					// Y la suscripción NO está ya cancelada
					const isDowngradeToFree =
						plan.planId === "free" &&
						currentPlanId &&
						currentPlanId !== "free" &&
						(currentPlanId === "standard" || currentPlanId === "premium") &&
						!isAlreadyCanceled;

					// Obtener la información de precios según el entorno
					const pricing = getPlanPricing(plan);

					// Calcular el precio según el periodo seleccionado
					// Solo aplicar descuento anual si estamos en producción con planes mensuales
					const displayPrice =
						!isDevelopment && !timePeriod && pricing.billingPeriod === "monthly"
							? Math.round(pricing.basePrice * 12 * 0.75) // Descuento anual del 25%
							: pricing.basePrice;

					// Estados derivados para configurar el CTA del PlanCard.
					const isInactive = !plan.isActive;
					const isReactivable = isCurrentPlan && isAlreadyCanceled && currentPlanId !== "free";
					const ctaLabel = isInactive
						? "No disponible"
						: reactivating
						? "Reactivando..."
						: isReactivable
						? "Reactivar suscripción"
						: isCurrentPlan
						? "Plan actual"
						: loadingPlanId === plan.planId
						? "Procesando..."
						: isDowngradeToFree
						? "Cancelar suscripción"
						: "Suscribirme";

					const ctaColor: "primary" | "success" | "error" | "secondary" = isReactivable
						? "success"
						: isDowngradeToFree
						? "error"
						: isCurrentPlan
						? "primary"
						: "primary";

					const ctaDisabled =
						isInactive ||
						loadingPlanId !== null ||
						reactivating ||
						(isCurrentPlan && !isAlreadyCanceled) ||
						(plan.planId === "free" &&
							isAlreadyCanceled &&
							currentPlanId !== "free" &&
							(currentPlanId === "standard" || currentPlanId === "premium"));

					const handleCtaClick = () => {
						if (plan.isActive && !loadingPlanId && !reactivating) {
							if (isReactivable) {
								handleReactivateSubscription();
							} else if (isDowngradeToFree) {
								setCancelDialogOpen(true);
							} else if (!isCurrentPlan) {
								const discountCode =
									plan.activeDiscounts && plan.activeDiscounts.length > 0 ? plan.activeDiscounts[0].code : undefined;
								handleSubscribe(plan.planId, discountCode);
							}
						}
					};

					// Mensaje contextual (cancelación) que va debajo del título.
					let contextMessage:
						| { text: string; tone?: "success" | "error" | "warning" | "info" }
						| undefined;
					if (
						plan.planId === "free" &&
						isAlreadyCanceled &&
						currentPlanId !== "free" &&
						(currentPlanId === "standard" || currentPlanId === "premium") &&
						currentSubscription?.currentPeriodEnd
					) {
						contextMessage = {
							text: `Tu plan volverá a Free el ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString("es-AR")}`,
							tone: "error",
						};
					} else if (
						isCurrentPlan &&
						isAlreadyCanceled &&
						currentPlanId !== "free" &&
						currentSubscription?.currentPeriodEnd
					) {
						contextMessage = {
							text: `Cancelado. Activo hasta el ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString("es-AR")}`,
							tone: "success",
						};
					}

					return (
						<Grid item xs={12} sm={6} md={4} key={plan.planId}>
							<PlanCard
								plan={plan}
								highlighted={plan.planId === "standard" && !isCurrentPlan}
								isCurrent={isCurrentPlan}
								contextMessage={contextMessage}
								showInactiveOverlay={isInactive}
								dataTestId={`sub-plan-card-${plan.planId}`}
								cta={{
									label: ctaLabel,
									onClick: handleCtaClick,
									disabled: ctaDisabled,
									loading: loadingPlanId === plan.planId || reactivating,
									variant: isInactive ? "outlined" : isCurrentPlan || plan.planId === "standard" || plan.planId === "premium" ? "contained" : "outlined",
									color: ctaColor,
									startIcon: isInactive ? <Lock size={16} /> : undefined,
									dataTestId: `sub-action-btn-${plan.planId}`,
								}}
							/>
						</Grid>
					);
				})}
			</Grid>

			{/* Sección de documentos legales */}
			<Box sx={{ textAlign: "center", mt: 1.5, mb: 1 }}>
				<Typography
					sx={{
						fontSize: "0.78rem",
						color: "text.secondary",
						letterSpacing: "-0.005em",
						textWrap: "pretty",
					}}
				>
					Al suscribirte, aceptás nuestros{" "}
					<Box
						component="button"
						type="button"
						onClick={handleOpenLegalDocs}
						sx={{
							background: "none",
							border: "none",
							p: 0,
							font: "inherit",
							cursor: "pointer",
							color: BRAND_BLUE,
							fontWeight: 600,
							borderBottom: `1px solid ${alpha(BRAND_BLUE, 0)}`,
							transition: "border-color 0.15s ease",
							"&:hover": { borderBottomColor: alpha(BRAND_BLUE, 0.5) },
						}}
					>
						términos y condiciones
					</Box>
					, nuestra{" "}
					<Box
						component="button"
						type="button"
						onClick={handleOpenLegalDocs}
						sx={{
							background: "none",
							border: "none",
							p: 0,
							font: "inherit",
							cursor: "pointer",
							color: BRAND_BLUE,
							fontWeight: 600,
							borderBottom: `1px solid ${alpha(BRAND_BLUE, 0)}`,
							transition: "border-color 0.15s ease",
							"&:hover": { borderBottomColor: alpha(BRAND_BLUE, 0.5) },
						}}
					>
						política de reembolsos
					</Box>{" "}
					y{" "}
					<Box
						component="button"
						type="button"
						onClick={handleOpenLegalDocs}
						sx={{
							background: "none",
							border: "none",
							p: 0,
							font: "inherit",
							cursor: "pointer",
							color: BRAND_BLUE,
							fontWeight: 600,
							borderBottom: `1px solid ${alpha(BRAND_BLUE, 0)}`,
							transition: "border-color 0.15s ease",
							"&:hover": { borderBottomColor: alpha(BRAND_BLUE, 0.5) },
						}}
					>
						términos de facturación
					</Box>
					.
				</Typography>
			</Box>

			{/* Diálogo para mostrar los documentos legales */}
			<Dialog
				open={legalDocsDialogOpen}
				onClose={handleCloseLegalDocs}
				maxWidth="lg"
				fullWidth
				PaperProps={{
					sx: {
						...dialogPaperSx,
						height: "80vh",
						maxHeight: "80vh",
					},
				}}
			>
				<TabLegalDocuments onClose={handleCloseLegalDocs} />
			</Dialog>

			{/* Diálogo para mostrar las opciones de downgrade */}
			<Dialog open={optionsDialogOpen} onClose={() => setOptionsDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
				<Box
					sx={{
						position: "relative",
						overflow: "hidden",
						p: { xs: 2.25, sm: 2.5 },
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
						borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
					}}
				>
					<Box
						sx={{
							position: "absolute",
							top: -60,
							right: -40,
							width: 220,
							height: 220,
							borderRadius: "50%",
							background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
							pointerEvents: "none",
						}}
					/>
					<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							<Crown size={20} variant="Bulk" />
						</Box>
						<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
								<Typography sx={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
									Cambio de plan
								</Typography>
							</Stack>
							<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
								Opciones disponibles
							</Typography>
							<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
								Elegí cómo querés proceder con el cambio.
							</Typography>
						</Stack>
						<IconButton
							onClick={() => setOptionsDialogOpen(false)}
							sx={{
								color: "text.secondary",
								borderRadius: 1,
								"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
							}}
							aria-label="cerrar"
						>
							<CloseSquare size={20} variant="Linear" />
						</IconButton>
					</Stack>
				</Box>
				<DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
					<FormControl component="fieldset" sx={{ width: "100%" }}>
						<RadioGroup
							aria-label="opciones-downgrade"
							name="opciones-downgrade"
							value={selectedOption}
							onChange={(e) => handleOptionSelection(e.target.value)}
						>
							{downgradeOptions.map((option, index) => {
								const isSelected = selectedOption === option.type;
								return (
									<Box
										key={index}
										onClick={() => handleOptionSelection(option.type)}
										sx={{
											mb: 1.25,
											p: 1.5,
											borderRadius: 1.25,
											cursor: "pointer",
											bgcolor: isSelected ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.06) : "background.paper",
											border: `1px solid ${isSelected ? alpha(BRAND_BLUE, 0.55) : alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
											transition: "border-color 0.15s ease, background-color 0.15s ease",
											"&:hover": {
												borderColor: alpha(BRAND_BLUE, isSelected ? 0.65 : 0.32),
												bgcolor: isSelected ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.08) : alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
											},
										}}
									>
										<Stack direction="row" alignItems="flex-start" spacing={1}>
											<Radio
												checked={isSelected}
												onChange={() => handleOptionSelection(option.type)}
												value={option.type}
												name="radio-option"
												sx={{
													mt: -0.5,
													color: alpha(BRAND_BLUE, isDark ? 0.4 : 0.32),
													"&.Mui-checked": { color: BRAND_BLUE },
												}}
											/>
											<Stack spacing={0.25} sx={{ flex: 1 }}>
												<Typography sx={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
													{(() => {
														switch (option.type) {
															case "cancel_downgrade":
																return "Cancelar el cambio programado";
															case "immediate_change":
																return "Cambiar inmediatamente";
															case "change_after_current":
																return "Cambiar al finalizar el período actual";
															default:
																return option.type;
														}
													})()}
												</Typography>
												<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
													{option.description}
												</Typography>
											</Stack>
										</Stack>
									</Box>
								);
							})}
						</RadioGroup>
					</FormControl>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
					<Button onClick={() => setOptionsDialogOpen(false)} disabled={loading} sx={ghostBtnSx}>
						Cancelar
					</Button>
					<Button
						variant="contained"
						onClick={handleOptionConfirm}
						disabled={!selectedOption || loading}
						data-testid="sub-options-confirm-btn"
						startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
						sx={brandPrimarySx}
					>
						{loading ? "Procesando..." : "Confirmar selección"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Diálogo de confirmación para cancelar suscripción */}
			<Dialog
				open={cancelDialogOpen}
				onClose={() => !cancelLoading && setCancelDialogOpen(false)}
				aria-labelledby="cancel-subscription-dialog-title"
				aria-describedby="cancel-subscription-dialog-description"
				maxWidth="sm"
				fullWidth
				PaperProps={{ sx: { ...dialogPaperSx, maxWidth: 520 } }}
			>
				<Box
					sx={{
						position: "relative",
						overflow: "hidden",
						p: { xs: 2.25, sm: 2.5 },
						bgcolor: alpha(theme.palette.error.main, isDark ? 0.08 : 0.04),
						borderBottom: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.22 : 0.14)}`,
					}}
				>
					<Box
						sx={{
							position: "absolute",
							top: -60,
							right: -40,
							width: 220,
							height: 220,
							borderRadius: "50%",
							background: `radial-gradient(circle, ${alpha(theme.palette.error.main, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
							pointerEvents: "none",
						}}
					/>
					<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(theme.palette.error.main, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.28 : 0.18)}`,
								color: theme.palette.error.main,
							}}
						>
							<Warning2 size={20} variant="Bulk" />
						</Box>
						<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: theme.palette.error.main }} />
								<Typography sx={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
									Cancelar suscripción
								</Typography>
							</Stack>
							<Typography id="cancel-subscription-dialog-title" sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
								Volver al plan gratuito
							</Typography>
						</Stack>
						<IconButton
							onClick={() => !cancelLoading && setCancelDialogOpen(false)}
							disabled={cancelLoading}
							sx={{
								color: "text.secondary",
								borderRadius: 1,
								"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
							}}
							aria-label="cerrar"
						>
							<CloseSquare size={20} variant="Linear" />
						</IconButton>
					</Stack>
				</Box>
				<DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
					<Stack spacing={2}>
						<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
							Al cancelar tu suscripción actual:
						</Typography>

						<Box
							sx={{
								p: 1.75,
								borderRadius: 1.25,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
							}}
						>
							<Stack direction="row" spacing={1} alignItems="flex-start">
								<InfoCircle size={16} variant="Bulk" color={BRAND_BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
								<Stack spacing={0.625}>
									<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>
										• Tu servicio seguirá activo hasta el final del período actual
									</Typography>
									<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>
										• Tendrás 15 días de gracia para archivar contenido
									</Typography>
									<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>
										• No se realizarán más cargos automáticos
									</Typography>
								</Stack>
							</Stack>
						</Box>

						<Box
							sx={{
								p: 1.75,
								borderRadius: 1.25,
								bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.05),
								border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
							}}
						>
							<Stack direction="row" spacing={1} alignItems="flex-start">
								<Warning2 size={16} variant="Bulk" color={STALE_AMBER} style={{ marginTop: 2, flexShrink: 0 }} />
								<Stack spacing={0.625} sx={{ flex: 1 }}>
									<Typography
										sx={{
											fontSize: "0.66rem",
											fontWeight: 600,
											letterSpacing: "0.06em",
											textTransform: "uppercase",
											color: STALE_AMBER,
										}}
									>
										Límites del plan gratuito
									</Typography>
									<Stack spacing={0.375}>
										<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>• 5 causas</Typography>
										<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>• 3 cálculos</Typography>
										<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>• 10 contactos</Typography>
										<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>• 50 MB de almacenamiento</Typography>
									</Stack>
								</Stack>
							</Stack>
						</Box>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
					<Button onClick={() => setCancelDialogOpen(false)} disabled={cancelLoading} data-testid="sub-cancel-dialog-keep-btn" sx={ghostBtnSx}>
						Mantener plan
					</Button>
					<Button
						variant="contained"
						onClick={handleCancelToFree}
						disabled={cancelLoading}
						startIcon={cancelLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
						data-testid="sub-cancel-dialog-confirm-btn"
						sx={destructiveBtnSx}
					>
						{cancelLoading ? "Procesando..." : "Confirmar cancelación"}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
};

export default Pricing;
