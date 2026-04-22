import React from "react";
import { useState, SyntheticEvent, useEffect } from "react";
import { useLocation, Link, Outlet, useNavigate } from "react-router-dom";

// material-ui
import { Box, Tab, Tabs } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import { useTeam } from "contexts/TeamContext";

// assets
import { Profile2User, Card, TableDocument, Link1 } from "iconsax-react";

// ==============================|| PROFILE - ACCOUNT ||============================== //

const AccountProfile = () => {
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const { isTeamMode, isOwner } = useTeam();

	// El tab PJN solo se muestra para cuentas personales o owners de equipo
	const showPjnTab = !isTeamMode || isOwner;

	const tabPaths = [
		"/apps/profiles/account/my-account",
		"/apps/profiles/account/subscription",
		"/apps/profiles/account/role",
		...(showPjnTab ? ["/apps/profiles/account/pjn"] : []),
	];

	const selectedTab = tabPaths.indexOf(pathname);
	const [value, setValue] = useState(selectedTab !== -1 ? selectedTab : 0);

	// Actualizar el tab seleccionado cuando cambia la ruta
	useEffect(() => {
		const idx = tabPaths.indexOf(pathname);
		if (idx !== -1) {
			setValue(idx);
		}
	}, [pathname, tabPaths.length]);

	// Si un miembro de equipo accede directamente a /pjn, redirigir a mi-cuenta
	useEffect(() => {
		if (!showPjnTab && pathname === "/apps/profiles/account/pjn") {
			navigate("/apps/profiles/account/my-account", { replace: true });
		}
	}, [showPjnTab, pathname, navigate]);

	const handleChange = (_event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	return (
		<MainCard border={false}>
			<Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}>
				<Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto" aria-label="account profile tab">
					<Tab label="Mi cuenta" component={Link} to="/apps/profiles/account/my-account" icon={<TableDocument />} iconPosition="start" />
					<Tab label="Suscripción" component={Link} to="/apps/profiles/account/subscription" icon={<Card />} iconPosition="start" />
					<Tab label="Mi Equipo" component={Link} to="/apps/profiles/account/role" icon={<Profile2User />} iconPosition="start" />
					{showPjnTab && (
						<Tab label="Integración PJN" component={Link} to="/apps/profiles/account/pjn" icon={<Link1 />} iconPosition="start" />
					)}
				</Tabs>
			</Box>
			<Box sx={{ mt: 2.5 }}>
				<Outlet />
			</Box>
		</MainCard>
	);
};

export default AccountProfile;
