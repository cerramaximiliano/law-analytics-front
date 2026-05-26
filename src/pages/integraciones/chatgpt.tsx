/**
 * /integraciones/chatgpt — landing pública dedicada para el conector MCP
 * de ChatGPT. Steps, FAQ y CTA orientados al flow de OpenAI.
 *
 * La página compartida /integraciones/conectores-ai sigue funcionando
 * como discovery general (cubre Claude.ai + ChatGPT).
 *
 * Tracking GTM (mismo namespace que conectores-ai con page_variant):
 *  - mcp_landing_view              { page_variant: 'chatgpt' }
 *  - mcp_landing_cta_click         { page_variant: 'chatgpt', cta_location }
 *  - mcp_landing_faq_open          { page_variant: 'chatgpt', faq_index, faq_question }
 */

import { useEffect, useState } from "react";

// material-ui
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Container,
	Divider,
	Grid,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

// icons
import {
	ArrowDown2,
	ArrowRight2,
	DocumentText,
	Folder,
	Lock1,
	Message,
	MessageQuestion,
	SearchNormal1,
	ShieldTick,
	Star1,
	TickCircle,
} from "iconsax-react";

// project-imports
import ChatGptLogo from "components/icons/ChatGptLogo";
import LogoSection from "components/logo";
import FadeInWhenVisible from "sections/landing/Animation";
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";
import { usePublicIntegrations } from "hooks/usePublicIntegrations";

// tracking
import { pushGTMEvent } from "utils/gtm";

const BRAND_BLUE = "#3A7BFF";

const MCP_SERVER_URL = "https://mcp.lawanalytics.app";

// Subject EXACTO (matchea subjectOptions en SupportModal.tsx — si lo renombrás,
// actualizar acá también).
const BETA_REQUEST_SUBJECT = "Solicitud de acceso beta — Conector MCP";

const BETA_REQUEST_LOCKED_HEADER = `Tipo: Solicitud de acceso beta — Conector MCP (ChatGPT)
Origen: /integraciones/chatgpt
Pre-requisitos del solicitante:
  • Cuenta activa en lawanalytics.app
  • Plan Plus/Team/Enterprise en ChatGPT (necesario para custom connectors / apps)

El usuario solicita acceso a la beta cerrada del conector MCP para ChatGPT. Una vez aprobado:
1. Activar grant manual en User.featureGrants.mcp_access = true (admin → Feature Grants)
2. Enviar instrucciones de cómo agregar el conector en ChatGPT (Settings → Apps & Connectors)`;

interface UseCase {
	icon: React.ReactNode;
	title: string;
	example: string;
}

const USE_CASES: UseCase[] = [
	{
		icon: <SearchNormal1 size={24} color={BRAND_BLUE} />,
		title: "Buscar tus expedientes",
		example: '"Buscame todos los casos de Pérez c/ Banco Nación"',
	},
	{
		icon: <DocumentText size={24} color={BRAND_BLUE} />,
		title: "Resumir movimientos recientes",
		example: '"¿Qué pasó esta semana en mi causa de laboral con Acme S.A.?"',
	},
	{
		icon: <Folder size={24} color={BRAND_BLUE} />,
		title: "Consultar detalle de un caso",
		example: '"Mostrame el detalle del folder Onildo — partes, juzgado, últimos escritos"',
	},
	{
		icon: <Star1 size={24} color={BRAND_BLUE} />,
		title: "Buscar jurisprudencia",
		example: '"Buscame sentencias sobre indemnización agravada por despido sin causa"',
	},
];

interface Step {
	num: number;
	title: string;
	body: string;
}

const STEPS: Step[] = [
	{
		num: 1,
		title: "Pedí acceso beta",
		body: "Esta integración está en beta cerrada — te activamos el acceso manualmente. Hacé click en 'Solicitar acceso' al final de la página o escribinos a soporte@lawanalytics.app.",
	},
	{
		num: 2,
		title: "Abrí ChatGPT → Settings → Apps & Connectors",
		body: "Necesitás un plan Plus, Team o Enterprise de ChatGPT (el plan Free no soporta custom connectors). Andá a Settings → Apps & Connectors → 'Add connector'.",
	},
	{
		num: 3,
		title: "Pegá la URL del servidor MCP",
		body: `Server URL: ${MCP_SERVER_URL}. Nombre: "Law Analytics" (o el que prefieras). Confirmá.`,
	},
	{
		num: 4,
		title: "Autorizá la conexión con tu cuenta",
		body: "ChatGPT te va a redirigir a lawanalytics.app/oauth/login. Loguéate con tu cuenta habitual, revisá los permisos en la pantalla de consent, y aceptá. Listo: las 12 tools de Law Analytics quedan disponibles en cualquier chat de ChatGPT.",
	},
];

