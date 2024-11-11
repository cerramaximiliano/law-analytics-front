// third-party
import { FormattedMessage } from "react-intl";
// assets
import {
	DollarSquare,
	Calculator,
	Folder,
	KyberNetwork,
	Messages2,
	Calendar1,
	Kanban,
	Profile2User,
	Bill,
	UserSquare,
	ShoppingBag,
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
	profile: UserSquare,
	ecommerce: ShoppingBag,
	price: DollarSquare,
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
					id: "labor-calculator",
					title: <FormattedMessage id="laboral" />,
					type: "item",
					url: "/apps/calc/labor",
				},
				{
					id: "civil-calculator",
					title: <FormattedMessage id="civil" />,
					type: "item",
					url: "/apps/calc/civil",
				},
				{
					id: "intereses-calculator",
					title: <FormattedMessage id="intereses" />,
					type: "item",
					url: "/apps/calc/intereses",
				},
			],
		},
		{
			id: "calendar",
			title: <FormattedMessage id="calendario" />,
			type: "item",
			url: "/apps/calendar",
			icon: icons.calendar,
		},
		{
			id: "customer",
			title: <FormattedMessage id="contactos" />,
			type: "collapse",
			icon: icons.customer,
			children: [
				{
					id: "customer-list",
					title: <FormattedMessage id="Clientes" />,
					type: "item",
					url: "/apps/customer/customer-list",
				},
			],
		},
		{
			id: "invoice",
			title: <FormattedMessage id="invoice" />,
			url: "/apps/invoice/dashboard",
			type: "collapse",
			icon: icons.invoice,
			breadcrumbs: true,
			children: [
				{
					id: "create",
					title: <FormattedMessage id="create" />,
					type: "item",
					url: "/apps/invoice/create",
				},
				{
					id: "details",
					title: <FormattedMessage id="details" />,
					type: "item",
					url: "/apps/invoice/details/1",
				},
				{
					id: "list",
					title: <FormattedMessage id="list" />,
					type: "item",
					url: "/apps/invoice/list",
				},
				{
					id: "edit",
					title: <FormattedMessage id="edit" />,
					type: "item",
					url: "/apps/invoice/edit/1",
				},
			],
		},
		{
			id: "profile",
			title: <FormattedMessage id="profile" />,
			type: "collapse",
			icon: icons.profile,
			children: [
				{
					id: "user-profile",
					title: <FormattedMessage id="user-profile" />,
					type: "item",
					url: "/apps/profiles/user/personal",
					breadcrumbs: false,
				},
				{
					id: "account-profile",
					title: <FormattedMessage id="account-profile" />,
					type: "item",
					url: "/apps/profiles/account/basic",
				},
			],
		},
		{
			id: "price",
			title: <FormattedMessage id="Suscripciones" />,
			icon: icons.price,
			type: "item",
			url: "/price/price1",
		},
	],
};

export default applications;
