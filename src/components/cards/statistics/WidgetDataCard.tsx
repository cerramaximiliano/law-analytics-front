import React from "react";
import {
	useState,
	//MouseEvent,
	ReactNode,
} from "react";

// material-ui
import { Box, Grid, ListItemButton, Menu, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project-imports
import MainCard from "components/MainCard";
import { BRAND_BLUE } from "themes/dashboardTokens";

// types
import { ColorProps } from "types/extended";
import { ThemeMode } from "types/config";

interface Props {
	title: string;
	count: string;
	percentage: ReactNode;
	iconPrimary: ReactNode;
	children: any;
	color?: ColorProps;
	/** Si se provee, la card es clickeable y navega/dispara la acción. */
	onClick?: () => void;
}

// ==============================|| CHART WIDGET - ECOMMERCE CARD  ||============================== //

const WidgetDataCard = ({ title, count, percentage, color, iconPrimary, children, onClick }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	// `color` prop preservada por compat (otros consumidores) pero el avatar
	// se unificó a BRAND_BLUE para evitar el arcoíris en el row de KPIs.
	void color;

	/* const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	}; */

	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
		<MainCard
			onClick={onClick}
			sx={
				onClick
					? {
							cursor: "pointer",
							transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
							"&:hover": {
								transform: "translateY(-2px)",
								borderColor: alpha(BRAND_BLUE, isDark ? 0.32 : 0.22),
								boxShadow: `0 8px 22px ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
							},
					  }
					: undefined
			}
		>
			<Stack spacing={2}>
				<Stack direction="row" alignItems="center" justifyContent="space-between">
					<Stack direction="row" alignItems="center" spacing={1.5}>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
								color: BRAND_BLUE,
								"& > svg": { color: BRAND_BLUE },
							}}
						>
							{iconPrimary}
						</Box>
						<Typography variant="subtitle1" sx={{ letterSpacing: "-0.005em" }}>
							{title}
						</Typography>
					</Stack>
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
				{/* Contenido — count grande con tabular-nums */}
				<Box sx={{ pt: 1, pb: 0.5 }}>
					<Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
						<Grid item xs={7}>
							{children}
						</Grid>
						<Grid item xs={5}>
							<Stack spacing={0.5}>
								<Typography
									sx={{
										fontSize: { xs: "1.4rem", md: "1.625rem" },
										fontWeight: 600,
										letterSpacing: "-0.02em",
										fontVariantNumeric: "tabular-nums",
										color: "text.primary",
										lineHeight: 1.15,
									}}
								>
									{count}
								</Typography>
								{percentage}
							</Stack>
						</Grid>
					</Grid>
				</Box>
			</Stack>
		</MainCard>
	);
};

export default WidgetDataCard;
