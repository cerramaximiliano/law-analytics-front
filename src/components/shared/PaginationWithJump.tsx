import React, { useState } from "react";
import { TextField, Typography, Stack, InputAdornment } from "@mui/material";
import CustomPagination from "./CustomPagination";

interface PaginationWithJumpProps {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
}

const PaginationWithJump: React.FC<PaginationWithJumpProps> = ({ page, totalPages, onPageChange, disabled = false }) => {
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
		// Solo permitir números
		if (value === "" || /^\d+$/.test(value)) {
			setJumpValue(value);
		}
	};

	return (
		<Stack direction="row" spacing={3} alignItems="center">
			<CustomPagination page={page} totalPages={totalPages} onPageChange={onPageChange} disabled={disabled} />

			{/* Salto directo a página */}
			{totalPages > 10 && (
				<Stack direction="row" spacing={1} alignItems="center">
					<Typography variant="body2" color="text.secondary">
						Ir a:
					</Typography>
					<TextField
						size="small"
						value={jumpValue}
						onChange={handleJumpChange}
						onKeyPress={handleJumpToPage}
						placeholder="Página"
						disabled={disabled}
						sx={{
							width: 80,
							"& .MuiInputBase-input": {
								textAlign: "center",
								py: 0.5,
							},
						}}
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<Typography variant="caption" color="text.secondary">
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
