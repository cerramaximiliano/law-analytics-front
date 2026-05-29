import type { AuditRoute } from "./routes";

// Rutas de la app logueada que NO estaban en el audit inicial.
// Excluye: dashboard/default, apps/calendar, apps/folders/list, apps/profiles/user/personal,
// documentos/escritos (ya auditadas); rutas del template (customer/list, invoice/*, tareas);
// rutas admin; rutas dinámicas (con :id/:token).

export const APP_ROUTES: AuditRoute[] = [
	// Dashboard
	{
		name: "dashboard-analytics",
		path: "/dashboard/analytics",
		description: "Dashboard — analytics",
		componentPath: "src/pages/dashboard/analytics",
	},

	// Apps
	{
		name: "chat",
		path: "/apps/chat",
		description: "Chat",
		componentPath: "src/pages/apps/chat",
	},
	{
		name: "documents",
		path: "/apps/documents",
		description: "Documentos (listado general)",
		componentPath: "src/pages/apps/documents",
	},

	// Calculators
	{
		name: "calc-all",
		path: "/apps/calc",
		description: "Calculadoras — índice general",
		componentPath: "src/pages/calculator/all/index",
	},
	{
		name: "calc-labor",
		path: "/apps/calc/labor",
		description: "Calculadora laboral",
		componentPath: "src/pages/calculator/labor/index",
	},
	{
		name: "calc-civil",
		path: "/apps/calc/civil",
		description: "Calculadora civil",
		componentPath: "src/pages/calculator/civil/index",
	},
	{
		name: "calc-intereses",
		path: "/apps/calc/intereses",
		description: "Calculadora de intereses",
		componentPath: "src/pages/calculator/intereses/index",
	},

	// Calendar variants
	{
		name: "calendar-availability",
		path: "/apps/calendar/availability",
		description: "Calendario — disponibilidad",
		componentPath: "src/pages/apps/calendar/availability",
	},
	{
		name: "calendar-reservations",
		path: "/apps/calendar/reservations",
		description: "Calendario — reservas",
		componentPath: "src/pages/apps/calendar/reservations",
	},
	{
		name: "calendar-booking-config",
		path: "/apps/calendar/booking-config",
		description: "Calendario — config de booking",
		componentPath: "src/pages/apps/calendar/availability",
	},

	// Profile — user tabs
	{
		name: "profile-user-payment",
		path: "/apps/profiles/user/payment",
		description: "Perfil — pagos",
		componentPath: "src/sections/apps/profiles/user/TabPayment",
	},
	{
		name: "profile-user-password",
		path: "/apps/profiles/user/password",
		description: "Perfil — contraseña",
		componentPath: "src/sections/apps/profiles/user/TabPassword",
	},
	{
		name: "profile-user-professional",
		path: "/apps/profiles/user/professional",
		description: "Perfil — profesional",
		componentPath: "src/sections/apps/profiles/user/TabProfessional",
	},
	{
		name: "profile-user-settings",
		path: "/apps/profiles/user/settings",
		description: "Perfil — ajustes",
		componentPath: "src/sections/apps/profiles/user/TabSettings",
	},

	// Profile — account tabs
	{
		name: "profile-account-my-account",
		path: "/apps/profiles/account/my-account",
		description: "Cuenta — mi cuenta",
		componentPath: "src/sections/apps/profiles/account/TabAccount",
	},
	{
		name: "profile-account-password",
		path: "/apps/profiles/account/password",
		description: "Cuenta — contraseña",
		componentPath: "src/sections/apps/profiles/account/TabPassword",
	},
	{
		name: "profile-account-role",
		path: "/apps/profiles/account/role",
		description: "Cuenta — rol",
		componentPath: "src/sections/apps/profiles/account/TabRole",
	},
	{
		name: "profile-account-settings",
		path: "/apps/profiles/account/settings",
		description: "Cuenta — ajustes",
		componentPath: "src/sections/apps/profiles/account/TabSettings",
	},
	{
		name: "profile-account-pjn",
		path: "/apps/profiles/account/pjn",
		description: "Cuenta — integración PJN",
		componentPath: "src/sections/apps/profiles/account/TabPjnIntegration",
	},

	// Documentos
	{
		name: "documentos-modelos",
		path: "/documentos/modelos",
		description: "Documentos — modelos/plantillas",
		componentPath: "src/pages/herramientas/plantillas",
	},

	// Herramientas
	{
		name: "herramientas-postal",
		path: "/herramientas/seguimiento-postal",
		description: "Herramientas — seguimiento postal",
		componentPath: "src/pages/herramientas/postal-tracking",
	},
	{
		name: "herramientas-plantillas",
		path: "/herramientas/plantillas",
		description: "Herramientas — plantillas (legacy)",
		componentPath: "src/pages/herramientas/plantillas",
	},

	// Suscripciones y subscription states
	{
		name: "suscripciones-tables",
		path: "/suscripciones/tables",
		description: "Suscripciones — comparación de planes",
		componentPath: "src/pages/extra-pages/price/price1",
	},
	{
		name: "subscription-success",
		path: "/apps/subscription/success",
		description: "Suscripción — éxito post-Stripe",
		componentPath: "src/pages/apps/subscription/success",
	},
	{
		name: "subscription-error",
		path: "/apps/subscription/error",
		description: "Suscripción — error post-Stripe",
		componentPath: "src/pages/apps/subscription/error",
	},

	// Ayuda
	{
		name: "ayuda",
		path: "/ayuda",
		description: "Ayuda",
		componentPath: "src/pages/help",
	},
];
