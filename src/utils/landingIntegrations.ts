// Lista dinámica de integraciones judiciales DISPONIBLES para textos de
// marketing ("Integración con PJN, MEV y EJE", hero, teaser de planes).
// Fuente: integrations.landing del endpoint público (config administrable en
// /admin/integrations) — la misma que gobierna el strip "Integrado con".
// Fallback = la lista histórica hardcodeada.
import { LandingIntegrationsMap } from "store/reducers/ApiService";

const LABELS: Record<string, string> = {
	pjn: "PJN",
	mev: "MEV",
	eje: "EJE",
	seclo: "SECLO",
	pjsalta: "Salta",
	pjcatamarca: "Catamarca",
};

const FALLBACK_LIST = "PJN, MEV y EJE";

/** "PJN, MEV, EJE y Salta" — solo las integraciones en estado 'available',
 *  respetando el orden configurado en el admin. */
export function formatAvailableIntegrations(landing?: LandingIntegrationsMap): string {
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
	if (items.length === 1) return items[0];
	return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

/** Reemplaza la lista histórica "PJN, MEV y EJE" embebida en un texto estático
 *  por la lista dinámica de integraciones disponibles. Si el texto no la
 *  contiene, vuelve intacto. */
export function withDynamicIntegrations(text: string, landing?: LandingIntegrationsMap): string {
	return text.replace("PJN, MEV y EJE", formatAvailableIntegrations(landing));
}
