import React from "react";
import { Box, Button, IconButton, Typography, Stack, useTheme, useMediaQuery } from "@mui/material";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";

interface CustomPaginationProps {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({ page, totalPages, onPageChange, disabled = false }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	// Generar array de números de página a mostrar
	const getPageNumbers = (): (number | string)[] => {
		const delta = isMobile ? 1 : 2; // Número de páginas a mostrar a cada lado de la página actual
		const range: number[] = [];
		const rangeWithDots: (number | string)[] = [];
		let l: number | undefined;

		// Siempre mostrar primera página
		range.push(1);

		// Calcular rango de páginas alrededor de la página actual
		for (let i = page - delta; i <= page + delta; i++) {
			if (i > 1 && i < totalPages) {
				range.push(i);
			}
		}

		// Siempre mostrar última página si hay más de una
		if (totalPages > 1) {
			range.push(totalPages);
		}

		// Agregar puntos suspensivos donde sea necesario
		range.forEach((i) => {
			if (l !== undefined) {
				if (i - l === 2) {
					// Si solo hay un hueco, mostrar el número
					rangeWithDots.push(l + 1);
				} else if (i - l !== 1) {
					// Si hay más de un hueco, mostrar puntos suspensivos
					rangeWithDots.push("...");
				}
			}
			rangeWithDots.push(i);
			l = i;
		});

		return rangeWithDots;
	};

	const pageNumbers = getPageNumbers();

	return (
		<Stack direction="row" spacing={isMobile ? 0.5 : 1} alignItems="center">
			{/* Botón Anterior */}
			<IconButton
				size="small"
				onClick={() => onPageChange(page - 1)}
				disabled={page === 0 || disabled}
				sx={{
					"&:hover": {
						backgroundColor: theme.palette.action.hover,
					},
				}}
				title="Página anterior"
			>
				<ArrowLeft2 size={18} />
			</IconButton>

			{/* Números de página */}
			{pageNumbers.map((pageNum, index) => (
				<Box key={index}>
					{pageNum === "..." ? (
						<Typography
							variant="body2"
							sx={{
								px: 1,
								color: "text.secondary",
								userSelect: "none",
							}}
						>
							...
						</Typography>
					) : (
						<Button
							size="small"
							onClick={() => onPageChange(Number(pageNum) - 1)}
							disabled={disabled}
							variant={page === Number(pageNum) - 1 ? "contained" : "text"}
							sx={{
								minWidth: isMobile ? 32 : 36,
								px: isMobile ? 0.5 : 1,
								py: 0.5,
								fontSize: isMobile ? "0.875rem" : "1rem",
								fontWeight: page === Number(pageNum) - 1 ? 600 : 400,
								...(page !== Number(pageNum) - 1 && {
									color: "text.primary",
									"&:hover": {
										backgroundColor: theme.palette.action.hover,
									},
								}),
							}}
						>
							{pageNum}
						</Button>
					)}
				</Box>
			))}

			{/* Botón Siguiente */}
			<IconButton
				size="small"
				onClick={() => onPageChange(page + 1)}
				disabled={page === totalPages - 1 || disabled}
				sx={{
					"&:hover": {
						backgroundColor: theme.palette.action.hover,
					},
				}}
				title="Página siguiente"
			>
				<ArrowRight2 size={18} />
			</IconButton>
		</Stack>
	);
};

export default CustomPagination;
