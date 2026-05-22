import React from "react";
import { Box, IconButton, Typography, Stack, useTheme, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { BRAND_BLUE } from "themes/dashboardTokens";

interface CustomPaginationProps {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({ page, totalPages, onPageChange, disabled = false }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const getPageNumbers = (): (number | string)[] => {
		const delta = isMobile ? 1 : 2;
		const range: number[] = [];
		const rangeWithDots: (number | string)[] = [];
		let l: number | undefined;

		range.push(1);

		for (let i = page - delta; i <= page + delta; i++) {
			if (i > 1 && i < totalPages) {
				range.push(i);
			}
		}

		if (totalPages > 1) {
			range.push(totalPages);
		}

		range.forEach((i) => {
			if (l !== undefined) {
				if (i - l === 2) {
					rangeWithDots.push(l + 1);
				} else if (i - l !== 1) {
					rangeWithDots.push("...");
				}
			}
			rangeWithDots.push(i);
			l = i;
		});

		return rangeWithDots;
	};

	const pageNumbers = getPageNumbers();

	const navIconSx = (isDisabled: boolean) => ({
		width: 30,
		height: 30,
		borderRadius: 0.875,
		border: `1px solid ${isDisabled ? alpha(theme.palette.text.disabled, 0.16) : alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		bgcolor: isDisabled ? "transparent" : alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
		color: isDisabled ? theme.palette.text.disabled : BRAND_BLUE,
		transition: "all 180ms ease",
		"&:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
			borderColor: alpha(BRAND_BLUE, isDark ? 0.38 : 0.28),
		},
		"&.Mui-disabled": {
			bgcolor: "transparent",
			borderColor: alpha(theme.palette.text.disabled, 0.16),
			color: theme.palette.text.disabled,
		},
	});

	return (
		<Stack direction="row" spacing={isMobile ? 0.5 : 0.625} alignItems="center">
			{/* Prev */}
			<IconButton size="small" onClick={() => onPageChange(page - 1)} disabled={page === 0 || disabled} sx={navIconSx(page === 0 || disabled)} title="Página anterior">
				<ArrowLeft2 size={14} variant="Bulk" />
			</IconButton>

			{/* Page numbers */}
			{pageNumbers.map((pageNum, index) => (
				<Box key={index}>
					{pageNum === "..." ? (
						<Typography
							sx={{
								px: 0.625,
								fontSize: "0.82rem",
								color: "text.secondary",
								letterSpacing: "-0.005em",
								userSelect: "none",
								fontVariantNumeric: "tabular-nums",
							}}
						>
							…
						</Typography>
					) : (
						<Box
							component="button"
							onClick={() => onPageChange(Number(pageNum) - 1)}
							disabled={disabled}
							sx={{
								minWidth: isMobile ? 30 : 32,
								height: 30,
								px: isMobile ? 0.5 : 0.75,
								borderRadius: 0.875,
								border: `1px solid ${
									page === Number(pageNum) - 1
										? alpha(BRAND_BLUE, isDark ? 0.36 : 0.26)
										: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)
								}`,
								bgcolor: page === Number(pageNum) - 1 ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.1) : "transparent",
								color: page === Number(pageNum) - 1 ? BRAND_BLUE : "text.primary",
								fontSize: isMobile ? "0.78rem" : "0.82rem",
								fontWeight: page === Number(pageNum) - 1 ? 700 : 500,
								letterSpacing: "-0.005em",
								fontVariantNumeric: "tabular-nums",
								cursor: disabled ? "default" : "pointer",
								transition: "all 180ms ease",
								"&:hover": {
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
									borderColor: alpha(BRAND_BLUE, isDark ? 0.28 : 0.18),
								},
								"&:disabled": {
									cursor: "default",
									color: theme.palette.text.disabled,
								},
							}}
						>
							{pageNum}
						</Box>
					)}
				</Box>
			))}

			{/* Next */}
			<IconButton
				size="small"
				onClick={() => onPageChange(page + 1)}
				disabled={page === totalPages - 1 || disabled}
				sx={navIconSx(page === totalPages - 1 || disabled)}
				title="Página siguiente"
			>
				<ArrowRight2 size={14} variant="Bulk" />
			</IconButton>
		</Stack>
	);
};

export default CustomPagination;
