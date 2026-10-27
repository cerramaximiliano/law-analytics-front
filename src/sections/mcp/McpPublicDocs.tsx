/**
 * Bloques de documentación pública del conector MCP, compartidos por las
 * landings /integraciones/conectores-ai y /integraciones/chatgpt.
 *
 * Estas secciones cubren lo que pide el Connectors Directory de Anthropic
 * (Etapa D — D1 del PLAN-LANZAMIENTO de la-mcp-server): requisitos, lista de
 * herramientas (en el resumen en inglés para revisores, no en las secciones para el usuario) y soporte.
 *
 * MCP_TOOL_GROUPS debe mantenerse alineado con ALL_TOOLS de
 * la-mcp-server/src/tools/index.ts (nombres y títulos).
 */

import { Box, Card, CardContent, Grid, Link, Stack, Typography } from "@mui/material";
import { Book1, CalendarTick, Clock, DocumentText, FolderOpen, Judge, MessageText1, SearchNormal1, TickCircle } from "iconsax-react";

import { DEFAULT_MCP_URL } from "types/mcpAddon";
import { PRIVACY_CONNECTORS_URL } from "utils/mcpLegal";

export const MCP_CONNECTOR_URL = DEFAULT_MCP_URL;
export const MCP_SUPPORT_EMAIL = "soporte@lawanalytics.app";
/** Ficha pública en el directorio de conectores de Claude (publicada el 2026-10-27, etiqueta "Comunidad"). */
export const CLAUDE_DIRECTORY_URL = "https://claude.ai/directory/law-analytics";

export type McpDocsClient = "claude" | "chatgpt";

interface McpToolItem {
	name: string;
	title: string;
}

interface McpToolGroup {
	title: string;
	tools: McpToolItem[];
}

export const MCP_TOOL_GROUPS: McpToolGroup[] = [
	{
		title: "Case folders",
		tools: [
			{ name: "search_folders", title: "Buscar carpetas" },
			{ name: "list_my_folders", title: "Listar mis carpetas" },
			{ name: "get_folder_detail", title: "Ver detalle de carpeta" },
			{ name: "list_folder_notes", title: "Listar notas de una carpeta" },
		],
	},
	{
		title: "Docket entries and texts",
		tools: [
			{ name: "list_folder_movements", title: "Listar movimientos de una carpeta" },
			{ name: "list_recent_movements", title: "Listar movimientos recientes" },
			{ name: "read_movement_text", title: "Leer texto de movimiento" },
			{ name: "search_folder_movement_texts", title: "Buscar en textos de movimientos" },
			{ name: "get_movement_document", title: "Ver documento de movimiento" },
		],
	},
	{
		title: "Tasks, events and deadlines",
		tools: [
			{ name: "get_upcoming_agenda", title: "Ver agenda próxima" },
			{ name: "list_tasks", title: "Listar tareas" },
			{ name: "list_folder_tasks", title: "Listar tareas de una carpeta" },
			{ name: "list_events", title: "Listar eventos" },
			{ name: "list_folder_events", title: "Listar eventos de una carpeta" },
		],
	},
	{
		title: "Calculations, contacts, templates, documents and postal tracking",
		tools: [
			{ name: "list_calculators", title: "Listar cálculos" },
			{ name: "get_calculator", title: "Ver cálculo" },
			{ name: "list_folder_calculators", title: "Listar cálculos de una carpeta" },
			{ name: "search_contacts", title: "Buscar contactos" },
			{ name: "get_contact", title: "Ver contacto" },
			{ name: "list_folder_contacts", title: "Listar contactos de una carpeta" },
			{ name: "list_models", title: "Listar modelos de escritos" },
			{ name: "get_model", title: "Ver modelo de escrito" },
			{ name: "list_documents", title: "Listar documentos" },
			{ name: "get_document", title: "Ver documento" },
			{ name: "list_folder_documents", title: "Listar documentos de una carpeta" },
			{ name: "list_postal_trackings", title: "Listar seguimientos postales" },
			{ name: "get_postal_tracking", title: "Ver seguimiento postal" },
		],
	},
	{
		title: "Case law",
		tools: [
			{ name: "search_sentencias", title: "Buscar sentencias" },
			{ name: "ask_jurisprudencia", title: "Consultar jurisprudencia" },
			{ name: "find_similar_sentencias", title: "Buscar sentencias similares" },
			{ name: "get_sentencia_text", title: "Leer texto de sentencia" },
			{ name: "list_jurisprudencia_filters", title: "Filtros de jurisprudencia" },
		],
	},
];

