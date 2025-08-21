import React from "react";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Tooltip, Stack, useTheme, useMediaQuery, Chip } from "@mui/material";
import { ArrowLeft2, ArrowRight2, Grid5 } from "iconsax-react";
import { useSelector } from "react-redux";

interface NavigationControlsProps {
	currentFolderId: string;
	inline?: boolean;
}

interface StateType {
	folder: {
		folders: any[];
	};
}

const NavigationControls = ({ currentFolderId, inline = false }: NavigationControlsProps) => {
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isTablet = useMediaQuery(theme.breakpoints.down("md"));
	const folders = useSelector((state: StateType) => state.folder.folders);

	// Encontrar el índice del folder actual y calcular anterior/siguiente
	const { prevFolder, nextFolder, currentIndex, totalFolders } = useMemo(() => {
		if (!folders || folders.length === 0 || !currentFolderId) {
			return { prevFolder: null, nextFolder: null, currentIndex: -1, totalFolders: 0 };
		}

		const index = folders.findIndex((f: any) => f._id === currentFolderId);
		return {
			prevFolder: index > 0 ? folders[index - 1] : null,
			nextFolder: index < folders.length - 1 ? folders[index + 1] : null,
			currentIndex: index,
			totalFolders: folders.length,
		};
	}, [folders, currentFolderId]);

	// Handlers de navegación
	const handleGoToList = useCallback(() => {
		navigate("/apps/folders/list");
	}, [navigate]);

	const handlePrevFolder = useCallback(() => {
		if (prevFolder) {
			navigate(`/apps/folders/details/${prevFolder._id}`);
		}
	}, [prevFolder, navigate]);

	const handleNextFolder = useCallback(() => {
		if (nextFolder) {
			navigate(`/apps/folders/details/${nextFolder._id}`);
		}
	}, [nextFolder, navigate]);

	// Formatear nombre del folder
	const formatFolderName = (name: string) => {
		if (!name) return "";
		return name
			.toLowerCase()
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	return (
		<Box sx={{ mb: inline ? 0 : 2 }}>
			<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1.5}>
				{/* Indicador de posición */}
				{currentIndex >= 0 && totalFolders > 0 && !isMobile && (
					<Chip
						label={`${currentIndex + 1} de ${totalFolders}`}
						size="small"
						sx={{
							height: 24,
							fontSize: "0.75rem",
							fontWeight: 500,
							bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100",
							color: theme.palette.mode === "dark" ? "grey.300" : "grey.700",
						}}
					/>
				)}

				{/* Botones de navegación */}
				<Stack direction="row" spacing={0}>
					<Tooltip title={prevFolder ? `Ir a: ${formatFolderName(prevFolder.folderName)}` : "No hay causa anterior"}>
						<span>
							<Button
								onClick={handlePrevFolder}
								disabled={!prevFolder}
								size="small"
								sx={{
									minWidth: 36,
									height: 36,
									borderRadius: "8px 0 0 8px",
									border: "1px solid",
									borderColor: theme.palette.divider,
									borderRight: 0,
									color: theme.palette.mode === "dark" ? "grey.400" : "grey.700",
									transition: "all 0.2s ease-in-out",
									"&:hover": {
										bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.50",
										borderColor: theme.palette.primary.main,
										color: theme.palette.primary.main,
										transform: "translateX(-2px)",
									},
									"&:disabled": {
										borderColor: theme.palette.divider,
										color: theme.palette.action.disabled,
									},
								}}
							>
								<ArrowLeft2 size={18} variant="Bold" />
							</Button>
						</span>
					</Tooltip>

					<Button
						variant="contained"
						startIcon={!isMobile && <Grid5 size={18} variant="Bold" />}
						onClick={handleGoToList}
						size="small"
						sx={{
							height: 36,
							borderRadius: 0,
							px: isTablet ? 2 : 3,
							minWidth: isTablet ? "auto" : "140px",
							bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.50",
							color: theme.palette.mode === "dark" ? "grey.100" : "grey.800",
							fontWeight: 600,
							textTransform: "none",
							boxShadow: "none",
							borderTop: "1px solid",
							borderBottom: "1px solid",
							borderColor: theme.palette.divider,
							transition: "all 0.2s ease-in-out",
							"&:hover": {
								bgcolor: theme.palette.primary.main,
								color: "white",
								boxShadow: theme.shadows[2],
								transform: "scale(1.02)",
							},
						}}
					>
						{isMobile ? "Lista" : "Volver a la lista"}
					</Button>

					<Tooltip title={nextFolder ? `Ir a: ${formatFolderName(nextFolder.folderName)}` : "No hay causa siguiente"}>
						<span>
							<Button
								onClick={handleNextFolder}
								disabled={!nextFolder}
								size="small"
								sx={{
									minWidth: 36,
									height: 36,
									borderRadius: "0 8px 8px 0",
									border: "1px solid",
									borderColor: theme.palette.divider,
									borderLeft: 0,
									color: theme.palette.mode === "dark" ? "grey.400" : "grey.700",
									transition: "all 0.2s ease-in-out",
									"&:hover": {
										bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.50",
										borderColor: theme.palette.primary.main,
										color: theme.palette.primary.main,
										transform: "translateX(2px)",
									},
									"&:disabled": {
										borderColor: theme.palette.divider,
										color: theme.palette.action.disabled,
									},
								}}
							>
								<ArrowRight2 size={18} variant="Bold" />
							</Button>
						</span>
					</Tooltip>
				</Stack>
			</Stack>
		</Box>
	);
};

export default NavigationControls;
