import { useEffect, useRef, useState } from "react";

// material-ui
import { Box, Container } from "@mui/material";
import { alpha } from "@mui/material/styles";

// third party
import { ArrowRight, Flash } from "iconsax-react";

// project-imports
import ApiService, { ActiveDiscount } from "store/reducers/ApiService";
import { pushGTMEvent } from "utils/gtm";
import dayjs from "utils/dayjs-config";

// ============================== TOKENS ============================== //
const BRAND_BLUE = "#3A7BFF";
const BRAND_PURPLE = "#8A5CFF";
const BRAND_GRADIENT_BG = `linear-gradient(90deg, ${BRAND_BLUE} 0%, ${BRAND_PURPLE} 50%, ${BRAND_BLUE} 100%)`;

const BANNER_CSS_VAR = "--discount-banner-h";

// ============================== BANNER ============================== //

/**
 * Strip promocional full-width fijo al tope del sitio. Aparece arriba del
 * navbar cuando hay un descuento público activo.
 *
 * Setea --discount-banner-h en :root con la altura real medida via
 * ResizeObserver. El AppBar de CommonLayout y el Hero del landing leen esa
 * variable para correrse y evitar overlap.
 *
 * Implementación: usa <span> nativos en vez de MUI Typography para evitar
 * que el `display: block` por default colapse el flex inline del strip.
 */
const DiscountBanner = () => {
	const [discount, setDiscount] = useState<ActiveDiscount | null>(null);
	const rootRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const response = await ApiService.getPublicPlans({ landingOnly: true });
				if (cancelled || !response?.success || !response.data) return;
				const firstWithDiscount = response.data.find((p) => p.activeDiscounts && p.activeDiscounts.length > 0);
				if (firstWithDiscount?.activeDiscounts?.[0]) {
					setDiscount(firstWithDiscount.activeDiscounts[0]);
				}
			} catch {
				// silencioso — sin banner es mejor que un banner roto
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!discount || !rootRef.current) return;
		const el = rootRef.current;
		const root = document.documentElement;

		const sync = () => {
			root.style.setProperty(BANNER_CSS_VAR, `${el.offsetHeight}px`);
		};
		sync();

		const ro = new ResizeObserver(sync);
		ro.observe(el);

		return () => {
			ro.disconnect();
			root.style.removeProperty(BANNER_CSS_VAR);
		};
	}, [discount]);

	if (!discount) return null;

	const handleClick = () => {
		pushGTMEvent("cta_click_discount_banner", { source: "discount_banner", code: discount.code });
		const target = document.getElementById("planes");
		if (target) {
			target.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	const validUntilLabel = discount.validUntil ? dayjs(discount.validUntil).format("D [de] MMMM") : null;
	const discountLabel = (() => {
		if (discount.badge) return discount.badge;
		if (discount.discountType === "percentage") return `${discount.discountValue}% OFF`;
		return discount.name;
	})();
	const durationLabel = discount.durationInMonths
		? `${discount.durationInMonths} ${discount.durationInMonths === 1 ? "mes" : "meses"}`
		: null;

	return (
		<Box
			ref={rootRef}
			role="button"
			tabIndex={0}
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleClick();
				}
			}}
			sx={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				width: "100%",
				zIndex: (t) => t.zIndex.appBar + 2,
				cursor: "pointer",
				background: BRAND_GRADIENT_BG,
				backgroundSize: "300% 100%",
				color: "#fff",
				borderBottom: `1px solid ${alpha("#000", 0.18)}`,
				animation: "discountShift 16s linear infinite",
				"@keyframes discountShift": {
					"0%": { backgroundPosition: "0% 50%" },
					"100%": { backgroundPosition: "300% 50%" },
				},
				"&:hover .banner-arrow": { transform: "translateX(4px)" },
				"&:focus-visible": {
					outline: `2px solid #fff`,
					outlineOffset: -2,
				},
			}}
		>
			<Container
				maxWidth="lg"
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexWrap: { xs: "wrap", md: "nowrap" },
					columnGap: { xs: 1.25, sm: 1.5, md: 2 },
					rowGap: 0.25,
					py: { xs: 0.75, md: 1 },
					px: { xs: 1.5, sm: 2, md: 3 },
					textAlign: "center",
					lineHeight: 1.25,
				}}
			>
				{/* Bloque 1 — chip de descuento */}
				<Box
					component="span"
					sx={{
						display: "inline-flex",
						alignItems: "center",
						gap: 0.5,
						flexShrink: 0,
						fontSize: { xs: "0.78rem", sm: "0.82rem", md: "0.86rem" },
						fontWeight: 700,
						letterSpacing: "0.02em",
						textTransform: "uppercase",
						color: "#fff",
						whiteSpace: "nowrap",
					}}
				>
					<Flash size={14} variant="Bold" color="#fff" />
					<Box component="span">{discountLabel}</Box>
				</Box>

				{/* Separador vertical — solo desktop */}
				<Box
					aria-hidden
					sx={{
						display: { xs: "none", md: "inline-block" },
						width: "1px",
						height: 14,
						bgcolor: alpha("#fff", 0.4),
						flexShrink: 0,
					}}
				/>

				{/* Bloque 2 — detalles del descuento */}
				<Box
					component="span"
					sx={{
						display: "inline-flex",
						alignItems: "center",
						flexWrap: "wrap",
						justifyContent: "center",
						columnGap: 0.5,
						flexShrink: 0,
						fontSize: { xs: "0.76rem", sm: "0.8rem", md: "0.84rem" },
						fontWeight: 500,
						color: alpha("#fff", 0.95),
						letterSpacing: "0.005em",
					}}
				>
					{durationLabel && (
						<>
							<Box component="span">durante</Box>
							<Box component="span" sx={{ fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
								{durationLabel}
							</Box>
						</>
					)}
					{durationLabel && validUntilLabel && (
						<Box component="span" sx={{ opacity: 0.55, px: 0.25 }}>
							·
						</Box>
					)}
					{validUntilLabel && (
						<>
							<Box component="span">hasta el</Box>
							<Box component="span" sx={{ fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
								{validUntilLabel}
							</Box>
						</>
					)}
				</Box>

				{/* Bloque 3 — CTA */}
				<Box
					component="span"
					sx={{
						display: "inline-flex",
						alignItems: "center",
						gap: 0.5,
						flexShrink: 0,
						fontSize: { xs: "0.78rem", sm: "0.82rem", md: "0.86rem" },
						fontWeight: 700,
						color: "#fff",
						letterSpacing: "0.01em",
						whiteSpace: "nowrap",
						ml: { md: 0.5 },
					}}
				>
					<Box
						component="span"
						sx={{
							borderBottom: `1.5px solid ${alpha("#fff", 0.7)}`,
							pb: "1px",
						}}
					>
						Aprovechar promo
					</Box>
					<Box
						className="banner-arrow"
						component="span"
						sx={{ display: "inline-flex", transition: "transform 0.2s ease" }}
					>
						<ArrowRight size={14} color="#fff" />
					</Box>
				</Box>
			</Container>
		</Box>
	);
};

export default DiscountBanner;
