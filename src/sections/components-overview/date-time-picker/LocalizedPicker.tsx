import React from "react";
import { useState } from "react";

// material-ui
import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateField } from "@mui/x-date-pickers/DateField";
import { TimeField } from "@mui/x-date-pickers/TimeField";

// third-party
import "dayjs/locale/de";
import "dayjs/locale/en-gb";
import "dayjs/locale/zh-cn";

// project-imports
import MainCard from "components/MainCard";

const locales = { "en-us": "en", "en-gb": "en-gb", "zh-cn": "zh-cn", de: "de" };

type LocaleKey = keyof typeof locales;

// ==============================|| DATE PICKER - LOCALIZED ||============================== //

export default function LocalizedPicker() {
	const [locale, setLocale] = useState<LocaleKey>("en-us");

	const selectLocale = (newLocale: any) => {
		setLocale(newLocale);
	};

	const localizeDatepickerCodeString = `<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={localeMap[locale]}>
  <div>
    <ToggleButtonGroup value={locale} exclusive sx={{ mb: 2, display: 'block' }}>
      {Object.keys(localeMap).map((localeItem) => (
        <ToggleButton key={localeItem} value={localeItem} onClick={() => selectLocale(localeItem)}>
          {localeItem}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
    <DatePicker
      mask={maskMap[locale]}
      value={value}
      onChange={(newValue) => setValue(newValue)}
      renderInput={(params) => <TextField {...params} />}
    />
  </div>
</LocalizationProvider>`;

	return (
		<MainCard title="Localization Picker" codeString={localizeDatepickerCodeString}>
			<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locales[locale]}>
				<Stack spacing={3} sx={{ width: 300 }}>
					<ToggleButtonGroup value={locale} exclusive fullWidth>
						{Object.keys(locales).map((localeItem) => (
							<ToggleButton key={localeItem} value={localeItem} onClick={() => selectLocale(localeItem)}>
								{localeItem}
							</ToggleButton>
						))}
					</ToggleButtonGroup>
					<DateField label="Date" defaultValue={new Date("2022-04-17")} />
					<TimeField label="Time" defaultValue={new Date("2022-04-17T18:30")} />
				</Stack>
			</LocalizationProvider>
		</MainCard>
	);
}
