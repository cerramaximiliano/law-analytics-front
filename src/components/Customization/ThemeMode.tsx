import { ChangeEvent } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import { FormControlLabel, Radio, RadioGroup, Stack } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import useConfig from "hooks/useConfig";

// assets
import { Moon, Setting2, Sun1 } from "iconsax-react";

// types
import { ThemeMode } from "types/config";

// ==============================|| CUSTOMIZATION - MODE ||============================== //

const ThemeModeLayout = () => {
	const theme = useTheme();

	const { mode, onChangeMode } = useConfig();

	const handleModeChange = (event: ChangeEvent<HTMLInputElement>) => {
		onChangeMode(event.target.value as ThemeMode);
	};

	return (
		<RadioGroup row aria-label="payment-card" name="payment-card" value={mode} onChange={handleModeChange}>
			<Stack direction="row" alignItems="center" spacing={2.5} sx={{ width: "100%" }}>
				<FormControlLabel
					control={<Radio value={ThemeMode.LIGHT} sx={{ display: "none" }} />}
					sx={{
						width: "100%",
						height: 60,
						m: 0,
						display: "flex",
						"& .MuiFormControlLabel-label": { flex: 1 },
					}}
					label={
						<MainCard
							content={false}
							sx={{
								borderWidth: 2,
								p: 1,
								...(theme.palette.mode === ThemeMode.LIGHT && {
									borderColor: theme.palette.primary.main,
								}),
							}}
						>
							<Stack direction="row" alignItems="center" justifyContent="center" sx={{ height: 44 }}>
								<Sun1 variant="Bold" color={theme.palette.warning.main} />
							</Stack>
						</MainCard>
					}
				/>
				<FormControlLabel
					control={<Radio value={ThemeMode.DARK} sx={{ display: "none" }} />}
					sx={{
						width: "100%",
						height: 60,
						m: 0,
						display: "flex",
						"& .MuiFormControlLabel-label": { flex: 1 },
					}}
					label={
						<MainCard
							content={false}
							sx={{
								borderWidth: 2,
								p: 1,
								...(theme.palette.mode === ThemeMode.DARK && {
									borderColor: theme.palette.primary.main,
								}),
							}}
						>
							<Stack direction="row" alignItems="center" justifyContent="center" sx={{ height: 44 }}>
								<Moon variant="Bold" />
							</Stack>
						</MainCard>
					}
				/>
				<FormControlLabel
					control={<Radio value={ThemeMode.AUTO} sx={{ display: "none" }} />}
					sx={{
						width: "100%",
						height: 60,
						m: 0,
						display: "flex",
						"& .MuiFormControlLabel-label": { flex: 1 },
					}}
					label={
						<MainCard
							content={false}
							sx={{
								borderWidth: 2,
								p: 1,
								...(mode === ThemeMode.AUTO && { borderColor: theme.palette.primary.main }),
							}}
						>
							<Stack direction="row" alignItems="center" justifyContent="center" sx={{ height: 44 }}>
								<Setting2 variant="Bold" />
							</Stack>
						</MainCard>
					}
				/>
			</Stack>
		</RadioGroup>
	);
};

export default ThemeModeLayout;
