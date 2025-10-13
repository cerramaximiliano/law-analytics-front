import React from "react";
import { useState } from "react";

import dayjs from "utils/dayjs-config";
import "dayjs/locale/es";
import { esES } from "@mui/x-date-pickers/locales";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
//import { DateField } from "@mui/x-date-pickers/DateField";

// material-ui
//import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Grid, InputLabel, Stack, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { PatternFormat } from "react-number-format";
import MainCard from "components/MainCard";
import { DateTimeField } from "@mui/x-date-pickers";
//import { es } from "date-fns/locale";
// third-party
// project-imports

// ==============================|| PLUGIN - MASK INPUT ||============================== //

const MaskPage = () => {
	const [date1, setDate1] = useState<dayjs.Dayjs | null>(null);
	const [date2, setDate2] = useState<dayjs.Dayjs | null>(null);

	const esLocale = esES.components.MuiLocalizationProvider.defaultProps.localeText;

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es" localeText={esLocale}>
			<Grid container spacing={3}>
				<Grid item xs={12} md={6}>
					<MainCard title="Date">
						<Grid container alignItems="center" spacing={3}>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel>Insert Date 1</InputLabel>
									<DateTimeField
										value={date1}
										format="DD-MM-YYYY"
										disableFuture={false}
										onChange={(newValue) => setDate1(newValue)}
										slotProps={{ textField: { fullWidth: true, placeholder: "DD/MM/AAAA" } }}
									/>
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel>Insert Date 2</InputLabel>
									<DatePicker
										disableOpenPicker={true}
										value={date2}
										onChange={(newValue) => setDate2(newValue)}
										slotProps={{ textField: { fullWidth: true } }}
										views={["day", "month", "year"]}
									/>
								</Stack>
							</Grid>
						</Grid>
					</MainCard>
				</Grid>

				<Grid item xs={12} md={6}>
					<MainCard title="Phone no.">
						<Grid container alignItems="center" spacing={3}>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel>Phone Number</InputLabel>
									<PatternFormat format="+1 (###) ###-####" mask="_" fullWidth customInput={TextField} placeholder="Phone Number" />
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel>Documento</InputLabel>
									<PatternFormat format="##.###.###" mask="_" fullWidth customInput={TextField} placeholder="Contact Number" />
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel>Telephone with Area Code</InputLabel>
									<PatternFormat format="(##) ####-#####" mask="_" fullWidth customInput={TextField} placeholder="Tel. with Code Area" />
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel>US Telephone</InputLabel>
									<PatternFormat format="(###) ### #####" mask="_" fullWidth customInput={TextField} placeholder="US Telephone" />
								</Stack>
							</Grid>
						</Grid>
					</MainCard>
				</Grid>
				<Grid item xs={12} md={6}>
					<MainCard title="Network">
						<Grid container alignItems="center" spacing={3}>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel>Enter IP Address</InputLabel>
									<PatternFormat format="###.###.###.###" mask="_" fullWidth customInput={TextField} placeholder="IP Address" />
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel>Enter IPV4</InputLabel>
									<PatternFormat format="####.####.####.####" mask="_" fullWidth customInput={TextField} placeholder="IPV4" />
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel>Enter IPV6</InputLabel>
									<PatternFormat
										format="####:####:####:#:###:####:####:####"
										mask="_"
										fullWidth
										customInput={TextField}
										placeholder="IPV6"
									/>
								</Stack>
							</Grid>
						</Grid>
					</MainCard>
				</Grid>
			</Grid>
		</LocalizationProvider>
	);
};

export default MaskPage;
