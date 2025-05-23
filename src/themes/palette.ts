// material-ui
import { alpha, createTheme } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";

// project-imports
import ThemeOption from "./theme";

// types
import { PresetColor, ThemeMode } from "types/config";
import { PaletteThemeProps } from "types/theme";

// ==============================|| DEFAULT THEME - PALETTE  ||============================== //

const Palette = (mode: ThemeMode, presetColor: PresetColor, themeContrast: boolean) => {
	const paletteColor: PaletteThemeProps = ThemeOption(presetColor, mode);

	return createTheme({
		palette: {
			mode: mode as PaletteMode,
			common: {
				black: "#000",
				white: "#fff",
			},
			...paletteColor,
			dark: {
				main: mode === ThemeMode.DARK ? paletteColor.secondary[200] || "#000" : paletteColor.secondary[900] || "#111",
				light: mode === ThemeMode.DARK ? paletteColor.secondary[100] || "#333" : paletteColor.secondary[800] || "#222",
				dark: mode === ThemeMode.DARK ? paletteColor.secondary[300] || "#111" : paletteColor.secondary[900] || "#000",
			},
			text: {
				primary: mode === ThemeMode.DARK ? alpha(paletteColor.secondary.darker!, 0.87) : paletteColor.secondary[800],
				secondary: mode === ThemeMode.DARK ? alpha(paletteColor.secondary.darker!, 0.45) : paletteColor.secondary.main,
				disabled: mode === ThemeMode.DARK ? alpha(paletteColor.secondary.darker!, 0.1) : paletteColor.secondary[400],
			},
			action: {
				disabled: paletteColor.secondary.light,
			},
			divider: mode === ThemeMode.DARK ? alpha(paletteColor.secondary.darker!, 0.05) : alpha(paletteColor.secondary.light!, 0.65),
			background: {
				paper: mode === ThemeMode.DARK ? paletteColor.secondary[100] : "#fff",
				default: themeContrast && mode !== ThemeMode.DARK ? "#fff" : paletteColor.secondary.lighter,
			},
		},
	});
};

export default Palette;
