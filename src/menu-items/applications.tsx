// third-party
import { FormattedMessage } from "react-intl";
// assets
import {
	Calculator,
	Folder,
	KyberNetwork,
	Messages2,
	Calendar1,
	Kanban,
	Profile2User,
	Bill,
	ShoppingBag,
	CalendarTick,
	Task,
	DocumentText,
} from "iconsax-react";
// type
import { NavItemType } from "types/menu";

// icons
const icons = {
	applications: KyberNetwork,
	calculator: Calculator,
	folders: Folder,
	chat: Messages2,
	calendar: Calendar1,
	kanban: Kanban,
	customer: Profile2User,
	invoice: Bill,
	ecommerce: ShoppingBag,
	tasks: Task,
	booking: CalendarTick,
	documents: DocumentText,
};

// ==============================|| MENU ITEMS - APPLICATIONS ||============================== //

const applications: NavItemType = {
	id: "group-applications",
	title: <FormattedMessage id="aplicaciones" />,
	icon: icons.applications,
	type: "group",
	children: [
		{
			id: "folders",
			title: <FormattedMessage id="causas" />,
			type: "item",
			icon: icons.folders,
			url: "/apps/folders/list",
			//children: [{ id: "details", title: <FormattedMessage id="details" />, type: "item", url: "/apps/folders/details" }],
		},
		{
			id: "calculator",
			title: <FormattedMessage id="cálculos" />,
			type: "collapse",
			icon: icons.calculator,
			children: [
				{
					id: "all-calculators",
					title: <FormattedMessage id="Mis Cálculos" />,
					type: "item",
					url: "/apps/calc",
				},
				{
					id: "labor-calculator",
					title: <FormattedMessage id="laboral" />,
					type: "item",
					url: "/apps/calc/labor",
				},
				{
					id: "intereses-calculator",
					title: <FormattedMessage id="intereses" />,
					type: "item",
					url: "/apps/calc/intereses",
				},
				{
					id: "civil-calculator",
					title: <FormattedMessage id="civil" />,
					type: "item",
					url: "/apps/calc/civil",
					disabled: true,
					chip: {
						label: "Próximamente",
						color: "primary",
						size: "small",
						variant: "filled",
						className: "truncate-chip coming-soon-chip",
					},
				},
				{
					id: "previsional-calculator",
					title: <FormattedMessage id="Previsional" />,
					type: "item",
					url: "/apps/calc/previsional",
					disabled: true,
					chip: {
						label: "Próximamente",
						color: "primary",
						size: "small",
						variant: "filled",
						className: "truncate-chip coming-soon-chip",
					},
				},
			],
		},
		{
			id: "calendar",
			title: <FormattedMessage id="calendario" />,
			type: "collapse",
			icon: icons.calendar,
			children: [
				{
					id: "calendar-agenda",
					title: <FormattedMessage id="Agenda" />,
					type: "item",
					url: "/apps/calendar",
				},
				{
					id: "calendar-reservations",
					title: <FormattedMessage id="Citas" />,
					type: "item",
					url: "/apps/calendar/reservations",
				},
			],
		},
		{
			id: "customer",
			title: <FormattedMessage id="contactos" />,
			type: "collapse",
			icon: icons.customer,
			children: [
				{
					id: "customer-list",
					title: <FormattedMessage id="contactos" />,
					type: "item",
					url: "/apps/customer/customer-list",
				},
			],
		},
		{
			id: "tasks",
			title: <FormattedMessage id="Tareas" />,
			icon: icons.tasks,
			type: "item",
			url: "/tareas",
		},
		{
			id: "documents",
			title: <FormattedMessage id="Documentos" />,
			icon: icons.documents,
			type: "item",
			url: "/apps/documents",
			disabled: true,
			chip: {
				label: "Próximamente",
				color: "primary",
				size: "small",
				variant: "filled",
				className: "truncate-chip coming-soon-chip",
			},
		},
		/* 
		{
			id: "invoice",
			title: <FormattedMessage id="Facturación" />,
			url: "/apps/invoice/dashboard",
			type: "collapse",
			icon: icons.invoice,
			breadcrumbs: true,
			children: [
				{
					id: "create",
					title: <FormattedMessage id="Nueva" />,
					type: "item",
					url: "/apps/invoice/create",
				},
				{
					id: "details",
					title: <FormattedMessage id="Detalles" />,
					type: "item",
					url: "/apps/invoice/details/1",
				},
				{
					id: "list",
					title: <FormattedMessage id="Listados" />,
					type: "item",
					url: "/apps/invoice/list",
				},
				{
					id: "edit",
					title: <FormattedMessage id="Editar" />,
					type: "item",
					url: "/apps/invoice/edit/1",
				},
			],
		}, */
	],
};

export default applications;
