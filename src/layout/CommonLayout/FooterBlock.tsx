// material-ui
import { styled, useTheme } from "@mui/material/styles";
import { Box, Container, Grid, Link, Stack, Typography, Button } from "@mui/material";
import { useState } from "react";

// third-party
import { motion } from "framer-motion";
import { Facebook, Instagram, MessageText1, DocumentText, MessageQuestion } from "iconsax-react";

// project-imports
import Logo from "components/logo";
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";
import { Link as RouterLink } from "react-router-dom";

// link - custom style
const FooterLink = styled(Link)(({ theme }) => ({
	color: theme.palette.text.primary,
	"&:hover, &:active": {
		color: theme.palette.primary.main,
	},
}));

// Custom button styled to look like a link
const FooterButton = styled(Button)(({ theme }) => ({
	color: theme.palette.text.primary,
	padding: 0,
	minWidth: 0,
	backgroundColor: "transparent",
	textTransform: "none",
	fontWeight: "inherit",
	fontSize: "inherit",
	justifyContent: "flex-start",
	"&:hover, &:active": {
		color: theme.palette.primary.main,
		backgroundColor: "transparent",
	},
}));

// ==============================|| LANDING - FOOTER PAGE ||============================== //

type showProps = {
	isFull?: boolean;
};

const FooterBlock = ({ isFull }: showProps) => {
	const theme = useTheme();
	const [supportOpen, setSupportOpen] = useState(false);

	const linkSX = {
		color: theme.palette.text.secondary,
		fontWeight: 400,
		opacity: "0.6",
		cursor: "pointer",
		"&:hover": {
			opacity: "1",
		},
	};

	const handleOpenSupport = () => {
		setSupportOpen(true);
	};

	const handleCloseSupport = () => {
		setSupportOpen(false);
	};

	return (
		<>
			<Box
				sx={{
					pt: isFull ? 5 : 10,
					pb: 10,
					bgcolor: "secondary.200",
					borderTop: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Container>
					<Grid container spacing={2}>
						<Grid item xs={12} md={4}>
							<motion.div
								initial={{ opacity: 0, translateY: 550 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={{
									type: "spring",
									stiffness: 150,
									damping: 30,
								}}
							>
								<Grid container spacing={2}>
									<Grid item xs={12}>
										<Logo reverse to="/" />
									</Grid>
									<Grid item xs={12}>
										<Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
											Law||Analytics cuenta con más de 500 usuarios en listas de distribución de novedades desde hace más de 4 años gracias
											a ofrecer herramientas de calidad y actualidad
										</Typography>
									</Grid>
								</Grid>
							</motion.div>
						</Grid>
						<Grid item xs={12} md={8}>
							<Grid container spacing={{ xs: 5, md: 2 }}>
								<Grid item xs={6} sm={4}>
									<Stack spacing={3}>
										<Typography variant="h5">Empresa</Typography>
										<Stack spacing={{ xs: 1.5, md: 2.5 }}>
											<FooterLink href="https://www.rumba-dev.com/" target="_blank" underline="none">
												Desarrolladores
											</FooterLink>
											<FooterLink href="https://www.instagram.com/law.analytics.app/" target="_blank" underline="none">
												Redes sociales
											</FooterLink>
										</Stack>
									</Stack>
								</Grid>
								<Grid item xs={6} sm={4}>
									<Stack spacing={3}>
										<Typography variant="h5">Ayuda & Soporte</Typography>
										<Stack spacing={{ xs: 1.5, md: 2.5 }}>
											<FooterButton
												onClick={handleOpenSupport}
												sx={{
													textAlign: "left",
													display: "inline-flex",
												}}
											>
												<Stack direction="row" alignItems="center" spacing={1}>
													<MessageText1 size={16} />
													<Typography component="span">Soporte</Typography>
												</Stack>
											</FooterButton>
											<RouterLink to="/guides" style={{ textDecoration: "none" }}>
												<FooterButton sx={{ textAlign: "left", display: "inline-flex" }}>
													<Stack direction="row" alignItems="center" spacing={1}>
														<DocumentText size={16} />
														<Typography component="span">Guías de Uso</Typography>
													</Stack>
												</FooterButton>
											</RouterLink>
											<RouterLink to="/faq" style={{ textDecoration: "none" }}>
												<FooterButton sx={{ textAlign: "left", display: "inline-flex" }}>
													<Stack direction="row" alignItems="center" spacing={1}>
														<MessageQuestion size={16} />
														<Typography component="span">Preguntas Frecuentes</Typography>
													</Stack>
												</FooterButton>
											</RouterLink>
										</Stack>
									</Stack>
								</Grid>
								<Grid item xs={6} sm={4}>
									<Stack spacing={3}>
										<Typography variant="h5">Recursos útiles</Typography>
										<Stack spacing={{ xs: 1.5, md: 2.5 }}>
											<RouterLink to="/privacy-policy" style={{ textDecoration: "none" }}>
												<FooterButton sx={{ color: theme.palette.text.primary }}>Política de privacidad</FooterButton>
											</RouterLink>
											<RouterLink to="/cookies-policy" style={{ textDecoration: "none" }}>
												<FooterButton sx={{ color: theme.palette.text.primary }}>Política de cookies</FooterButton>
											</RouterLink>
										</Stack>
									</Stack>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				</Container>
			</Box>
			<Box
				sx={{
					py: 2.4,
					borderTop: `1px solid ${theme.palette.divider}`,
					bgcolor: "secondary.200",
				}}
			>
				<Container>
					<Grid container spacing={2} alignItems="center" justifyContent="space-between">
						<Grid item xs={"auto"} sm={8}>
							<Typography>
								© Desarrollado por{" "}
								<Link href="https://www.rumba-dev.com/" underline="none">
									{" "}
									RUMBA
								</Link>
							</Typography>
						</Grid>
						<Grid item xs={"auto"} sm={4}>
							<Grid container spacing={2} alignItems="center" sx={{ justifyContent: "flex-end" }}>
								<Grid item>
									<Link href="https://www.instagram.com/rumballc/" target="_blank" underline="none" sx={linkSX}>
										<Instagram size="22" variant="Bulk" />
									</Link>
								</Grid>
								<Grid item>
									<Link href="https://www.facebook.com/profile.php?id=100083498354975" target="_blank" underline="none" sx={linkSX}>
										<Facebook size="22" variant="Bulk" />
									</Link>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				</Container>
			</Box>

			{/* Modal de soporte */}
			<SupportModal open={supportOpen} onClose={handleCloseSupport} />
		</>
	);
};

export default FooterBlock;