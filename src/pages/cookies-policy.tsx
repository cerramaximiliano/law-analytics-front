// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Container, Grid, Typography, Divider, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

// third-party
import { motion } from "framer-motion";

// project imports
import MainCard from "components/MainCard";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";

// ==============================|| COOKIES POLICY PAGE ||============================== //

const CookiesPolicy = () => {
	const theme = useTheme();

	// breadcrumb items
	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Política de Cookies" }];

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 15 }, pb: { xs: 5, md: 10 } }}>
			<Container>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<CustomBreadcrumbs items={breadcrumbItems} />
						<Box
							sx={{
								position: "relative",
								mb: 6,
								pb: 6,
								borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							}}
						>
							<motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.5 }}>
								<Typography variant="h1" sx={{ mb: 1 }}>
									Política de Cookies
								</Typography>
								<Typography variant="body1" color="text.secondary">
									Última actualización: 1 de Mayo de 2025
								</Typography>
							</motion.div>
						</Box>
					</Grid>

					<Grid item xs={12}>
						<MainCard>
							<Typography variant="body1" paragraph>
								Esta Política de Cookies explica qué son las cookies y cómo las utilizamos en Law||Analytics. Debe leer esta política para
								entender qué son las cookies, cómo las usamos, los tipos de cookies que utilizamos, qué información recopilamos usando
								cookies y cómo se utiliza esa información, y cómo controlar las preferencias de cookies.
							</Typography>

							<Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
								¿Qué son las cookies?
							</Typography>
							<Typography variant="body1" paragraph>
								Las cookies son pequeños archivos de texto que se almacenan en su navegador web o en el disco duro de su ordenador. Las
								cookies contienen información sobre sus visitas a nuestro sitio web y nos ayudan a ofrecer una mejor experiencia a nuestros
								usuarios. Permiten a nuestros sistemas reconocer su navegador y recopilar información como el tipo de navegador, el tiempo
								que pasó en nuestro sitio web, las páginas visitadas y las preferencias de idioma.
							</Typography>

							<Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
								Tipos de cookies que utilizamos
							</Typography>
							<Typography variant="body1">
								Las cookies pueden ser cookies de sesión o cookies persistentes. Las cookies de sesión son temporales y se eliminan de su
								dispositivo una vez que cierra el navegador web. Las cookies persistentes permanecen en su dispositivo hasta que expiran o
								hasta que usted las elimina mediante las configuraciones de su navegador.
							</Typography>
							<Typography variant="body1" sx={{ mt: 2 }}>
								En nuestro sitio web y aplicación, utilizamos los siguientes tipos de cookies:
							</Typography>

							<Box sx={{ mt: 2, mb: 4 }}>
								<Typography variant="h5" gutterBottom>
									Cookies estrictamente necesarias
								</Typography>
								<Typography variant="body1" paragraph>
									Estas cookies son esenciales para que usted pueda navegar por nuestro sitio web y utilizar sus funciones. Sin estas
									cookies, no podríamos proporcionar algunos servicios que ha solicitado, como la autentificación segura o recordar
									elementos en su carrito.
								</Typography>

								<Typography variant="h5" gutterBottom>
									Cookies de funcionalidad
								</Typography>
								<Typography variant="body1" paragraph>
									Estas cookies permiten que nuestro sitio web recuerde las elecciones que realiza (como su nombre de usuario, idioma o la
									región en la que se encuentra) y proporcione características mejoradas y más personales.
								</Typography>

								<Typography variant="h5" gutterBottom>
									Cookies de rendimiento y analíticas
								</Typography>
								<Typography variant="body1" paragraph>
									Estas cookies recopilan información sobre cómo los visitantes utilizan nuestro sitio web, por ejemplo, qué páginas visitan
									con más frecuencia y si reciben mensajes de error. Estas cookies no recopilan información que identifique a un visitante.
									Toda la información que recopilan estas cookies es agregada y, por lo tanto, anónima.
								</Typography>

								<Typography variant="h5" gutterBottom>
									Cookies de marketing
								</Typography>
								<Typography variant="body1" paragraph>
									Estas cookies se utilizan para mostrar anuncios que sean relevantes para usted y sus intereses. También se utilizan para
									limitar el número de veces que ve un anuncio y para ayudar a medir la efectividad de las campañas publicitarias.
								</Typography>
							</Box>

							<Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
								Cómo gestionamos las cookies
							</Typography>
							<Typography variant="body1" paragraph>
								Puede configurar su navegador para rechazar todas las cookies o para indicar cuándo se envía una cookie. Sin embargo, si no
								acepta cookies, es posible que no pueda utilizar algunas partes de nuestro sitio web.
							</Typography>
							<Typography variant="body1" paragraph>
								A continuación, le indicamos cómo puede deshabilitar las cookies en los navegadores más populares:
							</Typography>
							<ul>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									<strong>Google Chrome</strong>: Configuración → Mostrar opciones avanzadas → Privacidad → Configuración de contenido →
									Cookies
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									<strong>Mozilla Firefox</strong>: Opciones → Privacidad → Historial → Configuración personalizada
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									<strong>Internet Explorer</strong>: Herramientas → Opciones de Internet → Privacidad → Configuración
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									<strong>Safari</strong>: Preferencias → Privacidad
								</Typography>
							</ul>

							<Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
								Cookies de terceros
							</Typography>
							<Typography variant="body1" paragraph>
								Además de nuestras propias cookies, también podemos utilizar cookies de terceros para reportar estadísticas de uso del
								sitio, entregar anuncios en y a través del Servicio, y así sucesivamente.
							</Typography>

							<Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
								Cambios en nuestra Política de Cookies
							</Typography>
							<Typography variant="body1" paragraph>
								Si realizamos cambios en nuestra Política de Cookies, publicaremos la política actualizada en esta página. Le recomendamos
								que revise esta Política de Cookies periódicamente para estar informado sobre cómo utilizamos las cookies.
							</Typography>

							<Divider sx={{ my: 4 }} />

							<Typography variant="body1" paragraph>
								Si tiene alguna pregunta sobre esta Política de Cookies, puede contactarnos a través de nuestro formulario de contacto o por
								correo electrónico a privacy@lawanalytics.app.
							</Typography>
							<Typography variant="body1" paragraph>
								Para obtener más información sobre cómo protegemos su privacidad, consulte nuestra{" "}
								<MuiLink component={RouterLink} to="/privacy-policy">
									Política de Privacidad
								</MuiLink>
								.
							</Typography>
						</MainCard>
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default CookiesPolicy;
