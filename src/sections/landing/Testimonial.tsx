import React from "react";
import { Link as RouterLink } from "react-router-dom";
// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Avatar, Box, Button, Container, Grid, Stack, Typography } from "@mui/material";

// third party
import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";
import { QuoteUp } from "iconsax-react";

// project-imports
import FadeInWhenVisible from "./Animation";
import MainCard from "components/MainCard";

// ================================|| SLIDER - ITEMS ||================================ //

interface TestimonialItem {
	text: string;
	name: string;
	initials: string;
	role: string;
	company: string;
	color: "primary" | "secondary" | "error" | "info" | "warning" | "success";
	rating?: number;
}

const Item = ({ item }: { item: TestimonialItem }) => {
	const theme = useTheme();

	return (
		<MainCard
			sx={{
				width: { xs: "300px", md: "400px" },
				cursor: "pointer",
				my: 1,
				mx: 2,
				p: 3,
				borderRadius: "16px",
				boxShadow: theme.shadows[3],
				transition: "all 0.3s ease",
				border: `1px solid ${alpha(theme.palette[item.color].main, 0.2)}`,
				"&:hover": {
					boxShadow: theme.shadows[8],
					transform: "translateY(-5px)",
					borderColor: alpha(theme.palette[item.color].main, 0.5),
				},
			}}
		>
			<Stack spacing={3}>
				<Box
					sx={{
						color: theme.palette[item.color].main,
						mb: -1,
					}}
				>
					<QuoteUp variant="Bulk" size={32} />
				</Box>
				<Typography
					variant="body1"
					sx={{
						fontStyle: "italic",
						color: theme.palette.text.secondary,
						lineHeight: 1.6,
					}}
				>
					{item.text}
				</Typography>
				<Stack direction="row" alignItems="center" spacing={2} sx={{ pt: 1 }}>
					<Avatar
						sx={{
							bgcolor: alpha(theme.palette[item.color].main, 0.2),
							color: theme.palette[item.color].dark,
							fontWeight: 700,
						}}
					>
						{item.initials}
					</Avatar>
					<Stack>
						<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
							{item.name}
						</Typography>
						<Typography variant="caption" color="textSecondary">
							{item.role}
							{item.company ? `, ${item.company}` : ""}
						</Typography>
					</Stack>
				</Stack>
			</Stack>
		</MainCard>
	);
};

// ==============================|| LANDING - TestimonialPage ||============================== //
const TestimonialPage = () => {
	const theme = useTheme();

	const testimonials: TestimonialItem[] = [
		{
			text: "Law||Analytics ha cambiado completamente la forma en que gestiono mis casos. La calculadora de intereses me ha ahorrado horas de trabajo y la precisión es impecable.",
			name: "ML",
			initials: "ML",
			role: "Abogado Laboral",
			company: "Estudio Leguizamón & Asociados",
			color: "primary",
		},
		{
			text: "Después de probar varias soluciones, puedo decir que esta plataforma es la más completa para estudios jurídicos. El sistema de carpetas y gestión de clientes es muy intuitivo.",
			name: "CV",
			initials: "CV",
			role: "Socia Fundadora",
			company: "Vásquez, Mendoza & Cía.",
			color: "secondary",
		},
		{
			text: "La calculadora laboral me permite realizar liquidaciones complejas en minutos. Es una herramienta indispensable para mi práctica diaria como abogado especializado en derecho laboral.",
			name: "RA",
			initials: "RA",
			role: "Especialista en Derecho Laboral",
			company: "",
			color: "error",
		},
		{
			text: "El sistema de calendario y recordatorios ha sido fundamental para no perder ningún vencimiento. Muy recomendable para equipos de trabajo que necesitan coordinación.",
			name: "AM",
			initials: "AM",
			role: "Asistente Legal Senior",
			company: "Bufete Legal Mendoza",
			color: "info",
		},
		{
			text: "La interfaz es moderna e intuitiva, y la capacidad de vincular eventos del calendario con expedientes específicos es una función que no he encontrado en ninguna otra plataforma legal.",
			name: "FG",
			initials: "FG",
			role: "Abogado Civil",
			company: "",
			color: "warning",
		},
		{
			text: "El soporte técnico es excelente y siempre responden rápidamente a cualquier consulta. La plataforma se mantiene actualizada con nuevas funciones regularmente.",
			name: "LS",
			initials: "LS",
			role: "Gerente de Operaciones",
			company: "Estudio Jurídico Internacional",
			color: "success",
		},
		{
			text: "Como responsable de un equipo de abogados, valoro enormemente la capacidad de asignar tareas y hacer seguimiento de los avances en cada caso. Ha mejorado nuestra eficiencia un 40%.",
			name: "DT",
			initials: "DT",
			role: "Director Jurídico",
			company: "Torres & Asociados",
			color: "primary",
		},
		{
			text: "El sistema de citas online ha transformado la forma en que atendemos a nuestros clientes. Es un diferencial importante para nuestro estudio frente a la competencia.",
			name: "PR",
			initials: "PR",
			role: "Abogada Familiar",
			company: "",
			color: "secondary",
		},
		{
			text: "La calculadora de intereses es precisa y fácil de usar. Me ha ahorrado incontables horas de cálculos manuales y ha reducido los errores en nuestras presentaciones judiciales.",
			name: "JM",
			initials: "JM",
			role: "Abogado Corporativo",
			company: "Morales & Cía.",
			color: "info",
		},
		{
			text: "La integración entre el calendario y los expedientes es brillante. Puedo ver todos los vencimientos relacionados con un caso específico de forma inmediata.",
			name: "GP",
			initials: "GP",
			role: "Procuradora",
			company: "",
			color: "warning",
		},
	];

	return (
		<>
			<Box sx={{ mt: { md: 15, xs: 2.5 } }}>
				<Container>
					<Grid container spacing={2} justifyContent="center" sx={{ textAlign: "center", marginBottom: 4 }}>
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
									Abogados que ya
									<Box
										component="span"
										sx={{
											color: theme.palette.primary.main,
											mx: 1,
										}}
									>
										dejaron de trabajar
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
									Estudios jurídicos que optimizan su práctica diaria con Law||Analytics
								</Typography>
							</motion.div>
						</Grid>
					</Grid>
				</Container>
			</Box>
			<Box sx={{ mb: { md: 15, xs: 2.5 } }}>
				<Grid container spacing={4}>
					<Grid item xs={12}>
						<FadeInWhenVisible>
							<Marquee pauseOnHover gradient={false} speed={30}>
								{testimonials.slice(0, 5).map((item, index) => (
									<Item key={index} item={item} />
								))}
							</Marquee>
						</FadeInWhenVisible>
					</Grid>
					<Grid item xs={12}>
						<FadeInWhenVisible>
							<Marquee pauseOnHover direction="right" gradient={false} speed={30}>
								{testimonials.slice(5, 10).map((item, index) => (
									<Item key={index} item={item} />
								))}
							</Marquee>
						</FadeInWhenVisible>
					</Grid>
				</Grid>

				{/* CTA */}
				<Box sx={{ textAlign: "center", mt: 6 }}>
					<FadeInWhenVisible>
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
					</FadeInWhenVisible>
				</Box>
			</Box>
		</>
	);
};
export default TestimonialPage;
