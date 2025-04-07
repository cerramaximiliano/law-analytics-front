import { useState, Fragment, useEffect } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
	Box, Button, Chip, Grid, List, ListItem, ListItemText,
	Stack, Switch, Typography, CircularProgress, Alert
} from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import ApiService, { Plan, ResourceLimit, PlanFeature } from "store/reducers/ApiService";

// ==============================|| PRICING ||============================== //

const featureOrder = [
	"folders",       // Causas
	"calculators",   // Cálculos
	"contacts",      // Contactos
	"storage",       // Almacenamiento
	"exportReports",     // Exportación de reportes
	"bulkOperations",    // Operaciones masivas
	"advancedAnalytics", // Análisis avanzados
	"taskAutomation",    // Automatización de tareas
	"prioritySupport"    // Soporte prioritario
]


const Pricing = () => {
	const theme = useTheme();
	const [timePeriod, setTimePeriod] = useState(true); // true = mensual, false = anual
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  
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
			  subscription?: { plan: string } 
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
		const response = await ApiService.subscribeToPlan(planId);
		if (response.success && response.data?.checkoutUrl) {
		  window.location.href = response.data.checkoutUrl;
		} else {
		  alert("Error al iniciar el proceso de suscripción");
		}
	  } catch (error) {
		console.error("Error al suscribirse:", error);
		alert("Error al procesar la solicitud de suscripción");
	  }
	};
  
	// Obtener un orden global para todas las características
	// Primero las habilitadas en cualquier plan, luego las no habilitadas
	const getGlobalFeatureOrder = () => {
	  if (!plans.length) return [];
	  
	  // Recopilar todos los tipos de características
	  const allFeatureTypes = featureOrder.filter(type => {
		return plans.some(plan => {
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
	  const disabledTypes = featureOrder.filter(type => !allFeatureTypes.includes(type));
	  
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
  
	// Estilos
	const priceListDisable = {
	  opacity: 0.4,
	  textDecoration: "line-through",
	};
  
	const priceActivePlan = {
	  padding: 3,
	  borderRadius: 1,
	  bgcolor: theme.palette.primary.lighter,
	};
	
	const price = {
	  fontSize: "40px",
	  fontWeight: 700,
	  lineHeight: 1,
	};
  
	// Si está cargando, mostrar indicador
	if (loading) {
	  return (
		<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
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
			
			// Calcular el precio según el periodo seleccionado
			const displayPrice = !timePeriod && plan.pricingInfo.billingPeriod === 'monthly' 
			  ? Math.round(plan.pricingInfo.basePrice * 12 * 0.75) // Descuento anual del 25%
			  : plan.pricingInfo.basePrice;
			
			return (
			  <Grid item xs={12} sm={6} md={4} key={plan.planId}>
				<MainCard>
				  <Grid container spacing={3}>
					<Grid item xs={12}>
					  <Box sx={isCurrentPlan ? priceActivePlan : (plan.planId === "standard" ? { 
						padding: 3,
						borderRadius: 1,
						bgcolor: theme.palette.success.lighter
					  } : { padding: 3 })}>
						<Grid container spacing={3}>
						{(plan.isDefault || isCurrentPlan || plan.planId === "standard") && (
							<Grid item xs={12} sx={{ textAlign: "center" }}>
							  <Chip 
								label={isCurrentPlan ? "Plan Actual" : (plan.planId === "standard" ? "Popular" : "Predeterminado")} 
								color={isCurrentPlan ? "primary" : (plan.planId === "standard" ? "success" : "default")} 
							  />
							</Grid>
						  )}
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
							  color={isCurrentPlan ? "primary" : (plan.planId === "standard" ? "success" : "secondary")} 
							  variant={isCurrentPlan || plan.planId === "standard" ? "contained" : "outlined"} 
							  fullWidth
							  disabled={isCurrentPlan}
							  onClick={() => handleSubscribe(plan.planId)}
							>
							  {isCurrentPlan ? "Plan Actual" : "Suscribirme"}
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
								  sx={{ textAlign: "center", fontWeight: hasFeature ? 'medium' : 'normal' }} 
								/>
							  </ListItem>
							</Fragment>
						  );
						})}
					  </List>
					</Grid>
				  </Grid>
				</MainCard>
			  </Grid>
			);
		  })}
		</Grid>
	  </Grid>
	);
  };
  
  export default Pricing;