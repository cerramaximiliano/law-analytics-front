import React from "react";
import { Outlet } from "react-router-dom";

import ThemeCustomization from "themes";
import { ThemeMode } from "types/config";

// Wrapper for unauthenticated routes (booking, public token pages, feedback).
// Forces light mode regardless of the user's dark-mode preference.

const PublicLayout = () => (
	<ThemeCustomization forceMode={ThemeMode.LIGHT}>
		<Outlet />
	</ThemeCustomization>
);

export default PublicLayout;
