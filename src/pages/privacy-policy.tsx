// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Container, Grid, Typography, Divider, Link } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// project imports
import MainCard from "components/MainCard";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";
import { LEGAL_LAST_UPDATED } from "config/legalDates";
import LegalPageTOC, { TocItem } from "components/legal/LegalPageTOC";

// ============================== TOKENS ============================== //
// Mantener en sync con sections/landing/Planes.tsx
const BRAND_BLUE = "#3A7BFF";

// ==============================|| PRIVACY POLICY PAGE ||============================== //

const PRIVACY_TOC_ITEMS: TocItem[] = [
	{ id: "informacion-recopilamos", label: "Información que recopilamos" },
	{ id: "uso-informacion", label: "Uso de la información recogida" },
	{ id: "cookies", label: "Cookies" },
	{ id: "seguridad", label: "Seguridad" },
	{ id: "integracion-google-calendar", label: "Integración con Google Calendar" },
	{ id: "enlaces-terceros", label: "Enlaces a terceros" },
	{ id: "control-informacion", label: "Control de su información personal" },
	{ id: "cambios-politica", label: "Cambios en la política de privacidad" },
];

const PrivacyPolicy = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Política de Privacidad" }];

	const bodySx = {
		fontSize: "0.95rem",
		lineHeight: 1.65,
		color: theme.palette.text.primary,
		maxWidth: "70ch",
		textAlign: "justify" as const,
	};

	const linkSx = {
		color: BRAND_BLUE,
		fontWeight: 500,
		textDecoration: "none",
		"&:hover": { textDecoration: "underline" },
	};

	// Helpers para jerarquía editorial — h3 secciones, h4 sub-secciones
	const sectionHeading = (text: string, id?: string) => (
		<Typography
			id={id}
			variant="h3"
			sx={{
				mt: 5,
				mb: 1.5,
				fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.625rem" },
				fontWeight: 600,
				letterSpacing: "-0.015em",
				lineHeight: 1.2,
				color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
			}}
		>
			{text}
		</Typography>
	);

	const subHeading = (text: string) => (
		<Typography
			variant="h4"
			sx={{
				mt: 3,
				mb: 1.25,
				fontSize: { xs: "1rem", sm: "1.125rem" },
				fontWeight: 600,
				letterSpacing: "-0.01em",
				color: isDark ? theme.palette.grey[200] : theme.palette.grey[800],
			}}
		>
			{text}
		</Typography>
	);

	const bulletList = (items: React.ReactNode[]) => (
		<Box
			component="ul"
			sx={{
				pl: 3,
				maxWidth: "70ch",
				mb: 2,
				"& li": {
					fontSize: "0.95rem",
					lineHeight: 1.65,
					mb: 0.75,
					color: theme.palette.text.primary,
				},
			}}
		>
			{items.map((item, i) => (
				<li key={i}>{item}</li>
			))}
		</Box>
	);

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 6, md: 10 }, position: "relative", overflow: "hidden" }}>
			<PageBackground variant="light" />
			<Container sx={{ position: "relative", zIndex: 1, px: { xs: 2, sm: 3 } }}>
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
										fontSize: { xs: "1.85rem", sm: "2.5rem", md: "3rem" },
										fontWeight: 600,
										lineHeight: 1.08,
										letterSpacing: "-0.025em",
										textWrap: "balance",
										mb: 1.5,
										color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
									}}
								>
									Política de Privacidad
								</Typography>
								<Typography
									sx={{
										fontSize: "0.92rem",
										color: theme.palette.text.secondary,
										letterSpacing: "0.01em",
									}}
								>
									Última actualización: {LEGAL_LAST_UPDATED}
								</Typography>
							</motion.div>
						</Box>
					</Grid>

					{/* Mobile TOC — rendered above the card, only visible on xs/sm */}
					<Grid item xs={12} sx={{ display: { xs: "block", md: "none" } }}>
						<LegalPageTOC items={PRIVACY_TOC_ITEMS} ariaLabel="Índice de Política de Privacidad" />
					</Grid>

					{/* Desktop TOC sidebar */}
					<Grid item md={3} sx={{ display: { xs: "none", md: "block" } }}>
						<LegalPageTOC items={PRIVACY_TOC_ITEMS} ariaLabel="Índice de Política de Privacidad" />
					</Grid>

					<Grid item xs={12} md={9}>
						<MainCard sx={{ overflow: "hidden" }}>
							<Typography paragraph sx={bodySx}>
								La presente Política de Privacidad establece los términos en que Law||Analytics usa y protege la información que es
								proporcionada por sus usuarios al momento de utilizar su sitio web y aplicación. Estamos comprometidos con la seguridad de
								los datos de nuestros usuarios. Cuando le pedimos completar campos de información personal con la cual usted pueda ser
								identificado, lo hacemos asegurando que solo se empleará de acuerdo con los términos de este documento.
							</Typography>

							{sectionHeading("Información que recopilamos", "informacion-recopilamos")}
							<Typography paragraph sx={bodySx}>
								Nuestro sitio web y aplicación podrán recoger información personal, por ejemplo:
							</Typography>
							{bulletList([
								"Nombre y apellidos",
								"Información de contacto, incluyendo dirección de correo electrónico",
								"Información demográfica como preferencias e intereses",
								"Otra información relevante para encuestas y ofertas",
								"Datos específicos relacionados con su práctica legal",
							])}

							{sectionHeading("Uso de la información recogida", "uso-informacion")}
							<Typography paragraph sx={bodySx}>
								Nuestro sitio web y aplicación emplean la información con el fin de proporcionar el mejor servicio posible, particularmente
								para:
							</Typography>
							{bulletList([
								"Personalizar la experiencia del usuario y responder mejor a sus necesidades individuales",
								"Mejorar nuestros productos y servicios",
								"Procesar transacciones",
								"Enviar correos electrónicos periódicos con información relevante a su práctica jurídica (estas comunicaciones no utilizan datos obtenidos a través de APIs de Google)",
								"Administrar promociones, encuestas u otras características del sitio, sin utilizar datos obtenidos desde Google Calendar",
							])}

							{sectionHeading("Cookies", "cookies")}
							<Typography paragraph sx={bodySx}>
								Una cookie se refiere a un fichero que es enviado con la finalidad de solicitar permiso para almacenarse en su ordenador. Al
								aceptar, dicho fichero se crea y la cookie sirve entonces para tener información respecto al tráfico web, y también facilita
								las futuras visitas a una web recurrente. Para más información sobre nuestro uso de cookies, por favor consulte nuestra{" "}
								<Link href="/cookies-policy" sx={linkSx}>
									Política de Cookies
								</Link>
								.
							</Typography>

							{sectionHeading("Seguridad", "seguridad")}
							<Typography paragraph sx={bodySx}>
								Law||Analytics se compromete a proteger su información personal. Utilizamos sistemas seguros para la protección de la
								información y la actualizamos constantemente para asegurarnos de que no exista ningún acceso no autorizado.
							</Typography>

							{sectionHeading("Integración con Google Calendar", "integracion-google-calendar")}
							<Typography paragraph sx={bodySx}>
								Law||Analytics ofrece integración opcional con Google Calendar para mejorar la gestión de eventos y audiencias legales. Esta
								integración es completamente voluntaria y puede ser activada o desactivada en cualquier momento por el usuario.
							</Typography>

							{subHeading("Permisos de Google Calendar")}
							<Typography paragraph sx={bodySx}>
								Cuando usted conecta su cuenta de Google Calendar, solicitamos los siguientes permisos específicos:
							</Typography>
							{bulletList([
								<>
									<Box component="strong" sx={{ fontWeight: 600 }}>
										Ver y editar eventos en sus calendarios
									</Box>{" "}
									(https://www.googleapis.com/auth/calendar.events): permite crear, actualizar y eliminar eventos (audiencias, vencimientos
									y reuniones) entre Law||Analytics y Google Calendar.
								</>,
								<>
									<Box component="strong" sx={{ fontWeight: 600 }}>
										Ver calendarios y eventos
									</Box>{" "}
									(https://www.googleapis.com/auth/calendar.readonly): permite leer y mostrar sus calendarios y eventos de Google Calendar
									dentro de Law||Analytics; no crea, edita ni elimina eventos ni modifica permisos.
								</>,
							])}

							{subHeading("Cumplimiento de la política de Google (“Limited Use”)")}
							<Typography paragraph sx={bodySx}>
								Cumplimos con la <em>Google API Services User Data Policy (Limited Use)</em>. Los datos obtenidos mediante los scopes de
								Google se utilizan exclusivamente para proporcionar o mejorar funciones visibles al usuario dentro de Law||Analytics.{" "}
								<Box component="strong" sx={{ fontWeight: 600 }}>
									No vendemos
								</Box>{" "}
								ni{" "}
								<Box component="strong" sx={{ fontWeight: 600 }}>
									transferimos
								</Box>{" "}
								datos de Google a terceros; solo podemos compartirlos con proveedores que actúan como encargados de tratamiento
								(procesadores) para operar el servicio (p. ej., infraestructura de hosting, correo transaccional, monitoreo y registro),
								bajo contrato, con acceso limitado y sin reutilización para fines propios. No usamos datos de Google para publicidad,
								marketing, perfilado ni investigación de mercado. Puede consultar más información en{" "}
								<Link
									href="https://developers.google.com/terms/api-services-user-data-policy"
									target="_blank"
									rel="noopener noreferrer"
									sx={linkSx}
								>
									esta política de Google
								</Link>
								.
							</Typography>

							{subHeading("Uso de los datos de Google Calendar — no se comparten con terceros")}
							<Typography
								paragraph
								sx={{
									...bodySx,
									fontWeight: 600,
									p: 2,
									bgcolor: alpha(BRAND_BLUE, 0.06),
									borderLeft: `3px solid ${BRAND_BLUE}`,
									borderRadius: 0.5,
									maxWidth: "none",
								}}
							>
								IMPORTANTE: Los datos de Google Calendar NUNCA se comparten, venden, ceden o transfieren a terceros fuera de los proveedores
								que actúan como procesadores para operar el servicio. Estos datos se utilizan EXCLUSIVAMENTE dentro de Law||Analytics para
								proporcionar la funcionalidad de sincronización de calendario.
							</Typography>
							<Typography paragraph sx={bodySx}>
								Los datos obtenidos de Google Calendar se utilizan únicamente para:
							</Typography>
							{bulletList([
								"Importar eventos de Google Calendar a su calendario de Law||Analytics",
								"Crear eventos en Google Calendar desde Law||Analytics (audiencias, vencimientos, reuniones)",
								"Mantener sincronizados los eventos entre ambas plataformas",
								"Actualizar o eliminar eventos cuando se modifican en cualquiera de las plataformas",
							])}

							{subHeading("Almacenamiento y seguridad de datos de Google")}
							<Typography paragraph sx={bodySx}>
								<Box component="strong" sx={{ fontWeight: 600 }}>
									Importante:
								</Box>{" "}
								Los tokens de autenticación de Google se almacenan únicamente en su navegador web (sessionStorage) y nunca se envían ni
								almacenan en nuestros servidores. Los eventos importados desde Google Calendar se almacenan en nuestra base de datos con un
								identificador especial (googleCalendarId) que permite mantener la sincronización.{" "}
								<Box component="strong" sx={{ fontWeight: 600 }}>
									Estos datos no se utilizan para análisis de terceros, publicidad, perfilado ni se comparten con ninguna entidad externa.
								</Box>{" "}
								Aplicamos cifrado en tránsito y en reposo, y el acceso humano está limitado a casos de soporte, seguridad o cumplimiento
								legal, bajo controles y registro de acceso.
							</Typography>
							<Typography paragraph sx={bodySx}>
								Solo almacenamos la siguiente información de eventos de Google Calendar:
							</Typography>
							{bulletList([
								"Título del evento",
								"Descripción del evento",
								"Fecha y hora de inicio y fin",
								"ID único del evento en Google Calendar (para sincronización)",
							])}

							{subHeading("Desvinculación y eliminación de datos de Google")}
							<Typography paragraph sx={bodySx}>
								Usted puede desvincular su cuenta de Google Calendar en cualquier momento desde la sección de calendario de la aplicación.
								Al desvincular:
							</Typography>
							{bulletList([
								"Se revocan inmediatamente todos los permisos de acceso a Google Calendar",
								"Se eliminan automáticamente todos los eventos importados desde Google Calendar de nuestra base de datos en un plazo máximo de 30 días",
								"Se eliminan los tokens de autenticación de su navegador",
								"Los eventos creados localmente en Law||Analytics permanecen intactos",
							])}
							<Typography paragraph sx={bodySx}>
								Para revocar el acceso de Law||Analytics a su cuenta de Google, también puede hacerlo directamente desde su{" "}
								<Link href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" sx={linkSx}>
									configuración de permisos de Google
								</Link>
								.
							</Typography>

							{sectionHeading("Enlaces a terceros", "enlaces-terceros")}
							<Typography paragraph sx={bodySx}>
								Este sitio web puede contener enlaces a otros sitios que pudieran ser de su interés. Una vez que usted hace clic en estos
								enlaces y abandona nuestra página, ya no tenemos control sobre el sitio al que es redirigido y, por lo tanto, no somos
								responsables de los términos o privacidad ni de la protección de sus datos en esos otros sitios terceros.
							</Typography>

							{sectionHeading("Control de su información personal", "control-informacion")}
							<Typography paragraph sx={bodySx}>
								En cualquier momento usted puede restringir la recopilación o el uso de la información personal que es proporcionada a
								nuestro sitio web. Puede acceder a su información personal almacenada en su cuenta para corregirla o eliminarla.
							</Typography>
							<Typography paragraph sx={bodySx}>
								Law||Analytics no venderá ni transferirá información personal ni datos obtenidos desde Google a terceros, salvo a
								proveedores que actúan como encargados de tratamiento para operar el servicio, bajo contrato y sin reutilización para fines
								propios, o cuando sea requerido por ley o por una orden judicial válida. Esto incluye específicamente los datos obtenidos a
								través de la integración con Google Calendar, que se mantienen estrictamente confidenciales y se utilizan únicamente para
								proporcionar la sincronización de calendario dentro de nuestra aplicación.
							</Typography>

							{sectionHeading("Cambios en la Política de Privacidad", "cambios-politica")}
							<Typography paragraph sx={bodySx}>
								Law||Analytics se reserva el derecho de cambiar los términos de la presente Política de Privacidad en cualquier momento. Le
								notificaremos cualquier cambio significativo en la forma en que tratamos su información personal enviando un aviso a la
								dirección de correo electrónico principal especificada en su cuenta o colocando un aviso prominente en nuestro sitio.
							</Typography>

							<Divider sx={{ my: 4, borderColor: alpha(theme.palette.divider, 0.6) }} />

							<Typography paragraph sx={bodySx}>
								Si tiene alguna pregunta sobre esta Política de Privacidad, puede contactarnos a través de nuestro formulario de contacto o
								por correo electrónico a{" "}
								<Link href="mailto:soporte@lawanalytics.app" sx={linkSx}>
									soporte@lawanalytics.app
								</Link>
								.
							</Typography>
						</MainCard>
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default PrivacyPolicy;
