export interface SEOConfig {
	title: string;
	description: string;
	keywords: string[];
	ogImage?: string;
	ogType?: string;
	structuredData?: any;
}

export const defaultSEO: SEOConfig = {
	title: "Law Analytics - Software Legal Inteligente para Abogados",
	description:
		"Gestiona causas judiciales, calcula indemnizaciones laborales, administra clientes y optimiza tu estudio jurídico con inteligencia artificial. Sincronización automática con Poder Judicial.",
	keywords: [
		"software legal",
		"gestión causas judiciales",
		"calculadora laboral",
		"indemnización despido",
		"liquidación laboral",
		"intereses judiciales",
		"poder judicial sincronización",
		"expedientes digitales",
		"estudio jurídico",
		"abogados argentina",
		"LCT calculadora",
		"software abogados",
	],
	ogImage: "/og-image.png",
	ogType: "website",
};

export const pageSEO: Record<string, SEOConfig> = {
	"/": {
		title: "Law Analytics - Software Legal Inteligente para Abogados",
		description:
			"Optimiza tu práctica legal con herramientas inteligentes: gestión de causas, cálculos laborales, sincronización con Poder Judicial y más. Prueba gratis.",
		keywords: [...defaultSEO.keywords, "software jurídico", "herramientas legales"],
	},
	"/calculator/labor": {
		title: "Calculadora Laboral Online - Despidos e Indemnizaciones | Law Analytics",
		description:
			"Calcula indemnizaciones por despido, preaviso, integración y multas laborales según Art. 245 LCT. Fórmulas actualizadas y exportación de resultados.",
		keywords: [
			"calculadora laboral",
			"indemnización despido",
			"articulo 245 LCT",
			"preaviso laboral",
			"integración mes despido",
			"multas laborales",
			"liquidación final",
			"calculadora despido online",
			"ley contrato trabajo",
		],
		structuredData: {
			"@context": "https://schema.org",
			"@type": "WebApplication",
			name: "Calculadora Laboral - Law Analytics",
			applicationCategory: "BusinessApplication",
			operatingSystem: "Web",
			offers: {
				"@type": "Offer",
				price: "0",
				priceCurrency: "ARS",
			},
		},
	},
	"/calculator/intereses": {
		title: "Calculadora de Intereses Judiciales - BCRA, CER, CNAT | Law Analytics",
		description:
			"Calcula intereses judiciales con tasas BCRA, CER, CNAT. Métodos de indexación e interés diario. Exporta resultados para tus procesos legales.",
		keywords: [
			"calculadora intereses judiciales",
			"tasa BCRA",
			"tasa CER",
			"tasa CNAT",
			"intereses legales",
			"indexación judicial",
			"cálculo intereses",
			"intereses procesales",
		],
	},
	"/apps/folders": {
		title: "Gestión de Causas Judiciales - Expedientes Digitales | Law Analytics",
		description:
			"Administra expedientes legales con sincronización automática del Poder Judicial. Importa causas, visualiza movimientos y organiza documentos.",
		keywords: [
			"gestión causas",
			"expedientes digitales",
			"poder judicial sincronización",
			"causas judiciales",
			"gestión expedientes",
			"carpetas digitales",
			"seguimiento causas",
			"PJN integración",
		],
		structuredData: {
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			name: "Sistema de Gestión de Causas - Law Analytics",
			applicationCategory: "BusinessApplication",
			featureList: [
				"Importación automática desde Poder Judicial",
				"Sincronización de movimientos procesales",
				"Gestión de documentos digitales",
				"Vinculación con cálculos",
				"Archivado inteligente",
			],
		},
	},
	"/apps/customer": {
		title: "CRM Legal - Gestión de Contactos y Clientes | Law Analytics",
		description:
			"Administra clientes del estudio jurídico. Perfiles de personas físicas y jurídicas, vinculación con causas, importación y exportación masiva.",
		keywords: [
			"CRM legal",
			"gestión clientes abogados",
			"contactos estudio jurídico",
			"base datos clientes",
			"CRM abogados",
			"gestión contactos legal",
		],
	},
	"/apps/calendar": {
		title: "Calendario Legal - Agenda de Audiencias y Vencimientos | Law Analytics",
		description:
			"Gestiona tu agenda legal con calendario inteligente. Audiencias, vencimientos, recordatorios automáticos y vinculación con causas.",
		keywords: [
			"calendario legal",
			"agenda abogados",
			"audiencias judiciales",
			"vencimientos legales",
			"recordatorios automáticos",
			"agenda jurídica",
		],
	},
	"/booking": {
		title: "Sistema de Citas Online para Abogados | Law Analytics",
		description:
			"Permite a tus clientes agendar citas online. Configuración de disponibilidad, formularios personalizados y notificaciones automáticas.",
		keywords: ["citas online abogados", "reserva consultas legales", "agenda online jurídica", "sistema citas legales", "booking abogados"],
	},
	"/plans": {
		title: "Planes y Precios - Software Legal | Law Analytics",
		description:
			"Planes flexibles para estudios jurídicos de todos los tamaños. Prueba gratis, sin tarjeta de crédito. Funcionalidades completas.",
		keywords: ["precios software legal", "planes abogados", "suscripción software jurídico", "prueba gratis abogados"],
	},
};

export const legalStructuredData = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "Law Analytics",
	description: "Software de gestión legal inteligente para abogados y estudios jurídicos",
	url: "https://lawanalytics.app",
	logo: "https://lawanalytics.app/logo.png",
	sameAs: ["https://www.linkedin.com/company/lawanalytics", "https://twitter.com/lawanalytics"],
	contactPoint: {
		"@type": "ContactPoint",
		contactType: "customer support",
		email: "soporte@lawanalytics.app",
		availableLanguage: ["Spanish", "English"],
	},
	potentialAction: {
		"@type": "SearchAction",
		target: "https://lawanalytics.app/search?q={search_term_string}",
		"query-input": "required name=search_term_string",
	},
};

export const breadcrumbStructuredData = (items: Array<{ name: string; url: string }>) => ({
	"@context": "https://schema.org",
	"@type": "BreadcrumbList",
	itemListElement: items.map((item, index) => ({
		"@type": "ListItem",
		position: index + 1,
		name: item.name,
		item: item.url,
	})),
});
