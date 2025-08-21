import React from "react";
import { useEffect, useState } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, Typography, useMediaQuery } from "@mui/material";

// project-imports
import NavGroup from "./NavGroup";
import menuItems from "menu-items";
import { Menu } from "menu-items/dashboard";
import useAuth from "hooks/useAuth";

import { useSelector } from "store";
import useConfig from "hooks/useConfig";
import { HORIZONTAL_MAX_ITEM } from "config";

// types
import { NavItemType } from "types/menu";
import { MenuOrientation } from "types/config";

// ==============================|| DRAWER CONTENT - NAVIGATION ||============================== //

const Navigation = () => {
	const theme = useTheme();

	const downLG = useMediaQuery(theme.breakpoints.down("lg"));

	const { menuOrientation } = useConfig();
	const { drawerOpen } = useSelector((state) => state.menu);

	const [selectedItems, setSelectedItems] = useState<string | undefined>("");
	const [selectedLevel, setSelectedLevel] = useState<number>(0);
	const [filteredMenuItems, setFilteredMenuItems] = useState<{ items: NavItemType[] }>({ items: [] });
	const { user } = useAuth();
	const isAdmin = user?.role === "ADMIN_ROLE";

	useEffect(() => {
		handlerMenuItem();
		// eslint-disable-next-line
	}, [user]);

	let getMenu = Menu();
	const handlerMenuItem = () => {
		// Clone the original menu items to avoid mutating the imported object
		const menuItemsClone = {
			items: isAdmin
				? [...menuItems.items] // Include all menu items for admin users
				: menuItems.items.filter((item) => item.id !== "admin"), // Filter out admin items for non-admin users
		};

		const isFound = menuItemsClone.items.some((element) => element.id === "group-dashboard");

		if (getMenu?.id !== undefined && !isFound) {
			menuItemsClone.items.splice(0, 0, getMenu);
		}

		setFilteredMenuItems(menuItemsClone);
	};

	const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

	const lastItem = isHorizontal ? HORIZONTAL_MAX_ITEM : null;
	let lastItemIndex = filteredMenuItems.items.length - 1;
	let remItems: NavItemType[] = [];
	let lastItemId: string;

	if (lastItem && lastItem < filteredMenuItems.items.length) {
		lastItemId = filteredMenuItems.items[lastItem - 1].id!;
		lastItemIndex = lastItem - 1;
		remItems = filteredMenuItems.items.slice(lastItem - 1, filteredMenuItems.items.length).map((item) => ({
			title: item.title,
			elements: item.children,
			icon: item.icon,
		}));
	}

	const navGroups = filteredMenuItems.items.slice(0, lastItemIndex + 1).map((item) => {
		switch (item.type) {
			case "group":
				return (
					<NavGroup
						key={item.id}
						setSelectedItems={setSelectedItems}
						setSelectedLevel={setSelectedLevel}
						selectedLevel={selectedLevel}
						selectedItems={selectedItems}
						lastItem={lastItem!}
						remItems={remItems}
						lastItemId={lastItemId}
						item={item}
					/>
				);
			default:
				return (
					<Typography key={item.id} variant="h6" color="error" align="center">
						Fix - Navigation Group
					</Typography>
				);
		}
	});
	return (
		<Box
			sx={{
				pt: drawerOpen ? (isHorizontal ? 0 : 2) : 0,
				"& > ul:first-of-type": { mt: 0 },
				display: isHorizontal ? { xs: "block", lg: "flex" } : "block",
			}}
		>
			{navGroups}
		</Box>
	);
};

export default Navigation;
