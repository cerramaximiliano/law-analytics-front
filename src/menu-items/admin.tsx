import React from "react";

// third-party
import { FormattedMessage } from "react-intl";

// assets
import { User, DocumentText, Folder2, Notification, Setting3 } from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// ==============================|| ADMIN MENU ITEMS ||============================== //

const admin: NavItemType = {
	id: "admin",
	title: <FormattedMessage id="admin" defaultMessage="Administración" />,
	type: "group",
	children: [
		{
			id: "users",
			title: <FormattedMessage id="users" defaultMessage="Usuarios" />,
			type: "item",
			url: "/admin/users",
			icon: User,
			breadcrumbs: false,
		},
		{
			id: "plans",
			title: <FormattedMessage id="plans" defaultMessage="Planes y Suscripciones" />,
			type: "item",
			url: "/admin/plans",
			icon: DocumentText,
			breadcrumbs: true,
		},
		{
			id: "causas",
			title: <FormattedMessage id="causas" defaultMessage="Carpetas" />,
			type: "collapse",
			icon: Folder2,
			breadcrumbs: true,
			children: [
				{
					id: "causas-verified",
					title: <FormattedMessage id="causas-verified" defaultMessage="Carpetas Verificadas" />,
					type: "item",
					url: "/admin/causas/verified",
					breadcrumbs: true,
				},
				{
					id: "causas-folders",
					title: <FormattedMessage id="causas-folders" defaultMessage="Carpetas con Documentos" />,
					type: "item",
					url: "/admin/causas/folders",
					breadcrumbs: true,
				},
			],
		},
		{
			id: "workers",
			title: <FormattedMessage id="workers" defaultMessage="Workers" />,
			type: "collapse",
			icon: Setting3,
			breadcrumbs: true,
			children: [
				{
					id: "workers-pjn",
					title: <FormattedMessage id="workers-pjn" defaultMessage="Workers PJN" />,
					type: "item",
					url: "/admin/causas/workers",
					breadcrumbs: true,
				},
				{
					id: "workers-mev",
					title: <FormattedMessage id="workers-mev" defaultMessage="Workers MEV" />,
					type: "item",
					url: "/admin/workers/mev",
					breadcrumbs: true,
				},
			],
		},
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
