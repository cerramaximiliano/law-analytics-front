import { useState, MouseEvent } from "react";

// material-ui
import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

// assets
import { Card, Logout, Profile, TableDocument } from "iconsax-react";

// ==============================|| HEADER PROFILE - PROFILE TAB ||============================== //

interface Props {
	handleLogout: () => void;
}

const ProfileTab = ({ handleLogout }: Props) => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const handleListItemClick = (event: MouseEvent<HTMLDivElement>, index: number) => {
		setSelectedIndex(index);
	};

	return (
		<List component="nav" sx={{ p: 0, "& .MuiListItemIcon-root": { minWidth: 32 } }}>
			<ListItemButton selected={selectedIndex === 1} onClick={(event: MouseEvent<HTMLDivElement>) => handleListItemClick(event, 1)}>
				<ListItemIcon>
					<Profile variant="Bulk" size={18} />
				</ListItemIcon>
				<ListItemText primary="Ver Perfil" />
			</ListItemButton>

			<ListItemButton selected={selectedIndex === 3} onClick={(event: MouseEvent<HTMLDivElement>) => handleListItemClick(event, 3)}>
				<ListItemIcon>
					<TableDocument variant="Bulk" size={18} />
				</ListItemIcon>
				<ListItemText primary="Ver Cuenta" />
			</ListItemButton>
			<ListItemButton selected={selectedIndex === 4} onClick={(event: MouseEvent<HTMLDivElement>) => handleListItemClick(event, 4)}>
				<ListItemIcon>
					<Card variant="Bulk" size={18} />
				</ListItemIcon>
				<ListItemText primary="Suscripción" />
			</ListItemButton>
			<ListItemButton selected={selectedIndex === 2} onClick={handleLogout}>
				<ListItemIcon>
					<Logout variant="Bulk" size={18} />
				</ListItemIcon>
				<ListItemText primary="Cerrar Sesión" />
			</ListItemButton>
		</List>
	);
};

export default ProfileTab;
