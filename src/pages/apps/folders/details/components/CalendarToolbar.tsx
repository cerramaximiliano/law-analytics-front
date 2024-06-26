// material-ui
import { Button, Grid, Stack, Typography, GridProps } from "@mui/material";

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
				<Button variant="outlined" onClick={onClickToday} size={"small"}>
					Hoy
				</Button>
			</Grid>
			<Grid item>
				<Stack direction="row" alignItems="center" spacing={1}>
					<IconButton onClick={onClickPrev} size={"small"}>
						<ArrowLeft2 />
					</IconButton>
					<Typography variant={"body1"} color="textPrimary">
						{format(date, "MMM yyyy", { locale: es })}
					</Typography>
					<IconButton onClick={onClickNext} size={"small"}>
						<ArrowRight2 />
					</IconButton>
				</Stack>
			</Grid>
		</Grid>
	);
};

export default CalendarToolbar;
