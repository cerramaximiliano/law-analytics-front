/**
 * /integraciones/conectores-ai — landing pública del MCP server.
 * Soporta Claude.ai y ChatGPT con FAQ compartida — el copy/hero/CTA se
 * adapta dinámicamente según qué AIs estén enabled en IntegrationsConfig.
 * URL vieja /integraciones/claude-ai redirige acá (LoginRoutes.tsx).
 *
 * Tracking GTM:
 *  - mcp_landing_view              al montar (con flags claude_enabled, chatgpt_enabled)
 *  - mcp_landing_cta_click         al click en CTA (hero / footer / unavailable_beta_request) + cta_kind
 *  - mcp_landing_view { page_variant: "beta_access" }  pantalla de acceso beta (switch apagado + grant)
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
	Link,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

// icons
import {
	ArrowDown2,
	ArrowRight2,
	Calendar,
	DocumentText,
	DocumentText1,
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
import useMcpAccess from "hooks/useMcpAccess";
import useMcpLandingCta from "hooks/useMcpLandingCta";
import McpConnectGuide from "sections/apps/profiles/account/McpConnectGuide";
import {
	MCP_CONNECTOR_URL,
	McpRequirementsSection,
	McpReviewerSummary,
	McpSupportSection,
	McpToolsSection,
} from "sections/mcp/McpPublicDocs";

// tracking
import { pushGTMEvent } from "utils/gtm";
import { PRIVACY_CONNECTORS_URL } from "utils/mcpLegal";

const BRAND_BLUE = "#3A7BFF";

// Subject EXACTO (matchea subjectOptions en SupportModal.tsx — si lo renombrás,
// actualizar acá también).
const BETA_REQUEST_SUBJECT = "Solicitud de acceso beta — Conector MCP";

const BETA_REQUEST_LOCKED_HEADER = `Tipo: Solicitud de acceso beta — Conector MCP (Claude.ai / ChatGPT)
Origen: /integraciones/conectores-ai
Pre-requisitos del solicitante:
  • Cuenta activa en lawanalytics.app
  • Cuenta de Claude.ai o ChatGPT con un plan que admita conectores

El usuario solicita acceso a la beta cerrada del conector MCP. Una vez aprobado:
1. Activar grant manual en User.featureGrants.mcp_access = true (admin → Feature Grants)
2. Enviar instrucciones de cómo conectar el conector en Claude.ai (Settings → Connectors) o ChatGPT`;

interface UseCase {
	icon: React.ReactNode;
	title: string;
	example: string;
	/** Herramientas MCP que suele usar el asistente para responder (nombres de la-mcp-server). */
	tools: string[];
}

const USE_CASES: UseCase[] = [
	{
		icon: <SearchNormal1 size={24} color={BRAND_BLUE} />,
		title: "Buscar tus expedientes",
		example: '"Buscame todos los casos de Pérez c/ Banco Nación"',
		tools: ["search_folders"],
	},
	{
		icon: <DocumentText size={24} color={BRAND_BLUE} />,
		title: "Resumir movimientos recientes",
		example: '"¿Qué pasó esta semana en mi causa de laboral con Acme S.A.?"',
		tools: ["search_folders", "list_folder_movements"],
	},
	{
		icon: <Calendar size={24} color={BRAND_BLUE} />,
		title: "Revisar tu agenda y vencimientos",
		example: '"¿Qué audiencias, tareas y vencimientos tengo en los próximos 7 días?"',
		tools: ["get_upcoming_agenda"],
	},
	{
		icon: <DocumentText1 size={24} color={BRAND_BLUE} />,
		title: "Leer el texto de un movimiento",
		example: '"Leé la última resolución de la causa Pérez c/ Banco Nación y explicame qué ordena"',
		tools: ["list_folder_movements", "read_movement_text"],
	},
	{
		icon: <Folder size={24} color={BRAND_BLUE} />,
		title: "Consultar detalle de un caso",
		example: '"Mostrame el detalle del folder Onildo — partes, juzgado, últimos escritos"',
		tools: ["get_folder_detail"],
	},
	{
		icon: <Star1 size={24} color={BRAND_BLUE} />,
		title: "Buscar jurisprudencia",
		example: '"Buscame sentencias sobre indemnización agravada por despido sin causa"',
		tools: ["search_sentencias", "get_sentencia_text"],
	},
];

