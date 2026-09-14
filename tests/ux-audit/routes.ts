export interface AuditRoute {
	name: string;
	path: string;
	description: string;
	componentPath: string;
}

export interface Viewport {
	name: string;
	width: number;
	height: number;
}

export const AUDIT_ROUTES: AuditRoute[] = [
	{
		name: "dashboard",
		path: "/dashboard/default",
		description: "Dashboard principal",
		componentPath: "src/pages/dashboard/default",
	},
	{
		name: "calendar",
		path: "/apps/calendar",
		description: "Calendario de eventos",
		componentPath: "src/pages/apps/calendar/calendar",
	},
	{
		name: "folders",
		path: "/apps/folders/list",
		description: "Listado de causas/folders",
		componentPath: "src/pages/apps/folders/folders",
	},
	{
		name: "contacts",
		path: "/apps/customer/list",
		description: "Listado de contactos",
		componentPath: "src/pages/apps/customer/list",
	},
	{
		name: "tasks",
		path: "/tasks",
		description: "Tareas",
		componentPath: "src/pages/tasks",
	},
	{
		name: "profile",
		path: "/apps/profiles/user/personal",
		description: "Perfil de usuario — datos personales",
		componentPath: "src/sections/apps/profiles/user/TabPersonal",
	},
	{
		name: "invoices",
		path: "/apps/invoice/dashboard",
		description: "Dashboard de facturación",
		componentPath: "src/pages/apps/invoice/dashboard",
	},
	{
		name: "escritos",
		path: "/documentos/escritos",
		description: "Escritos judiciales",
		componentPath: "src/pages/documentos/escritos",
	},
];

export const VIEWPORTS: Viewport[] = [
	{ name: "desktop", width: 1440, height: 900 },
	{ name: "tablet", width: 820, height: 1180 },
	{ name: "mobile", width: 390, height: 844 },
];
