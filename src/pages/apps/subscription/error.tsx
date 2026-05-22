import React from "react";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Button, Box, Container, Stack, Typography, useMediaQuery } from "@mui/material";

// icons
import { CloseCircle, ArrowLeft, RefreshSquare, MessageQuestion } from "iconsax-react";

// project-imports
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";
import { BRAND_BLUE } from "themes/dashboardTokens";

// ==============================|| SUBSCRIPTION ERROR ||============================== //

const SubscriptionError = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const [supportModalOpen, setSupportModalOpen] = useState(false);

	const causes = [
		"Información de pago incorrecta",
		"Fondos insuficientes en la tarjeta",
		"Límite de transacciones alcanzado",
		"Problema temporal con el procesador de pagos",
	];

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "calc(100vh - 180px)",
				position: "relative",
				overflow: "hidden",
				px: { xs: 2, sm: 3 },
			}}
		>
			{/* Atmospheric backdrop destructivo */}
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					pointerEvents: "none",
					background: `radial-gradient(circle at 50% 30%, ${alpha(errorColor, isDark ? 0.1 : 0.05)} 0%, transparent 60%)`,
				}}
			/>

			<Container maxWidth="sm" sx={{ position: "relative" }}>
				<Box
					sx={{
						p: { xs: 3, sm: 4 },
						borderRadius: 2,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.025),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
					}}
				>
					<Stack spacing={{ xs: 2, sm: 2.5 }} alignItems="center">
						{/* Icon ring sober destructivo */}
						<Box
							sx={{
								width: 64,
								height: 64,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(errorColor, isDark ? 0.16 : 0.08),
								border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.2)}`,
								color: errorColor,
							}}
						>
							<CloseCircle size={30} variant="Bulk" />
						</Box>

						{/* Eyebrow + título + body */}
						<Stack spacing={1} alignItems="center" sx={{ textAlign: "center" }}>
							<Stack direction="row" spacing={0.625} alignItems="center">
								<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: errorColor }} />
								<Typography
									sx={{
										fontSize: "0.6rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Pago no procesado
								</Typography>
							</Stack>
							<Typography
								sx={{
									fontSize: { xs: "1.15rem", sm: "1.3rem" },
									fontWeight: 600,
									letterSpacing: "-0.015em",
									color: "text.primary",
									textWrap: "balance" as any,
								}}
							>
								Error en el proceso de pago
							</Typography>
							<Typography
								sx={{
									fontSize: "0.85rem",
									color: "text.secondary",
									letterSpacing: "-0.005em",
									lineHeight: 1.5,
									textWrap: "pretty" as any,
									maxWidth: 420,
								}}
							>
								No pudimos procesar tu pago. No se realizó ningún cargo a tu tarjeta.
							</Typography>
						</Stack>

						{/* Posibles causas — Box brand-tinted con dots indicadores */}
						<Box
							sx={{
								width: "100%",
								p: { xs: 1.75, sm: 2 },
								borderRadius: 1.5,
								bgcolor: theme.palette.background.paper,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
							}}
						>
							<Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
								<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
								<Typography
									sx={{
										fontSize: "0.6rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Posibles causas
								</Typography>
							</Stack>
							<Stack spacing={0.625}>
								{causes.map((cause, idx) => (
									<Stack key={idx} direction="row" spacing={0.875} alignItems="flex-start">
										<Box
											sx={{
												width: 4,
												height: 4,
												borderRadius: "50%",
												bgcolor: BRAND_BLUE,
												mt: 0.875,
												flexShrink: 0,
											}}
										/>
										<Typography
											sx={{
												fontSize: "0.82rem",
												color: "text.primary",
												letterSpacing: "-0.005em",
												lineHeight: 1.55,
											}}
										>
											{cause}
										</Typography>
									</Stack>
								))}
							</Stack>
						</Box>

						{/* Acciones — sober brand + ghost brand */}
						<Stack
							direction={{ xs: "column", sm: "row" }}
							spacing={1.25}
							justifyContent="center"
							sx={{ width: "100%", mt: 0.5 }}
						>
							<Button
								component={RouterLink}
								to="/suscripciones/tables"
								variant="contained"
								fullWidth={matchDownSM}
								startIcon={<RefreshSquare size={16} variant="Bulk" />}
								data-testid="sub-error-retry-btn"
								sx={{
									textTransform: "none",
									fontWeight: 600,
									letterSpacing: "-0.005em",
									bgcolor: BRAND_BLUE,
									color: "#fff",
									borderRadius: 1.25,
									px: 2,
									py: 1,
									boxShadow: "none",
									flex: { sm: 1 },
									"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
								}}
							>
								Intentar nuevamente
							</Button>

							<Button
								onClick={() => navigate("/dashboard/default")}
								fullWidth={matchDownSM}
								startIcon={<ArrowLeft size={16} variant="Bulk" />}
								sx={{
									textTransform: "none",
									fontWeight: 600,
									letterSpacing: "-0.005em",
									color: "text.secondary",
									borderRadius: 1.25,
									px: 2,
									py: 1,
									border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
									flex: { sm: 1 },
									"&:hover": {
										color: BRAND_BLUE,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
										borderColor: alpha(BRAND_BLUE, 0.28),
									},
								}}
							>
								Volver al dashboard
							</Button>
						</Stack>

						{/* Link de soporte — text-button brand */}
						<Button
							size="small"
							startIcon={<MessageQuestion size={14} variant="Bulk" />}
							onClick={() => setSupportModalOpen(true)}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								fontSize: "0.78rem",
								color: BRAND_BLUE,
								"&:hover": {
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
								},
							}}
						>
							¿Necesitás ayuda? Contactá a soporte
						</Button>
					</Stack>
				</Box>
			</Container>

			{/* Modal de soporte */}
			<SupportModal open={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
		</Box>
	);
};

export default SubscriptionError;