export const MCP_TOOL_COUNT = MCP_TOOL_GROUPS.reduce((acc, g) => acc + g.tools.length, 0);

const sectionTitleSx = { fontWeight: 700, mb: 1, textAlign: "center" } as const;
const monoSx = { fontFamily: "monospace", fontSize: 12 } as const;
const BRAND_BLUE = "#3A7BFF";

const clientLabel = (client: McpDocsClient) => (client === "chatgpt" ? "ChatGPT" : "Claude");

// ─── Qué necesitás ─────────────────────────────────────────────────────────

/** Precio vigente del add-on, usado si la API todavía no devolvió el precio (confirmado en checkout 2026-10-07). */
export const MCP_ADDON_FALLBACK_PRICE = "US$ 4/mes";

export const McpRequirementsSection = ({ client, priceLabel }: { client: McpDocsClient; priceLabel: string | null }) => {
	const price = priceLabel || MCP_ADDON_FALLBACK_PRICE;
	const items = [
		{
			title: "Una cuenta de Law||Analytics con plan Estándar, Pro o Premium",
			body: "Es la cuenta con la que vas a autorizar la conexión. El conector consulta tus carpetas y las de los equipos de los que sos miembro.",
		},
		{
			title: `El add-on Conectores de IA (${price})`,
			body: "Se suma a tu plan y lo podés quitar cuando quieras. Un mismo add-on habilita Claude y ChatGPT.",
		},
		{
			title: `Una cuenta de ${clientLabel(client)}`,
			body:
				client === "chatgpt"
					? "La disponibilidad de los conectores depende de tu plan de ChatGPT."
					: "La disponibilidad de los conectores depende de tu plan de Claude.",
		},
	];
	return (
		<Box sx={{ mb: 8 }} id="requisitos">
			<Typography variant="h4" sx={sectionTitleSx}>
				Qué necesitás
			</Typography>
			<Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mb: 4 }}>
				Tres requisitos antes de conectar.
			</Typography>
			<Grid container spacing={2}>
				{items.map((it) => (
					<Grid item xs={12} md={4} key={it.title}>
						<Card variant="outlined" sx={{ height: "100%" }}>
							<CardContent>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
									{it.title}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{it.body}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				))}
			</Grid>
		</Box>
	);
};

// ─── ¿Qué podés hacer? ─────────────────────────────────────────────────────

interface McpUseCase {
	icon: React.ReactNode;
	title: string;
	/** Preguntas de ejemplo: sin nombres de partes, montos ni respuestas — solo lo que el usuario pediría. */
	examples: string[];
}

// Inspiradas en las pruebas reales del conector (la-mcp-server/docs: VERIFICACION-LECTURA-CAUSAS,
// LECTURA-EXPEDIENTES, DIRECTORIO). Nunca mostrar nombres de herramientas acá: no le dicen nada al usuario.
const MCP_USE_CASES: McpUseCase[] = [
	{
		icon: <MessageText1 size={24} color={BRAND_BLUE} />,
		title: "Chateá con el expediente",
		examples: [
			"¿Qué reclama la demanda, con qué fundamentos y por qué montos?",
			"¿Qué negó la contraparte al contestar y qué excepciones planteó?",
		],
	},
	{
		icon: <DocumentText size={24} color={BRAND_BLUE} />,
		title: "Ponete al día con una causa",
		examples: [
			"¿Qué pasó en esta causa en el último mes? Resumime los movimientos importantes y decime si hay algo que requiera respuesta.",
		],
	},
	{
		icon: <Judge size={24} color={BRAND_BLUE} />,
		title: "Analizá el caso",
		examples: [
			"¿Qué prueba ofreció cada parte, cuál se admitió y qué falta producir?",
			"¿Qué resoluciones fueron adversas a mi cliente y cuáles se apelaron?",
		],
	},
	{
		icon: <CalendarTick size={24} color={BRAND_BLUE} />,
		title: "Encontrá las fechas clave",
		examples: ["¿Cuándo quedó notificado del traslado de la demanda cada demandado, y de qué forma?"],
	},
	{
		icon: <Clock size={24} color={BRAND_BLUE} />,
		title: "Repasá vencimientos y agenda",
		examples: ["¿Qué audiencias, tareas y vencimientos tengo en las próximas dos semanas, y de qué causa es cada uno?"],
	},
	{
		icon: <Book1 size={24} color={BRAND_BLUE} />,
		title: "Jurisprudencia para tu caso",
		examples: [
			"Leé los hechos de esta causa y buscame sentencias de casos parecidos. ¿Cómo resolvieron los tribunales planteos similares?",
		],
	},
	{
		icon: <FolderOpen size={24} color={BRAND_BLUE} />,
		title: "Recorré tus carpetas",
		examples: ["¿Qué carpetas tengo activas y cuáles tuvieron movimientos en los últimos 7 días?"],
	},
	{
		icon: <SearchNormal1 size={24} color={BRAND_BLUE} />,
		title: "Buscá dentro de los escritos",
		examples: ["¿En qué escritos o resoluciones se habló de la pericia? Pasame el link al documento."],
	},
];

