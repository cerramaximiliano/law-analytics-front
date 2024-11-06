// material-ui
import { CardMedia, Container, Grid, Stack, Typography } from "@mui/material";

// third party
import { motion } from "framer-motion";

// project-imports
import FadeInWhenVisible from "./Animation";
import MainCard from "components/MainCard";

// assets
//import { ExportSquare } from "iconsax-react";
import featureFigma from "assets/images/landing/feature-figma.png";
import featureComponents from "assets/images/landing/feature-components.png";
import featureDocumentation from "assets/images/landing/feature-documentation.png";

const Technologies = [
	{
		icon: featureFigma,
		title: "Dashboard de control",
		description: "Maneja todas las variables de tu negocio desde un solo lugar. Ingresos, honorarios, tareas y más.",
		preview: "https://www.figma.com/file/6XqmRhRmkr33w0EFD49acY/Able-Pro--v9.0-Figma-Preview?type=design&mode=design&t=4FS2Lw6WxsmJ3RLm-0",
	},
	{
		icon: featureComponents,
		title: "Agenda sincronizada",
		description: "Sincroniza tu agenda con Google Clalendar para tener todos los recordatorios del proceso en un sólo lugar.",
		preview: "/components-overview/buttons",
	},
	{
		icon: featureDocumentation,
		title: "Base de clientes",
		description: "Administra la base de datos de clientes de forma ordenada y notifica novedades procesales de forma inmediata.",
		preview: "https://phoenixcoded.gitbook.io/able-pro/v/react/",
	},
];

// ==============================|| LANDING - ComboPage ||============================== //

const ComboPage = () => {
	return (
		<Container>
			<Grid container spacing={3} alignItems="center" justifyContent="center" sx={{ mt: { md: 15, xs: 2.5 }, mb: { md: 10, xs: 2.5 } }}>
				<Grid item xs={12}>
					<Grid container spacing={2} justifyContent="center" sx={{ textAlign: "center", marginBottom: 3 }}>
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
								<Typography variant="h2">Estudio Jurídico virtual</Typography>
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
							>
								<Typography>
									Con Law||Analytics puedes mantener tu estudio jurídico de forma 100% virtual y trabajar de forma remota y colaborativa
									desde cualquier lugar 🌍
								</Typography>
							</motion.div>
						</Grid>
					</Grid>
				</Grid>
				<Grid item xs={12}>
					<Grid container spacing={3} alignItems="center">
						{Technologies.map((tech, index) => (
							<Grid item xs={12} md={6} lg={4} key={index}>
								<FadeInWhenVisible>
									<MainCard>
										<Grid container spacing={3.5}>
											<Grid item xs={12}>
												<Stack spacing={1}>
													<Typography variant="h5">{tech.title}</Typography>
													<Typography>{tech.description}</Typography>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<CardMedia component="img" image={tech.icon} sx={{ width: "100%" }} />
											</Grid>
											{/* 										<Grid item xs={12}>
												<Button
													variant="contained"
													color="secondary"
													size="large"
													startIcon={<ExportSquare />}
													component={Link}
													href={tech.preview}
													target="_blank"
													sx={{
														fontWeight: 500,
														bgcolor: "secondary.light",
														color: "secondary.darker",
														"&:hover": { color: "secondary.lighter" },
													}}
												>
													Reference
												</Button>
											</Grid> */}
										</Grid>
									</MainCard>
								</FadeInWhenVisible>
							</Grid>
						))}
					</Grid>
				</Grid>
			</Grid>
		</Container>
	);
};
export default ComboPage;
