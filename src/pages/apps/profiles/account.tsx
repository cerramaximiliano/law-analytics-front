import { useState, SyntheticEvent } from "react";
import { useLocation, Link, Outlet } from "react-router-dom";

// material-ui
import { Box, Tab, Tabs } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";

// assets
import { Profile2User, Card, TableDocument } from "iconsax-react";

// ==============================|| PROFILE - ACCOUNT ||============================== //

const AccountProfile = () => {
	const { pathname } = useLocation();

	let selectedTab = 0;
	switch (pathname) {
		case "/apps/profiles/account/my-account":
			selectedTab = 0;
			break;
		case "/apps/profiles/account/role":
			selectedTab = 1;
			break;
		/* 		case "/apps/profiles/account/settings":
					selectedTab = 2;
					break; */
		default:
			selectedTab = 0;
	}

	const [value, setValue] = useState(selectedTab);

	const handleChange = (event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	return (
		<MainCard border={false}>
			<Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}>
				<Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto" aria-label="account profile tab">
					<Tab label="Mi cuenta" component={Link} to="/apps/profiles/account/my-account" icon={<TableDocument />} iconPosition="start" />
					<Tab label="Suscripción" component={Link} to="/apps/profiles/account/settings" icon={<Card />} iconPosition="start" />
					<Tab label="Roles" component={Link} to="/apps/profiles/account/role" icon={<Profile2User />} iconPosition="start" />
				</Tabs>
			</Box>
			<Box sx={{ mt: 2.5 }}>
				<Outlet />
			</Box>
		</MainCard>
	);
};

export default AccountProfile;
