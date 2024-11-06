// material-ui
import { Box, Button, Container, Grid, TextField, Typography } from "@mui/material";

// project-imports
import FadeInWhenVisible from "./Animation";

// ==============================|| LANDING - ContactUsPage ||============================== //

const ContactUsPage = () => {
	return (
		<Box sx={{ bgcolor: "secondary.200", pb: { md: 10, xs: 7 }, pt: 0.25 }}>
			<Container>
				<Grid container spacing={3} alignItems="center" justifyContent="center" sx={{ mt: { md: 10, xs: 2.5 } }}>
					<Grid item xs={12} md={8}>
						<FadeInWhenVisible>
							<Grid container spacing={2} justifyContent="center">
								<Grid item xs={12}>
									<Typography variant="h2">Conecta con nosotros</Typography>
								</Grid>
								<Grid item xs={12}>
									<Typography>
										Envíanos tu correo para mantenerte en contacto de novedades, actualizaciones, promociones y lanzamientos.
									</Typography>
								</Grid>
							</Grid>
						</FadeInWhenVisible>
					</Grid>
					<Grid item xs={12} md={4}>
						<FadeInWhenVisible>
							<Grid container spacing={2} justifyContent={{ md: "end", xs: "center" }} alignItems="center">
								<Grid item>
									<TextField id="firstNameBasic" name="firstName" placeholder="Ingresa tu correo" fullWidth />
								</Grid>
								<Grid item>
									<Button variant="contained" color="primary" size="large">
										Suscríbete
									</Button>
								</Grid>
							</Grid>
						</FadeInWhenVisible>
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};
export default ContactUsPage;
