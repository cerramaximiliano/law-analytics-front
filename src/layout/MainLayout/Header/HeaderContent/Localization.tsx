import { useRef, useState } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, ClickAwayListener, Grid, List, ListItemButton, ListItemText, Paper, Popper, Typography, useMediaQuery } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import IconButton from "components/@extended/IconButton";
import Transitions from "components/@extended/Transitions";
import useConfig from "hooks/useConfig";

// assets
import { LanguageSquare } from "iconsax-react";

// types
import { I18n, ThemeMode } from "types/config";

// ==============================|| HEADER CONTENT - LOCALIZATION ||============================== //

const Localization = () => {
	const theme = useTheme();
	const matchesXs = useMediaQuery(theme.breakpoints.down("md"));

	const { i18n } = useConfig();

	const anchorRef = useRef<any>(null);
	const [open, setOpen] = useState(false);
	const handleToggle = () => {
		setOpen((prevOpen) => !prevOpen);
	};

	const handleClose = (event: MouseEvent | TouchEvent) => {
		if (anchorRef.current && anchorRef.current.contains(event.target)) {
			return;
		}
		setOpen(false);
	};

	const handleListItemClick = (lang: I18n) => {
		// La función onChangeLocalization ha sido eliminada

		setOpen(false);
	};

	const iconBackColorOpen = theme.palette.mode === ThemeMode.DARK ? "secondary.200" : "secondary.200";
	const iconBackColor = theme.palette.mode === ThemeMode.DARK ? "background.default" : "secondary.100";

	return (
		<Box sx={{ flexShrink: 0, ml: 0.5 }}>
			<IconButton
				color="secondary"
				variant="light"
				aria-label="open localization"
				ref={anchorRef}
				aria-controls={open ? "localization-grow" : undefined}
				aria-haspopup="true"
				onClick={handleToggle}
				size="large"
				sx={{ color: "secondary.main", bgcolor: open ? iconBackColorOpen : iconBackColor, p: 1 }}
			>
				<LanguageSquare variant="Bulk" size={26} />
			</IconButton>
			<Popper
				placement={matchesXs ? "bottom-start" : "bottom"}
				open={open}
				anchorEl={anchorRef.current}
				role={undefined}
				transition
				disablePortal
				popperOptions={{
					modifiers: [
						{
							name: "offset",
							options: {
								offset: [matchesXs ? 0 : 0, 9],
							},
						},
					],
				}}
			>
				{({ TransitionProps }) => (
					<Transitions type="grow" position={matchesXs ? "top-right" : "top"} in={open} {...TransitionProps}>
						<Paper sx={{ boxShadow: theme.customShadows.z1, borderRadius: 1.5 }}>
							<ClickAwayListener onClickAway={handleClose}>
								<MainCard border={false} content={false}>
									<List
										component="nav"
										sx={{
											p: 1,
											width: "100%",
											minWidth: 200,
											maxWidth: 290,
											bgcolor: theme.palette.background.paper,
											[theme.breakpoints.down("md")]: {
												maxWidth: 250,
											},
										}}
									>
										<ListItemButton selected={i18n === "en"} onClick={() => handleListItemClick("en")}>
											<ListItemText
												primary={
													<Grid container>
														<Typography color="textPrimary">English</Typography>
														<Typography variant="caption" color="textSecondary" sx={{ ml: "8px" }}>
															(UK)
														</Typography>
													</Grid>
												}
											/>
										</ListItemButton>
										<ListItemButton selected={i18n === "fr"} onClick={() => handleListItemClick("fr")}>
											<ListItemText
												primary={
													<Grid container>
														<Typography color="textPrimary">français</Typography>
														<Typography variant="caption" color="textSecondary" sx={{ ml: "8px" }}>
															(French)
														</Typography>
													</Grid>
												}
											/>
										</ListItemButton>
										<ListItemButton selected={i18n === "ro"} onClick={() => handleListItemClick("ro")}>
											<ListItemText
												primary={
													<Grid container>
														<Typography color="textPrimary">Română</Typography>
														<Typography variant="caption" color="textSecondary" sx={{ ml: "8px" }}>
															(Romanian)
														</Typography>
													</Grid>
												}
											/>
										</ListItemButton>
										<ListItemButton selected={i18n === "zh"} onClick={() => handleListItemClick("zh")}>
											<ListItemText
												primary={
													<Grid container>
														<Typography color="textPrimary">中国人</Typography>
														<Typography variant="caption" color="textSecondary" sx={{ ml: "8px" }}>
															(Chinese)
														</Typography>
													</Grid>
												}
											/>
										</ListItemButton>
									</List>
								</MainCard>
							</ClickAwayListener>
						</Paper>
					</Transitions>
				)}
			</Popper>
		</Box>
	);
};

export default Localization;