interface FaqItem {
	q: string;
	a: string;
}

const FAQ: FaqItem[] = [
	{
		q: "¿Es seguro? ¿ChatGPT accede a mis datos sin filtro?",
		a: "ChatGPT sólo puede invocar tools de lectura — no puede modificar, eliminar ni compartir nada. Cada tool call valida que vos sos el dueño del folder consultado (no podés acceder a folders de otros users). La autorización es OAuth 2.1 estándar y podés revocarla en cualquier momento.",
	},
	{
		q: "¿Qué ve exactamente ChatGPT sobre mis causas?",
		a: "Sólo lo que le pidas. Las tools devuelven datos puntuales — buscar folders por texto, traer detalle de un folder específico (con su causa linkeada, movimientos, tareas, notas, etc.). ChatGPT NO recibe un dump completo de tu base. Cada query es explícita y queda en logs.",
	},
	{
		q: "¿Cómo revoco el acceso?",
		a: "Dos formas: (1) En ChatGPT → Settings → Apps & Connectors → Law Analytics → Disconnect. (2) En lawanalytics.app → Configuración → Apps conectadas → Desconectar. Ambas revocan el token inmediatamente.",
	},
	{
		q: "¿Qué tools están disponibles?",
		a: "12 tools cubriendo: búsqueda de folders, listado paginado, detalle completo (folder + causa + movimientos + counts), drill-downs por colección (movimientos, tareas, notas, eventos, cálculos, contactos, escritos), búsqueda semántica de sentencias judiciales (~80 mil), y consulta RAG sobre el contenido de un expediente específico.",
	},
	{
		q: "¿Funciona con Claude.ai también?",
		a: "Sí — el mismo addon mcp_access habilita Claude.ai y ChatGPT. El protocolo MCP es un estándar abierto. Si querés conectar Claude.ai, mirá /integraciones/conectores-ai. Cuando otros clientes (Gemini, Copilot, etc.) habiliten MCP los iremos sumando.",
	},
	{
		q: "¿Qué plan de ChatGPT necesito?",
		a: "Plus, Team o Enterprise — el plan Free de ChatGPT no soporta custom connectors / apps externos. Una vez conectado, podés usarlo en cualquier chat sin restricciones de tipo de modelo.",
	},
	{
		q: "¿Tiene costo extra del lado de lawanalytics.app?",
		a: "Es un add-on opcional sobre planes Standard y Premium de Law Analytics. Lo agregás desde la página de planes — Stripe prorratea automáticamente sobre tu ciclo de billing. Lo podés cancelar cuando quieras.",
	},
	{
		q: "Conecté pero ChatGPT no encuentra las herramientas",
		a: "Suele ser cache. En ChatGPT: Settings → Apps & Connectors → Law Analytics → Disconnect + Remove → volvé a agregar con la misma URL. Después abrí un chat NUEVO. Si persiste, contactanos.",
	},
	{
		q: "¿Mis datos salen del país?",
		a: "Las tools del MCP corren en nuestra infraestructura. ChatGPT (OpenAI) procesa los datos que vos le pasás en el chat — eso queda regido por la política de privacidad de OpenAI. No enviamos tu base completa a ningún lado, solo respondemos lo que cada query individual pide.",
	},
];