export const McpUseCasesSection = ({ assistantLabel }: { assistantLabel: string }) => (
	<Box sx={{ mb: 8 }} id="que-podes-hacer">
		<Typography variant="h4" sx={sectionTitleSx}>
			¿Qué podés hacer?
		</Typography>
		<Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mb: 4, maxWidth: 640, mx: "auto" }}>
			Todo lo que tenés en Law||Analytics, con la inteligencia de {assistantLabel}. Abrí un chat y preguntá como le preguntarías a un colega
			que leyó el expediente:
		</Typography>
		<Grid container spacing={2}>
			{MCP_USE_CASES.map((uc) => (
				<Grid item xs={12} sm={6} key={uc.title}>
					<Card variant="outlined" sx={{ height: "100%" }}>
						<CardContent>
							<Stack direction="row" spacing={2} alignItems="flex-start">
								<Box sx={{ pt: 0.5 }}>{uc.icon}</Box>
								<Stack spacing={1}>
									<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
										{uc.title}
									</Typography>
									{uc.examples.map((ex) => (
										<Typography key={ex} variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
											“{ex}”
										</Typography>
									))}
								</Stack>
							</Stack>
						</CardContent>
					</Card>
				</Grid>
			))}
		</Grid>
	</Box>
);

// ─── Qué puede consultar el asistente ──────────────────────────────────────

const MCP_CAPABILITIES: { title: string; items: string[] }[] = [
	{
		title: "Tus carpetas",
		items: [
			"Búsqueda por carátula o parte, y el listado completo",
			"Juzgado, expediente, estado y etapa de cada causa",
			"Las notas que cargaste en cada carpeta",
		],
	},
	{
		title: "El expediente completo",
		items: [
			"Los movimientos de todas las jurisdicciones que seguís",
			"El texto de proveídos, resoluciones, sentencias, escritos, cédulas y oficios",
			"Búsqueda de palabras dentro de los textos y enlace al documento original",
		],
	},
	{
		title: "Tu agenda",
		items: ["Audiencias, tareas y vencimientos", "Lo que viene en los próximos días, causa por causa"],
	},
	{
		title: "Tu trabajo guardado",
		items: ["Cálculos y liquidaciones", "Contactos", "Modelos de escritos y documentos", "Seguimiento de cartas documento"],
	},
	{
		title: "Jurisprudencia",
		items: [
			"Búsqueda de sentencias en lenguaje natural, por fuero o de la Corte Suprema",
			"Fallos similares a uno que ya encontraste",
			"El texto completo de cada sentencia",
		],
	},
];

export const McpCapabilitiesSection = () => (
	<Box sx={{ mb: 8 }} id="herramientas">
		<Typography variant="h4" sx={sectionTitleSx}>
			Qué puede consultar el asistente
		</Typography>
		<Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mb: 4, maxWidth: 640, mx: "auto" }}>
			Tus carpetas y las de los equipos de los que sos miembro. Todo en modo lectura: el asistente no puede crear, modificar ni eliminar
			nada en tu cuenta.
		</Typography>
		<Grid container spacing={2}>
			{MCP_CAPABILITIES.map((group) => (
				<Grid item xs={12} md={6} key={group.title}>
					<Card variant="outlined" sx={{ height: "100%" }}>
						<CardContent>
							<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
								{group.title}
							</Typography>
							<Stack spacing={1} component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
								{group.items.map((it) => (
									<Stack component="li" direction="row" spacing={1} alignItems="flex-start" key={it}>
										<TickCircle size={16} color={BRAND_BLUE} style={{ marginTop: 3, flexShrink: 0 }} />
										<Typography variant="body2">{it}</Typography>
									</Stack>
								))}
							</Stack>
						</CardContent>
					</Card>
				</Grid>
			))}
		</Grid>
	</Box>
);

