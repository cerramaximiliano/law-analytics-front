import React from "react";
import { useState } from "react";

// material-ui
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";

// third-party
import dayjs from "utils/dayjs-config";

// project-imports
import MainCard from "components/MainCard";

// ==============================|| DATE PICKER - LANDSCAPE ||============================== //

const isWeekend = (date: dayjs.Dayjs) => {
	const day = date.day();
	return day === 0 || day === 6;
};

export default function LandscapeDatePicker() {
	const [value, setValue] = useState<dayjs.Dayjs | null>(dayjs());

	const landscapDatepickerCodeString = `<LocalizationProvider dateAdapter={AdapterDayjs}>
  <StaticDatePicker
    orientation="landscape"
    openTo="day"
    value={value}
    shouldDisableDate={isWeekend}
    onChange={(newValue) => {
      setValue(newValue);
    }}
    renderInput={(params) => <TextField {...params} />}
  />
</LocalizationProvider>`;

	return (
		<MainCard title="Landscape" codeString={landscapDatepickerCodeString}>
			<LocalizationProvider dateAdapter={AdapterDayjs}>
				<StaticDatePicker
					orientation="landscape"
					openTo="day"
					value={value}
					shouldDisableDate={isWeekend}
					onChange={(newValue) => {
						setValue(newValue);
					}}
				/>
			</LocalizationProvider>
		</MainCard>
	);
}
