import React from "react";
// project-imports
import applications from "./applications";
import admin from "./admin";
import userSettings from "./user-settings";

// types
import { NavItemType } from "types/menu";

// ==============================|| MENU ITEMS ||============================== //

// Create a menu items structure with ALL items
// Role-based filtering will be done at the component level that consumes this
const menuItems: { items: NavItemType[] } = {
	items: [applications, userSettings, admin],
};

export default menuItems;
