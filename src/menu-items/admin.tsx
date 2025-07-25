// third-party
import { FormattedMessage } from "react-intl";

// assets
import { MessageSquare, User, DocumentText, Monitor, Folder2, Notification } from "iconsax-react";

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
			id: "causas",
			title: <FormattedMessage id="causas" defaultMessage="Causas" />,
			type: "collapse",
			icon: Folder2,
			breadcrumbs: true,
			children: [
				{
					id: "causas-verified",
					title: <FormattedMessage id="causas-verified" defaultMessage="Causas Verificadas" />,
					type: "item",
					url: "/admin/causas/verified",
					breadcrumbs: true,
				},
				{
					id: "causas-folders",
					title: <FormattedMessage id="causas-folders" defaultMessage="Causas con Carpetas" />,
					type: "item",
					url: "/admin/causas/folders",
					breadcrumbs: true,
				},
				{
					id: "causas-workers",
					title: <FormattedMessage id="causas-workers" defaultMessage="Configuración de Workers" />,
					type: "item",
					url: "/admin/causas/workers",
					breadcrumbs: true,
				},
			],
		},
		{
			id: "server-status",
			title: <FormattedMessage id="server-status" defaultMessage="Estado del Servidor" />,
			type: "item",
			url: "/admin/server-status",
			icon: Monitor,
			breadcrumbs: true,
		},
		{
			id: "notifications",
			title: <FormattedMessage id="notifications" defaultMessage="Monitoreo de Notificaciones" />,
			type: "item",
			url: "/admin/notifications",
			icon: Notification,
			breadcrumbs: true,
		},
	],
};

export default admin;