// ─── Soporte ───────────────────────────────────────────────────────────────

export const McpSupportSection = () => (
	<Box sx={{ mb: 8, textAlign: "center" }} id="soporte">
		<Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
			Soporte
		</Typography>
		<Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: "auto" }}>
			Si tenés problemas para conectar o una consulta sobre el conector, escribinos a{" "}
			<Link href={`mailto:${MCP_SUPPORT_EMAIL}`} underline="hover" sx={{ fontWeight: 500 }}>
				{MCP_SUPPORT_EMAIL}
			</Link>
			. Para saber cómo tratamos la información que consultan los asistentes, leé la{" "}
			<Link href={PRIVACY_CONNECTORS_URL} underline="hover" sx={{ fontWeight: 500 }}>
				Política de Privacidad — Conectores de IA
			</Link>
			.
		</Typography>
	</Box>
);

// ─── English summary (para revisores del directorio) ───────────────────────

export const McpReviewerSummary = ({ client }: { client: McpDocsClient }) => {
	const steps =
		client === "chatgpt"
			? [
					"Activate the “Conectores de IA” add-on on your Law Analytics account (Plans or Profile → Subscription).",
					`In ChatGPT: Settings → Apps & Connectors → Create, and enter the server URL ${MCP_CONNECTOR_URL}.`,
					"Sign in with your Law Analytics account on the authorization screen and approve access (OAuth 2.1).",
			  ]
			: [
					"Activate the “Conectores de IA” add-on on your Law Analytics account (Plans or Profile → Subscription).",
					"In Claude: Settings → Connectors → Browse connectors → search for “Law Analytics” → Connect.",
					`Alternatively, add it as a custom connector (Settings → Connectors → Add custom connector) with the URL ${MCP_CONNECTOR_URL}.`,
					"Sign in with your Law Analytics account on the authorization screen and approve access (OAuth 2.1).",
			  ];
	return (
		<Box sx={{ py: 4 }} id="english-summary" lang="en">
			<Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
				For reviewers — English summary
			</Typography>
			<Stack spacing={2}>
				<Typography variant="body2" color="text.secondary">
					Law Analytics is a case-management platform for lawyers in Argentina. This connector lets {clientLabel(client)} read the
					user&apos;s own Law Analytics data — case folders, court docket entries and their text, tasks, events and upcoming deadlines,
					calculations, contacts, document templates, documents and postal tracking — and search case law (court rulings). Access is limited
					to the user&apos;s folders and those of teams they belong to.
				</Typography>
				<Box>
					<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
						Setup
					</Typography>
					<Box component="ol" sx={{ m: 0, pl: 3 }}>
						{steps.map((s) => (
							<Typography component="li" variant="body2" color="text.secondary" key={s}>
								{s}
							</Typography>
						))}
					</Box>
				</Box>
				<Box>
					<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
						Requirements
					</Typography>
					<Typography variant="body2" color="text.secondary">
						A Law Analytics account on the Estándar, Pro or Premium plan with the “Conectores de IA” add-on, and a {clientLabel(client)}{" "}
						account on a plan that supports connectors.
					</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
						Tools
					</Typography>
					<Stack spacing={0.5}>
						{MCP_TOOL_GROUPS.map((g) => (
							<Typography variant="body2" color="text.secondary" key={g.title} sx={{ wordBreak: "break-word" }}>
								<Box component="span" sx={{ fontWeight: 500 }}>
									{g.title}:
								</Box>{" "}
								<Box component="span" sx={monoSx}>
									{g.tools.map((t) => t.name).join(", ")}
								</Box>
							</Typography>
						))}
					</Stack>
				</Box>
				<Typography variant="body2" color="text.secondary">
					All {MCP_TOOL_COUNT} tools are read-only: the connector cannot create, modify or delete anything. Access can be revoked at any
					time from Law Analytics (Profile → Integrations → AI assistants). Privacy policy:{" "}
					<Link href={PRIVACY_CONNECTORS_URL} underline="hover">
						lawanalytics.app{PRIVACY_CONNECTORS_URL}
					</Link>
					. Support:{" "}
					<Link href={`mailto:${MCP_SUPPORT_EMAIL}`} underline="hover">
						{MCP_SUPPORT_EMAIL}
					</Link>
					.
				</Typography>
			</Stack>
		</Box>
	);
};
