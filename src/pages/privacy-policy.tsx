// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Container, Grid, Typography, Divider, Link } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// project imports
import MainCard from "components/MainCard";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";

// ==============================|| PRIVACY POLICY PAGE ||============================== //

const PrivacyPolicy = () => {
	const theme = useTheme();

	// breadcrumb items
	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Política de Privacidad" }];

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
									Política de Privacidad
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
								La presente Política de Privacidad establece los términos en que Law||Analytics usa y protege la información que es
								proporcionada por sus usuarios al momento de utilizar su sitio web y aplicación. Esta compañía está comprometida con la
								seguridad de los datos de sus usuarios. Cuando le pedimos llenar los campos de información personal con la cual usted pueda
								ser identificado, lo hacemos asegurando que sólo se empleará de acuerdo con los términos de este documento.
							</Typography>

							<Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
								Información que recopilamos
							</Typography>
							<Typography variant="body1" paragraph>
								Nuestro sitio web y aplicación podrán recoger información personal, por ejemplo:
							</Typography>
							<ul>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									Nombre y apellidos
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									Información de contacto incluyendo dirección de correo electrónico
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									Información demográfica como preferencias e intereses
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									Otra información relevante para encuestas y ofertas
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									Datos específicos relacionados con su práctica legal
								</Typography>
							</ul>

							<Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
								Uso de la información recogida
							</Typography>
							<Typography variant="body1" paragraph>
								Nuestro sitio web y aplicación emplea la información con el fin de proporcionar el mejor servicio posible, particularmente
								para:
							</Typography>
							<ul>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									Personalizar la experiencia del usuario y responder mejor a sus necesidades individuales
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									Mejorar nuestros productos y servicios
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									Procesar transacciones
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									Enviar correos electrónicos periódicos con información relevante a su práctica jurídica
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1 }}>
									Administrar promociones, encuestas u otras características del sitio
								</Typography>
							</ul>

							<Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
								Cookies
							</Typography>
							<Typography variant="body1" paragraph>
								Una cookie se refiere a un fichero que es enviado con la finalidad de solicitar permiso para almacenarse en su ordenador. Al
								aceptar, dicho fichero se crea y la cookie sirve entonces para tener información respecto al tráfico web, y también facilita
								las futuras visitas a una web recurrente. Para más información sobre nuestro uso de cookies, por favor consulte nuestra{" "}
								<Link href="/cookies-policy">Política de Cookies</Link>.
							</Typography>

							<Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
								Seguridad
							</Typography>
							<Typography variant="body1" paragraph>
								Law||Analytics se compromete a proteger su información personal. Utilizamos sistemas seguros para la protección de la
								información y la actualizamos constantemente para asegurarnos de que no exista ningún acceso no autorizado.
							</Typography>

							<Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
								Enlaces a Terceros
							</Typography>
							<Typography variant="body1" paragraph>
								Este sitio web puede contener enlaces a otros sitios que pudieran ser de su interés. Una vez que usted hace clic en estos
								enlaces y abandona nuestra página, ya no tenemos control sobre el sitio al que es redirigido y por lo tanto no somos
								responsables de los términos o privacidad ni de la protección de sus datos en esos otros sitios terceros.
							</Typography>

							<Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
								Control de su información personal
							</Typography>
							<Typography variant="body1" paragraph>
								En cualquier momento usted puede restringir la recopilación o el uso de la información personal que es proporcionada a
								nuestro sitio web. Puede acceder a su información personal almacenada en su cuenta para corregirla o eliminarla.
							</Typography>
							<Typography variant="body1" paragraph>
								Law||Analytics no venderá, cederá ni distribuirá la información personal que es recopilada sin su consentimiento, salvo que
								sea requerido por un juez con una orden judicial.
							</Typography>

							<Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
								Cambios en la Política de Privacidad
							</Typography>
							<Typography variant="body1" paragraph>
								Law||Analytics se reserva el derecho de cambiar los términos de la presente Política de Privacidad en cualquier momento. Le
								notificaremos cualquier cambio significativo en la forma en que tratamos su información personal enviando un aviso a la
								dirección de correo electrónico principal especificada en su cuenta o colocando un aviso prominente en nuestro sitio.
							</Typography>

							<Divider sx={{ my: 4 }} />

							<Typography variant="body1" paragraph>
								Si tiene alguna pregunta sobre esta Política de Privacidad, puede contactarnos a través de nuestro formulario de contacto o
								por correo electrónico a privacy@lawanalytics.app.
							</Typography>
						</MainCard>
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default PrivacyPolicy;
