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

// project-imports
import MainCard from "components/MainCard";
import ApiService, { Plan, ResourceLimit, PlanFeature } from "store/reducers/ApiService";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import TabLegalDocuments from "./TabPanel";

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
	// Estado para el diálogo de documentos legales
	const [legalDocsDialogOpen, setLegalDocsDialogOpen] = useState(false);
	// Estado para el diálogo de opciones de downgrade
	const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
	const [downgradeOptions, setDowngradeOptions] = useState<DowngradeOption[]>([]);
	const [selectedOption, setSelectedOption] = useState<string>("");
	const [targetPlanId, setTargetPlanId] = useState<string>("");

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
						subscription?: { plan: string };
					};

					if (responseData.success && responseData.subscription) {
						// El planId está en el campo "plan" de la suscripción
						setCurrentPlanId(responseData.subscription.plan);
					}
				} catch (err) {
					console.error("Error al obtener suscripción actual:", err);
					// No mostramos error si falla esto, solo para el listado de planes
				}
			} catch (err) {
				setError("Error al cargar los planes. Por favor, intenta más tarde.");
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchPlans();
	}, []);

	const handleSubscribe = async (planId: string) => {
		try {
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
			const response = (await ApiService.subscribeToPlan(planId, successUrl, errorUrl)) as any;

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
				console.log("Redirigiendo a URL de Stripe:", response.url);
				window.location.href = response.url;
			} else if (response.success && response.sessionId) {
				// En caso de que solo devuelva el sessionId sin URL
				console.log("Obtenido sessionId de Stripe:", response.sessionId);
				alert("Proceso de suscripción iniciado. Serás redirigido a la página de pago.");
			}
			// Caso para suscripción pendiente de cancelación (no relacionado con plan gratuito)
			else if (response.success && response.pendingCancellation) {
				console.log("Suscripción pendiente de cancelación detectada");
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
				// Respuesta exitosa pero sin URL ni sessionId
				console.log("Respuesta exitosa sin URL ni sessionId");
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Operación completada, pero no se pudo iniciar el proceso de pago.",
						variant: "alert",
						alert: {
							color: "warning",
						},
						close: false,
					}),
				);
			} else {
				// Respuesta no exitosa
				console.error("Error en la respuesta:", response);
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
			console.error("Error al suscribirse:", error);
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

				// Actualizar la página para reflejar los cambios
				setTimeout(() => {
					window.location.reload();
				}, 1500);
			} else {
				throw new Error(response.message || "Error al procesar la solicitud");
			}
		} catch (error) {
			console.error("Error al procesar la opción:", error);
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
			switch (featureType) {
				case "folders":
					return `+${resource.limit} Causas`;
				case "calculators":
					return `+${resource.limit} Cálculos`;
				case "contacts":
					return `+${resource.limit} Contactos`;
				case "storage":
					return `${resource.limit} MB de Almacenamiento`;
				default:
					// Capitalizar el nombre del recurso
					const displayName = resource.name.charAt(0).toUpperCase() + resource.name.slice(1);
					return `${resource.limit} ${displayName}`;
			}
		}

		// Para características booleanas
		const feature = plan.features.find((f: PlanFeature) => f.name === featureType);
		if (feature) {
			return feature.enabled ? feature.description : null;
		}

		return null;
	};

	// Función para obtener el texto predeterminado para características deshabilitadas
	const getDefaultFeatureText = (featureType: string): string => {
		// Primero buscar si es un recurso en algún plan para obtener su descripción
		for (const plan of plans) {
			const resource = plan.resourceLimits.find((r: ResourceLimit) => r.name === featureType);
			if (resource) {
				switch (featureType) {
					case "folders":
						return "+0 Causas";
					case "calculators":
						return "+0 Cálculos";
					case "contacts":
						return "+0 Contactos";
					case "storage":
						return "0 MB de Almacenamiento";
					default:
						const displayName = resource.name.charAt(0).toUpperCase() + resource.name.slice(1);
						return `0 ${displayName}`;
				}
			}
		}

		// Buscar si es una característica en algún plan para obtener su descripción
		for (const plan of plans) {
			const feature = plan.features.find((f: PlanFeature) => f.name === featureType);
			if (feature) {
				return feature.description;
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
	const getPlanStyle = (planId: string, isCurrentPlan: boolean) => {
		if (isCurrentPlan) {
			return {
				padding: 3,
				borderRadius: 1,
				bgcolor: theme.palette.primary.lighter,
			};
		}

		switch (planId) {
			case "free":
				return {
					padding: 3,
					borderRadius: 1,
					bgcolor: theme.palette.info.lighter,
				};
			case "standard":
				return {
					padding: 3,
					borderRadius: 1,
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
	const getPlanChip = (planId: string, isCurrentPlan: boolean, isDefault: boolean) => {
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
			<Grid item xs={12}>
				<Stack spacing={2} direction={{ xs: "column", md: "row" }} justifyContent="space-between">
					<Stack spacing={0}></Stack>
					<Stack direction="row" spacing={1.5} alignItems="center">
						<Typography variant="subtitle1" color={timePeriod ? "textSecondary" : "textPrimary"}>
							Cobro Anual
						</Typography>
						<Switch checked={timePeriod} onChange={() => setTimePeriod(!timePeriod)} inputProps={{ "aria-label": "container" }} />
						<Typography variant="subtitle1" color={timePeriod ? "textPrimary" : "textSecondary"}>
							Cobro Mensual
						</Typography>
					</Stack>
				</Stack>
			</Grid>
			<Grid item container spacing={3} xs={12} alignItems="center">
				{plans.map((plan) => {
					// Determinar si este es el plan activo del usuario
					const isCurrentPlan = currentPlanId === plan.planId;

					// Determinar si es plan Free y hay otro plan activo (para el caso de downgrade)
					const isDowngradeToFree = plan.planId === "free" && currentPlanId && currentPlanId !== "free";

					// Calcular el precio según el periodo seleccionado
					const displayPrice =
						!timePeriod && plan.pricingInfo.billingPeriod === "monthly"
							? Math.round(plan.pricingInfo.basePrice * 12 * 0.75) // Descuento anual del 25%
							: plan.pricingInfo.basePrice;

					return (
						<Grid item xs={12} sm={6} md={4} key={plan.planId}>
							<MainCard>
								<Grid container spacing={3}>
									<Grid item xs={12}>
										<Box sx={getPlanStyle(plan.planId, isCurrentPlan)}>
											<Grid container spacing={3}>
												{/* Mostramos el chip correspondiente */}
												<Grid item xs={12} sx={{ textAlign: "center" }}>
													{getPlanChip(plan.planId, isCurrentPlan, plan.isDefault)}
												</Grid>
												<Grid item xs={12}>
													<Stack spacing={0} textAlign="center">
														<Typography variant="h4">{plan.displayName}</Typography>
														<Typography>{plan.description}</Typography>
													</Stack>
												</Grid>
												<Grid item xs={12}>
													<Stack spacing={0} alignItems="center">
														<Typography variant="h2" sx={price}>
															${displayPrice}
														</Typography>
														<Typography variant="h6" color="textSecondary">
															{timePeriod ? "/mes" : "/año"}
														</Typography>
													</Stack>
												</Grid>
												<Grid item xs={12}>
													<Button
														color={getButtonColor(plan.planId, isCurrentPlan)}
														variant={isCurrentPlan || plan.planId === "standard" || plan.planId === "premium" ? "contained" : "outlined"}
														fullWidth
														disabled={isCurrentPlan}
														onClick={() => handleSubscribe(plan.planId)}
													>
														{isCurrentPlan ? "Plan Actual" : isDowngradeToFree ? "Bajar a Free" : "Suscribirme"}
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
											{/* Primero mostrar los recursos del plan actual */}
											{plan.resourceLimits.map((resource, i) => (
												<Fragment key={`resource-${i}`}>
													<ListItem>
														<ListItemText
															primary={planFeatureValue(plan, resource.name)}
															sx={{ textAlign: "center", fontWeight: "medium" }}
														/>
													</ListItem>
												</Fragment>
											))}

											{/* Luego mostrar las características en orden: habilitadas primero, deshabilitadas después */}
											{[...plan.features]
												.sort((a, b) => {
													// Ordenar: enabled (true) primero, luego disabled (false)
													if (a.enabled === b.enabled) return 0;
													return a.enabled ? -1 : 1;
												})
												.map((feature, i) => (
													<Fragment key={`feature-${i}`}>
														<ListItem sx={!feature.enabled ? priceListDisable : {}}>
															<ListItemText
																primary={feature.enabled ? feature.description : getDefaultFeatureText(feature.name)}
																sx={{ textAlign: "center", fontWeight: feature.enabled ? "medium" : "normal" }}
															/>
														</ListItem>
													</Fragment>
												))}
										</List>
									</Grid>
								</Grid>
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
			<Dialog open={legalDocsDialogOpen} onClose={handleCloseLegalDocs} maxWidth="lg" fullWidth>
				<DialogContent sx={{ p: 0 }}>
					<TabLegalDocuments />
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseLegalDocs} color="error">
						Cerrar
					</Button>
				</DialogActions>
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
		</Grid>
	);
};

export default Pricing;
