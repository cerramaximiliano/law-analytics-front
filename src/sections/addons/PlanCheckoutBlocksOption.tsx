/**
 * Selector «Sumar causas adicionales» dentro de la tarjeta de Premium, para contratar el plan
 * y los bloques (y el conector de IA, si se marcó) en un solo pago. Con bloques elegidos
 * muestra el total: "Plan Premium US$ 29,99 + 5 bloques US$ 45 = US$ 74,99/mes · 1.750 causas".
 * El estado lo maneja usePlanCheckoutBlocks.
 */

import { Box, IconButton, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Add, Minus } from "iconsax-react";

import { formatAmount } from "utils/planCheckoutAddon";
import { blocksSummary } from "utils/planCheckoutBlocks";

const BRAND_BLUE = "#3A7BFF";

interface Props {
	planId: string;
	blocks: number;
	maxBlocks: number;
	onChange: (blocks: number) => void;
	unitPrice: number | null;
	unitCurrency: string;
	foldersPerBlock: number;
	/** Total ya formateado (formatPlanBlocksTotal); null si no se puede calcular. */
	totalLabel: string | null;
	disabled?: boolean;
}

const PlanCheckoutBlocksOption = ({
	planId,
	blocks,
	maxBlocks,
	onChange,
	unitPrice,
	unitCurrency,
	foldersPerBlock,
	totalLabel,
	disabled = false,
}: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const active = blocks > 0;
	const priceLabel = typeof unitPrice === "number" ? ` (+${formatAmount(unitPrice, unitCurrency)}/mes c/u)` : "";
	return (
		<Box
			data-testid={`plan-blocks-option-${planId}`}
			sx={{
				mt: 1.5,
				px: 1.25,
				py: 0.75,
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, active ? (isDark ? 0.5 : 0.4) : isDark ? 0.22 : 0.16)}`,
				bgcolor: alpha(BRAND_BLUE, active ? (isDark ? 0.12 : 0.06) : isDark ? 0.05 : 0.02),
				transition: "background-color 0.15s ease, border-color 0.15s ease",
			}}
		>
			<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
				<Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
					{`Sumar causas adicionales${priceLabel}`}
				</Typography>
				<Stack direction="row" alignItems="center" spacing={0.5} aria-describedby={`plan-blocks-total-${planId}`}>
					<IconButton
						size="small"
						aria-label="Quitar un bloque de causas"
						disabled={disabled || blocks <= 0}
						onClick={() => onChange(blocks - 1)}
						data-testid={`plan-blocks-minus-${planId}`}
					>
						<Minus size={16} />
					</IconButton>
					<Typography
						variant="body2"
						sx={{ minWidth: 20, textAlign: "center", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
						data-testid={`plan-blocks-count-${planId}`}
						aria-live="polite"
					>
						{blocks}
					</Typography>
					<IconButton
						size="small"
						aria-label="Sumar un bloque de causas"
						disabled={disabled || blocks >= maxBlocks}
						onClick={() => onChange(blocks + 1)}
						data-testid={`plan-blocks-plus-${planId}`}
					>
						<Add size={16} />
					</IconButton>
				</Stack>
			</Stack>
			<Typography
				id={`plan-blocks-total-${planId}`}
				variant="caption"
				color="text.secondary"
				sx={{ display: "block", pb: 0.25, lineHeight: 1.4 }}
			>
				{active
					? totalLabel || blocksSummary(blocks, foldersPerBlock)
					: `Cada bloque suma ${foldersPerBlock.toLocaleString("es-AR")} causas activas. Se paga junto con el plan.`}
			</Typography>
		</Box>
	);
};

export default PlanCheckoutBlocksOption;