const ChatGptLandingPage = () => {
	const theme = useTheme();
	const { integrations, loading: integrationsLoading } = usePublicIntegrations();
	const chatGptEnabled = integrations.chatGpt.enabled;
	const maintenanceMessage = integrations.chatGpt.maintenanceMessage;
	const isBeta = integrations.chatGpt.releaseStage !== "stable";

	// Esta página es ChatGPT-only: si chatGpt está deshabilitado, mostramos
	// "no disponible" (no derivamos hacia conectores-ai porque el user vino
	// con interés específico en ChatGPT).
	const heroTitle = "Conectá ChatGPT a tu cuenta de Law Analytics";
	const heroCtaLabel = isBeta ? "Solicitar acceso beta" : "Conectar ChatGPT";

	const [openFaq, setOpenFaq] = useState<number | null>(null);

	useEffect(() => {
		if (!integrationsLoading && chatGptEnabled) {
			pushGTMEvent("mcp_landing_view", { page_variant: "chatgpt" });
		}
	}, [integrationsLoading, chatGptEnabled]);

	const handleFaqToggle = (idx: number) => {
		const newState = openFaq === idx ? null : idx;
		setOpenFaq(newState);
		if (newState !== null) {
			pushGTMEvent("mcp_landing_faq_open", { page_variant: "chatgpt", faq_index: idx, faq_question: FAQ[idx].q });
		}
	};

	const [supportOpen, setSupportOpen] = useState(false);

	const handleCtaClick = (location: string) => {
		pushGTMEvent("mcp_landing_cta_click", { page_variant: "chatgpt", cta_location: location });
		setSupportOpen(true);
	};

	// Gating: si la integración está deshabilitada en IntegrationsConfig
	// mostramos pantalla de "no disponible" en vez de la landing completa.
	// Durante el fetch inicial (sin cache) mostramos un esqueleto neutro
	// para evitar flash de la landing en deshabilitado.
	if (integrationsLoading) {
		return <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }} />;
	}

	if (!chatGptEnabled) {
		return (
			<Box sx={{ bgcolor: "background.default", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
				<Container maxWidth="sm">
					<Stack spacing={3} alignItems="center" sx={{ textAlign: "center", py: 8 }}>
						<ChatGptLogo size={64} />
						<Typography variant="h3" sx={{ fontWeight: 700 }}>
							Integración no disponible
						</Typography>
						<Typography color="text.secondary">
							{maintenanceMessage ||
								"La integración con Claude.ai no está disponible en este momento. Volvé a intentar más tarde."}
						</Typography>
						<Button variant="contained" href="/" sx={{ mt: 2 }}>
							Volver al inicio
						</Button>
					</Stack>
				</Container>
			</Box>
		);
	}

	return (
		<Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
			{/* Nav minimalista — logo a la izquierda como link a la landing */}
			<Box
				component="header"
				sx={{
					position: "sticky",
					top: 0,
					zIndex: 10,
					bgcolor: alpha(theme.palette.background.default, 0.85),
					backdropFilter: "blur(10px)",
					borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
				}}
			>
				<Container maxWidth="md" sx={{ display: "flex", alignItems: "center", py: 1.5 }}>
					<LogoSection to="/" />
				</Container>
			</Box>

			<Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
				{/* Hero — ChatGPT-specific: logo, title, copy y CTA dedicados. */}
				<Stack spacing={2} alignItems="center" sx={{ textAlign: "center", mb: 6 }}>
					<Box sx={{ mb: 1 }}>
						<ChatGptLogo size={64} />
					</Box>
					<Chip
						label={isBeta ? "BETA CERRADA" : "DISPONIBLE"}
						color={isBeta ? "primary" : "success"}
						size="small"
						sx={{ fontWeight: 700, letterSpacing: 1, mb: 1 }}
					/>
					<Typography variant="h2" sx={{ fontWeight: 700, fontSize: { xs: 28, md: 44 } }}>
						{heroTitle}
					</Typography>
					<Typography variant="h6" color="text.secondary" sx={{ maxWidth: 640, fontWeight: 400 }}>
						Pediole a ChatGPT que busque tus causas, resuma movimientos, te recuerde audiencias y consulte
						jurisprudencia — directo desde cualquier chat, con tus datos reales.
					</Typography>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
						<Button
							variant="contained"
							size="large"
							onClick={() => handleCtaClick("hero")}
							endIcon={<ArrowRight2 size={20} />}
							sx={{ minWidth: 220 }}
						>
							{heroCtaLabel}
						</Button>
						<Button
							variant="outlined"
							size="large"
							component="a"
							href="#como-funciona"
							sx={{ minWidth: 180 }}
						>
							Cómo funciona
						</Button>
					</Stack>
				</Stack>

				<Divider sx={{ my: 6 }} />

				{/* Use cases */}
				<FadeInWhenVisible>
				<Box sx={{ mb: 8 }} id="que-podes-hacer">
					<Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>
						Qué podés hacer
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mb: 4 }}>
						Estos son ejemplos reales de lo que podés pedirle a Claude desde cualquier chat:
					</Typography>
					<Grid container spacing={2}>
						{USE_CASES.map((uc, i) => (
							<Grid item xs={12} sm={6} key={i}>
								<Card variant="outlined" sx={{ height: "100%" }}>
									<CardContent>
										<Stack direction="row" spacing={2} alignItems="flex-start">
											<Box sx={{ pt: 0.5 }}>{uc.icon}</Box>
											<Box>
												<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
													{uc.title}
												</Typography>
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{ fontStyle: "italic" }}
												>
													{uc.example}
												</Typography>
											</Box>
										</Stack>
									</CardContent>
								</Card>
							</Grid>
						))}
					</Grid>
				</Box>
				</FadeInWhenVisible>

				<Divider sx={{ my: 6 }} />

				{/* Steps */}
				<FadeInWhenVisible>
				<Box sx={{ mb: 8 }} id="como-funciona">
					<Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>
						Cómo conectarlo
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mb: 4 }}>
						4 pasos. Demora menos de 2 minutos.
					</Typography>
					<Stack spacing={2}>
						{STEPS.map((s) => (
							<Card key={s.num} variant="outlined">
								<CardContent>
									<Stack direction="row" spacing={3} alignItems="flex-start">
										<Box
											sx={{
												minWidth: 40,
												height: 40,
												borderRadius: "50%",
												bgcolor: BRAND_BLUE,
												color: "white",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontWeight: 700,
												fontSize: 18,
											}}
										>
											{s.num}
										</Box>
										<Box sx={{ flex: 1 }}>
											<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
												{s.title}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												{s.body}
											</Typography>
										</Box>
									</Stack>
								</CardContent>
							</Card>
						))}
					</Stack>
				</Box>
				</FadeInWhenVisible>

				<Divider sx={{ my: 6 }} />

				{/* Trust / Security */}
				<FadeInWhenVisible>
				<Box sx={{ mb: 8 }} id="seguridad">
					<Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: "center" }}>
						Seguridad y privacidad
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={4}>
							<Stack spacing={1} alignItems="center" sx={{ textAlign: "center" }}>
								<Lock1 size={32} color={BRAND_BLUE} />
								<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
									OAuth 2.1 estándar
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Mismo protocolo que usás para login con Google o GitHub.
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={12} sm={4}>
							<Stack spacing={1} alignItems="center" sx={{ textAlign: "center" }}>
								<ShieldTick size={32} color={BRAND_BLUE} />
								<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
									Sólo lectura
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Claude no puede modificar, eliminar ni compartir tus datos.
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={12} sm={4}>
							<Stack spacing={1} alignItems="center" sx={{ textAlign: "center" }}>
								<TickCircle size={32} color={BRAND_BLUE} />
								<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
									Revocable al instante
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Cancelás desde Claude.ai o desde tu cuenta de Law Analytics.
								</Typography>
							</Stack>
						</Grid>
					</Grid>
				</Box>
				</FadeInWhenVisible>

				<Divider sx={{ my: 6 }} />

				{/* FAQ */}
				<FadeInWhenVisible>
				<Box sx={{ mb: 8 }} id="faq">
					<Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: "center" }}>
						Preguntas frecuentes
					</Typography>
					<Stack spacing={1}>
						{FAQ.map((item, i) => (
							<Accordion
								key={i}
								expanded={openFaq === i}
								onChange={() => handleFaqToggle(i)}
								disableGutters
								elevation={0}
								sx={{
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: "8px !important",
									"&:before": { display: "none" },
									"&.Mui-expanded": { margin: 0, borderColor: BRAND_BLUE },
								}}
							>
								<AccordionSummary expandIcon={<ArrowDown2 size={18} />}>
									<Stack direction="row" spacing={1.5} alignItems="center">
										<MessageQuestion size={20} color={BRAND_BLUE} />
										<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
											{item.q}
										</Typography>
									</Stack>
								</AccordionSummary>
								<AccordionDetails>
									<Typography variant="body2" color="text.secondary" sx={{ pl: 4.5 }}>
										{item.a}
									</Typography>
								</AccordionDetails>
							</Accordion>
						))}
					</Stack>
				</Box>
				</FadeInWhenVisible>

				<Divider sx={{ my: 6 }} />

				{/* CTA final */}
				<FadeInWhenVisible>
				<Box sx={{ textAlign: "center", py: 6 }}>
					<Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
						Listo para probarlo
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 540, mx: "auto" }}>
						Estamos onboarding manualmente a un grupo chico de estudios jurídicos. Escribinos y te
						activamos el acceso.
					</Typography>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
						<Button
							variant="contained"
							size="large"
							onClick={() => handleCtaClick("footer")}
							startIcon={<Message size={20} />}
							sx={{ minWidth: 240 }}
						>
							{heroCtaLabel}
						</Button>
					</Stack>
					<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3 }}>
						Tenés que tener una cuenta activa en lawanalytics.app + plan Plus/Team/Enterprise en ChatGPT.
					</Typography>
				</Box>
				</FadeInWhenVisible>
			</Container>

			{/* SupportModal — usado para "Solicitar acceso beta". Se pre-setea con
			    subject + lockedHeader del contexto del request; el user solo aporta
			    su email (si está anónimo) y opcionalmente agrega contexto extra. */}
			<SupportModal
				open={supportOpen}
				onClose={() => setSupportOpen(false)}
				defaultSubject={BETA_REQUEST_SUBJECT}
				defaultPriority="low"
				lockedHeader={BETA_REQUEST_LOCKED_HEADER}
				variant="landing"
			/>
		</Box>
	);
};

export default ChatGptLandingPage;
