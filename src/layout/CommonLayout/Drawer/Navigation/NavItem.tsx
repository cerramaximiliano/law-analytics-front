import { forwardRef, useEffect, ForwardRefExoticComponent, RefAttributes } from "react";
import { Link } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import { useMediaQuery, Avatar, Chip, ListItemButton, ListItemText, Typography } from "@mui/material";

// project-imports
import { dispatch, useSelector } from "store";
import { activeComponent, openComponentDrawer } from "store/reducers/menu";

// types
import { ThemeMode } from "types/config";
import { LinkTarget, NavItemType } from "types/menu";

// ==============================|| NAVIGATION - ITEM ||============================== //

interface Props {
	item: NavItemType;
	level: number;
}

const NavItem = ({ item, level }: Props) => {
	const theme = useTheme();
	const matchesMD = useMediaQuery(theme.breakpoints.down("md"));

	const { openComponent } = useSelector((state) => state.menu);

	let itemTarget: LinkTarget = "_self";
	if (item.target) {
		itemTarget = "_blank";
	}

	let listItemProps: {
		component: ForwardRefExoticComponent<RefAttributes<HTMLAnchorElement>> | string;
		href?: string;
		target?: LinkTarget;
	} = {
		component: forwardRef((props, ref) => <Link {...props} to={item.url!} target={itemTarget} ref={ref} />),
	};
	if (item?.external) {
		listItemProps = { component: "a", href: item.url, target: itemTarget };
	}

	const itemHandler = (id: string) => {
		dispatch(activeComponent({ openComponent: id }));
		matchesMD && dispatch(openComponentDrawer({ componentDrawerOpen: false }));
	};

	// active menu item on page load
	useEffect(() => {
		const currentIndex = document.location.pathname
			.toString()
			.split("/")
			.findIndex((id) => id === item.id);
		if (currentIndex > -1) {
			dispatch(activeComponent({ openComponent: item.id }));
		}
		// eslint-disable-next-line
	}, []);

	const textColor = theme.palette.mode === ThemeMode.DARK ? "secondary.400" : "secondary.main";
	const iconSelectedColor = theme.palette.mode === ThemeMode.DARK ? "text.primary" : "primary.main";

	return (
		<ListItemButton
			{...listItemProps}
			disabled={item.disabled}
			onClick={() => itemHandler(item.id!)}
			selected={openComponent === item.id}
			sx={{ pl: 2.5, py: 1, mb: 0.5 }}
		>
			<ListItemText
				primary={
					<Typography
						variant="h6"
						sx={{
							color: openComponent === item.id ? iconSelectedColor : textColor,
							fontWeight: 500,
						}}
					>
						{item.title}
					</Typography>
				}
			/>
			{item.chip && (
				<Chip
					color={item.chip.color}
					variant={item.chip.variant}
					size={item.chip.size}
					label={item.chip.label}
					avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
				/>
			)}
		</ListItemButton>
	);
};

export default NavItem;
