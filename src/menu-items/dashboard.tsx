// third-party
import { FormattedMessage } from "react-intl";

// project-imports
import { useSelector } from "store";

// type
import { NavItemType } from "types/menu";
import { Home3, HomeTrendUp, Box1 } from "iconsax-react";

const icons = {
	navigation: Home3,
	dashboard: HomeTrendUp,
	components: Box1,
};

// ==============================|| MENU ITEMS - API ||============================== //

export const Menu = () => {
	let { menu } = useSelector((state) => state.menu);

	menu = {
		id: "group-dashboard",
		title: "dashboard",
		type: "group",
		icon: "dashboard",
		children: [
			{
				id: "dashboard",
				title: "Home",
				type: "collapse",
				icon: "dashboard",
				children: [
					{
						id: "default",
						title: "Inicio",
						type: "item",
						url: "/dashboard/default",
						breadcrumbs: true,
					},
					/* 					{
						id: "informes",
						title: "Informes",
						type: "item",
						url: "/dashboard/info",
						breadcrumbs: false,
					}, */
				],
			},
		],
	};

	const SubChildrenLis = (SubChildrenLis: NavItemType[]) => {
		return SubChildrenLis?.map((subList: NavItemType) => {
			return {
				...subList,
				title: <FormattedMessage id={`${subList.title}`} />,
				// @ts-ignore
				icon: icons[subList.icon],
			};
		});
	};

	const itemList = (subList: NavItemType) => {
		let list: NavItemType = {
			...subList,
			title: <FormattedMessage id={`${subList.title}`} />,
			// @ts-ignore
			icon: icons[subList.icon],
		};

		if (subList.type === "collapse") {
			list.children = SubChildrenLis(subList.children!);
		}
		return list;
	};

	const withoutMenu = menu?.children?.filter((item: NavItemType) => item.id !== "no-menu");
	const ChildrenList: NavItemType[] | undefined = withoutMenu?.map((subList: NavItemType) => {
		return itemList(subList);
	});

	const menuList: NavItemType = {
		...menu,
		title: <FormattedMessage id={`${menu.title}`} />,
		// @ts-ignore
		icon: icons[menu.icon],
		children: ChildrenList,
	};

	return menuList;
};
