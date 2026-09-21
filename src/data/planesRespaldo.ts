// Respaldo estático de los planes públicos, con la misma forma que devuelve
// GET /api/plan-configs/public.
//
// Lo dibujan la sección Planes de la landing y la página /plans desde el primer
// momento, y cuando responde la API se actualizan en sitio. Sin esto /plans
// mostraba un indicador de carga que después se reemplazaba por cuatro tarjetas:
// un salto de diseño de 0,98 en Lighthouse y una página de precios sin precios
// para quien llega desde un anuncio (la-ads/analysis/2026-09-21-plans-y-jurisprudencia-lighthouse.md).
//
// Tiene que coincidir con `planconfigs` en la base, que es la fuente de verdad:
// las mismas filas, en el mismo orden y con los mismos textos, para que al llegar
// la respuesta real las tarjetas no cambien de alto. Si se toca un precio o un
// cupo en la base, se cambia acá también; planesRespaldo.test.ts fija los valores
// vigentes para que el cambio no pase inadvertido.

import { Plan, PlanFeature, ResourceLimit } from "store/reducers/ApiService";

type Cupos = {
	folders: number;
	calculators: number;
	contacts: number;
	storage: number;
	postalTrackings: number;
	postalDocuments: number;
	aiQueriesPerMonth: number;
	// -1 = ilimitado en planconfigs
	jurisprudenciaSearchPerMonth: number;
};

type Funciones = {
	vinculateFolders: boolean;
	advancedAnalytics: boolean;
	exportReports: boolean;
	movements: boolean;
	booking: boolean;
	prioritySupport: boolean;
};

const recursos = (cupos: Cupos, almacenamiento = "MB de Almacenamiento"): ResourceLimit[] => [
	{ name: "folders", limit: cupos.folders, displayName: "Causas", description: "Número máximo de carpetas", visibility: "all", order: 1 },
	{
		name: "calculators",
		limit: cupos.calculators,
		displayName: "Calculadoras",
		description: "Número máximo de calculadoras",
		visibility: "all",
		order: 2,
	},
	{
		name: "contacts",
		limit: cupos.contacts,
		displayName: "Contactos",
		description: "Número máximo de contactos",
		visibility: "all",
		order: 3,
	},
	{
		name: "storage",
		limit: cupos.storage,
		displayName: almacenamiento,
		description: "Almacenamiento máximo en MB",
		visibility: "all",
		order: 4,
	},
	{
		name: "postalTrackings",
		limit: cupos.postalTrackings,
		displayName: "Seguimientos postales",
		description: "Número máximo de seguimientos postales activos",
		visibility: "all",
		order: 6,
	},
	{
		name: "postalDocuments",
		limit: cupos.postalDocuments,
		displayName: "Documentos",
		description: "Número máximo de escritos generados",
		visibility: "all",
		order: 7,
	},
	{
		name: "aiQueriesPerMonth",
		limit: cupos.aiQueriesPerMonth,
		displayName: "Consultas IA/mes",
		description: "Consultas mensuales al Asistente IA (editor)",
		visibility: "all",
		order: 10,
	},
	{
		name: "jurisprudenciaSearchPerMonth",
		limit: cupos.jurisprudenciaSearchPerMonth,
		displayName: "Búsquedas de jurisprudencia/mes",
		description: "Búsquedas semánticas de jurisprudencia por mes (-1 = ilimitado, 0 = bloqueado)",
		visibility: "all",
		order: 11,
	},
];

