// third-party
import { FormattedMessage } from "react-intl";

// assets
import { MessageSquare, User, DocumentText, Monitor } from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// ==============================|| ADMIN MENU ITEMS ||============================== //

const admin: NavItemType = {
	id: "admin",
	title: <FormattedMessage id="admin" defaultMessage="Administración" />,
	type: "group",
	children: [
		{
			id: "marketing",
			title: <FormattedMessage id="marketing" defaultMessage="Marketing" />,
			type: "collapse",
			icon: MessageSquare,
			breadcrumbs: true,
			children: [
				{
					id: "mailing",
					title: <FormattedMessage id="mailing" defaultMessage="Campañas de Email" />,
					type: "item",
					url: "/admin/marketing/mailing",
					breadcrumbs: true,
				},
				{
					id: "templates",
					title: <FormattedMessage id="templates" defaultMessage="Plantillas de Email" />,
					type: "item",
					url: "/admin/marketing/templates",
					breadcrumbs: true,
				},
				{
					id: "contacts",
					title: <FormattedMessage id="contacts" defaultMessage="Contactos" />,
					type: "item",
					url: "/admin/marketing/contacts",
					breadcrumbs: true,
				},
			],
		},
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
			id: "server-status",
			title: <FormattedMessage id="server-status" defaultMessage="Estado del Servidor" />,
			type: "item",
			url: "/admin/server-status",
			icon: Monitor,
			breadcrumbs: true,
		},
	],
};

export default admin;
