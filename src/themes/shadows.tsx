// material-ui
import { alpha, Theme } from "@mui/material/styles";

// types
import { ThemeMode } from "types/config";
import { CustomShadowProps } from "types/theme";

// ==============================|| DEFAULT THEME - SHADOWS  ||============================== //

const CustomShadows = (theme: Theme): CustomShadowProps => ({
	// z1: `0px 2px 8px rgba(0, 0, 0, 0.15)`,
	button: theme.palette.mode === ThemeMode.DARK ? `0 2px 0 rgb(0 0 0 / 5%)` : `0 2px #0000000b`,
	text: `0 -1px 0 rgb(0 0 0 / 12%)`,
	z1:
		theme.palette.mode === ThemeMode.DARK
			? `0px 8px 24px ${alpha(theme.palette.secondary[200]!, 0.3)}`
			: `0px 8px 24px  ${alpha(theme.palette.secondary.darker, 0.08)}`,
	z2:
		theme.palette.mode === ThemeMode.DARK
			? `0px 2px 8px ${alpha(theme.palette.secondary[200]!, 0.3)}`
			: `0px 2px 8px  ${alpha(theme.palette.secondary.darker, 0.08)}`,
	primary: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
	secondary: `0 0 0 2px ${alpha(theme.palette.secondary.main, 0.2)}`,
	error: `0 0 0 2px ${alpha(theme.palette.error.main, 0.2)}`,
	warning: `0 0 0 2px ${alpha(theme.palette.warning.main, 0.2)}`,
	info: `0 0 0 2px ${alpha(theme.palette.info.main, 0.2)}`,
	success: `0 0 0 2px ${alpha(theme.palette.success.main, 0.2)}`,
	grey: `0 0 0 2px ${alpha(theme.palette.secondary.main, 0.2)}`,
	primaryButton: `0 14px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
	secondaryButton: `0 14px 12px ${alpha(theme.palette.secondary.main, 0.2)}`,
	errorButton: `0 14px 12px ${alpha(theme.palette.error.main, 0.2)}`,
	warningButton: `0 14px 12px ${alpha(theme.palette.warning.main, 0.2)}`,
	infoButton: `0 14px 12px ${alpha(theme.palette.info.main, 0.2)}`,
	successButton: `0 14px 12px ${alpha(theme.palette.success.main, 0.2)}`,
	greyButton: `0 14px 12px ${alpha(theme.palette.secondary.main, 0.2)}`,
});

export default CustomShadows;
