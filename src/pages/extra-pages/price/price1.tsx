import React from "react";
import { useState, Fragment, useEffect } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Button,
	Chip,
	Grid,
	List,
	ListItem,
	ListItemText,
	Stack,
	Switch,
	Typography,
	CircularProgress,
	Alert,
	Link,
	Dialog,
	DialogContent,
	DialogActions,
	DialogTitle,
	Radio,
	RadioGroup,
	FormControl,
	Paper,
} from "@mui/material";

// icons
import { Lock, DiscountShape } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import ApiService, { Plan, ResourceLimit, PlanFeature } from "store/reducers/ApiService";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import TabLegalDocuments from "./TabPanel";
import { getPlanPricing, getBillingPeriodText, getCurrentEnvironment, cleanPlanDisplayName } from "utils/planPricingUtils";

// ==============================|| PRICING ||============================== //

// Interfaz para las opciones de downgrade
interface DowngradeOption {
	type: string;
	description: string;
}

const Pricing = () => {
	const theme = useTheme();
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

		console.log("📋 Suscripción actualizada:", {
			plan: newPlanId,
			cancelAtPeriodEnd: subscriptionData?.cancelAtPeriodEnd,
			currentPeriodEnd: subscriptionData?.currentPeriodEnd,
		});
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

						console.log("📋 Suscripción actual:", {
							plan: responseData.subscription.plan,
							cancelAtPeriodEnd: responseData.subscription.cancelAtPeriodEnd,
							currentPeriodEnd: responseData.subscription.currentPeriodEnd,
						});
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
				// Redireccionar a la página de error
				window.location.href = errorUrl;
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al procesar la solicitud de suscripción. Por favor, intenta de nuevo más tarde.",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
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
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al procesar la solicitud. Por favor, intenta nuevamente.",
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
			return feature.enabled ? (feature.displayName || feature.description) : null;
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

	// Función para obtener el color y el estilo según el tipo de plan
	const getPlanStyle = (planId: string, isCurrentPlan: boolean, isActive: boolean) => {
		const baseStyle = {
			padding: 3,
			borderRadius: 1,
		};

		// Si no está activo, usar un estilo gris
		if (!isActive) {
			return {
				...baseStyle,
				bgcolor: theme.palette.grey[200],
				opacity: 0.8,
			};
		}

		if (isCurrentPlan) {
			return {
				...baseStyle,
				bgcolor: theme.palette.primary.lighter,
			};
		}

		switch (planId) {
			case "free":
				return {
					...baseStyle,
					bgcolor: theme.palette.info.lighter,
				};
			case "standard":
				return {
					...baseStyle,
					bgcolor: theme.palette.success.lighter,
				};
			case "premium":
				return {
					padding: 3,
					borderRadius: 1,
					bgcolor: theme.palette.secondary.lighter,
				};
			default:
				return { padding: 3 };
		}
	};

	// Función para obtener el color del botón según el tipo de plan
	const getButtonColor = (planId: string, isCurrentPlan: boolean) => {
		if (isCurrentPlan) {
			return "primary";
		}

		switch (planId) {
			case "free":
				return "info";
			case "standard":
				return "success";
			case "premium":
				return "secondary";
			default:
				return "secondary";
		}
	};

	// Función para obtener el chip distintivo según el plan
	const getPlanChip = (planId: string, isCurrentPlan: boolean, isDefault: boolean, isActive: boolean) => {
		// Si el plan no está activo, mostrar chip de próximamente
		if (!isActive) {
			return <Chip label="Próximamente" color="warning" variant="filled" />;
		}

		if (isCurrentPlan) {
			return <Chip label="Plan Actual" color="primary" />;
		}

		switch (planId) {
			case "standard":
				return <Chip label="Popular" color="success" />;
			case "premium":
				return <Chip label="Recomendado" color="secondary" />;
			case "free":
				if (isDefault) {
					return <Chip label="Básico" color="info" />;
				}
				return null;
			default:
				if (isDefault) {
					return <Chip label="Predeterminado" color="default" />;
				}
				return null;
		}
	};

	// Estilos
	const priceListDisable = {
		opacity: 0.4,
		textDecoration: "line-through",
	};

	const price = {
		fontSize: "40px",
		fontWeight: 700,
		lineHeight: 1,
	};

	// Si está cargando, mostrar indicador
	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
				<CircularProgress />
			</Box>
		);
	}

	// Si hay error, mostrar mensaje
	if (error) {
		return (
			<Alert severity="error" sx={{ mt: 2 }}>
				{error}
			</Alert>
		);
	}

	return (
		<Grid container spacing={3}>
			{!isDevelopment && (
				<Grid item xs={12}>
					<Stack spacing={2} direction={{ xs: "column", md: "row" }} justifyContent="space-between">
						<Stack spacing={0}></Stack>
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Typography variant="subtitle1" color={timePeriod ? "textSecondary" : "textPrimary"}>
								Cobro Anual
							</Typography>
							<Switch
								checked={timePeriod}
								onChange={() => setTimePeriod(!timePeriod)}
								inputProps={{ "aria-label": "container" }}
								disabled
							/>
							<Typography variant="subtitle1" color={timePeriod ? "textPrimary" : "textSecondary"}>
								Cobro Mensual
							</Typography>
						</Stack>
					</Stack>
				</Grid>
			)}
			<Grid item container spacing={3} xs={12} alignItems="center">
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

					// Debug: mostrar información del plan y validación
					if (plan.planId === "free") {
						console.log("🔍 Plan Free - Validación de cancelación:", {
							currentPlanId,
							isAlreadyCanceled,
							isDowngradeToFree,
							currentPeriodEnd: currentSubscription?.currentPeriodEnd,
							validations: {
								isPlanFree: plan.planId === "free",
								hasCurrentPlan: !!currentPlanId,
								isNotFreePlan: currentPlanId !== "free",
								isPaidPlan: currentPlanId === "standard" || currentPlanId === "premium",
								notCanceled: !isAlreadyCanceled,
							},
						});
					}

					// Obtener la información de precios según el entorno
					const pricing = getPlanPricing(plan);

					// Calcular el precio según el periodo seleccionado
					// Solo aplicar descuento anual si estamos en producción con planes mensuales
					const displayPrice =
						!isDevelopment && !timePeriod && pricing.billingPeriod === "monthly"
							? Math.round(pricing.basePrice * 12 * 0.75) // Descuento anual del 25%
							: pricing.basePrice;

					return (
						<Grid item xs={12} sm={6} md={4} key={plan.planId}>
							<MainCard sx={{ position: "relative", overflow: "hidden" }}>
								<Grid container spacing={3}>
									<Grid item xs={12}>
										<Box sx={getPlanStyle(plan.planId, isCurrentPlan, plan.isActive)}>
											<Grid container spacing={3}>
												{/* Mostramos el chip correspondiente */}
												<Grid item xs={12} sx={{ textAlign: "center" }}>
													{getPlanChip(plan.planId, isCurrentPlan, plan.isDefault, plan.isActive)}
												</Grid>
												<Grid item xs={12}>
													<Stack spacing={0} textAlign="center">
														<Typography variant="h4">{cleanPlanDisplayName(plan.displayName)}</Typography>
														<Typography>{plan.description}</Typography>
														{/* Mostrar mensaje de cancelación para plan Free SOLO si el plan actual es un plan de pago cancelado */}
														{plan.planId === "free" &&
															isAlreadyCanceled &&
															currentPlanId !== "free" &&
															(currentPlanId === "standard" || currentPlanId === "premium") &&
															currentSubscription?.currentPeriodEnd && (
																<Typography variant="caption" color="error.main" sx={{ mt: 0.5, fontWeight: 600 }}>
																	Tu plan volverá a Free el{" "}
																	{new Date(currentSubscription.currentPeriodEnd).toLocaleDateString("es-AR", {
																		day: "2-digit",
																		month: "2-digit",
																		year: "numeric",
																	})}
																</Typography>
															)}
														{/* Mostrar mensaje de cancelación SOLO para el plan de pago actual que está cancelado (no para Free) */}
														{isCurrentPlan &&
															isAlreadyCanceled &&
															currentPlanId !== "free" &&
															(currentPlanId === "standard" || currentPlanId === "premium") &&
															currentSubscription?.currentPeriodEnd && (
																<Typography variant="caption" color="success.main" sx={{ mt: 0.5, fontWeight: 600 }}>
																	Cancelado. Activo hasta el{" "}
																	{new Date(currentSubscription.currentPeriodEnd).toLocaleDateString("es-AR", {
																		day: "2-digit",
																		month: "2-digit",
																		year: "numeric",
																	})}
																</Typography>
															)}
													</Stack>
												</Grid>

												<Grid item xs={12}>
													<Stack spacing={0} alignItems="center">
														{plan.activeDiscounts && plan.activeDiscounts.length > 0 ? (
															<>
																<Stack direction="row" spacing={1.5} alignItems="baseline">
																	<Typography
																		variant="h4"
																		sx={{
																			textDecoration: "line-through",
																			color: "text.secondary",
																			fontWeight: 500,
																			opacity: 0.8,
																		}}
																	>
																		${plan.activeDiscounts[0].originalPrice}
																	</Typography>
																	<Typography variant="h2" sx={{ ...price, color: "success.main" }}>
																		${plan.activeDiscounts[0].finalPrice}
																	</Typography>
																</Stack>
																<Typography variant="h6" color="textSecondary">
																	{getBillingPeriodText(pricing.billingPeriod)}
																</Typography>
																<Box
																	sx={{
																		mt: 1.5,
																		p: 1,
																		bgcolor: "success.lighter",
																		borderRadius: 1,
																		border: "1px solid",
																		borderColor: "success.light",
																		textAlign: "center",
																	}}
																>
																	<Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
																		<DiscountShape size={14} color="var(--mui-palette-success-main)" />
																		<Chip
																			label={plan.activeDiscounts[0].badge}
																			size="small"
																			color="success"
																			sx={{ fontWeight: 700, fontSize: "0.7rem" }}
																		/>
																	</Stack>
																	<Typography variant="caption" color="success.dark" sx={{ display: "block", mt: 0.5, fontWeight: 600 }}>
																		{plan.activeDiscounts[0].promotionalMessage}
																	</Typography>
																	{plan.activeDiscounts[0].durationInMonths && (
																		<Typography variant="caption" color="success.dark" sx={{ display: "block" }}>
																			Válido por {plan.activeDiscounts[0].durationInMonths} meses
																		</Typography>
																	)}
																</Box>
															</>
														) : (
															<>
																<Typography variant="h2" sx={price}>
																	${displayPrice}
																</Typography>
																<Typography variant="h6" color="textSecondary">
																	{getBillingPeriodText(pricing.billingPeriod)}
																</Typography>
															</>
														)}
													</Stack>
												</Grid>
												<Grid item xs={12}>
													<Button
														color={
															isCurrentPlan && isAlreadyCanceled && currentPlanId !== "free"
																? "success"
																: isDowngradeToFree
																? "error"
																: getButtonColor(plan.planId, isCurrentPlan)
														}
														variant={isCurrentPlan || plan.planId === "standard" || plan.planId === "premium" ? "contained" : "outlined"}
														fullWidth
														disabled={
															!plan.isActive ||
															loadingPlanId !== null ||
															reactivating ||
															(isCurrentPlan && !isAlreadyCanceled) ||
															// Deshabilitar botón en card Free si hay un plan de pago cancelado (volverá automáticamente a Free)
															(plan.planId === "free" &&
																isAlreadyCanceled &&
																currentPlanId !== "free" &&
																(currentPlanId === "standard" || currentPlanId === "premium"))
														}
														onClick={() => {
															if (plan.isActive && !loadingPlanId && !reactivating) {
																// Solo permitir reactivar si es plan de pago (no free) y está cancelado
																if (isCurrentPlan && isAlreadyCanceled && currentPlanId !== "free") {
																	handleReactivateSubscription();
																} else if (isDowngradeToFree) {
																	// Si es downgrade a free, abrir diálogo de confirmación
																	setCancelDialogOpen(true);
																} else {
																	// Si es suscripción normal, usar flujo normal
																	// Obtener el código de descuento si existe
																	const discountCode =
																		plan.activeDiscounts && plan.activeDiscounts.length > 0 ? plan.activeDiscounts[0].code : undefined;
																	handleSubscribe(plan.planId, discountCode);
																}
															}
														}}
														startIcon={
															!plan.isActive ? (
																<Lock size={16} />
															) : loadingPlanId === plan.planId || reactivating ? (
																<CircularProgress size={16} color="inherit" />
															) : undefined
														}
													>
														{!plan.isActive
															? "No disponible"
															: reactivating
															? "Reactivando..."
															: isCurrentPlan && isAlreadyCanceled && currentPlanId !== "free"
															? "Reactivar Suscripción"
															: isCurrentPlan
															? "Plan Actual"
															: loadingPlanId === plan.planId
															? "Procesando..."
															: isDowngradeToFree
															? "Cancelar Suscripción"
															: "Suscribirme"}
													</Button>
												</Grid>
											</Grid>
										</Box>
									</Grid>
									<Grid item xs={12}>
										<List
											sx={{
												m: 0,
												p: 0,
												"&> li": {
													px: 0,
													py: 0.625,
												},
											}}
											component="ul"
										>
											{/* Crear un arreglo combinado de recursos y características, ordenado correctamente */}
											{(() => {
												const currentEnv = import.meta.env.PROD ? "production" : "development";
												const isVisibleInCurrentEnv = (visibility: string | undefined) => {
													if (!visibility || visibility === "all") return true;
													if (visibility === "none") return false;
													return visibility === currentEnv;
												};

												// Mapear recursos a objetos con información común (filtrando por visibility)
												const resourceItems = plan.resourceLimits
													.filter((resource) => isVisibleInCurrentEnv(resource.visibility))
													.map((resource) => ({
														type: "resource" as const,
														enabled: true,
														description: planFeatureValue(plan, resource.name) || "",
														name: resource.name,
													}));

												// Mapear características a objetos con información común (filtrando por visibility)
												const featureItems = plan.features
													.filter((feature) => isVisibleInCurrentEnv(feature.visibility))
													.map((feature) => ({
														type: "feature" as const,
														enabled: feature.enabled,
														description: feature.enabled ? feature.description : getDefaultFeatureText(feature.name),
														name: feature.name,
													}));

												// Combinar ambos arreglos
												// Combinar ambos arreglos
												const allItems = [...resourceItems, ...featureItems];

												// Ordenar: primero resources por order, luego features por order
												const sortedItems = allItems.sort((a, b) => {
													// Resources siempre antes que features
													if (a.type !== b.type) return a.type === "resource" ? -1 : 1;
													// Dentro del mismo tipo, ordenar por order
													const orderA = (plan.resourceLimits.find((r: any) => r.name === a.name)?.order ?? plan.features.find((f: any) => f.name === a.name)?.order) ?? 99;
													const orderB = (plan.resourceLimits.find((r: any) => r.name === b.name)?.order ?? plan.features.find((f: any) => f.name === b.name)?.order) ?? 99;
													return orderA - orderB;
												});
												return sortedItems.map((item, i) => (
													<Fragment key={`${item.type}-${i}`}>
														<ListItem sx={!item.enabled ? priceListDisable : {}}>
															<ListItemText
																primary={item.description}
																sx={{ textAlign: "center", fontWeight: item.enabled ? "medium" : "normal" }}
															/>
														</ListItem>
													</Fragment>
												));
											})()}
										</List>
									</Grid>
								</Grid>

								{/* Overlay para planes no activos */}
								{!plan.isActive && (
									<Box
										sx={{
											position: "absolute",
											top: 0,
											left: 0,
											right: 0,
											bottom: 0,
											backgroundColor: theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)",
											backdropFilter: "blur(5px)",
											WebkitBackdropFilter: "blur(5px)",
											zIndex: 100,
											borderRadius: "inherit",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<Paper
											elevation={3}
											sx={{
												p: 2,
												textAlign: "center",
												backgroundColor: "background.paper",
												maxWidth: "80%",
											}}
										>
											<Lock variant="Bulk" size={32} color={theme.palette.warning.main} style={{ marginBottom: 8 }} />
											<Typography variant="h6" gutterBottom color="warning.main">
												Próximamente
											</Typography>
											<Typography variant="caption" color="text.secondary">
												Este plan estará disponible pronto
											</Typography>
										</Paper>
									</Box>
								)}
							</MainCard>
						</Grid>
					);
				})}
			</Grid>

			{/* Sección de documentos legales */}
			<Grid item xs={12}>
				<Box sx={{ textAlign: "center", mt: 4, mb: 2 }}>
					<Typography variant="body2" color="text.secondary">
						Al suscribirte, aceptas nuestros{" "}
						<Link component="button" variant="body2" onClick={handleOpenLegalDocs} sx={{ textDecoration: "none" }}>
							términos y condiciones de suscripción
						</Link>
						, así como nuestra{" "}
						<Link component="button" variant="body2" onClick={handleOpenLegalDocs} sx={{ textDecoration: "none" }}>
							política de reembolsos
						</Link>{" "}
						y{" "}
						<Link component="button" variant="body2" onClick={handleOpenLegalDocs} sx={{ textDecoration: "none" }}>
							términos de facturación
						</Link>
						.
					</Typography>
				</Box>
			</Grid>

			{/* Diálogo para mostrar los documentos legales */}
			<Dialog
				open={legalDocsDialogOpen}
				onClose={handleCloseLegalDocs}
				maxWidth="lg"
				fullWidth
				sx={{
					"& .MuiDialog-paper": {
						height: "80vh",
						maxHeight: "80vh",
					},
				}}
			>
				<TabLegalDocuments onClose={handleCloseLegalDocs} />
			</Dialog>

			{/* Diálogo para mostrar las opciones de downgrade */}
			<Dialog open={optionsDialogOpen} onClose={() => setOptionsDialogOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="h4">Opciones de cambio de plan</Typography>
				</DialogTitle>
				<DialogContent sx={{ pt: 3 }}>
					<Typography variant="body1" sx={{ mb: 3 }}>
						Selecciona cómo quieres proceder con tu cambio de plan:
					</Typography>

					<FormControl component="fieldset" sx={{ width: "100%" }}>
						<RadioGroup
							aria-label="opciones-downgrade"
							name="opciones-downgrade"
							value={selectedOption}
							onChange={(e) => handleOptionSelection(e.target.value)}
						>
							{downgradeOptions.map((option, index) => (
								<Paper
									key={index}
									elevation={1}
									onClick={() => handleOptionSelection(option.type)}
									sx={{
										mb: 2,
										p: 2,
										border: selectedOption === option.type ? `2px solid ${theme.palette.primary.main}` : "1px solid transparent",
										borderRadius: 1,
										transition: "all 0.2s ease-in-out",
										cursor: "pointer",
										"&:hover": {
											borderColor: theme.palette.primary.light,
											bgcolor: theme.palette.background.paper,
											boxShadow: 3,
										},
									}}
								>
									<Box sx={{ display: "flex", alignItems: "flex-start" }}>
										<Radio
											checked={selectedOption === option.type}
											onChange={() => handleOptionSelection(option.type)}
											value={option.type}
											name="radio-option"
											sx={{ mt: -0.5, mr: 1 }}
										/>
										<Box>
											<Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
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
											<Typography variant="body2" color="textSecondary">
												{option.description}
											</Typography>
										</Box>
									</Box>
								</Paper>
							))}
						</RadioGroup>
					</FormControl>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
					<Button onClick={() => setOptionsDialogOpen(false)} color="error" variant="outlined" disabled={loading}>
						Cancelar
					</Button>
					<Button onClick={handleOptionConfirm} color="primary" variant="contained" disabled={!selectedOption || loading}>
						{loading ? (
							<>
								<CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
								Procesando...
							</>
						) : (
							"Confirmar selección"
						)}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Diálogo de confirmación para cancelar suscripción */}
			<Dialog
				open={cancelDialogOpen}
				onClose={() => !cancelLoading && setCancelDialogOpen(false)}
				aria-labelledby="cancel-subscription-dialog-title"
				aria-describedby="cancel-subscription-dialog-description"
				PaperProps={{
					sx: {
						borderRadius: 3,
						boxShadow: "0 10px 40px 0 rgba(0,0,0,0.1)",
						maxWidth: 500,
					},
				}}
			>
				<DialogTitle
					id="cancel-subscription-dialog-title"
					sx={{
						pb: 1,
						pt: 3,
						px: 3,
						fontWeight: 600,
					}}
				>
					¿Cancelar suscripción y volver al Plan Gratuito?
				</DialogTitle>
				<DialogContent sx={{ p: 3 }}>
					<Typography variant="body1" paragraph>
						Al cancelar tu suscripción actual:
					</Typography>

					<Box
						sx={{
							bgcolor: "background.neutral",
							p: 2,
							borderRadius: 2,
							mb: 2,
						}}
					>
						<Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
							Detalles importantes:
						</Typography>
						<Stack spacing={1}>
							<Typography variant="body2" color="text.primary">
								• Tu servicio seguirá activo hasta el final del período actual
							</Typography>
							<Typography variant="body2" color="text.primary">
								• Tendrás un período de gracia de 15 días para archivar contenido
							</Typography>
							<Typography variant="body2" color="text.primary">
								• No se realizarán más cargos automáticos
							</Typography>
						</Stack>
					</Box>

					<Alert severity="warning" variant="outlined" sx={{ borderRadius: 2, borderWidth: 1.5 }}>
						<Typography variant="body2" fontWeight="bold" gutterBottom>
							Límites del Plan Gratuito:
						</Typography>
						<List dense sx={{ pl: 2 }}>
							<ListItem sx={{ py: 0.25, px: 0 }}>
								<ListItemText primary="• 5 Causas" primaryTypographyProps={{ variant: "body2" }} />
							</ListItem>
							<ListItem sx={{ py: 0.25, px: 0 }}>
								<ListItemText primary="• 3 Cálculos" primaryTypographyProps={{ variant: "body2" }} />
							</ListItem>
							<ListItem sx={{ py: 0.25, px: 0 }}>
								<ListItemText primary="• 10 Contactos" primaryTypographyProps={{ variant: "body2" }} />
							</ListItem>
							<ListItem sx={{ py: 0.25, px: 0 }}>
								<ListItemText primary="• 50 MB de Almacenamiento" primaryTypographyProps={{ variant: "body2" }} />
							</ListItem>
						</List>
					</Alert>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3 }}>
					<Button onClick={() => setCancelDialogOpen(false)} disabled={cancelLoading}>
						Mantener mi plan actual
					</Button>
					<Button
						onClick={handleCancelToFree}
						color="error"
						variant="contained"
						disabled={cancelLoading}
						startIcon={cancelLoading ? <CircularProgress size={20} /> : undefined}
					>
						{cancelLoading ? "Procesando..." : "Confirmar cancelación"}
					</Button>
				</DialogActions>
			</Dialog>
		</Grid>
	);
};

export default Pricing;
