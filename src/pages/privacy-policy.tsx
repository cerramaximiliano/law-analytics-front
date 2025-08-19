// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Container, Grid, Typography, Divider, Link } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// project imports
import MainCard from "components/MainCard";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";

// ==============================|| PRIVACY POLICY PAGE ||============================== //

const PrivacyPolicy = () => {
	const theme = useTheme();

	// breadcrumb items
	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Política de Privacidad" }];

	return (
		<Box component="section" sx={{ pt: { xs: 8, sm: 10, md: 15 }, pb: { xs: 5, md: 10 }, position: "relative", overflow: "hidden" }}>
			<PageBackground variant="light" />
			<Container sx={{ px: { xs: 2, sm: 3 } }}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<CustomBreadcrumbs items={breadcrumbItems} />
						<Box
							sx={{
								position: "relative",
								mb: { xs: 3, sm: 4, md: 6 },
								pb: { xs: 3, sm: 4, md: 6 },
								borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							}}
						>
							<motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.5 }}>
								<Typography
									variant="h1"
									sx={{
										mb: 1,
										fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3rem" },
										lineHeight: { xs: 1.3, sm: 1.2 },
									}}
								>
									Política de Privacidad
								</Typography>
								<Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Última actualización: 19 de Agosto de 2025
								</Typography>
							</motion.div>
						</Box>
					</Grid>

					<Grid item xs={12}>
						<MainCard sx={{ overflow: "hidden" }}>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								La presente Política de Privacidad establece los términos en que Law||Analytics usa y protege la información que es
								proporcionada por sus usuarios al momento de utilizar su sitio web y aplicación. Esta compañía está comprometida con la
								seguridad de los datos de sus usuarios. Cuando le pedimos llenar los campos de información personal con la cual usted pueda
								ser identificado, lo hacemos asegurando que sólo se empleará de acuerdo con los términos de este documento.
							</Typography>

							<Typography
								variant="h3"
								gutterBottom
								sx={{
									mt: 4,
									fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
								}}
							>
								Información que recopilamos
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Nuestro sitio web y aplicación podrán recoger información personal, por ejemplo:
							</Typography>
							<Box component="ul" sx={{ pl: { xs: 2, sm: 3, md: 4 }, pr: { xs: 1, sm: 2 } }}>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Nombre y apellidos
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Información de contacto incluyendo dirección de correo electrónico
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Información demográfica como preferencias e intereses
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Otra información relevante para encuestas y ofertas
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Datos específicos relacionados con su práctica legal
								</Typography>
							</Box>

							<Typography
								variant="h3"
								gutterBottom
								sx={{
									mt: 4,
									fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
								}}
							>
								Uso de la información recogida
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Nuestro sitio web y aplicación emplea la información con el fin de proporcionar el mejor servicio posible, particularmente
								para:
							</Typography>
							<Box component="ul" sx={{ pl: { xs: 2, sm: 3, md: 4 }, pr: { xs: 1, sm: 2 } }}>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Personalizar la experiencia del usuario y responder mejor a sus necesidades individuales
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Mejorar nuestros productos y servicios
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Procesar transacciones
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Enviar correos electrónicos periódicos con información relevante a su práctica jurídica
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Administrar promociones, encuestas u otras características del sitio
								</Typography>
							</Box>

							<Typography
								variant="h3"
								gutterBottom
								sx={{
									mt: 4,
									fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
								}}
							>
								Cookies
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Una cookie se refiere a un fichero que es enviado con la finalidad de solicitar permiso para almacenarse en su ordenador. Al
								aceptar, dicho fichero se crea y la cookie sirve entonces para tener información respecto al tráfico web, y también facilita
								las futuras visitas a una web recurrente. Para más información sobre nuestro uso de cookies, por favor consulte nuestra{" "}
								<Link href="/cookies-policy">Política de Cookies</Link>.
							</Typography>

							<Typography
								variant="h3"
								gutterBottom
								sx={{
									mt: 4,
									fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
								}}
							>
								Seguridad
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Law||Analytics se compromete a proteger su información personal. Utilizamos sistemas seguros para la protección de la
								información y la actualizamos constantemente para asegurarnos de que no exista ningún acceso no autorizado.
							</Typography>

							<Typography
								variant="h3"
								gutterBottom
								sx={{
									mt: 4,
									fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
								}}
							>
								Integración con Google Calendar
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Law||Analytics ofrece integración opcional con Google Calendar para mejorar la gestión de eventos y audiencias legales. Esta
								integración es completamente voluntaria y puede ser activada o desactivada en cualquier momento por el usuario.
							</Typography>
							
							<Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 2, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
								Permisos de Google Calendar
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Cuando usted conecta su cuenta de Google Calendar, solicitamos los siguientes permisos específicos:
							</Typography>
							<Box component="ul" sx={{ pl: { xs: 2, sm: 3, md: 4 }, pr: { xs: 1, sm: 2 }, mb: 2 }}>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									<strong>Ver y editar eventos en todos sus calendarios</strong> (auth/calendar.events): Permite sincronizar audiencias, 
									vencimientos y reuniones entre Law||Analytics y Google Calendar
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									<strong>Ver la lista de control de acceso de los calendarios</strong> (auth/calendar.acls.readonly): Permite verificar 
									los permisos de acceso para asegurar la correcta sincronización de eventos
								</Typography>
							</Box>
							
							<Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 2, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
								Uso de los Datos de Google Calendar
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Los datos obtenidos de Google Calendar se utilizan exclusivamente para:
							</Typography>
							<Box component="ul" sx={{ pl: { xs: 2, sm: 3, md: 4 }, pr: { xs: 1, sm: 2 }, mb: 2 }}>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Importar eventos de Google Calendar a su calendario de Law||Analytics
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Crear eventos en Google Calendar desde Law||Analytics (audiencias, vencimientos, reuniones)
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Mantener sincronizados los eventos entre ambas plataformas
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Actualizar o eliminar eventos cuando se modifican en cualquiera de las plataformas
								</Typography>
							</Box>
							
							<Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 2, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
								Almacenamiento y Seguridad de Datos de Google
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								<strong>Importante:</strong> Los tokens de autenticación de Google se almacenan únicamente en su navegador web (sessionStorage) 
								y nunca se envían ni almacenan en nuestros servidores. Los eventos importados desde Google Calendar se almacenan en nuestra 
								base de datos con un identificador especial (googleCalendarId) que permite mantener la sincronización.
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Solo almacenamos la siguiente información de eventos de Google Calendar:
							</Typography>
							<Box component="ul" sx={{ pl: { xs: 2, sm: 3, md: 4 }, pr: { xs: 1, sm: 2 }, mb: 2 }}>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Título del evento
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Descripción del evento
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Fecha y hora de inicio y fin
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									ID único del evento en Google Calendar (para sincronización)
								</Typography>
							</Box>
							
							<Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 2, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
								Desvinculación y Eliminación de Datos de Google
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Usted puede desvincular su cuenta de Google Calendar en cualquier momento desde la sección de calendario de la aplicación. 
								Al desvincular:
							</Typography>
							<Box component="ul" sx={{ pl: { xs: 2, sm: 3, md: 4 }, pr: { xs: 1, sm: 2 }, mb: 2 }}>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Se revocan inmediatamente todos los permisos de acceso a Google Calendar
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Se eliminan automáticamente todos los eventos importados desde Google Calendar de nuestra base de datos
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Se eliminan los tokens de autenticación de su navegador
								</Typography>
								<Typography component="li" variant="body1" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
									Los eventos creados localmente en Law||Analytics permanecen intactos
								</Typography>
							</Box>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Para revocar el acceso de Law||Analytics a su cuenta de Google, también puede hacerlo directamente desde su 
								<Link href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" sx={{ ml: 0.5 }}>
									configuración de permisos de Google
								</Link>.
							</Typography>

							<Typography
								variant="h3"
								gutterBottom
								sx={{
									mt: 4,
									fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
								}}
							>
								Enlaces a Terceros
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Este sitio web puede contener enlaces a otros sitios que pudieran ser de su interés. Una vez que usted hace clic en estos
								enlaces y abandona nuestra página, ya no tenemos control sobre el sitio al que es redirigido y por lo tanto no somos
								responsables de los términos o privacidad ni de la protección de sus datos en esos otros sitios terceros.
							</Typography>

							<Typography
								variant="h3"
								gutterBottom
								sx={{
									mt: 4,
									fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
								}}
							>
								Control de su información personal
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								En cualquier momento usted puede restringir la recopilación o el uso de la información personal que es proporcionada a
								nuestro sitio web. Puede acceder a su información personal almacenada en su cuenta para corregirla o eliminarla.
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Law||Analytics no venderá, cederá ni distribuirá la información personal que es recopilada sin su consentimiento, salvo que
								sea requerido por un juez con una orden judicial.
							</Typography>

							<Typography
								variant="h3"
								gutterBottom
								sx={{
									mt: 4,
									fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
								}}
							>
								Cambios en la Política de Privacidad
							</Typography>
							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Law||Analytics se reserva el derecho de cambiar los términos de la presente Política de Privacidad en cualquier momento. Le
								notificaremos cualquier cambio significativo en la forma en que tratamos su información personal enviando un aviso a la
								dirección de correo electrónico principal especificada en su cuenta o colocando un aviso prominente en nuestro sitio.
							</Typography>

							<Divider sx={{ my: 4 }} />

							<Typography variant="body1" paragraph sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, textAlign: "justify" }}>
								Si tiene alguna pregunta sobre esta Política de Privacidad, puede contactarnos a través de nuestro formulario de contacto o
								por correo electrónico a soporte@lawanalytics.app.
							</Typography>
						</MainCard>
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default PrivacyPolicy;
