import React from "react";
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
		<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} {...others} sx={{ mb: 1.5 }}>
			<Stack direction="row" alignItems="center" spacing={1}>
				<IconButton onClick={onClickPrev} size="small">
					<ArrowLeft2 size={18} />
				</IconButton>
				<IconButton onClick={onClickNext} size="small">
					<ArrowRight2 size={18} />
				</IconButton>
				<Tooltip title="Ir a hoy">
					<IconButton color="primary" onClick={onClickToday} size="small">
						<Calendar1 size={18} variant="Bulk" />
					</IconButton>
				</Tooltip>
			</Stack>
			
			<Typography variant={matchDownSM ? "h6" : "h5"} color="textPrimary" sx={{ fontWeight: 600 }}>
				{capitalizeFirstLetter(format(date, "MMMM yyyy", { locale: es }))}
			</Typography>

			{/* Botones de vista */}
			<Stack direction="row" spacing={0.5}>
				{viewFilter.map((viewOption) => {
					const Icon = viewOption.icon;
					const isActive = viewOption.value === view;
					return (
						<Tooltip title={viewOption.label} key={viewOption.value}>
							<IconButton
								color={isActive ? "primary" : "default"}
								size="small"
								onClick={() => onChangeView(viewOption.value)}
							>
								<Icon size={18} variant={isActive ? "Bulk" : "Linear"} />
							</IconButton>
						</Tooltip>
					);
				})}
			</Stack>
		</Stack>
	);
};

export default Toolbar;
