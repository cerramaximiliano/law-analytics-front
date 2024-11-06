// material-ui
import { styled, useTheme } from "@mui/material/styles";
import { Box, Container, Grid, Link, Stack, Typography } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// project-imports
import Logo from "components/logo";

// assets
import { Facebook, Instagram } from "iconsax-react";

// link - custom style
const FooterLink = styled(Link)(({ theme }) => ({
	color: theme.palette.text.primary,
	"&:hover, &:active": {
		color: theme.palette.primary.main,
	},
}));

// ==============================|| LANDING - FOOTER PAGE ||============================== //

type showProps = {
	isFull?: boolean;
};

const FooterBlock = ({ isFull }: showProps) => {
	const theme = useTheme();

	const linkSX = {
		color: theme.palette.text.secondary,
		fontWeight: 400,
		opacity: "0.6",
		cursor: "pointer",
		"&:hover": {
			opacity: "1",
		},
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
											<FooterLink href="https://phoenixcoded.authordesk.app/" target="_blank" underline="none">
												Soporte
											</FooterLink>
										</Stack>
									</Stack>
								</Grid>
								<Grid item xs={6} sm={4}>
									<Stack spacing={3}>
										<Typography variant="h5">Recursos útiles</Typography>
										<Stack spacing={{ xs: 1.5, md: 2.5 }}>
											<FooterLink href="https://themeforest.net/page/item_support_policy" target="_blank" underline="none">
												Política de privacidad
											</FooterLink>
											<FooterLink href="https://themeforest.net/licenses/standard" target="_blank" underline="none">
												Política de cookies
											</FooterLink>
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
		</>
	);
};

export default FooterBlock;
