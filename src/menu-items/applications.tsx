import React from "react";

// third-party
import { FormattedMessage } from "react-intl";
// assets
import { Calculator, Folder, KyberNetwork, Messages2, Calendar1, Profile2User, CalendarTick, Task, DocumentText } from "iconsax-react";
// type
import { NavItemType } from "types/menu";

// icons
const icons = {
	applications: KyberNetwork,
	calculator: Calculator,
	folders: Folder,
	chat: Messages2,
	calendar: Calendar1,
	customer: Profile2User,
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
			title: <FormattedMessage id="carpetas" />,
			type: "collapse",
			icon: icons.folders,
			children: [
				{
					id: "my-folders",
					title: <FormattedMessage id="Mis Carpetas" />,
					type: "item",
					url: "/apps/folders/list",
				},
			],
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
					id: "previsional-calculator",
					title: <FormattedMessage id="Previsional" />,
					type: "item",
					url: "/apps/calc/previsional",
				},
				{
					id: "intereses-calculator",
					title: <FormattedMessage id="intereses" />,
					type: "item",
					url: "/apps/calc/intereses",
				},
				{
					id: "liquidacion-calculator",
					title: <FormattedMessage id="Liquidación judicial" />,
					type: "item",
					url: "/apps/calc/liquidacion",
				},
				{
					id: "valores-arancelarios",
					title: <FormattedMessage id="Valores arancelarios" />,
					type: "item",
					url: "/apps/calc/valores",
				},
				// Civil oculta hasta tener motor propio (backlog la-ads ítem 7, D3 b.7).
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
	],
};

export default applications;
