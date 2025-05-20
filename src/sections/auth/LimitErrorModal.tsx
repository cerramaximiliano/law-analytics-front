import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Box,
	Typography,
	Stack,
	Divider,
	Paper,
	useTheme,
	Grid,
	Chip,
	List,
	ListItem,
	ListItemText,
	CircularProgress,
	Alert,
	alpha
} from "@mui/material";
import { Lock, ArrowRight, TickCircle, CloseCircle, Crown } from "iconsax-react";
// Importar MainCard desde el componente personalizado
import MainCard from "components/MainCard";
// Importar el servicio API para obtener planes dinámicamente
import ApiService, { Plan } from "store/reducers/ApiService";

interface LimitInfo {
	resourceType: string;
	plan: string;
	currentCount: string;
	limit: number;
}

interface FeatureInfo {
	feature: string;
	plan: string;
	availableIn: string[];
}

interface LimitErrorModalProps {
	open: boolean;
	onClose: () => void;
	message: string;
	limitInfo?: LimitInfo;
	featureInfo?: FeatureInfo;
	upgradeRequired?: boolean;
}

export const LimitErrorModal: React.FC<LimitErrorModalProps> = ({
	open,
	onClose,
	message,
	limitInfo,
	featureInfo,
	upgradeRequired = false,
}) => {
	const navigate = useNavigate();
	const theme = useTheme();
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Cargar planes cuando se abra el modal
	useEffect(() => {
		const fetchPlans = async () => {
			if (!open) return;

			try {
				setLoading(true);
				setError(null);
				const response = await ApiService.getPublicPlans();
				if (response.success && response.data) {
					setPlans(response.data);
				} else {
					setError("No se pudieron cargar los planes");
				}
			} catch (err) {
				console.error("Error al cargar los planes:", err);
				setError("Error al cargar los planes. Por favor, intenta más tarde.");
			} finally {
				setLoading(false);
			}
		};

		fetchPlans();
	}, [open]);

	const handleUpgrade = (planId?: string) => {
		onClose();
		if (planId) {
			navigate(`/suscripciones/tables?plan=${planId}`);
		} else {
			navigate("/suscripciones/tables");
		}
	};

	// Gestor de estado simplificado del modal
	// No intentamos cerrar otros modales desde aquí - eso lo maneja ServerContext
	const modalOpenedRef = React.useRef(false);

	// Registrar la apertura y cierre del modal
	React.useEffect(() => {
		if (open && !modalOpenedRef.current) {
			console.log("LimitErrorModal: Modal de restricción de plan abierto");
			modalOpenedRef.current = true;
		}

		// Limpiar referencia al cerrar
		if (!open) {
			modalOpenedRef.current = false;
		}
	}, [open]);

	const isLimitError = !!limitInfo;
	const isFeatureError = !!featureInfo;

	const getTitle = () => {
		if (isFeatureError) {
			return "Función no disponible";
		}
		if (isLimitError) {
			return "Límite alcanzado";
		}
		return "Restricción del plan";
	};

	// Determinar planes recomendados según el error
	const getRecommendedPlans = () => {
		if (plans.length === 0) return [];

		let currentUserPlan = "free";

		if (isLimitError && limitInfo) {
			currentUserPlan = limitInfo.plan.toLowerCase();
		} else if (isFeatureError && featureInfo) {
			currentUserPlan = featureInfo.plan.toLowerCase();
		}

		// Filtrar planes según el plan actual del usuario
		return plans.filter((plan) => plan.planId.toLowerCase() !== currentUserPlan);
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

	const getContentMessage = () => {
		if (isLimitError && limitInfo) {

			return (
				<Paper
					elevation={0}
					sx={{
						mb: 2,
						p: 3,
						borderRadius: 2,
						maxWidth: "540px",
						mx: "auto",
						bgcolor: theme.palette.mode === "dark" ? "background.paper" : "grey.50",
						border: `1px solid ${theme.palette.divider}`,
					}}
				>
					<Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
						{message}
					</Typography>
					<Stack spacing={2.5}>
						<Box>
							<Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
								<Typography variant="body2">{limitInfo.resourceType}</Typography>
							</Box>
							<Divider />
						</Box>

						<Box sx={{ mt: 2 }}>
							<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
								<Typography variant="body2" color="text.secondary">
									<strong>Uso actual:</strong>
								</Typography>
								<Typography variant="body2" fontWeight="medium" >
									{limitInfo.currentCount} / {limitInfo.limit}
								</Typography>
							</Box>
						</Box>
					</Stack>
				</Paper>
			);
		}

		if (isFeatureError && featureInfo) {
			return (
				<Paper
					elevation={0}
					sx={{
						mb: 2,
						p: 3,
						borderRadius: 2,
						maxWidth: "540px",
						mx: "auto",
						bgcolor: theme.palette.mode === "dark" ? "background.paper" : "grey.50",
						border: `1px solid ${theme.palette.divider}`,
					}}
				>
					<Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
						{message}
					</Typography>
					<Stack spacing={2.5}>
						<Box>
							<Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
								<Typography variant="body2" color="text.secondary">
									<strong>Función:</strong>
								</Typography>
								<Typography variant="body2">{featureInfo.feature}</Typography>
							</Box>
							<Divider />
						</Box>

						<Box>
							<Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
								<Typography variant="body2" color="text.secondary">
									<strong>Tu plan:</strong>
								</Typography>
								<Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
									<Crown size={16} variant="Bulk" color={theme.palette.primary.main} />
									{featureInfo.plan}
								</Typography>
							</Box>
							<Divider />
						</Box>

						{featureInfo.availableIn.length > 0 && (
							<Box>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
									<strong>Planes que incluyen esta función:</strong>
								</Typography>
								<Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
									{featureInfo.availableIn.map((plan, index) => (
										<Box
											key={index}
											sx={{
												display: "inline-flex",
												alignItems: "center",
												px: 1.5,
												py: 0.5,
												border: `1px solid ${theme.palette.primary.light}`,
												borderRadius: 1,
												bgcolor: theme.palette.primary.lighter,
												color: theme.palette.primary.dark,
												fontSize: "0.75rem",
												gap: 0.5,
											}}
										>
											<Crown size={14} variant="Bulk" />
											{plan}
										</Box>
									))}
								</Stack>
							</Box>
						)}
					</Stack>
				</Paper>
			);
		}

		return (
			<Alert
				severity="warning"
				icon={<Lock variant="Bulk" size={24} color={theme.palette.warning.main} />}
				sx={{
					mb: 2,
					width: "100%",
					maxWidth: "700px",
					mx: "auto",
				}}
			>
				{message || "Acceso denegado: Esta característica no está disponible en tu plan actual."}
			</Alert>
		);
	};

	// Renderizado de planes
	const renderPlansList = () => {
		if (loading) {
			return (
				<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
					<CircularProgress />
				</Box>
			);
		}

		if (error) {
			return <Alert severity="error">{error}</Alert>;
		}

		if (plans.length === 0) {
			return <Alert severity="info">No hay planes disponibles en este momento.</Alert>;
		}

		const recommendedPlans = getRecommendedPlans();

		return (
			<Grid container spacing={2}>
				<Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 0 }}>
					<Grid
						container
						spacing={2}
						justifyContent="center"
						sx={{
							maxWidth: "100%",
							margin: "auto",
						}}
					>
						{recommendedPlans.map((plan) => {
							// Usar siempre el precio mensual
							const displayPrice = plan.pricingInfo.basePrice;

							return (
								<Grid item xs={12} sm={6} md={recommendedPlans.length <= 2 ? 5 : 4} key={plan.planId}>
									<MainCard
										elevation={2}
										sx={{
											height: "100%",
											minHeight: "380px",
											overflow: "visible",
											transition: "all 0.3s ease-in-out",
											"&:hover": {
												transform: "translateY(-5px)",
												boxShadow: theme.shadows[10],
											},
										}}
									>
										<Grid container spacing={1}>
											<Grid item xs={12}>
												<Box
													sx={{
														...getPlanStyle(plan.planId, false),
														pt: 2,
														pb: 2,
													}}
												>
													<Grid container spacing={1}>
														{/* Mostramos el chip correspondiente */}
														<Grid item xs={12} sx={{ textAlign: "center" }}>
															{getPlanChip(plan.planId, false, plan.isDefault)}
														</Grid>
														<Grid item xs={12}>
															<Stack spacing={0} textAlign="center">
																<Typography variant="h4">{plan.displayName}</Typography>
															</Stack>
														</Grid>
														<Grid item xs={12}>
															<Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
																<Typography variant="h2" sx={price}>
																	${displayPrice}
																</Typography>
																<Typography variant="h6" color="textSecondary" sx={{ ml: 1 }}>
																	/mes
																</Typography>
															</Box>
														</Grid>
														<Grid item xs={12}>
															<Button
																color={getButtonColor(plan.planId, false)}
																variant={
																	plan.planId.toLowerCase() === "standard" || plan.planId.toLowerCase() === "premium"
																		? "contained"
																		: "outlined"
																}
																fullWidth
																onClick={() => handleUpgrade(plan.planId)}
																endIcon={<ArrowRight size={16} />}
																size="medium"
																sx={{
																	py: 1,
																	fontWeight: 600,
																	transition: "all 0.3s ease-in-out",
																	"&:hover": {
																		transform: "scale(1.02)",
																	},
																}}
															>
																Suscribirme Ahora
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
															py: 0.4,
														},
														maxHeight: "180px",
														overflowY: "auto",
														"&::-webkit-scrollbar": {
															width: "6px",
														},
														"&::-webkit-scrollbar-track": {
															backgroundColor: alpha(theme.palette.background.paper, 0.1),
														},
														"&::-webkit-scrollbar-thumb": {
															backgroundColor: alpha(theme.palette.primary.main, 0.2),
															borderRadius: "6px",
														},
													}}
													component="ul"
												>
													{/* Primero mostrar los recursos del plan */}
													{plan.resourceLimits.map((resource, i) => {
														// Formatear la descripción del recurso de forma legible
														let formattedDescription;
														switch (resource.name) {
															case "folders":
																formattedDescription = `+${resource.limit} Causas`;
																break;
															case "calculators":
																formattedDescription = `+${resource.limit} Cálculos`;
																break;
															case "contacts":
																formattedDescription = `+${resource.limit} Contactos`;
																break;
															case "storage":
																formattedDescription = `${resource.limit} MB de Almacenamiento`;
																break;
															default:
																// Capitalizar el nombre del recurso
																const displayName = resource.name.charAt(0).toUpperCase() + resource.name.slice(1);
																formattedDescription = `${resource.limit} ${displayName}`;
														}

														return (
															<React.Fragment key={`resource-${i}`}>
																<ListItem>
																	<ListItemText primary={formattedDescription} sx={{ textAlign: "center", fontWeight: "medium" }} />
																</ListItem>
															</React.Fragment>
														);
													})}

													{/* Luego mostrar las características en orden: habilitadas primero, deshabilitadas después */}
													{[...plan.features]
														.sort((a, b) => {
															// Ordenar: enabled (true) primero, luego disabled (false)
															if (a.enabled === b.enabled) return 0;
															return a.enabled ? -1 : 1;
														})
														.map((feature, i) => (
															<React.Fragment key={`feature-${i}`}>
																<ListItem sx={!feature.enabled ? priceListDisable : {}}>
																	<Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center", gap: 1 }}>
																		{feature.enabled ? (
																			<TickCircle size={16} variant="Bold" color={theme.palette.success.main} />
																		) : (
																			<CloseCircle size={16} variant="Bold" color={theme.palette.text.disabled} />
																		)}
																		<ListItemText
																			primary={feature.description}
																			sx={{ textAlign: "center", fontWeight: feature.enabled ? "medium" : "normal" }}
																		/>
																	</Box>
																</ListItem>
															</React.Fragment>
														))}
												</List>
											</Grid>
										</Grid>
									</MainCard>
								</Grid>
							);
						})}
					</Grid>
				</Box>
			</Grid>
		);
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			TransitionProps={{
				timeout: 400,
			}}
			PaperProps={{
				sx: {
					borderRadius: 3,
					overflow: "hidden",
					maxWidth: { xs: "95%", sm: "85%", md: "800px" },
					maxHeight: "90vh",
					margin: "auto",
					boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
				},
			}}
		>
			<DialogTitle
				sx={{
					bgcolor: theme.palette.primary.lighter,
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Stack spacing={1}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<Crown size={24} variant="Bulk" color={theme.palette.primary.main} />
						<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
							{getTitle()}
						</Typography>
					</Stack>
					<Typography variant="body2" color="textSecondary">
						Se requiere actualizar tu plan para continuar
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />

			<DialogContent
				sx={{
					p: 2.5,
					pb: 3,
					bgcolor: theme.palette.mode === "dark" ? alpha(theme.palette.background.default, 0.8) : alpha(theme.palette.grey[50], 0.8),
				}}
			>
				<Box sx={{ mx: "auto" }}>
					<Box sx={{ maxWidth: "600px", mx: "auto", mb: 2 }}>
						{getContentMessage()}
					</Box>
					{renderPlansList()}
				</Box>
			</DialogContent>

			<Divider />

			<DialogActions
				sx={{
					p: 2.5,
					bgcolor: theme.palette.background.default,
					borderTop: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Grid container justifyContent="flex-end" alignItems="center">
					<Grid item>
						<Button
							onClick={onClose}
							color="error"
							sx={{
								minWidth: 100,
							}}
						>
							Cerrar
						</Button>
					</Grid>
				</Grid>
			</DialogActions>
		</Dialog>
	);
};
