import React from "react";
import { ReactNode, useEffect, useMemo } from "react";

// material-ui
import { CssBaseline, StyledEngineProvider } from "@mui/material";
import { createTheme, ThemeOptions, ThemeProvider, Theme, TypographyVariantsOptions } from "@mui/material/styles";

// project-imports
import Palette from "./palette";
import Typography from "./typography";
import CustomShadows from "./shadows";
import componentsOverride from "./overrides";

import { HEADER_HEIGHT } from "config";
import useConfig from "hooks/useConfig";
import getWindowScheme from "utils/getWindowScheme";

// types
import { ThemeMode } from "types/config";
import { CustomShadowProps } from "types/theme";

// types
type ThemeCustomizationProps = {
	children: ReactNode;
	forceMode?: ThemeMode;
};

// ==============================|| DEFAULT THEME - MAIN  ||============================== //

export default function ThemeCustomization({ children, forceMode }: ThemeCustomizationProps) {
	const { themeDirection, mode, presetColor, fontFamily, themeContrast } = useConfig();
	let themeMode = forceMode ?? mode;
	if (themeMode === ThemeMode.AUTO) {
		const autoMode = getWindowScheme();
		if (autoMode) {
			themeMode = ThemeMode.DARK;
		} else {
			themeMode = ThemeMode.LIGHT;
		}
	}

	const theme: Theme = useMemo<Theme>(() => Palette(themeMode, presetColor, themeContrast), [themeMode, presetColor, themeContrast]);

	const themeTypography: TypographyVariantsOptions = useMemo<TypographyVariantsOptions>(
		() => Typography(fontFamily),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[fontFamily],
	);
	const themeCustomShadows: CustomShadowProps = useMemo<CustomShadowProps>(() => CustomShadows(theme), [theme]);

	const themeOptions: ThemeOptions = useMemo(
		() => ({
			breakpoints: {
				values: {
					xs: 0,
					sm: 768,
					md: 1024,
					lg: 1266,
					xl: 1440,
				},
			},
			direction: themeDirection,
			mixins: {
				toolbar: {
					minHeight: HEADER_HEIGHT,
					paddingTop: 8,
					paddingBottom: 8,
				},
			},
			palette: theme.palette,
			shape: {
				borderRadius: 8,
			},
			customShadows: themeCustomShadows,
			typography: themeTypography,
		}),
		[themeDirection, theme, themeTypography, themeCustomShadows],
	);

	const themes: Theme = useMemo(() => {
		const t = createTheme(themeOptions);
		t.components = componentsOverride(t);
		return t;
	}, [themeOptions]);

	// Cuando este ThemeCustomization se monta anidado dentro de otro (caso típico:
	// CommonLayout / PublicLayout con `forceMode=LIGHT` sobre el outer de App.tsx en
	// dark), ambos CssBaseline emiten `body { background-color }` y el orden en el
	// <head> determina quién gana. El orden no es estable entre navegaciones (al
	// desmontar/remontar el sub-árbol, el inner se reinserta al principio del head
	// vía emotion y el outer dark gana la cascada). Para no depender de eso, forzamos
	// el body bg como inline style — siempre vence a cualquier regla de stylesheet.
	useEffect(() => {
		if (forceMode === undefined) return;
		const body = document.body;
		const prev = body.style.backgroundColor;
		body.style.backgroundColor = themes.palette.background.default;
		return () => {
			body.style.backgroundColor = prev;
		};
	}, [forceMode, themes.palette.background.default]);

	return (
		<StyledEngineProvider injectFirst>
			<ThemeProvider theme={themes}>
				<CssBaseline />
				{children}
			</ThemeProvider>
		</StyledEngineProvider>
	);
}
