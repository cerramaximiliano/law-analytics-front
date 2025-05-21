// third-party
import { FormattedMessage } from "react-intl";
// assets
import {
	DollarSquare,
	UserSquare,
	InfoCircle,
	BoxTick,
} from "iconsax-react";
// type
import { NavItemType } from "types/menu";

// icons
const icons = {
	userSettings: BoxTick,
	price: DollarSquare,
	profile: UserSquare,
	help: InfoCircle,
};

// ==============================|| MENU ITEMS - USER SETTINGS ||============================== //

const userSettings: NavItemType = {
	id: "group-user-settings",
	title: <FormattedMessage id="configuración" />,
	icon: icons.userSettings,
	type: "group",
	children: [
		{
			id: "price",
			title: <FormattedMessage id="Planes" />,
			icon: icons.price,
			type: "item",
			url: "/suscripciones/tables",
		},
		{
			id: "profile",
			title: <FormattedMessage id="Perfil" />,
			type: "collapse",
			icon: icons.profile,
			children: [
				{
					id: "user-profile",
					title: <FormattedMessage id="Usuario" />,
					type: "item",
					url: "/apps/profiles/user/personal",
					breadcrumbs: false,
				},
				{
					id: "account-profile",
					title: <FormattedMessage id="Cuenta" />,
					type: "item",
					url: "/apps/profiles/account/my-account",
				},
			],
		},
		{
			id: "help",
			title: <FormattedMessage id="Ayuda" />,
			icon: icons.help,
			type: "item",
			url: "/ayuda",
		},
	],
};

export default userSettings;