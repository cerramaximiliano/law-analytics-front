import { useState, MouseEvent } from "react";

// material-ui
import { Box, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Menu, Stack, Typography } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import IconButton from "components/@extended/IconButton";

// assets
import { More } from "iconsax-react";

import Avatar1 from "assets/images/users/avatar-1.png";
import Avatar2 from "assets/images/users/avatar-2.png";
import Avatar3 from "assets/images/users/avatar-3.png";
import Avatar4 from "assets/images/users/avatar-4.png";

// ===========================|| DATA WIDGET - TEAM MEMBERS ||=========================== //

const TeamMembers = () => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const open = Boolean(anchorEl);

	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
		<MainCard content={false}>
			<Box sx={{ p: 3, pb: 0 }}>
				<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
					<Typography variant="h5">Team Members</Typography>
					<IconButton
						color="secondary"
						id="wallet-button"
						aria-controls={open ? "wallet-menu" : undefined}
						aria-haspopup="true"
						aria-expanded={open ? "true" : undefined}
						onClick={handleClick}
					>
						<More style={{ transform: "rotate(90deg)" }} />
					</IconButton>
					<Menu
						id="wallet-menu"
						anchorEl={anchorEl}
						open={open}
						onClose={handleClose}
						MenuListProps={{
							"aria-labelledby": "wallet-button",
							sx: { p: 1.25, minWidth: 150 },
						}}
						anchorOrigin={{
							vertical: "bottom",
							horizontal: "right",
						}}
						transformOrigin={{
							vertical: "top",
							horizontal: "right",
						}}
					>
						<ListItemButton onClick={handleClose}>Today</ListItemButton>
						<ListItemButton onClick={handleClose}>Weekly</ListItemButton>
						<ListItemButton onClick={handleClose}>Monthly</ListItemButton>
					</Menu>
				</Stack>
			</Box>
			<List disablePadding sx={{ "& .MuiListItem-root": { px: 3, py: 1.5 } }}>
				<ListItem divider secondaryAction={<Typography color="text.secondary">5 min ago</Typography>}>
					<ListItemAvatar sx={{ mr: 1 }}>
						<Avatar alt="User 1" src={Avatar1} variant="rounded" size="lg" />
					</ListItemAvatar>
					<ListItemText
						primary={<Typography variant="subtitle1">David Jones</Typography>}
						secondary={<Typography sx={{ mt: 0.25 }}>Project Leader</Typography>}
					/>
				</ListItem>
				<ListItem divider secondaryAction={<Typography color="text.secondary">1 hour ago</Typography>}>
					<ListItemAvatar sx={{ mr: 1 }}>
						<Avatar alt="User 2" src={Avatar2} variant="rounded" size="lg" />
					</ListItemAvatar>
					<ListItemText
						primary={<Typography variant="subtitle1">David Jones</Typography>}
						secondary={<Typography sx={{ mt: 0.25 }}>HR Manager</Typography>}
					/>
				</ListItem>
				<ListItem divider secondaryAction={<Typography color="text.secondary">Yesterday</Typography>}>
					<ListItemAvatar sx={{ mr: 1 }}>
						<Avatar alt="User 3" src={Avatar3} variant="rounded" size="lg" />
					</ListItemAvatar>
					<ListItemText
						primary={<Typography variant="subtitle1">David Jones</Typography>}
						secondary={<Typography sx={{ mt: 0.25 }}>Developer</Typography>}
					/>
				</ListItem>
				<ListItem secondaryAction={<Typography color="text.secondary">02-05-2022</Typography>}>
					<ListItemAvatar sx={{ mr: 1 }}>
						<Avatar alt="User 4" src={Avatar4} variant="rounded" size="lg" />
					</ListItemAvatar>
					<ListItemText
						primary={<Typography variant="subtitle1">David Jones</Typography>}
						secondary={<Typography sx={{ mt: 0.25 }}>UI/UX Designer</Typography>}
					/>
				</ListItem>
			</List>
		</MainCard>
	);
};
export default TeamMembers;
