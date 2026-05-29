import React from "react";
// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";

// project imports
import { useDispatch } from "store";
import { openSearch } from "store/reducers/search";
import { BRAND_BLUE } from "themes/dashboardTokens";

// assets
import { SearchNormal1 } from "iconsax-react";

// types
import { ThemeMode } from "types/config";

// ==============================|| HEADER CONTENT - COMMAND TRIGGER ||============================== //
// Reemplaza el OutlinedInput read-only "Ctrl + K" por un botón con chip kbd.
// Comunica más claramente que abre un command palette y se ve menos como un
// input real que invita a tipear y no responde.

// ⌘ en Mac, Ctrl en el resto. Resuelto al cargar el módulo para no parpadear.
const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const KBD_LABEL = isMac ? "⌘K" : "Ctrl K";

const Search = () => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const isDark = theme.palette.mode === ThemeMode.DARK;

	return (
		<Box sx={{ width: "100%", ml: { xs: 0, md: 2 } }}>
			<ButtonBase
				onClick={() => dispatch(openSearch())}
				aria-label="Abrir buscador (Ctrl+K)"
				sx={{
					width: { xs: "100%", md: 280 },
					px: 1.5,
					py: 1,
					borderRadius: 1,
					border: `1px solid ${theme.palette.divider}`,
					bgcolor: "background.paper",
					justifyContent: "space-between",
					gap: 1.5,
					transition: "background-color 180ms, border-color 180ms",
					"&:hover": {
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
						borderColor: alpha(BRAND_BLUE, isDark ? 0.3 : 0.2),
					},
					"&:focus-visible": {
						outline: `2px solid ${BRAND_BLUE}`,
						outlineOffset: 2,
					},
				}}
			>
				<Stack direction="row" alignItems="center" spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
					<SearchNormal1 size={16} color={theme.palette.text.secondary} />
					<Typography
						sx={{
							fontSize: "0.85rem",
							color: "text.secondary",
							textAlign: "left",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						Buscar...
					</Typography>
				</Stack>
				<Box
					component="kbd"
					sx={{
						display: { xs: "none", sm: "inline-flex" },
						alignItems: "center",
						px: 0.75,
						py: 0.15,
						borderRadius: 0.75,
						border: `1px solid ${theme.palette.divider}`,
						bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
						fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
						fontSize: "0.68rem",
						fontWeight: 600,
						color: "text.secondary",
						letterSpacing: "0.02em",
						lineHeight: 1.4,
					}}
				>
					{KBD_LABEL}
				</Box>
			</ButtonBase>
		</Box>
	);
};

export default Search;