const funciones = (f: Funciones): PlanFeature[] => [
	{
		name: "vinculateFolders",
		enabled: f.vinculateFolders,
		displayName: "Vincular causas",
		description: "Vinculación con servicios externos",
		visibility: "all",
		order: 1,
	},
	{
		name: "advancedAnalytics",
		enabled: f.advancedAnalytics,
		displayName: "Análisis avanzados",
		description: "Análisis avanzados",
		visibility: "all",
		order: 2,
	},
	{
		name: "exportReports",
		enabled: f.exportReports,
		displayName: "Exportar reportes",
		description: "Exportación de reportes",
		visibility: "all",
		order: 3,
	},
	{
		name: "movements",
		enabled: f.movements,
		displayName: "Sincronizar causas",
		description: "Sincronización de causas judiciales",
		visibility: "all",
		order: 4,
	},
	{
		name: "booking",
		enabled: f.booking,
		displayName: "Reservas y agenda",
		description: "Sistema de reservas y agenda",
		visibility: "all",
		order: 5,
	},
	{
		name: "prioritySupport",
		enabled: f.prioritySupport,
		displayName: "Soporte prioritario",
		description: "Soporte prioritario",
		visibility: "all",
		order: 7,
	},
];

const precio = (basePrice: number): Plan["pricingInfo"] => ({ basePrice, currency: "USD", billingPeriod: "monthly" });

// Igual que en la respuesta del API: el precio ya está resuelto para el entorno.
// Sin esta marca, getPlanPricing aplica en localhost sus precios de desarrollo.
const hasEnvironments = true;

export const PLANES_RESPALDO: Plan[] = [
	{
		planId: "free",
		displayName: "Plan Gratuito",
		description: "Plan básico con funcionalidades limitadas",
		isActive: true,
		hasEnvironments,
		isDefault: true,
		pricingInfo: precio(0),
		resourceLimits: recursos(
			{
				folders: 5,
				calculators: 3,
				contacts: 10,
				storage: 50,
				postalTrackings: 5,
				postalDocuments: 5,
				aiQueriesPerMonth: 5,
				jurisprudenciaSearchPerMonth: 5,
			},
			"Almacenamiento",
		),
		features: funciones({
			vinculateFolders: true,
			advancedAnalytics: false,
			exportReports: false,
			movements: false,
			booking: false,
			prioritySupport: false,
		}),
		activeDiscounts: [],
	},
	{
		planId: "standard",
		displayName: "Plan Estándar",
		description: "Plan con funcionalidades adicionales para profesionales",
		isActive: true,
		hasEnvironments,
		isDefault: false,
		pricingInfo: precio(7.99),
		resourceLimits: recursos({
			folders: 50,
			calculators: 20,
			contacts: 100,
			storage: 100,
			postalTrackings: 30,
			postalDocuments: 50,
			aiQueriesPerMonth: 50,
			jurisprudenciaSearchPerMonth: -1,
		}),
		features: funciones({
			vinculateFolders: true,
			advancedAnalytics: true,
			exportReports: true,
			movements: true,
			booking: true,
			prioritySupport: false,
		}),
		activeDiscounts: [],
	},
	{
		planId: "pro",
		displayName: "Plan Pro",
		description: "Plan intermedio: analytics avanzado y automatización",
		isActive: true,
		hasEnvironments,
		isDefault: false,
		pricingInfo: precio(14.99),
		resourceLimits: recursos({
			folders: 200,
			calculators: 100,
			contacts: 500,
			storage: 150,
			postalTrackings: 60,
			postalDocuments: 200,
			aiQueriesPerMonth: 200,
			jurisprudenciaSearchPerMonth: -1,
		}),
		features: funciones({
			vinculateFolders: true,
			advancedAnalytics: true,
			exportReports: true,
			movements: true,
			booking: true,
			prioritySupport: false,
		}),
		activeDiscounts: [],
	},
	{
		planId: "premium",
		displayName: "Plan Premium",
		description: "Plan completo con todas las funcionalidades",
		isActive: true,
		hasEnvironments,
		isDefault: false,
		pricingInfo: precio(29.99),
		resourceLimits: recursos({
			folders: 500,
			calculators: 200,
			contacts: 1000,
			storage: 200,
			postalTrackings: 100,
			postalDocuments: 500,
			aiQueriesPerMonth: 500,
			jurisprudenciaSearchPerMonth: -1,
		}),
		features: funciones({
			vinculateFolders: true,
			advancedAnalytics: true,
			exportReports: true,
			movements: true,
			booking: true,
			prioritySupport: true,
		}),
		activeDiscounts: [],
	},
];
