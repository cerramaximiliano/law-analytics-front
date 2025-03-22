// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, Container, Grid, Stack, Typography } from "@mui/material";

// third party
import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";

// project-imports
import FadeInWhenVisible from "./Animation";
import MainCard from "components/MainCard";
// assets
//import Avatar from "components/@extended/Avatar";
import Avatar1 from "assets/images/users/avatar-6.png";
import Avatar2 from "assets/images/users/avatar-1.png";
import Avatar3 from "assets/images/users/avatar-2.png";
import Avatar4 from "assets/images/users/avatar-3.png";
import Avatar5 from "assets/images/users/avatar-4.png";
import Avatar6 from "assets/images/users/avatar-5.png";
import Avatar7 from "assets/images/users/avatar-7.png";
import Avatar8 from "assets/images/users/avatar-8.png";

// ================================|| SLIDER - ITEMS ||================================ //

const Item = ({ item }: { item: { image: string; text: string; name: string; designation: string; highlight?: boolean } }) => (
	<MainCard
		sx={{
			width: { xs: "300px", md: "420px" },
			cursor: "pointer",
			my: 0.2,
			mx: 1.5,
		}}
	>
		<Stack direction="row" alignItems="flex-start" spacing={2}>
			<Stack>
				<Typography>{item.text}</Typography>
				<Typography>
					<small>{item.name}</small> -{" "}
					<Box component="span" color="textSecondary">
						{item.designation}
					</Box>
				</Typography>
			</Stack>
		</Stack>
	</MainCard>
);

// ==============================|| LANDING - TestimonialPage ||============================== //
const TestimonialPage = () => {
	const theme = useTheme();
	const items = [
		{
			image: Avatar1,
			text: "“Muy útil para gestionar clientes y expedientes de manera eficiente.💼“",
			name: "DV",
			designation: "Personalización",
		},
		{
			image: Avatar2,
			text: "“Excelente calidad en el desarrollo, diseño profesional y fácil de usar.🎨“",
			name: "SB",
			designation: "Calidad del Código",
		},
		{
			image: Avatar3,
			text: "“De las mejores plataformas para administrar un despacho jurídico.👏“",
			name: "HM",
			designation: "Calidad de Diseño",
		},
		{
			image: Avatar4,
			text: "“El soporte es excelente y siempre responden rápido a las necesidades.🙌“",
			name: "HK",
			designation: "Atención al Cliente",
		},
		{
			image: Avatar5,
			text: "“Todo lo necesario para desarrolladores jurídicos, ¡una herramienta completa! 💻“",
			name: "SA",
			designation: "Disponibilidad de Funciones",
		},
		{
			image: Avatar6,
			text: "“El diseño es impecable, con colores bien elegidos para la interfaz. 🎨“",
			name: "RL",
			designation: "Otros",
		},
		{
			image: Avatar7,
			text: "“Atención al cliente excelente, me ayudaron con rapidez. 👍“",
			name: "RT",
			designation: "Atención al Cliente",
		},
		{
			image: Avatar8,
			text: "“Cumple perfectamente con mis necesidades, elegante y rápido. 💼“",
			name: "GS",
			designation: "Disponibilidad de Funciones",
		},
	];

	return (
		<>
			<Box sx={{ mt: { md: 15, xs: 2.5 } }}>
				<Container>
					<Grid container spacing={2} justifyContent="center" sx={{ textAlign: "center", marginBottom: 4 }}>
						<Grid item xs={12}>
							<motion.div
								initial={{ opacity: 0, translateY: 550 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={{
									type: "spring",
									stiffness: 150,
									damping: 30,
									delay: 0.2,
								}}
							>
								<Typography variant="h2">
									Ellos{" "}
									<Box
										component="span"
										sx={{
											color: theme.palette.primary.main,
										}}
									>
										eligen{" "}
									</Box>{" "}
									Law||Analytics, Ahora es tu turno 😍
								</Typography>
							</motion.div>
						</Grid>
						<Grid item xs={12} md={7}>
							<motion.div
								initial={{ opacity: 0, translateY: 550 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={{
									type: "spring",
									stiffness: 150,
									damping: 30,
									delay: 0.4,
								}}
							></motion.div>
						</Grid>
					</Grid>
				</Container>
			</Box>
			<Box sx={{ mb: { md: 10, xs: 2.5 } }}>
				<Grid container spacing={4}>
					<Grid item xs={12}>
						<FadeInWhenVisible>
							<Marquee pauseOnHover gradient={false}>
								{items.map((item, index) => (
									<Item key={index} item={item} />
								))}
							</Marquee>
						</FadeInWhenVisible>
					</Grid>
					<Grid item xs={12}>
						<FadeInWhenVisible>
							<Marquee pauseOnHover direction="right" gradient={false}>
								{items.map((item, index) => (
									<Item key={index} item={item} />
								))}
							</Marquee>
						</FadeInWhenVisible>
					</Grid>
				</Grid>
			</Box>
		</>
	);
};
export default TestimonialPage;