interface Step {
	num: number;
	title: string;
	body: string;
	/** Camino alternativo (se muestra debajo del body). */
	alt?: string;
}

const buildSteps = (priceLabel: string | null): Step[] => [
	{
		num: 1,
		title: "Activá el add-on Conectores de IA",
		body: `Se suma a tu plan Estándar, Pro o Premium${priceLabel ? ` por ${priceLabel}` : ""}. Lo activás desde esta página, desde Planes o desde tu cuenta (Perfil → Suscripción), y lo podés quitar cuando quieras.`,
	},
	{
		num: 2,
		title: "Agregá Law Analytics en Claude",
		body: "En Claude: Configuración → Conectores → Explorar conectores → buscá \"Law Analytics\" → Conectar. Los conectores están disponibles según tu plan de Claude.",
		alt: `Alternativa: Configuración → Conectores → Agregar conector personalizado. Nombre: "Law Analytics". URL: ${MCP_CONNECTOR_URL}.`,
	},
	{
		num: 3,
		title: "Autorizá la conexión con tu cuenta",
		body: "Claude te va a redirigir a lawanalytics.app/oauth/login. Iniciá sesión con tu cuenta habitual, revisá los permisos en la pantalla de autorización y aceptá. Desde ese momento las herramientas de Law||Analytics quedan disponibles en tus chats de Claude.",
	},
];

interface FaqItem {
	q: string;
	a: string;
	/** Link opcional al final de la respuesta (p. ej. a la política de privacidad). */
	link?: { href: string; label: string };
}

