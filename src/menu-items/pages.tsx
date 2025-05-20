// third-party
import { FormattedMessage } from "react-intl";

// assets
import { Book1, Security, DollarSquare } from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// icons
const icons = {
	page: Book1,
	authentication: Security,
	pricing: DollarSquare,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const pages: NavItemType = {
	id: "group-pages",
	title: <FormattedMessage id="pages" />,
	type: "group",
	icon: icons.page,
	children: [
		{
			id: "authentication",
			title: <FormattedMessage id="authentication" />,
			type: "collapse",
			icon: icons.authentication,
			children: [
				{
					id: "authentication1",
					title: (
						<>
							<FormattedMessage id="authentication" /> 1
						</>
					),
					type: "collapse",
					children: [
						{
							id: "login",
							title: <FormattedMessage id="login" />,
							type: "item",
							url: "/auth/login",
							target: true,
						},
						{
							id: "register",
							title: <FormattedMessage id="register" />,
							type: "item",
							url: "/auth/register",
							target: true,
						},
						{
							id: "forgot-password",
							title: <FormattedMessage id="forgot-password" />,
							type: "item",
							url: "/auth/forgot-password",
							target: true,
						},
						{
							id: "reset-password",
							title: <FormattedMessage id="reset-password" />,
							type: "item",
							url: "/auth/reset-password",
							target: true,
						},
						{
							id: "check-mail",
							title: <FormattedMessage id="check-mail" />,
							type: "item",
							url: "/auth/check-mail",
							target: true,
						},
						{
							id: "code-verification",
							title: <FormattedMessage id="code-verification" />,
							type: "item",
							url: "/auth/code-verification",
							target: true,
						},
					],
				},
			],
		},
		{
			id: "price",
			title: <FormattedMessage id="price" />,
			type: "collapse",
			icon: icons.pricing,
			children: [
				{
					id: "price1",
					title: (
						<>
							<FormattedMessage id="price" /> 1
						</>
					),
					type: "item",
					url: "/price/price1",
				},
				{
					id: "price2",
					title: (
						<>
							<FormattedMessage id="price" /> 2
						</>
					),
					type: "item",
					url: "/price/price2",
				},
			],
		},
	],
};

export default pages;