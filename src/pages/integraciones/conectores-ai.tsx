/**
 * /integraciones/conectores-ai — landing pública del MCP server.
 * Soporta Claude.ai y ChatGPT con FAQ compartida — el copy/hero/CTA se
 * adapta dinámicamente según qué AIs estén enabled en IntegrationsConfig.
 * URL vieja /integraciones/claude-ai redirige acá (LoginRoutes.tsx).
 *
 * Tracking GTM:
 *  - mcp_landing_view              al montar (con flags claude_enabled, chatgpt_enabled)
 *  - mcp_landing_cta_click         al click en CTA (hero / footer)
 *  - mcp_landing_faq_open          al abrir un item del FAQ
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
import ClaudeAiLogo from "components/icons/ClaudeAiLogo";
import AiClientsLogos from "components/icons/AiClientsLogos";
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

const BETA_REQUEST_LOCKED_HEADER = `Tipo: Solicitud de acceso beta — Conector MCP (Claude.ai / ChatGPT)
Origen: /integraciones/conectores-ai
Pre-requisitos del solicitante:
  • Cuenta activa en lawanalytics.app
  • Plan Pro/Team en Claude.ai o ChatGPT (necesario para custom connectors)

El usuario solicita acceso a la beta cerrada del conector MCP. Una vez aprobado:
1. Activar grant manual en User.featureGrants.mcp_access = true (admin → Feature Grants)
2. Enviar instrucciones de cómo conectar el conector en Claude.ai (Settings → Connectors) o ChatGPT`;

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
		title: "Abrí Claude.ai → Settings → Connectors",
		body: "Necesitás un plan Pro/Team de Claude.ai (los planes Free no soportan custom connectors). Andá a Settings (avatar arriba a la derecha) → Connectors en la sidebar izquierda → 'Add custom connector'.",
	},
	{
		num: 3,
		title: "Pegá la URL del servidor MCP",
		body: `Server URL: ${MCP_SERVER_URL}. Nombre: "Law Analytics" (o el que quieras). Click "Add".`,
	},
	{
		num: 4,
		title: "Autorizá la conexión con tu cuenta",
		body: "Claude.ai te va a redirigir a lawanalytics.app/oauth/login. Loguéate con tu cuenta habitual, revisá los permisos en la pantalla de consent, y aceptá. Listo: las 12 tools de Law Analytics quedan disponibles en cualquier chat de Claude.",
	},
];

interface FaqItem {
	q: string;
	a: string;
}

const FAQ: FaqItem[] = [
	{
		q: "¿Es seguro? ¿Claude.ai accede a mis datos sin filtro?",
		a: "Claude.ai sólo puede invocar tools de lectura — no puede modificar, eliminar ni compartir nada. Cada tool call valida que vos sos el dueño del folder consultado (no podés acceder a folders de otros users). La autorización es OAuth 2.1 estándar y podés revocarla en cualquier momento.",
	},
	{
		q: "¿Qué ve exactamente Claude.ai sobre mis causas?",
		a: "Sólo lo que le pidas. Las tools devuelven datos puntuales — buscar folders por texto, traer detalle de un folder específico (con su causa linkeada, movimientos, tareas, notas, etc.). Claude NO recibe un dump completo de tu base. Cada query es explícita y queda en logs.",
	},
	{
		q: "¿Cómo revoco el acceso?",
		a: "Dos formas: (1) En Claude.ai → Settings → Connectors → Law Analytics → Disconnect. (2) En lawanalytics.app → Configuración → Apps conectadas → Desconectar. Ambas revocan el token inmediatamente.",
	},
	{
		q: "¿Qué tools están disponibles?",
		a: "12 tools cubriendo: búsqueda de folders, listado paginado, detalle completo (folder + causa + movimientos + counts), drill-downs por colección (movimientos, tareas, notas, eventos, cálculos, contactos, escritos), búsqueda semántica de sentencias judiciales (~80 mil), y consulta RAG sobre el contenido de un expediente específico.",
	},
	{
		q: "¿Funciona con ChatGPT u otros asistentes?",
		a: "Sí — el protocolo MCP es un estándar abierto. Soportamos Claude.ai y ChatGPT (ambos con el mismo addon). Cuando otros clientes (Gemini, Copilot, etc.) habiliten MCP los iremos sumando.",
	},
	{
		q: "¿Tiene costo extra?",
		a: "Es un add-on opcional sobre planes Estándar, Pro y Premium. Lo agregás desde la página de planes — Stripe prorratea automáticamente sobre tu ciclo de billing. Lo podés cancelar cuando quieras.",
	},
	{
		q: "Conecté pero Claude.ai dice que no encuentra herramientas",
		a: "Suele ser cache. En Claude.ai: Settings → Connectors → Law Analytics → Disconnect + Remove (los 3 puntitos) → Re-add con la misma URL. Después abrí un chat NUEVO. Si persiste, contactanos.",
	},
	{
		q: "¿Mis datos salen del país?",
		a: "Las tools del MCP corren en nuestra infraestructura. Claude.ai (Anthropic) procesa los datos que vos le pasás en el chat — eso queda regido por la política de privacidad de Anthropic. No enviamos tu base completa a ningún lado, solo respondemos lo que cada query individual pide.",
	},
];

const ClaudeAiLandingPage = () => {
	const theme = useTheme();
	const { integrations, loading: integrationsLoading } = usePublicIntegrations();
	const claudeAiEnabled = integrations.claudeAi.enabled;
	const chatGptEnabled = integrations.chatGpt.enabled;
	const anyAiEnabled = claudeAiEnabled || chatGptEnabled;
	const bothAiEnabled = claudeAiEnabled && chatGptEnabled;

	// El mensaje de mantenimiento prioriza el del primero deshabilitado
	// (mensaje "general" cuando se desactiva la página entera).
	const maintenanceMessage = integrations.claudeAi.maintenanceMessage || integrations.chatGpt.maintenanceMessage;

	// Chip stage: si alguno está en beta, mostrar BETA (conservador). Si ambos
	// stable (o solo está enabled uno y es stable), mostrar DISPONIBLE.
	const anyBeta =
		(claudeAiEnabled && integrations.claudeAi.releaseStage !== "stable") ||
		(chatGptEnabled && integrations.chatGpt.releaseStage !== "stable");

	// Title dinámico: menciona los AI activos por nombre.
	const heroTitle = bothAiEnabled
		? "Conectá Claude.ai y ChatGPT a tu cuenta de Law Analytics"
		: claudeAiEnabled
			? "Conectá Claude.ai a tu cuenta de Law Analytics"
			: "Conectá ChatGPT a tu cuenta de Law Analytics";

	// CTA label: cuando ambos AI están enabled hablamos genérico.
	const heroCtaLabel = anyBeta
		? "Solicitar acceso beta"
		: bothAiEnabled
			? "Conectar conector AI"
			: claudeAiEnabled
				? "Conectar Claude.ai"
				: "Conectar ChatGPT";

	const [openFaq, setOpenFaq] = useState<number | null>(null);

	useEffect(() => {
		// Solo trackeamos el view si alguna integración está habilitada — si
		// ninguna lo está, el user ve la pantalla "no disponible".
		if (!integrationsLoading && anyAiEnabled) {
			pushGTMEvent("mcp_landing_view", { claude_enabled: claudeAiEnabled, chatgpt_enabled: chatGptEnabled });
		}
	}, [integrationsLoading, anyAiEnabled, claudeAiEnabled, chatGptEnabled]);

	const handleFaqToggle = (idx: number) => {
		const newState = openFaq === idx ? null : idx;
		setOpenFaq(newState);
		if (newState !== null) {
			pushGTMEvent("mcp_landing_faq_open", { faq_index: idx, faq_question: FAQ[idx].q });
		}
	};

	const [supportOpen, setSupportOpen] = useState(false);

	const handleCtaClick = (location: string) => {
		pushGTMEvent("mcp_landing_cta_click", { cta_location: location });
		setSupportOpen(true);
	};

	// Gating: si la integración está deshabilitada en IntegrationsConfig
	// mostramos pantalla de "no disponible" en vez de la landing completa.
	// Durante el fetch inicial (sin cache) mostramos un esqueleto neutro
	// para evitar flash de la landing en deshabilitado.
	if (integrationsLoading) {
		return <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }} />;
	}

	if (!anyAiEnabled) {
		return (
			<Box sx={{ bgcolor: "background.default", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
				<Container maxWidth="sm">
					<Stack spacing={3} alignItems="center" sx={{ textAlign: "center", py: 8 }}>
						<ClaudeAiLogo size={64} />
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
				{/* Hero — logos y title dinámicos según qué AI estén enabled
				    (Claude.ai, ChatGPT o ambos). Página renombrada de
				    /integraciones/claude-ai a /integraciones/conectores-ai
				    (redirect 301 en LoginRoutes.tsx). */}
				<Stack spacing={2} alignItems="center" sx={{ textAlign: "center", mb: 6 }}>
					<Box sx={{ mb: 1 }}>
						<AiClientsLogos integrations={integrations} size={64} spacing={2} />
					</Box>
					<Chip
						label={anyBeta ? "BETA CERRADA" : "DISPONIBLE"}
						color={anyBeta ? "primary" : "success"}
						size="small"
						sx={{ fontWeight: 700, letterSpacing: 1, mb: 1 }}
					/>
					<Typography variant="h2" sx={{ fontWeight: 700, fontSize: { xs: 28, md: 44 } }}>
						{heroTitle}
					</Typography>
					<Typography variant="h6" color="text.secondary" sx={{ maxWidth: 640, fontWeight: 400 }}>
						{bothAiEnabled
							? "Pediole a Claude o ChatGPT que busquen tus causas, resuman movimientos, te recuerden audiencias y consulten jurisprudencia — directo desde cualquier chat, con tus datos reales."
							: claudeAiEnabled
								? "Pediole a Claude que busque tus causas, resuma movimientos, te recuerde audiencias y consulte jurisprudencia — directo desde cualquier chat, con tus datos reales."
								: "Pediole a ChatGPT que busque tus causas, resuma movimientos, te recuerde audiencias y consulte jurisprudencia — directo desde cualquier chat, con tus datos reales."}
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
						Tenés que tener una cuenta activa en lawanalytics.app + plan Pro/Team en {bothAiEnabled ? "Claude.ai o ChatGPT" : claudeAiEnabled ? "Claude.ai" : "ChatGPT"}.
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

export default ClaudeAiLandingPage;
