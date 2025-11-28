import React from "react";

// third-party
import { FormattedMessage } from "react-intl";

// assets
import { Notification } from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// ==============================|| ADMIN MENU ITEMS ||============================== //

const admin: NavItemType = {
	id: "admin",
	title: <FormattedMessage id="admin" defaultMessage="Administración" />,
	type: "group",
	children: [
		{
			id: "notifications",
			title: <FormattedMessage id="notifications" defaultMessage="Notificaciones" />,
			type: "collapse",
			icon: Notification,
			breadcrumbs: true,
			children: [
				{
					id: "notifications-monitoring",
					title: <FormattedMessage id="notifications-monitoring" defaultMessage="Monitoreo" />,
					type: "item",
					url: "/admin/notifications",
					breadcrumbs: true,
				},
				{
					id: "notifications-judicial",
					title: <FormattedMessage id="notifications-judicial" defaultMessage="Movimientos Judiciales" />,
					type: "item",
					url: "/admin/notifications/judicial-movements",
					breadcrumbs: true,
				},
			],
		},
	],
};

export default admin;
