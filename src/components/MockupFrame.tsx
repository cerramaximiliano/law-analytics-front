import { useTheme, alpha } from "@mui/material/styles";
import { Box } from "@mui/material";
import { motion } from "framer-motion";

import dashboardImage from "assets/images/dashboard.png";

const BRAND_BLUE = "#3A7BFF";

interface MockupFrameProps {
	image?: string;
	alt?: string;
	urlLabel?: string;
	compact?: boolean;
	showSecondaryCopy?: boolean;
	paperBg?: string;
	textColor?: string;
}

const MockupFrame = ({
	image = dashboardImage,
	alt = "Law Analytics Dashboard",
	urlLabel = "lawanalytics.app",
	compact = false,
	showSecondaryCopy = true,
	paperBg,
	textColor,
}: MockupFrameProps) => {
	const theme = useTheme();
	const effectivePaperBg = paperBg ?? theme.palette.background.paper;
	const effectiveTextColor = textColor ?? theme.palette.text.primary;

	return (
		<Box
			sx={{
				position: "relative",
				width: "100%",
				...(compact ? { maxWidth: 420, mx: "auto" } : { transform: { md: "scale(1.05)" }, transformOrigin: "center center" }),
			}}
		>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					inset: compact ? "6% -6% -6% -6%" : "8% -6% -8% -6%",
					background: `radial-gradient(ellipse at 50% 60%, ${alpha(BRAND_BLUE, 0.32)} 0%, ${alpha(BRAND_BLUE, 0.14)} 40%, transparent 72%)`,
					filter: "blur(38px)",
					zIndex: 0,
					pointerEvents: "none",
				}}
			/>

			{!compact && showSecondaryCopy && (
				<Box
					component="img"
					src={image}
					alt=""
					aria-hidden
					sx={{
						position: "absolute",
						top: -18,
						right: -22,
						width: "92%",
						height: "auto",
						borderRadius: "14px",
						opacity: 0.22,
						filter: "blur(2px)",
						zIndex: 1,
					}}
				/>
			)}

			<Box
				component={motion.div}
				animate={{ y: [0, -6, 0] }}
				transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
				sx={{ position: "relative", zIndex: 2 }}
			>
				<Box
					sx={{
						position: "relative",
						borderRadius: "14px",
						overflow: "hidden",
						boxShadow: `0 30px 60px ${alpha("#0F172A", 0.22)}, 0 12px 28px ${alpha("#0F172A", 0.12)}`,
						border: `1px solid ${alpha(effectiveTextColor, 0.1)}`,
						bgcolor: effectivePaperBg,
					}}
				>
					<Box
						sx={{
							height: { xs: 28, md: 34 },
							bgcolor: alpha(effectivePaperBg, 0.72),
							backdropFilter: "blur(12px)",
							WebkitBackdropFilter: "blur(12px)",
							display: "flex",
							alignItems: "center",
							px: 1.5,
							gap: 1.25,
							borderBottom: `1px solid ${alpha(effectiveTextColor, 0.1)}`,
						}}
					>
						<Box sx={{ display: "flex", gap: 0.625 }}>
							<Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#FF5F57" }} />
							<Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#FEBC2E" }} />
							<Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#28C840" }} />
						</Box>
						<Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
							<Box
								sx={{
									display: "inline-flex",
									alignItems: "center",
									gap: 0.5,
									px: 1.25,
									py: 0.25,
									borderRadius: 999,
									bgcolor: alpha(effectiveTextColor, 0.06),
									fontSize: { xs: "0.6rem", md: "0.68rem" },
									color: effectiveTextColor,
									fontWeight: 500,
									letterSpacing: "0.02em",
								}}
							>
								<Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: 10, height: 10, mr: 0.25 }}>
									<path
										d="M12 1a4 4 0 0 1 4 4v3h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V5a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v3h4V5a2 2 0 0 0-2-2Z"
										fill="currentColor"
									/>
								</Box>
								{urlLabel}
							</Box>
						</Box>
						<Box sx={{ width: 28 }} />
					</Box>

					<Box
						component="img"
						src={image}
						alt={alt}
						sx={{
							width: "100%",
							height: "auto",
							display: "block",
							...(compact && {
								maxHeight: 230,
								objectFit: "cover",
								objectPosition: "top left",
							}),
						}}
					/>

					<Box
						aria-hidden
						sx={{
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
							height: { xs: 50, md: 80 },
							background: `linear-gradient(to bottom, transparent, ${effectivePaperBg})`,
							pointerEvents: "none",
						}}
					/>
				</Box>
			</Box>
		</Box>
	);
};

export default MockupFrame;
