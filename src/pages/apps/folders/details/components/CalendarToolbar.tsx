import React from "react";
// material-ui
import { Button, Grid, Stack, Typography, GridProps, ButtonGroup } from "@mui/material";

// third-party
import { format } from "date-fns";
import { es } from "date-fns/locale";

// project-imports
import IconButton from "components/@extended/IconButton";

// assets
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";

// ==============================|| CALENDAR - TOOLBAR ||============================== //

export interface ToolbarProps {
	date: number | Date;
	view: string;
	onClickNext: () => void;
	onClickPrev: () => void;
	onClickToday: () => void;
	onChangeView: (s: string) => void;
	sx?: GridProps["sx"];
}

const CalendarToolbar = ({ date, view, onClickNext, onClickPrev, onClickToday, onChangeView, sx, ...others }: ToolbarProps) => {
	return (
		<Grid alignItems="center" container justifyContent="space-around" spacing={0} {...others} sx={{ pb: 2 }}>
			<Grid item>
				<Stack direction="row" spacing={1}>
					<Button variant="outlined" onClick={onClickToday} size="small">
						Hoy
					</Button>
					<ButtonGroup size="small" variant="outlined">
						<Button
							onClick={() => onChangeView("listYear")}
							variant={view === "listYear" ? "contained" : "outlined"}
							sx={{
								"&.MuiButton-contained": {
									borderRight: "1px solid rgba(255, 255, 255, 0.5) !important",
								},
							}}
						>
							Anual
						</Button>
						<Button
							onClick={() => onChangeView("listMonth")}
							variant={view === "listMonth" ? "contained" : "outlined"}
							sx={{
								"&.MuiButton-contained": {
									borderLeft: "1px solid rgba(255, 255, 255, 0.5) !important",
								},
							}}
						>
							Mensual
						</Button>
					</ButtonGroup>
				</Stack>
			</Grid>
			<Grid item>
				<Stack direction="row" alignItems="center" spacing={1}>
					<IconButton onClick={onClickPrev} size="small">
						<ArrowLeft2 />
					</IconButton>
					<Typography variant="body1" color="textPrimary">
						{view === "listYear" ? format(date, "yyyy", { locale: es }) : format(date, "MMM yyyy", { locale: es })}
					</Typography>
					<IconButton onClick={onClickNext} size="small">
						<ArrowRight2 />
					</IconButton>
				</Stack>
			</Grid>
		</Grid>
	);
};

export default CalendarToolbar;
