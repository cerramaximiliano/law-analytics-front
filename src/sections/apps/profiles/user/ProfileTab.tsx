import React from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

// assets
import {
	//CardCoin,
	Lock,
	Profile,
	Setting3,
} from "iconsax-react";

function getPathIndex(pathname: string) {
	let selectedTab = 0;
	switch (pathname) {
		case "/apps/profiles/user/professional":
			selectedTab = 1;
			break;
		case "/apps/profiles/user/settings":
			selectedTab = 2;
			break;
		case "/apps/profiles/user/personal":
		default:
			selectedTab = 0;
	}
	return selectedTab;
}

// ==============================|| USER PROFILE - BASIC ||============================== //

const ProfileTab = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { pathname } = useLocation();

	const [selectedIndex, setSelectedIndex] = useState(getPathIndex(pathname));
	const handleListItemClick = (index: number, route: string) => {
		setSelectedIndex(index);
		navigate(route);
	};

	useEffect(() => {
		setSelectedIndex(getPathIndex(pathname));
	}, [pathname]);

	return (
		<List
			component="nav"
			sx={{
				p: 0,
				"& .MuiListItemIcon-root": { minWidth: 32, color: theme.palette.secondary.main },
			}}
		>
			<ListItemButton selected={selectedIndex === 0} onClick={() => handleListItemClick(0, "/apps/profiles/user/personal")}>
				<ListItemIcon>
					<Profile size={18} />
				</ListItemIcon>
				<ListItemText primary="Información Personal" />
			</ListItemButton>
			<ListItemButton selected={selectedIndex === 1} onClick={() => handleListItemClick(2, "/apps/profiles/user/professional")}>
				<ListItemIcon>
					<Lock size={18} />
				</ListItemIcon>
				<ListItemText primary="Información Profesional" />
			</ListItemButton>
			<ListItemButton selected={selectedIndex === 2} onClick={() => handleListItemClick(3, "/apps/profiles/user/settings")}>
				<ListItemIcon>
					<Setting3 size={18} />
				</ListItemIcon>
				<ListItemText primary="Configuraciones" />
			</ListItemButton>
		</List>
	);
};

export default ProfileTab;
