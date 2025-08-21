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

// ==============================|| PLANES PÚBLICOS ||============================== //

const featureOrder = [
	"folders", // Causas
	"calculators", // Cálculos
	"contacts", // Contactos
	"storage", // Almacenamiento
	"exportReports", // Exportación de reportes
	"bulkOperations", // Operaciones masivas
	"advancedAnalytics", // Análisis avanzados
	"taskAutomation", // Automatización de tareas
	"prioritySupport", // Soporte prioritario
];

const Plans = () => {
	const theme = useTheme();
	const [timePeriod, setTimePeriod] = useState(true); // true = mensual, false = anual
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [plans, setPlans] = useState<Plan[]>([]);

	// breadcrumb items
	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Planes y Precios" }];

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
			} catch (err) {
				setError("Error al cargar los planes. Por favor, intenta más tarde.");
			} finally {
				setLoading(false);
			}
		};

		fetchPlans();
	}, []);

	// Obtener un orden global para todas las características
	const getGlobalFeatureOrder = () => {
		if (!plans.length) return [];

		// Recopilar todos los tipos de características
		const allFeatureTypes = featureOrder.filter((type) => {
			return plans.some((plan) => {
				// Verificar límites de recursos
				if (["folders", "calculators", "contacts", "storage"].includes(type)) {
					const resource = plan.resourceLimits.find((r: ResourceLimit) => r.name === type);
					return resource && resource.limit > 0;
				}
				// Verificar características
				const feature = plan.features.find((f: PlanFeature) => f.name === type);
				return feature && feature.enabled;
			});
		});

		// Recopilar los tipos que no están habilitados en ningún plan
		const disabledTypes = featureOrder.filter((type) => !allFeatureTypes.includes(type));

		// Combinar ambas listas
		return [...allFeatureTypes, ...disabledTypes];
	};

	// Verificar si un plan tiene una característica específica y obtener su valor
	const planFeatureValue = (plan: Plan, featureType: string) => {
		// Para límites de recursos
		if (featureType === "folders") {
			const folders = plan.resourceLimits.find((r: ResourceLimit) => r.name === "folders");
			return folders ? `+${folders.limit} Causas` : null;
		}

		if (featureType === "calculators") {
			const calculators = plan.resourceLimits.find((r: ResourceLimit) => r.name === "calculators");
			return calculators ? `+${calculators.limit} Cálculos` : null;
		}

		if (featureType === "contacts") {
			const contacts = plan.resourceLimits.find((r: ResourceLimit) => r.name === "contacts");
			return contacts ? `+${contacts.limit} Contactos` : null;
		}

		if (featureType === "storage") {
			const storage = plan.resourceLimits.find((r: ResourceLimit) => r.name === "storage");
			return storage ? `${storage.limit} MB de Almacenamiento` : null;
		}

		// Para características booleanas
		const feature = plan.features.find((f: PlanFeature) => f.name === featureType);
		if (feature) {
			return feature.enabled ? feature.description : null;
		}

		return null;
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

	// Obtener texto predeterminado para un tipo de característica
	const getDefaultFeatureText = (featureType: string): string => {
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
				// Buscar la descripción en cualquier plan
				for (const plan of plans) {
					const feature = plan.features.find((f: PlanFeature) => f.name === featureType);
					if (feature) {
						return feature.description;
					}
				}
				return featureType; // Si no se encuentra una descripción, usar el nombre del tipo
		}
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
						<Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ mb: 4 }}>
							<Typography variant="subtitle1" color={timePeriod ? "textSecondary" : "textPrimary"}>
								Cobro Anual
							</Typography>
							<Switch checked={timePeriod} onChange={() => setTimePeriod(!timePeriod)} inputProps={{ "aria-label": "container" }} />
							<Typography variant="subtitle1" color={timePeriod ? "textPrimary" : "textSecondary"}>
								Cobro Mensual
							</Typography>
						</Stack>
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
								// Calcular el precio según el periodo seleccionado
								const displayPrice =
									!timePeriod && plan.pricingInfo.billingPeriod === "monthly"
										? Math.round(plan.pricingInfo.basePrice * 12 * 0.75) // Descuento anual del 25%
										: plan.pricingInfo.basePrice;

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
																	color={getButtonColor(plan.planId)}
																	variant={plan.planId === "standard" || plan.planId === "premium" ? "contained" : "outlined"}
																	fullWidth
																	href={plan.isActive ? "/login" : undefined}
																	disabled={!plan.isActive}
																	startIcon={!plan.isActive ? <Lock size={16} /> : undefined}
																>
																	{plan.isActive ? "Comenzar" : "No disponible"}
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
														{/* Mostrar todas las características en el mismo orden para todos los planes */}
														{getGlobalFeatureOrder().map((featureType, i) => {
															const featureValue = planFeatureValue(plan, featureType);
															const hasFeature = !!featureValue;

															return (
																<Fragment key={i}>
																	<ListItem sx={!hasFeature ? priceListDisable : {}}>
																		<ListItemText
																			primary={hasFeature ? featureValue : getDefaultFeatureText(featureType)}
																			sx={{ textAlign: "center", fontWeight: hasFeature ? "medium" : "normal" }}
																		/>
																	</ListItem>
																</Fragment>
															);
														})}
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
