/**
 * Checkbox "Agregar Conectores de IA (+US$ 4/mes)" dentro de la tarjeta de un plan pago,
 * para contratar plan + add-on en un solo checkout (usuarios sin plan pago). Marcado,
 * muestra el total: "Plan Estándar US$ 7,99 + Conectores de IA US$ 4 = US$ 11,99/mes".
 * El estado y el flujo los maneja usePlanCheckoutAddon.
 */

import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { addonCheckboxLabel } from "utils/planCheckoutAddon";

const BRAND_BLUE = "#3A7BFF";

interface Props {
	planId: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	addonPrice: number | null;
	addonCurrency: string;
	/** Total ya formateado (formatPlanAddonTotal); null si no se puede calcular. */
	totalLabel: string | null;
	disabled?: boolean;
}

const PlanCheckoutAddonOption = ({ planId, checked, onChange, addonPrice, addonCurrency, totalLabel, disabled = false }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box
			data-testid={`plan-addon-option-${planId}`}
			sx={{
				mt: 1.5,
				px: 1.25,
				py: 0.75,
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, checked ? (isDark ? 0.5 : 0.4) : isDark ? 0.22 : 0.16)}`,
				bgcolor: alpha(BRAND_BLUE, checked ? (isDark ? 0.12 : 0.06) : isDark ? 0.05 : 0.02),
				transition: "background-color 0.15s ease, border-color 0.15s ease",
			}}
		>
			<FormControlLabel
				sx={{ mx: 0, alignItems: "center", width: "100%" }}
				control={
					<Checkbox
						size="small"
						checked={checked}
						disabled={disabled}
						onChange={(e) => onChange(e.target.checked)}
						inputProps={{ "aria-describedby": `plan-addon-total-${planId}` }}
						sx={{ p: 0.5, mr: 0.75 }}
					/>
				}
				label={
					<Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
						{addonCheckboxLabel(addonPrice, addonCurrency)}
					</Typography>
				}
			/>
			<Typography
				id={`plan-addon-total-${planId}`}
				variant="caption"
				color="text.secondary"
				sx={{ display: "block", pl: 4.25, pb: 0.25, lineHeight: 1.4 }}
			>
				{checked && totalLabel ? totalLabel : "Usá Claude.ai y ChatGPT con tus datos. Se paga junto con el plan."}
			</Typography>
		</Box>
	);
};

export default PlanCheckoutAddonOption;
