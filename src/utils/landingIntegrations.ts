// Lista dinámica de integraciones judiciales DISPONIBLES para textos de
// marketing ("Integración con PJN, MEV y EJE", hero, teaser de planes,
// "Empezá en 3 pasos"). Fuente primaria: integrations.landingCatalog del
// endpoint público (catálogo administrable en /admin/integrations, con
// metadata + capacidades). Fallback: el mapa legacy integrations.landing y,
// en última instancia, la lista histórica hardcodeada.
import { LandingCatalogEntry, LandingIntegrationsMap, PublicIntegrations } from "store/reducers/ApiService";

const LABELS: Record<string, string> = {
	pjn: "PJN",
	mev: "MEV",
	eje: "EJE",
	seclo: "SECLO",
	pjsalta: "Salta",
	pjcatamarca: "Catamarca",
};

const FALLBACK_LIST = "PJN, MEV y EJE";
const FALLBACK_SYNC_LIST = "PJN/MEV";

/** "A, B y C" — join estilo castellano. */
function joinEs(items: string[]): string {
	if (items.length === 0) return "";
	if (items.length === 1) return items[0];
	return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

/** Entries 'available' del catálogo, ya ordenadas por order asc. */
function availableEntries(catalog?: LandingCatalogEntry[]): LandingCatalogEntry[] {
	if (!catalog || catalog.length === 0) return [];
	return catalog.filter((entry) => entry.status === "available").sort((a, b) => a.order - b.order);
}

/** "PJN, MEV, EJE y Salta" — solo las integraciones en estado 'available',
 *  respetando el orden configurado en el admin. Usa el catálogo dinámico si
 *  está presente; si no, el mapa legacy. */
export function formatAvailableIntegrations(landing?: LandingIntegrationsMap, catalog?: LandingCatalogEntry[]): string {
	const fromCatalog = availableEntries(catalog).map((entry) => entry.listLabel || entry.shortName || entry.key.toUpperCase());
	if (fromCatalog.length > 0) return joinEs(fromCatalog);
	if (!landing) return FALLBACK_LIST;
	const items = Object.entries(landing)
		.map(([key, value]) => ({
			key,
			status: typeof value === "string" ? value : value?.status,
			order: typeof value === "object" && typeof value?.order === "number" ? value.order : 99,
		}))
		.filter((entry) => entry.status === "available" && LABELS[entry.key])
		.sort((a, b) => a.order - b.order)
		.map((entry) => LABELS[entry.key]);
	if (items.length === 0) return FALLBACK_LIST;
	return joinEs(items);
}

/** "PJN/MEV" — jurisdicciones disponibles que permiten sincronización con
 *  credenciales. Fallback = la dupla histórica. */
export function formatSyncIntegrations(catalog?: LandingCatalogEntry[]): string {
	const items = availableEntries(catalog)
		.filter((entry) => entry.capabilities?.credentialSync)
		.map((entry) => entry.listLabel || entry.shortName || entry.key.toUpperCase());
	if (items.length === 0) return FALLBACK_SYNC_LIST;
	return items.join("/");
}

/** "EJE, Salta y Catamarca" — jurisdicciones disponibles que permiten agregar
 *  causas individualmente pero NO sincronización con credenciales. Vacío si
 *  no hay catálogo o no hay ninguna en esa condición. */
export function formatIndividualOnlyIntegrations(catalog?: LandingCatalogEntry[]): string {
	const items = availableEntries(catalog)
		.filter((entry) => entry.capabilities?.individualCauses && !entry.capabilities?.credentialSync)
		.map((entry) => entry.listLabel || entry.shortName || entry.key.toUpperCase());
	return joinEs(items);
}

/** Reemplaza la lista histórica "PJN, MEV y EJE" embebida en un texto estático
 *  por la lista dinámica de integraciones disponibles. Si el texto no la
 *  contiene, vuelve intacto. Acepta el objeto PublicIntegrations completo o el
 *  mapa legacy (compat con call sites previos). */
export function withDynamicIntegrations(text: string, source?: PublicIntegrations | LandingIntegrationsMap): string {
	const isFull = !!source && ("claudeAi" in source || "landingCatalog" in source);
	const landing = isFull ? (source as PublicIntegrations).landing : (source as LandingIntegrationsMap | undefined);
	const catalog = isFull ? (source as PublicIntegrations).landingCatalog : undefined;
	return text.replace("PJN, MEV y EJE", formatAvailableIntegrations(landing, catalog));
}
