// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Container, Grid, Typography, Divider, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

// third-party
import { motion } from "framer-motion";

// project imports
import MainCard from "components/MainCard";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";

// ============================== TOKENS ============================== //
// Mantener en sync con sections/landing/Planes.tsx
const BRAND_BLUE = "#3A7BFF";

// ============================== HELPERS ============================== //

const sectionHeading = (text: string, mt = 4) => (
	<Typography
		variant="h3"
		sx={{
			mt,
			mb: 1.5,
			fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.625rem" },
			fontWeight: 600,
			letterSpacing: "-0.015em",
			lineHeight: 1.2,
		}}
	>
		{text}
	</Typography>
);

const subHeading = (text: string) => (
	<Typography
		variant="h5"
		sx={{
			fontSize: "1.05rem",
			fontWeight: 600,
			letterSpacing: "-0.01em",
			mb: 1,
			mt: 2.5,
		}}
	>
		{text}
	</Typography>
);

// ==============================|| COOKIES POLICY PAGE ||============================== //

const CookiesPolicy = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Política de Cookies" }];

	const bodySx = {
		fontSize: "0.95rem",
		lineHeight: 1.65,
		color: theme.palette.text.primary,
		maxWidth: "70ch",
	};

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 6, md: 10 }, position: "relative", overflow: "hidden" }}>
			<PageBackground variant="light" />
			<Container sx={{ position: "relative", zIndex: 1 }}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<CustomBreadcrumbs items={breadcrumbItems} />
						<Box
							sx={{
								position: "relative",
								mt: { xs: 2, md: 3 },
								mb: { xs: 4, md: 6 },
								pb: { xs: 3, md: 4 },
								borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
							}}
						>
							<motion.div
								initial={{ opacity: 0, y: 24 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ type: "spring", stiffness: 150, damping: 30 }}
							>
								<Typography
									variant="h1"
									sx={{
										fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
										fontWeight: 600,
										lineHeight: 1.08,
										letterSpacing: "-0.025em",
										textWrap: "balance",
										mb: 1.5,
										color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
									}}
								>
									Política de Cookies
								</Typography>
								<Typography
									sx={{
										fontSize: "0.92rem",
										color: theme.palette.text.secondary,
										letterSpacing: "0.01em",
									}}
								>
									Última actualización: 1 de Mayo de 2025
								</Typography>
							</motion.div>
						</Box>
					</Grid>

					<Grid item xs={12}>
						<MainCard>
							<Typography paragraph sx={bodySx}>
								Esta Política de Cookies explica qué son las cookies y cómo las utilizamos en Law||Analytics. Debe leer esta política para
								entender qué son las cookies, cómo las usamos, los tipos de cookies que utilizamos, qué información recopilamos usando
								cookies y cómo se utiliza esa información, y cómo controlar las preferencias de cookies.
							</Typography>

							{sectionHeading("¿Qué son las cookies?")}
							<Typography paragraph sx={bodySx}>
								Las cookies son pequeños archivos de texto que se almacenan en su navegador web o en el disco duro de su ordenador. Las
								cookies contienen información sobre sus visitas a nuestro sitio web y nos ayudan a ofrecer una mejor experiencia a nuestros
								usuarios. Permiten a nuestros sistemas reconocer su navegador y recopilar información como el tipo de navegador, el tiempo
								que pasó en nuestro sitio web, las páginas visitadas y las preferencias de idioma.
							</Typography>

							{sectionHeading("Tipos de cookies que utilizamos")}
							<Typography sx={bodySx}>
								Las cookies pueden ser cookies de sesión o cookies persistentes. Las cookies de sesión son temporales y se eliminan de su
								dispositivo una vez que cierra el navegador web. Las cookies persistentes permanecen en su dispositivo hasta que expiran o
								hasta que usted las elimina mediante las configuraciones de su navegador.
							</Typography>
							<Typography sx={{ ...bodySx, mt: 2 }}>
								En nuestro sitio web y aplicación, utilizamos los siguientes tipos de cookies:
							</Typography>

							<Box sx={{ mt: 1, mb: 4 }}>
								{subHeading("Cookies estrictamente necesarias")}
								<Typography paragraph sx={bodySx}>
									Estas cookies son esenciales para que usted pueda navegar por nuestro sitio web y utilizar sus funciones. Sin estas
									cookies, no podríamos proporcionar algunos servicios que ha solicitado, como la autentificación segura o recordar
									elementos en su carrito.
								</Typography>

								{subHeading("Cookies de funcionalidad")}
								<Typography paragraph sx={bodySx}>
									Estas cookies permiten que nuestro sitio web recuerde las elecciones que realiza (como su nombre de usuario, idioma o la
									región en la que se encuentra) y proporcione características mejoradas y más personales.
								</Typography>

								{subHeading("Cookies de rendimiento y analíticas")}
								<Typography paragraph sx={bodySx}>
									Estas cookies recopilan información sobre cómo los visitantes utilizan nuestro sitio web, por ejemplo, qué páginas visitan
									con más frecuencia y si reciben mensajes de error. Estas cookies no recopilan información que identifique a un visitante.
									Toda la información que recopilan estas cookies es agregada y, por lo tanto, anónima.
								</Typography>

								{subHeading("Cookies de marketing")}
								<Typography paragraph sx={bodySx}>
									Estas cookies se utilizan para mostrar anuncios que sean relevantes para usted y sus intereses. También se utilizan para
									limitar el número de veces que ve un anuncio y para ayudar a medir la efectividad de las campañas publicitarias.
								</Typography>
							</Box>

							{sectionHeading("Cómo gestionamos las cookies")}
							<Typography paragraph sx={bodySx}>
								Puede configurar su navegador para rechazar todas las cookies o para indicar cuándo se envía una cookie. Sin embargo, si no
								acepta cookies, es posible que no pueda utilizar algunas partes de nuestro sitio web.
							</Typography>
							<Typography paragraph sx={bodySx}>
								A continuación, le indicamos cómo puede deshabilitar las cookies en los navegadores más populares:
							</Typography>
							<Box
								component="ul"
								sx={{
									pl: 3,
									maxWidth: "70ch",
									"& li": {
										fontSize: "0.95rem",
										lineHeight: 1.65,
										mb: 0.75,
										color: theme.palette.text.primary,
									},
								}}
							>
								<li>
									<Box component="strong" sx={{ fontWeight: 600 }}>
										Google Chrome
									</Box>
									: Configuración → Mostrar opciones avanzadas → Privacidad → Configuración de contenido → Cookies
								</li>
								<li>
									<Box component="strong" sx={{ fontWeight: 600 }}>
										Mozilla Firefox
									</Box>
									: Opciones → Privacidad → Historial → Configuración personalizada
								</li>
								<li>
									<Box component="strong" sx={{ fontWeight: 600 }}>
										Internet Explorer
									</Box>
									: Herramientas → Opciones de Internet → Privacidad → Configuración
								</li>
								<li>
									<Box component="strong" sx={{ fontWeight: 600 }}>
										Safari
									</Box>
									: Preferencias → Privacidad
								</li>
							</Box>

							{sectionHeading("Cookies de terceros")}
							<Typography paragraph sx={bodySx}>
								Además de nuestras propias cookies, también podemos utilizar cookies de terceros para reportar estadísticas de uso del
								sitio, entregar anuncios en y a través del Servicio, y así sucesivamente.
							</Typography>

							{sectionHeading("Cambios en nuestra Política de Cookies")}
							<Typography paragraph sx={bodySx}>
								Si realizamos cambios en nuestra Política de Cookies, publicaremos la política actualizada en esta página. Le recomendamos
								que revise esta Política de Cookies periódicamente para estar informado sobre cómo utilizamos las cookies.
							</Typography>

							<Divider sx={{ my: 4, borderColor: alpha(theme.palette.divider, 0.6) }} />

							<Typography paragraph sx={bodySx}>
								Si tiene alguna pregunta sobre esta Política de Cookies, puede contactarnos a través de nuestro formulario de contacto o por
								correo electrónico a{" "}
								<MuiLink href="mailto:privacy@lawanalytics.app" sx={{ color: BRAND_BLUE, fontWeight: 500, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
									privacy@lawanalytics.app
								</MuiLink>
								.
							</Typography>
							<Typography paragraph sx={bodySx}>
								Para obtener más información sobre cómo protegemos su privacidad, consulte nuestra{" "}
								<MuiLink
									component={RouterLink}
									to="/privacy-policy"
									sx={{ color: BRAND_BLUE, fontWeight: 500, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
								>
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
