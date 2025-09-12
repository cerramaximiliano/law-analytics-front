import React from "react";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
	Button,
	Box,
	Container,
	Grid,
	Stack,
	Typography,
	useMediaQuery,
	LinearProgress,
	Fade,
	Zoom,
	Paper,
	Chip,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	alpha,
} from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { fetchUserStats } from "store/reducers/userStats";
import { updateUser } from "store/reducers/auth";
import ApiService from "store/reducers/ApiService";

// assets
import { TickCircle, Star1, Flash, Crown, ArrowRight2 } from "iconsax-react";
import target from "assets/images/analytics/target.svg";

// ==============================|| SUBSCRIPTION SUCCESS ||============================== //

const SubscriptionSuccess = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));

	const [showContent, setShowContent] = useState(false);
	const [showFeatures, setShowFeatures] = useState(false);
	const [redirectCountdown, setRedirectCountdown] = useState(10);

	const user = useSelector((state) => state.auth.user);
	const userStats = useSelector((state) => state.userStats.data);

	useEffect(() => {
		// Mostrar notificación de éxito
		dispatch(
			openSnackbar({
				open: true,
				message: "¡Suscripción completada exitosamente!",
				variant: "alert",
				alert: {
					color: "success",
				},
				close: false,
			}),
		);

		// Sincronizar suscripción como fallback (en caso de que el webhook falle)
		const syncSubscription = async () => {
			try {
				const response = await ApiService.syncSubscription();
				
				if (response.success && response.user) {
					// Actualizar usuario en Redux con la información sincronizada
					dispatch(updateUser(response.user));
					
					// Si hay stats, actualizarlos también
					if (response.userStats) {
						// Actualizar los stats con la estructura correcta
						dispatch({
							type: "FETCH_USER_STATS_SUCCESS",
							payload: {
								totalFolders: response.userStats.totalFolders,
								totalContacts: response.userStats.totalContacts,
								totalCalculators: response.userStats.totalCalculators,
								planInfo: response.userStats.planInfo
							}
						});
					}
					
					console.log("Suscripción sincronizada exitosamente");
				}
			} catch (error) {
				// Error silencioso - no interrumpir la experiencia del usuario
				console.error("Error al sincronizar suscripción:", error);
			}
		};

		// Ejecutar sincronización
		syncSubscription();

		// Actualizar stats del usuario (puede obtener datos adicionales)
		dispatch(fetchUserStats());

		// Animaciones escalonadas
		setTimeout(() => setShowContent(true), 300);
		setTimeout(() => setShowFeatures(true), 800);

		// Countdown para redirección automática
		const timer = setInterval(() => {
			setRedirectCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					navigate("/dashboard/default");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [navigate]);

	// Características del plan (podrías personalizarlas según el plan adquirido)
	const planFeatures = [
		{ icon: <Crown />, text: "Acceso completo a todas las funciones premium" },
		{ icon: <Flash />, text: "Sin límites en carpetas y contactos" },
		{ icon: <Star1 />, text: "Soporte prioritario 24/7" },
		{ icon: <TickCircle />, text: "Almacenamiento ampliado" },
	];

	return (
		<Container fixed>
			<Grid container spacing={4} alignItems="center" justifyContent="center" sx={{ minHeight: "calc(100vh - 200px)", py: 4 }}>
				<Grid item xs={12} lg={10} xl={8}>
					<Fade in={showContent} timeout={1000}>
						<MainCard
							sx={{
								background: `linear-gradient(135deg, ${alpha(theme.palette.success.lighter, 0.1)} 0%, ${alpha(
									theme.palette.background.paper,
									0.9,
								)} 100%)`,
								border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
								boxShadow: `0 20px 60px ${alpha(theme.palette.success.main, 0.1)}`,
							}}
						>
							<Grid container spacing={4} alignItems="center">
								{/* Sección de imagen/icono */}
								<Grid item xs={12} md={5}>
									<Zoom in={showContent} timeout={1500}>
										<Box
											sx={{
												position: "relative",
												p: matchDownSM ? 3 : 5,
												bgcolor: `linear-gradient(135deg, ${theme.palette.success.lighter} 0%, ${alpha(
													theme.palette.success.light,
													0.3,
												)} 100%)`,
												textAlign: "center",
												borderRadius: 3,
												overflow: "hidden",
												"&::before": {
													content: '""',
													position: "absolute",
													top: -50,
													right: -50,
													width: 150,
													height: 150,
													borderRadius: "50%",
													bgcolor: alpha(theme.palette.success.main, 0.1),
												},
												"&::after": {
													content: '""',
													position: "absolute",
													bottom: -30,
													left: -30,
													width: 100,
													height: 100,
													borderRadius: "50%",
													bgcolor: alpha(theme.palette.success.main, 0.08),
												},
											}}
										>
											<Avatar
												sx={{
													width: 120,
													height: 120,
													margin: "0 auto 20px",
													bgcolor: theme.palette.success.main,
													animation: "pulse 2s infinite",
													"@keyframes pulse": {
														"0%": {
															transform: "scale(1)",
															boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0.7)}`,
														},
														"70%": {
															transform: "scale(1.05)",
															boxShadow: `0 0 0 20px ${alpha(theme.palette.success.main, 0)}`,
														},
														"100%": {
															transform: "scale(1)",
															boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0)}`,
														},
													},
												}}
											>
												<TickCircle size={60} variant="Bold" />
											</Avatar>
											<Typography variant="h3" color="success.darker" sx={{ fontWeight: 700 }}>
												¡Bienvenido!
											</Typography>
											<Typography variant="body1" color="success.dark" sx={{ mt: 1 }}>
												{user?.firstName} {user?.lastName}
											</Typography>
											{userStats?.planInfo?.planName && (
												<Chip
													label={userStats.planInfo.planName}
													color="success"
													sx={{ mt: 2, fontWeight: 600 }}
													icon={<Crown size={16} />}
												/>
											)}
										</Box>
									</Zoom>
								</Grid>

								{/* Contenido principal */}
								<Grid item xs={12} md={7}>
									<Stack spacing={3} alignItems={matchDownSM ? "center" : "flex-start"}>
										<Box>
											<Typography
												variant="h1"
												sx={{
													background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
													backgroundClip: "text",
													textFillColor: "transparent",
													WebkitBackgroundClip: "text",
													WebkitTextFillColor: "transparent",
													fontSize: matchDownSM ? "2rem" : "2.5rem",
													fontWeight: 800,
													mb: 2,
												}}
											>
												¡Suscripción Exitosa!
											</Typography>
											<Typography variant="h5" color="textSecondary" align={matchDownSM ? "center" : "left"} sx={{ fontWeight: 400 }}>
												Tu cuenta ha sido actualizada correctamente
											</Typography>
										</Box>

										<Paper
											elevation={0}
											sx={{
												p: 2,
												bgcolor: alpha(theme.palette.info.lighter, 0.5),
												border: `1px solid ${theme.palette.info.light}`,
												borderRadius: 2,
												width: "100%",
											}}
										>
											<Typography variant="body2" color="info.darker" sx={{ fontWeight: 500 }}>
												💡 Tu suscripción está activa y todos los beneficios ya están disponibles en tu cuenta.
											</Typography>
										</Paper>

										{/* Lista de características */}
										<Fade in={showFeatures} timeout={2000}>
											<Box sx={{ width: "100%" }}>
												<Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
													Lo que incluye tu plan:
												</Typography>
												<List sx={{ p: 0 }}>
													{planFeatures.map((feature, index) => (
														<Zoom
															in={showFeatures}
															timeout={1500 + index * 200}
															key={index}
															style={{ transitionDelay: `${index * 100}ms` }}
														>
															<ListItem
																sx={{
																	p: 1,
																	mb: 1,
																	borderRadius: 2,
																	transition: "all 0.3s",
																	"&:hover": {
																		bgcolor: alpha(theme.palette.success.lighter, 0.2),
																		transform: "translateX(8px)",
																	},
																}}
															>
																<ListItemIcon sx={{ minWidth: 40 }}>
																	<Avatar
																		size="sm"
																		sx={{
																			bgcolor: alpha(theme.palette.success.main, 0.1),
																			color: theme.palette.success.main,
																		}}
																	>
																		{React.cloneElement(feature.icon, { size: 18 })}
																	</Avatar>
																</ListItemIcon>
																<ListItemText
																	primary={feature.text}
																	primaryTypographyProps={{
																		variant: "body2",
																		sx: { fontWeight: 500 },
																	}}
																/>
															</ListItem>
														</Zoom>
													))}
												</List>
											</Box>
										</Fade>

										{/* Barra de progreso y botones */}
										<Box sx={{ width: "100%", mt: 3 }}>
											<Box sx={{ mb: 2 }}>
												<Typography variant="caption" color="textSecondary">
													Redirigiendo al dashboard en {redirectCountdown} segundos...
												</Typography>
												<LinearProgress
													variant="determinate"
													value={100 - redirectCountdown * 10}
													sx={{
														mt: 1,
														height: 6,
														borderRadius: 3,
														bgcolor: alpha(theme.palette.success.main, 0.1),
														"& .MuiLinearProgress-bar": {
															borderRadius: 3,
															background: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
														},
													}}
												/>
											</Box>

											<Stack direction={matchDownSM ? "column" : "row"} spacing={2} sx={{ width: matchDownSM ? "100%" : "auto" }}>
												<Button
													component={RouterLink}
													to="/dashboard/default"
													variant="contained"
													size="large"
													fullWidth={matchDownSM}
													endIcon={<ArrowRight2 />}
													sx={{
														background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
														boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.4)}`,
														"&:hover": {
															transform: "translateY(-2px)",
															boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.5)}`,
														},
														transition: "all 0.3s",
													}}
												>
													Ir al Dashboard
												</Button>
												<Button
													component={RouterLink}
													to="/apps/profiles/account/settings"
													variant="outlined"
													size="large"
													fullWidth={matchDownSM}
													sx={{
														borderColor: theme.palette.success.main,
														color: theme.palette.success.main,
														"&:hover": {
															borderColor: theme.palette.success.dark,
															bgcolor: alpha(theme.palette.success.main, 0.05),
														},
													}}
												>
													Ver Detalles del Plan
												</Button>
											</Stack>
										</Box>
									</Stack>
								</Grid>
							</Grid>
						</MainCard>
					</Fade>
				</Grid>
			</Grid>
		</Container>
	);
};

export default SubscriptionSuccess;
