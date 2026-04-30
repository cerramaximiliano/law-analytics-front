import React from "react";
// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Container, Grid, Typography, Divider, Link as MuiLink, Paper } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { SecuritySafe, Cpu, TrendUp, Magicpen } from "iconsax-react";

// third-party
import { motion } from "framer-motion";

// project imports
import MainCard from "components/MainCard";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";
import { LEGAL_LAST_UPDATED } from "config/legalDates";
import LegalPageTOC, { TocItem } from "components/legal/LegalPageTOC";

// ==============================|| COOKIES POLICY PAGE ||============================== //

const COOKIES_TOC_ITEMS: TocItem[] = [
	{ id: "que-son-cookies", label: "¿Qué son las cookies?" },
	{ id: "tipos-cookies", label: "Tipos de cookies que utilizamos" },
	{ id: "gestion-cookies", label: "Cómo gestionamos las cookies" },
	{ id: "cookies-terceros", label: "Cookies de terceros" },
	{ id: "cambios-politica-cookies", label: "Cambios en nuestra política de cookies" },
];

const CookiesPolicy = () => {
	const theme = useTheme();

	// breadcrumb items
	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Política de Cookies" }];

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 15 }, pb: { xs: 5, md: 10 }, position: "relative", overflow: "hidden" }}>
			<PageBackground variant="light" />
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
									Última actualización: {LEGAL_LAST_UPDATED}
								</Typography>
							</motion.div>
						</Box>
					</Grid>

					{/* Mobile TOC — visible only on xs/sm */}
					<Grid item xs={12} sx={{ display: { xs: "block", md: "none" } }}>
						<LegalPageTOC items={COOKIES_TOC_ITEMS} ariaLabel="Índice de Política de Cookies" />
					</Grid>

					{/* Desktop TOC sidebar */}
					<Grid item md={3} sx={{ display: { xs: "none", md: "block" } }}>
						<LegalPageTOC items={COOKIES_TOC_ITEMS} ariaLabel="Índice de Política de Cookies" />
					</Grid>

					<Grid item xs={12} md={9}>
						<MainCard>
							<Typography variant="body1" paragraph>
								Esta Política de Cookies explica qué son las cookies y cómo las utilizamos en Law||Analytics. Debe leer esta política para
								entender qué son las cookies, cómo las usamos, los tipos de cookies que utilizamos, qué información recopilamos usando
								cookies y cómo se utiliza esa información, y cómo controlar las preferencias de cookies.
							</Typography>

							<Typography id="que-son-cookies" variant="h3" gutterBottom sx={{ mt: 4 }}>
								¿Qué son las cookies?
							</Typography>
							<Typography variant="body1" paragraph>
								Las cookies son pequeños archivos de texto que se almacenan en su navegador web o en el disco duro de su ordenador. Las
								cookies contienen información sobre sus visitas a nuestro sitio web y nos ayudan a ofrecer una mejor experiencia a nuestros
								usuarios. Permiten a nuestros sistemas reconocer su navegador y recopilar información como el tipo de navegador, el tiempo
								que pasó en nuestro sitio web, las páginas visitadas y las preferencias de idioma.
							</Typography>

							<Typography id="tipos-cookies" variant="h3" gutterBottom sx={{ mt: 4 }}>
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
								<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
										<SecuritySafe size={18} color={theme.palette.success.main} />
										<Typography variant="h5">Cookies estrictamente necesarias</Typography>
									</Box>
									<Typography variant="body1">
										Estas cookies son esenciales para que usted pueda navegar por nuestro sitio web y utilizar sus funciones. Sin estas
										cookies, no podríamos proporcionar algunos servicios que ha solicitado, como la autentificación segura o recordar
										elementos en su carrito.
									</Typography>
								</Paper>

								<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
										<Magicpen size={18} color={theme.palette.primary.main} />
										<Typography variant="h5">Cookies de funcionalidad</Typography>
									</Box>
									<Typography variant="body1">
										Estas cookies permiten que nuestro sitio web recuerde las elecciones que realiza (como su nombre de usuario, idioma o la
										región en la que se encuentra) y proporcione características mejoradas y más personales.
									</Typography>
								</Paper>

								<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
										<Cpu size={18} color={theme.palette.info.main} />
										<Typography variant="h5">Cookies de rendimiento y analíticas</Typography>
									</Box>
									<Typography variant="body1">
										Estas cookies recopilan información sobre cómo los visitantes utilizan nuestro sitio web, por ejemplo, qué páginas
										visitan con más frecuencia y si reciben mensajes de error. Estas cookies no recopilan información que identifique a un
										visitante. Toda la información que recopilan estas cookies es agregada y, por lo tanto, anónima.
									</Typography>
								</Paper>

								<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
										<TrendUp size={18} color={theme.palette.warning.main} />
										<Typography variant="h5">Cookies de marketing</Typography>
									</Box>
									<Typography variant="body1">
										Estas cookies se utilizan para mostrar anuncios que sean relevantes para usted y sus intereses. También se utilizan para
										limitar el número de veces que ve un anuncio y para ayudar a medir la efectividad de las campañas publicitarias.
									</Typography>
								</Paper>
							</Box>

							<Typography id="gestion-cookies" variant="h3" gutterBottom sx={{ mt: 4 }}>
								Cómo gestionamos las cookies
							</Typography>
							<Typography variant="body1" paragraph>
								Puede configurar su navegador para rechazar todas las cookies o para indicar cuándo se envía una cookie. Sin embargo, si no
								acepta cookies, es posible que no pueda utilizar algunas partes de nuestro sitio web.
							</Typography>
							<Typography variant="body1" paragraph>
								A continuación, le indicamos cómo puede deshabilitar las cookies en los navegadores más populares:
							</Typography>
							<Box component="ul" sx={{ pl: { xs: 2, sm: 3 }, pr: { xs: 1, sm: 2 } }}>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									<strong>Google Chrome</strong>: Configuración → Mostrar opciones avanzadas → Privacidad → Configuración de contenido →
									Cookies
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									<strong>Mozilla Firefox</strong>: Opciones → Privacidad → Historial → Configuración personalizada
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									<strong>Microsoft Edge</strong>: Configuración → Privacidad, búsqueda y servicios → Cookies y permisos del sitio
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									<strong>Safari</strong>: Preferencias → Privacidad
								</Typography>
							</Box>

							<Typography id="cookies-terceros" variant="h3" gutterBottom sx={{ mt: 4 }}>
								Cookies de terceros
							</Typography>
							<Typography variant="body1" paragraph>
								Además de nuestras propias cookies, también podemos utilizar cookies de terceros para reportar estadísticas de uso del
								sitio, entregar anuncios en y a través del Servicio, y así sucesivamente.
							</Typography>

							<Typography id="cambios-politica-cookies" variant="h3" gutterBottom sx={{ mt: 4 }}>
								Cambios en nuestra política de cookies
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