const FAQ: FaqItem[] = [
	{
		q: "¿Es seguro? ¿Claude.ai accede a mis datos sin filtro?",
		a: "Claude.ai sólo puede invocar tools de lectura — no puede crear, modificar ni eliminar nada en tu cuenta. Cada consulta se limita a tus carpetas y a las de los equipos de los que sos miembro: nunca accede a datos de otros usuarios. La autorización es OAuth 2.1 estándar y podés revocarla en cualquier momento.",
	},
	{
		q: "¿Qué ve exactamente Claude.ai sobre mis causas?",
		a: "Sólo lo que le pidas. Las tools devuelven datos puntuales — buscar folders por texto, traer detalle de un folder específico (con su causa linkeada, movimientos, tareas, notas, etc.). Claude nunca recibe una copia completa de tu cuenta: obtiene, consulta por consulta, solo lo que necesita para responderte, y eso lo procesa Anthropic según sus propias políticas. En nuestras métricas de uso registramos qué herramienta se usó y cuándo, sin los términos de búsqueda ni el contenido devuelto.",
	},
	{
		q: "¿Qué pasa con mis carpetas archivadas?",
		a: "De las carpetas archivadas Claude solo ve la carátula, el fuero y la jurisdicción. Para que pueda consultar el resto (movimientos, tareas, documentos, etc.) tenés que desarchivarla desde la app de Law||Analytics, sujeto al cupo de carpetas activas de tu plan.",
	},
	{
		q: "¿Cómo revoco el acceso?",
		a: "Dos formas: (1) En lawanalytics.app → Perfil → Integraciones → Asistentes de IA → Revocar: corta el acceso en el momento. (2) En Claude.ai → Settings → Connectors → Law Analytics → Disconnect: quita el conector de Claude.ai; para revocar también la autorización en Law||Analytics, usá la opción (1).",
	},
	{
		q: "¿Qué información puede consultar?",
		a: "Todo en modo lectura, de tus carpetas y de las de los equipos de los que sos miembro: carpetas (búsqueda, listado y detalle con la causa vinculada), movimientos, tareas, notas, eventos y agenda, calculadoras, contactos, modelos, documentos y seguimientos postales. Además, jurisprudencia: búsqueda de sentencias judiciales, preguntas sobre ellas y acceso a su texto.",
	},
	{
		q: "¿Funciona con ChatGPT u otros asistentes?",
		a: "Sí — el protocolo MCP es un estándar abierto. Soportamos Claude.ai y ChatGPT (ambos con el mismo addon). Cuando otros clientes (Gemini, Copilot, etc.) habiliten MCP los iremos sumando.",
	},
	{
		q: "¿Tiene costo extra?",
		a: "Sí: es el add-on Conectores de IA, opcional sobre los planes Estándar, Pro y Premium. Lo activás desde esta página, desde Planes o desde tu cuenta; el primer cobro es proporcional a lo que queda de tu período y después se cobra junto con tu plan. Lo podés quitar cuando quieras (al quitarlo, los asistentes se desconectan).",
	},
	{
		q: "Conecté pero Claude.ai dice que no encuentra herramientas",
		a: "Suele ser cache. En Claude.ai: Settings → Connectors → Law Analytics → Disconnect + Remove (los 3 puntitos) → Re-add con la misma URL. Después abrí un chat NUEVO. Si persiste, contactanos.",
	},
	{
		q: "¿Mis datos salen del país?",
		a: "Sí. Lo que Claude.ai consulta a través del conector lo procesa Anthropic en servidores fuera de la Argentina (entre otros, en Estados Unidos), según su propia política de privacidad; al autorizar el conector das tu consentimiento expreso para esa transferencia (Ley 25.326, art. 12). Nuestra propia infraestructura también está alojada en proveedores de nube con servidores fuera del país. Nunca enviamos tu base completa: solo respondemos lo que cada consulta pide.",
		link: { href: PRIVACY_CONNECTORS_URL, label: "Ver la Política de Privacidad — Conectores de IA" },
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
		? "Conectá Claude.ai y ChatGPT a tu cuenta de Law||Analytics"
		: claudeAiEnabled
			? "Conectá Claude.ai a tu cuenta de Law||Analytics"
			: "Conectá ChatGPT a tu cuenta de Law||Analytics";

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

	// CTA según el estado del visitante (anónimo / gratis / pago sin add-on / con acceso / beta).
	const cta = useMcpLandingCta({ onBetaRequest: () => setSupportOpen(true) });
	const handleCtaClick = (location: string) => cta.onClick(location);
	const steps = buildSteps(cta.priceLabel);

	// Gating: si la integración está deshabilitada en IntegrationsConfig
	// mostramos pantalla de "no disponible" en vez de la landing completa.
	// Durante el fetch inicial (sin cache) mostramos un esqueleto neutro
	// para evitar flash de la landing en deshabilitado.
	// Beta por grant: con el switch público apagado, un usuario con acceso beta
	// igual puede conectar (misma regla que el consent OAuth).
	const { access: mcpAccess, loading: mcpAccessLoading } = useMcpAccess();
	const betaAccess = !!mcpAccess?.providers.claude.available;
	const showBetaAccess = !integrationsLoading && !mcpAccessLoading && !anyAiEnabled && betaAccess;
	useEffect(() => {
		if (showBetaAccess) pushGTMEvent("mcp_landing_view", { page_variant: "beta_access" });
	}, [showBetaAccess]);

	const supportModal = (
		<SupportModal
			open={supportOpen}
			onClose={() => setSupportOpen(false)}
			defaultSubject={BETA_REQUEST_SUBJECT}
			defaultPriority="low"
			lockedHeader={BETA_REQUEST_LOCKED_HEADER}
			variant="landing"
		/>
	);

	if (integrationsLoading || mcpAccessLoading) {
		return <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }} />;
	}

	if (showBetaAccess) {
		return (
			<Box sx={{ bgcolor: "background.default", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
				<Container maxWidth="sm">
					<Stack spacing={3} sx={{ py: 8 }}>
						<Stack spacing={1} alignItems="center" sx={{ textAlign: "center" }}>
							<Typography variant="h3" sx={{ fontWeight: 700 }}>
								Tenés acceso beta a Claude.ai
							</Typography>
							<Typography color="text.secondary">
								La integración todavía no está abierta al público, pero tu cuenta está habilitada para usarla.
							</Typography>
						</Stack>
						<McpConnectGuide access={mcpAccess} />
						<Button variant="outlined" href="/apps/profiles/account/pjn?view=ia" sx={{ alignSelf: "center", textTransform: "none" }}>
							Ver mis asistentes conectados
						</Button>
					</Stack>
				</Container>
			</Box>
		);
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
						<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2, width: { xs: "100%", sm: "auto" } }}>
							{!maintenanceMessage && (
								<Button
									variant="contained"
									startIcon={<Message size={18} />}
									onClick={() => {
										pushGTMEvent("mcp_landing_cta_click", { cta_location: "unavailable_beta_request", cta_kind: "beta_request" });
										setSupportOpen(true);
									}}
								>
									Solicitar acceso a la beta
								</Button>
							)}
							<Button variant={maintenanceMessage ? "contained" : "outlined"} href="/">
								Volver al inicio
							</Button>
						</Stack>
					</Stack>
				</Container>
				{supportModal}
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
						label={anyBeta ? "BETA" : "DISPONIBLE"}
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
							disabled={cta.disabled}
							endIcon={<ArrowRight2 size={20} />}
							sx={{ minWidth: 220 }}
						>
							{cta.label}
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
												<Typography
													variant="caption"
													color="text.secondary"
													sx={{ display: "block", mt: 1, fontFamily: "monospace", fontSize: 11, wordBreak: "break-word" }}
												>
													{uc.tools.join(" · ")}
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

				{/* Requisitos */}
				<FadeInWhenVisible>
					<McpRequirementsSection client="claude" priceLabel={cta.priceLabel} />
				</FadeInWhenVisible>

				<Divider sx={{ my: 6 }} />

				{/* Steps */}
				<FadeInWhenVisible>
				<Box sx={{ mb: 8 }} id="como-funciona">
					<Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>
						Cómo conectarlo
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mb: 4 }}>
						{steps.length} pasos. Demora menos de 2 minutos.
					</Typography>
					<Stack spacing={2}>
						{steps.map((s) => (
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
											{s.alt && (
												<Typography variant="body2" color="text.secondary" sx={{ mt: 1, wordBreak: "break-word" }}>
													{s.alt}
												</Typography>
											)}
										</Box>
									</Stack>
								</CardContent>
							</Card>
						))}
					</Stack>
				</Box>
				</FadeInWhenVisible>

				<Divider sx={{ my: 6 }} />

				{/* Herramientas */}
				<FadeInWhenVisible>
					<McpToolsSection />
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
									El conector no puede crear, modificar ni eliminar nada en tu cuenta.
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
									Cancelás desde Claude.ai o desde tu cuenta de Law||Analytics.
								</Typography>
							</Stack>
						</Grid>
					</Grid>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
						Cómo tratamos la información que consultan los asistentes de IA:{" "}
						<Link href={PRIVACY_CONNECTORS_URL} underline="hover" sx={{ fontWeight: 500 }}>
							Política de Privacidad — Conectores de IA
						</Link>
						.
					</Typography>
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
										{item.link && (
											<>
												{" "}
												<Link href={item.link.href} underline="hover" sx={{ fontWeight: 500 }}>
													{item.link.label}
												</Link>
											</>
										)}
									</Typography>
								</AccordionDetails>
							</Accordion>
						))}
					</Stack>
				</Box>
				</FadeInWhenVisible>

				<Divider sx={{ my: 6 }} />

				{/* Soporte */}
				<FadeInWhenVisible>
					<McpSupportSection />
				</FadeInWhenVisible>

				<Divider sx={{ my: 6 }} />

				{/* CTA final */}
				<FadeInWhenVisible>
				<Box sx={{ textAlign: "center", py: 6 }}>
					<Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
						{cta.kind === "connect" ? "Ya podés conectarlo" : "Listo para probarlo"}
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 540, mx: "auto" }}>
						{cta.kind === "beta_request"
							? "Estamos sumando de a poco a un grupo chico de estudios jurídicos. Escribinos y te activamos el acceso."
							: "Activá el add-on y conectá tu asistente en menos de dos minutos. Podés quitarlo cuando quieras."}
					</Typography>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
						<Button
							variant="contained"
							size="large"
							onClick={() => handleCtaClick("footer")}
							disabled={cta.disabled}
							startIcon={cta.kind === "beta_request" ? <Message size={20} /> : undefined}
							endIcon={cta.kind === "beta_request" ? undefined : <ArrowRight2 size={20} />}
							sx={{ minWidth: 240 }}
						>
							{cta.label}
						</Button>
					</Stack>
					<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3, maxWidth: 560, mx: "auto" }}>
						{cta.footnote} Además necesitás una cuenta de {bothAiEnabled ? "Claude o ChatGPT" : claudeAiEnabled ? "Claude" : "ChatGPT"}; la
						disponibilidad de los conectores depende de tu plan.
					</Typography>
				</Box>
				</FadeInWhenVisible>

				<Divider sx={{ my: 6 }} />

				{/* Resumen en inglés para revisores del directorio de conectores */}
				<McpReviewerSummary client="claude" />
			</Container>

			{/* SupportModal — "Solicitar acceso beta" (beta cerrada). Diálogos del alta del add-on. */}
			{supportModal}
			{cta.dialogs}
		</Box>
	);
};

export default ClaudeAiLandingPage;
