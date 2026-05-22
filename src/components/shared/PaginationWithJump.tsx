import React, { useState } from "react";
import { TextField, Typography, Stack, InputAdornment, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CustomPagination from "./CustomPagination";
import { BRAND_BLUE } from "themes/dashboardTokens";

interface PaginationWithJumpProps {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
}

const PaginationWithJump: React.FC<PaginationWithJumpProps> = ({ page, totalPages, onPageChange, disabled = false }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [jumpValue, setJumpValue] = useState("");

	const handleJumpToPage = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			const pageNum = parseInt(jumpValue, 10);
			if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
				onPageChange(pageNum - 1);
				setJumpValue("");
			}
		}
	};

	const handleJumpChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		if (value === "" || /^\d+$/.test(value)) {
			setJumpValue(value);
		}
	};

	return (
		<Stack direction="row" spacing={{ xs: 1.25, sm: 1.5, md: 2 }} alignItems="center">
			<CustomPagination page={page} totalPages={totalPages} onPageChange={onPageChange} disabled={disabled} />

			{/* Salto directo */}
			{totalPages > 10 && (
				<Stack direction="row" spacing={0.875} alignItems="center">
					<Typography
						sx={{
							fontSize: "0.6rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "text.secondary",
						}}
					>
						Ir a
					</Typography>
					<TextField
						size="small"
						value={jumpValue || ""}
						onChange={handleJumpChange}
						onKeyPress={handleJumpToPage}
						placeholder="Página"
						disabled={disabled}
						sx={{
							width: 96,
							"& .MuiInputBase-root": {
								height: 30,
								borderRadius: 0.875,
								bgcolor: theme.palette.background.paper,
								fontSize: "0.78rem",
								fontVariantNumeric: "tabular-nums",
								"& fieldset": {
									borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
								},
								"&:hover fieldset": {
									borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
								},
								"&.Mui-focused fieldset": {
									borderColor: BRAND_BLUE,
								},
							},
							"& .MuiInputBase-input": {
								textAlign: "center",
								py: 0.375,
								fontWeight: 600,
								letterSpacing: "-0.005em",
								color: "text.primary",
							},
						}}
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<Typography
										sx={{
											fontSize: "0.7rem",
											fontWeight: 500,
											color: "text.secondary",
											letterSpacing: "-0.005em",
											fontVariantNumeric: "tabular-nums",
										}}
									>
										/{totalPages}
									</Typography>
								</InputAdornment>
							),
						}}
					/>
				</Stack>
			)}
		</Stack>
	);
};

export default PaginationWithJump;
