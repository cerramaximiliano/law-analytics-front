import { useState, useEffect } from "react";

// material-ui
import { Theme } from "@mui/material/styles";
import { useMediaQuery, Stack, Tooltip, Typography, GridProps } from "@mui/material";

// third-party
import { format } from "date-fns";
import { es } from "date-fns/locale";

// project-imports
import IconButton from "components/@extended/IconButton";

// assets
import { ArrowLeft2, ArrowRight2, Calendar1, Category, Grid6 } from "iconsax-react";

// constant
const viewOptions = [
	{
		label: "Mes",
		value: "dayGridMonth",
		icon: Category,
	},
	{
		label: "Semana",
		value: "timeGridWeek",
		icon: Grid6,
	},
	{
		label: "Día",
		value: "timeGridDay",
		icon: Calendar1,
	},
];

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

const Toolbar = ({ date, view, onClickNext, onClickPrev, onClickToday, onChangeView, sx, ...others }: ToolbarProps) => {
	const matchDownSM = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

	const [viewFilter, setViewFilter] = useState(viewOptions);

	useEffect(() => {
		if (matchDownSM) {
			const filter = viewOptions.filter((item) => item.value !== "dayGridMonth" && item.value !== "timeGridWeek");
			setViewFilter(filter);
		} else {
			setViewFilter(viewOptions);
		}
	}, [matchDownSM]);

	const capitalizeFirstLetter = (string: string) => {
		return string.charAt(0).toUpperCase() + string.slice(1);
	};

	return (
		<Stack direction="column" spacing={3} {...others} sx={{ pb: 3 }}>
			{/* Fila superior con botones de navegación y título del mes */}
			<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
				<Tooltip title="Ir a hoy">
					<IconButton color="primary" onClick={onClickToday} size={matchDownSM ? "medium" : "large"}>
						<Calendar1 variant="Bulk" />
					</IconButton>
				</Tooltip>

				<Stack direction="row" alignItems="center" spacing={matchDownSM ? 1 : 2}>
					<IconButton onClick={onClickPrev} size={matchDownSM ? "medium" : "large"}>
						<ArrowLeft2 />
					</IconButton>
					<Typography variant={matchDownSM ? "h5" : "h4"} color="textPrimary" sx={{ fontWeight: 600 }}>
						{capitalizeFirstLetter(format(date, "MMMM yyyy", { locale: es }))}
					</Typography>
					<IconButton onClick={onClickNext} size={matchDownSM ? "medium" : "large"}>
						<ArrowRight2 />
					</IconButton>
				</Stack>

				{/* Botones de vista */}
				<Stack direction="row" spacing={1}>
					{viewFilter.map((viewOption) => {
						const Icon = viewOption.icon;
						const isActive = viewOption.value === view;
						return (
							<Tooltip title={viewOption.label} key={viewOption.value}>
								<IconButton
									color={isActive ? "primary" : "default"}
									size={matchDownSM ? "medium" : "large"}
									onClick={() => onChangeView(viewOption.value)}
								>
									<Icon variant={isActive ? "Bulk" : "Linear"} />
								</IconButton>
							</Tooltip>
						);
					})}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Toolbar;
