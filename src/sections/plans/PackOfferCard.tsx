/**
 * Tarjeta del pack (combo) que propone un cupón dirigido o público: plan + bloques de causas +
 * conector de IA ya elegidos, editables, con el total con descuento y un solo botón. La
 * selección es la misma que la de la tarjeta del plan (usePlanCheckoutBlocks +
 * usePlanCheckoutAddon): lo que se cambia acá se refleja allá y el checkout es el mismo.
 */

import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";

import PlanCheckoutAddonOption from "sections/mcp/PlanCheckoutAddonOption";
import PlanCheckoutBlocksOption from "sections/addons/PlanCheckoutBlocksOption";
import { applyPercentOff, formatAmount } from "utils/planCheckoutAddon";
import { packFolders, packSubtotal } from "utils/planCheckoutPack";

const BRAND_BLUE = "#3A7BFF";

export interface PackOfferCardProps {
	title: string;
	subtitle?: string | null;
	/** "25 % OFF" (badge del cupón o derivado). */
	badge?: string | null;
	planId: string;
	/** "Premium" (sin "Plan"). */
	planName: string;
	planPrice: number | null;
	currency: string;
	planFolders: number | null;
	blocks: {
		offer: boolean;
		value: number;
		max: number;
		unitPrice: number | null;
		foldersPerBlock: number;
		onChange: (n: number) => void;
	};
	connector: {
		offer: boolean;
		checked: boolean;
		price: number | null;
		onChange: (checked: boolean) => void;
	};
	percentOff: number | null;
	/** "durante 6 meses" (discountDurationLabel). */
	durationLabel: string;
	cta: { label: string; onClick: () => void; disabled?: boolean; loading?: boolean };
}

const PackOfferCard = ({
	title,
	subtitle,
	badge,
	planId,
	planName,
	planPrice,
	currency,
	planFolders,
	blocks,
	connector,
	percentOff,
	durationLabel,
	cta,
}: PackOfferCardProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const blocksHere = blocks.offer ? blocks.value : 0;
	const connectorHere = connector.offer && connector.checked;
	const subtotal = packSubtotal({
		planPrice,
		blocks: blocksHere,
		unitPrice: blocks.unitPrice,
		connector: connectorHere,
		addonPrice: connector.price,
	});
	const folders = packFolders(planFolders, blocksHere, blocks.foldersPerBlock);
	const discounted = subtotal !== null && typeof percentOff === "number" ? applyPercentOff(subtotal, percentOff) : null;

	return (
		<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 150, damping: 28 }}>
			<Box
				data-testid={`pack-offer-${planId}`}
				sx={{
					maxWidth: 720,
					mx: "auto",
					mb: 4,
					p: { xs: 2, sm: 3 },
					borderRadius: 3,
					border: `1.5px solid ${alpha(BRAND_BLUE, isDark ? 0.55 : 0.45)}`,
					bgcolor: isDark ? alpha(BRAND_BLUE, 0.08) : alpha(BRAND_BLUE, 0.04),
					boxShadow: `0 12px 32px ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
				}}
			>
				<Stack
					direction={{ xs: "column", sm: "row" }}
					alignItems={{ sm: "center" }}
					justifyContent="space-between"
					spacing={1}
					sx={{ mb: 1 }}
				>
					<Typography
						component="h2"
						sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" }, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}
					>
						{title}
					</Typography>
					{badge && (
						<Chip
							label={badge}
							size="small"
							sx={{ fontWeight: 700, bgcolor: BRAND_BLUE, color: "#fff", alignSelf: { xs: "flex-start", sm: "auto" } }}
						/>
					)}
				</Stack>
				{subtitle && (
					<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
						{subtitle}
					</Typography>
				)}

				<Box
					sx={{
						px: 1.25,
						py: 0.75,
						borderRadius: 1.5,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.5 : 0.4)}`,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.06),
					}}
				>
					<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{`Plan ${planName}${typeof planFolders === "number" ? ` · ${planFolders.toLocaleString("es-AR")} causas` : ""}`}
						</Typography>
						{typeof planPrice === "number" && (
							<Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
								{`${formatAmount(planPrice, currency)}/mes`}
							</Typography>
						)}
					</Stack>
				</Box>
				{blocks.offer && (
					<PlanCheckoutBlocksOption
						planId={`pack-${planId}`}
						blocks={blocks.value}
						maxBlocks={blocks.max}
						onChange={blocks.onChange}
						unitPrice={blocks.unitPrice}
						unitCurrency={currency}
						foldersPerBlock={blocks.foldersPerBlock}
						totalLabel={null}
						disabled={cta.disabled}
					/>
				)}
				{connector.offer && (
					<PlanCheckoutAddonOption
						planId={`pack-${planId}`}
						checked={connector.checked}
						onChange={connector.onChange}
						addonPrice={connector.price}
						addonCurrency={currency}
						totalLabel={null}
						disabled={cta.disabled}
					/>
				)}

				<Stack
					direction={{ xs: "column", sm: "row" }}
					alignItems={{ sm: "flex-end" }}
					justifyContent="space-between"
					spacing={1.5}
					sx={{ mt: 2 }}
				>
					<Box>
						{subtotal !== null && (
							<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
								{`Total sin descuento: ${formatAmount(subtotal, currency)}/mes${
									typeof folders === "number" ? ` · ${folders.toLocaleString("es-AR")} causas` : ""
								}`}
							</Typography>
						)}
						{discounted !== null ? (
							<Typography
								sx={{ fontSize: { xs: "1.5rem", md: "1.75rem" }, fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}
							>
								{`${formatAmount(discounted, currency)}/mes`}
								<Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
									{`con ${percentOff} % OFF ${durationLabel}`}
								</Typography>
							</Typography>
						) : (
							subtotal !== null && (
								<Typography sx={{ fontSize: { xs: "1.5rem", md: "1.75rem" }, fontWeight: 700, lineHeight: 1.1 }}>
									{`${formatAmount(subtotal, currency)}/mes`}
								</Typography>
							)
						)}
						<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
							Podés sumar o quitar ítems antes de pagar; el descuento se aplica a todo lo que incluyas. Un solo pago, todo activo al
							instante.
						</Typography>
					</Box>
					<Button
						variant="contained"
						size="large"
						onClick={cta.onClick}
						disabled={cta.disabled || cta.loading}
						data-testid={`pack-offer-cta-${planId}`}
						sx={{
							textTransform: "none",
							fontWeight: 700,
							px: 3,
							whiteSpace: "nowrap",
							bgcolor: BRAND_BLUE,
							"&:hover": { bgcolor: "#2f6ae0" },
						}}
					>
						{cta.loading ? "Procesando..." : cta.label}
					</Button>
				</Stack>
			</Box>
		</motion.div>
	);
};

export default PackOfferCard;
