import React from "react";
import { Link as RouterLink } from "react-router-dom";
// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, Button, Container, Grid, Typography } from "@mui/material";

// third party
import { motion } from "framer-motion";
import { Judge, Calculator, Calendar, Timer1 } from "iconsax-react";

// project-imports
import FadeInWhenVisible from "./Animation";
import MainCard from "components/MainCard";

// ==============================|| LANDING - TestimonialPage ||============================== //

interface UseCaseItem {
	icon: React.ElementType;
	color: "primary" | "info" | "warning" | "success";
	title: string;
	description: string;
}

const USE_CASES: UseCaseItem[] = [
	{
		icon: Judge,
		color: "primary",
		title: "Fueros PJN y MEV",
		description: "Seguimiento automático de expedientes en Civil, Trabajo y Seguridad Social del Poder Judicial de la Nación y del fuero CABA.",
	},
	{
		icon: Calculator,
		color: "info",
		title: "Liquidaciones precisas",
		description: "Calculadoras laborales e intereses actualizadas con índices oficiales. Resultados listos para copiar a escritos judiciales.",
	},
	{
		icon: Calendar,
		color: "warning",
		title: "Cero vencimientos perdidos",
		description: "Vencimientos extraídos automáticamente de los expedientes y sincronizados con tu calendario. Alertas configurables por caso.",
	},
	{
		icon: Timer1,
		color: "success",
		title: "Menos tiempo administrativo",
		description: "Centralización de causas, clientes y agenda en un solo sistema. Menos tiempo buscando información, más tiempo ejerciendo.",
	},
];

const UseCaseCard = ({ item }: { item: UseCaseItem }) => {
	const theme = useTheme();
	const Icon = item.icon;

	return (
		<MainCard
			sx={{
				height: "100%",
				borderRadius: "16px",
				boxShadow: theme.shadows[2],
				transition: "all 0.3s ease",
				"&:hover": {
					boxShadow: theme.shadows[8],
					transform: "translateY(-4px)",
				},
			}}
		>
			<Box
				sx={{
					display: "inline-flex",
					p: 1.5,
					borderRadius: "12px",
					bgcolor: theme.palette[item.color].lighter,
					mb: 2,
				}}
			>
				<Icon size={28} variant="Bulk" style={{ color: theme.palette[item.color].main }} />
			</Box>
			<Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
				{item.title}
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
				{item.description}
			</Typography>
		</MainCard>
	);
};

const TestimonialPage = () => {
	const theme = useTheme();

	return (
		<>
			<Box sx={{ mt: { md: 15, xs: 2.5 } }}>
				<Container>
					<Grid container spacing={2} justifyContent="center" sx={{ textAlign: "center", mb: 4 }}>
						<Grid item xs={12}>
							<motion.div
								initial={{ opacity: 0, translateY: 50 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={{
									type: "spring",
									stiffness: 150,
									damping: 30,
									delay: 0.2,
								}}
							>
								<Typography variant="h2">
									Lo que vas a
									<Box
										component="span"
										sx={{
											color: theme.palette.primary.main,
											mx: 1,
										}}
									>
										dejar de hacer
									</Box>
									a mano
								</Typography>
							</motion.div>
						</Grid>
						<Grid item xs={12} md={7}>
							<motion.div
								initial={{ opacity: 0, translateY: 30 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={{
									type: "spring",
									stiffness: 150,
									damping: 30,
									delay: 0.4,
								}}
							>
								<Typography variant="h5" color="text.secondary" sx={{ mt: 2 }}>
									Casos de uso reales de estudios jurídicos que ya usan Law||Analytics
								</Typography>
							</motion.div>
						</Grid>
					</Grid>

					<Grid container spacing={3} sx={{ mb: { md: 8, xs: 4 } }}>
						{USE_CASES.map((item, index) => (
							<Grid item xs={12} sm={6} md={3} key={index}>
								<FadeInWhenVisible>
									<UseCaseCard item={item} />
								</FadeInWhenVisible>
							</Grid>
						))}
					</Grid>

					{/* CTA */}
					<Box sx={{ textAlign: "center", mt: 4, mb: { md: 15, xs: 2.5 } }}>
						<FadeInWhenVisible>
							<Box>
								<Typography
									variant="h4"
									sx={{
										mb: 3,
										fontWeight: 600,
										color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
									}}
								>
									¿Querés trabajar así vos también?
								</Typography>
								<Button
									component={RouterLink}
									to="/register"
									variant="contained"
									color="primary"
									size="large"
									sx={{
										px: 5,
										py: 1.5,
										borderRadius: 2,
										fontWeight: 600,
										fontSize: "1rem",
										boxShadow: theme.shadows[4],
										"&:hover": {
											boxShadow: theme.shadows[8],
											transform: "translateY(-2px)",
										},
										transition: "all 0.2s ease-in-out",
									}}
								>
									Probar gratis ahora
								</Button>
							</Box>
						</FadeInWhenVisible>
					</Box>
				</Container>
			</Box>
		</>
	);
};
export default TestimonialPage;
