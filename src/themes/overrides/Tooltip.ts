// material-ui
import { alpha, Theme } from "@mui/material/styles";

// types
import { ThemeMode } from "types/config";

// ==============================|| OVERRIDES - TOOLTIP ||============================== //

// secondary.darker is the strongest neutral in either mode (auto-inverted by ThemeOption);
// background.paper is the surface color of cards in either mode. Pairing them gives a
// high-contrast tooltip without branching on mode.
export default function Tooltip(theme: Theme) {
	const isDark = theme.palette.mode === ThemeMode.DARK;

	return {
		MuiTooltip: {
			styleOverrides: {
				tooltip: {
					backgroundColor: theme.palette.secondary.darker,
					color: theme.palette.background.paper,
					fontSize: 12,
					fontWeight: 500,
					lineHeight: 1.4,
					padding: "6px 10px",
					borderRadius: 6,
					boxShadow: `0 4px 14px 0 ${alpha("#000", isDark ? 0.55 : 0.18)}`,
					maxWidth: 320,
				},
				arrow: {
					color: theme.palette.secondary.darker,
				},
			},
		},
	};
}
