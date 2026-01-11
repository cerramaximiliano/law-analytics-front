import React from "react";
import { useState, Fragment, useEffect } from "react";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import {
	Box,
	Button,
	Chip,
	Container,
	Grid,
	List,
	ListItem,
	ListItemText,
	Stack,
	Switch,
	Typography,
	CircularProgress,
	Alert,
	Paper,
} from "@mui/material";

// third-party
import { motion } from "framer-motion";

// icons
import { Lock } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import ApiService, { Plan, ResourceLimit, PlanFeature } from "store/reducers/ApiService";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";
import { getPlanPricing, formatPrice, getBillingPeriodText, getCurrentEnvironment, cleanPlanDisplayName } from "utils/planPricingUtils";

// ==============================|| PLANES PÚBLICOS ||============================== //

const Plans = () => {
	const theme = useTheme();
	const [timePeriod, setTimePeriod] = useState(true); // true = mensual, false = anual
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null); // Para tracking del plan siendo procesado
	const isDevelopment = getCurrentEnvironment() === "development";

	// breadcrumb items
	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Planes y Precios" }];

	// Obtener los planes al cargar el componente
	useEffect(() => {
		const fetchPlans = async () => {
			try {
				setLoading(true);

				// Log el entorno actual para debug
				const currentEnv = getCurrentEnvironment();
				console.log("📍 Current environment in Plans component:", currentEnv);

				const response = await ApiService.getPublicPlans();
				if (response.success && response.data) {
					// Log detallado de lo que viene del backend
					console.log("📦 Plans received from API:", response.data);
					response.data.forEach((plan: Plan) => {
						console.log(`📋 Plan ${plan.planId}:`, {
							displayName: plan.displayName,
							pricingInfo: plan.pricingInfo,
							environments: plan.environments,
							hasEnvironments: plan.hasEnvironments,
						});
					});

					setPlans(response.data);
				} else {
					setError("No se pudieron cargar los planes");
				}
			} catch (err) {
				setError("Error al cargar los planes. Por favor, intenta más tarde.");
			} finally {
				setLoading(false);
			}
		};

		fetchPlans();
	}, []);

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
	const getPlanStyle = (planId: string, isActive: boolean) => {
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
					...baseStyle,
					bgcolor: theme.palette.secondary.lighter,
				};
			default:
				return baseStyle;
		}
	};

	// Función para obtener el color del botón según el tipo de plan
	const getButtonColor = (planId: string) => {
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
	const getPlanChip = (planId: string, isDefault: boolean, isActive: boolean) => {
		// Si el plan no está activo, mostrar chip de próximamente
		if (!isActive) {
			return <Chip label="Próximamente" color="warning" variant="filled" />;
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

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 15 }, pb: { xs: 5, md: 10 }, position: "relative", overflow: "hidden" }}>
			<PageBackground variant="light" />
			<Container>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<CustomBreadcrumbs items={breadcrumbItems} />
						<Box
							sx={{
								position: "relative",
								mb: 6,
								pb: 6,
								borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							}}
						>
							<motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.5 }}>
								<Typography variant="h1" sx={{ mb: 2 }}>
									Planes y Precios
								</Typography>
								<Typography variant="body1" color="text.secondary">
									Elige el plan que mejor se adapte a tus necesidades
								</Typography>
							</motion.div>
						</Box>
						{!isDevelopment && (
							<Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ mb: 4 }}>
								<Typography variant="subtitle1" color={timePeriod ? "textSecondary" : "textPrimary"}>
									Cobro Anual
								</Typography>
								<Switch checked={timePeriod} onChange={() => setTimePeriod(!timePeriod)} inputProps={{ "aria-label": "container" }} />
								<Typography variant="subtitle1" color={timePeriod ? "textPrimary" : "textSecondary"}>
									Cobro Mensual
								</Typography>
							</Stack>
						)}
					</Grid>

					{/* Si está cargando, mostrar indicador */}
					{loading && (
						<Grid item xs={12}>
							<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
								<CircularProgress />
							</Box>
						</Grid>
					)}

					{/* Si hay error, mostrar mensaje */}
					{error && (
						<Grid item xs={12}>
							<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
								<Alert severity="error">{error}</Alert>
							</Box>
						</Grid>
					)}

					{/* Planes */}
					{!loading && !error && (
						<Grid item container spacing={3} xs={12} alignItems="center">
							{plans.map((plan) => {
								// Obtener la información de precios según el entorno
								const pricing = getPlanPricing(plan);

								// Log para debug de precios
								console.log(`💰 Pricing for ${plan.planId}:`, {
									environment: getCurrentEnvironment(),
									pricing,
									plan,
								});

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
													<Box sx={getPlanStyle(plan.planId, plan.isActive)}>
														<Grid container spacing={3}>
															{/* Mostramos el chip correspondiente */}
															<Grid item xs={12} sx={{ textAlign: "center" }}>
																{getPlanChip(plan.planId, plan.isDefault, plan.isActive)}
															</Grid>
															<Grid item xs={12}>
																<Stack spacing={0} textAlign="center">
																	<Typography variant="h4">{cleanPlanDisplayName(plan.displayName)}</Typography>
																	<Typography>{plan.description}</Typography>
																</Stack>
															</Grid>
															<Grid item xs={12}>
																<Stack spacing={0} alignItems="center">
																	<Typography variant="h2" sx={price}>
																		${displayPrice}
																	</Typography>
																	<Typography variant="h6" color="textSecondary">
																		{getBillingPeriodText(pricing.billingPeriod)}
																	</Typography>
																</Stack>
															</Grid>
															<Grid item xs={12}>
																<Button
																	color={getButtonColor(plan.planId)}
																	variant={plan.planId === "standard" || plan.planId === "premium" ? "contained" : "outlined"}
																	fullWidth
																	href={plan.isActive && !loadingPlanId ? "/login" : undefined}
																	disabled={!plan.isActive || loadingPlanId !== null}
																	onClick={() => {
																		if (plan.isActive) {
																			setLoadingPlanId(plan.planId);
																		}
																	}}
																	startIcon={
																		!plan.isActive ? (
																			<Lock size={16} />
																		) : loadingPlanId === plan.planId ? (
																			<CircularProgress size={16} color="inherit" />
																		) : undefined
																	}
																>
																	{!plan.isActive ? "No disponible" : loadingPlanId === plan.planId ? "Procesando..." : "Comenzar"}
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
															// Features y recursos a ocultar temporalmente
															const hiddenFeatures = ["teams"];
															const hiddenResources = ["teamMembers"];

															// Mapear recursos a objetos con información común (filtrando los ocultos)
															const resourceItems = plan.resourceLimits
																.filter((resource) => !hiddenResources.includes(resource.name))
																.map((resource) => ({
																	type: "resource" as const,
																	enabled: true,
																	description: planFeatureValue(plan, resource.name) || "",
																	name: resource.name,
																}));

															// Mapear características a objetos con información común (filtrando las ocultas)
															const featureItems = plan.features
																.filter((feature) => !hiddenFeatures.includes(feature.name))
																.map((feature) => ({
																	type: "feature" as const,
																	enabled: feature.enabled,
																	description: feature.enabled ? feature.description : getDefaultFeatureText(feature.name),
																	name: feature.name,
																}));

															// Combinar ambos arreglos
															const allItems = [...resourceItems, ...featureItems];

															// Ordenar: primero por enabled (true primero), luego alfabéticamente por description
															const sortedItems = allItems.sort((a, b) => {
																// Primero ordenar por enabled (true antes que false)
																if (a.enabled !== b.enabled) {
																	return a.enabled ? -1 : 1;
																}
																// Luego ordenar alfabéticamente por description
																return a.description.localeCompare(b.description, "es", { sensitivity: "base" });
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
					)}
				</Grid>
			</Container>
		</Box>
	);
};

export default Plans;
