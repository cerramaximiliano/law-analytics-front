import React, { useState, useEffect } from "react";
import { SearchNormal1, Calculator as CalculatorIcon } from "iconsax-react";
import { useSelector } from "react-redux";
import {
	Box,
	Button,
	DialogActions,
	DialogTitle,
	DialogContent,
	FormControl,
	InputAdornment,
	Stack,
	TextField,
	Typography,
	Tooltip,
	Menu,
	MenuItem,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import { getCalculatorsByUserId } from "store/reducers/calculator";
import { RootState, dispatch } from "store";
import { Add } from "iconsax-react";
import { useNavigate, useParams } from "react-router";
import { BRAND_BLUE } from "themes/dashboardTokens";

//types
import { CalcModalType, Calculator, CalcFormProps } from "types/calculator";

const NoCalculatorsFound = () => {
	const theme = useTheme();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const navigate = useNavigate();
	const { id } = useParams();

	const calculatorTypes = [
		{ name: "Cálculo Laboral", path: `/apps/calc/labor?folder=${id}` },
		// { name: "Cálculo Civil", path: `/apps/calc/civil?folder=${id}` }, // Oculto temporalmente
		{ name: "Cálculo de Intereses", path: `/apps/calc/intereses?folder=${id}` },
	];

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleNavigate = (path: string) => {
		navigate(path);
		handleClose();
	};

	return (
		<Box
			sx={{
				textAlign: "center",
				py: 4,
				bgcolor: theme.palette.background.paper,
				borderRadius: 2,
				border: "1px dashed",
				borderColor: theme.palette.divider,
			}}
		>
			<Stack spacing={2} alignItems="center">
				<Typography color="textSecondary">No se encontraron cálculos</Typography>

				<Button
					variant="outlined"
					color="primary"
					startIcon={<Add size={20} />}
					onClick={handleClick}
					sx={{
						borderStyle: "dashed",
						"&:hover": {
							borderStyle: "dashed",
							bgcolor: theme.palette.primary.lighter,
						},
					}}
				>
					Crear Nuevo Cálculo
				</Button>

				<Menu
					anchorEl={anchorEl}
					open={open}
					onClose={handleClose}
					PaperProps={{
						sx: {
							mt: 1,
							boxShadow: theme.shadows[3],
							"& .MuiMenuItem-root": {
								px: 2,
								py: 1,
								borderRadius: 1,
								mx: 0.5,
								my: 0.25,
							},
						},
					}}
				>
					{calculatorTypes.map((type) => (
						<MenuItem
							key={type.path}
							onClick={() => handleNavigate(type.path)}
							sx={{
								"&:hover": {
									bgcolor: theme.palette.primary.lighter,
								},
							}}
						>
							{type.name}
						</MenuItem>
					))}
				</Menu>
			</Stack>
		</Box>
	);
};

const CalcForm = ({ handlerAddress, searchTerm, selectedCalculators }: CalcFormProps) => {
	const theme = useTheme();
	const calculators = useSelector((state: RootState) => state.calculator.calculators);

	const filteredCalculators =
		calculators?.filter((calc: Calculator) => {
			// Primero verificamos que sea de tipo "Calculado" y que no tenga folderId
			if (calc.folderId || calc.type !== "Calculado") return false;

			const searchLower = searchTerm.toLowerCase();
			return (
				(calc.reclamante?.toLowerCase() || "").includes(searchLower) ||
				(calc.reclamado?.toLowerCase() || "").includes(searchLower) ||
				(calc.type?.toLowerCase() || "").includes(searchLower) ||
				(calc.category?.toLowerCase() || "").includes(searchLower) ||
				(calc.subcategory?.toLowerCase() || "").includes(searchLower) ||
				(calc.date?.toLowerCase() || "").includes(searchLower) ||
				(calc.amount?.toString() || "").includes(searchLower)
			);
		}) || [];

	return (
		<Stack spacing={1.5}>
			{filteredCalculators.length > 0 ? (
				filteredCalculators.map((calculator: Calculator) => {
					const isSelected = selectedCalculators.some((calc) => calc._id === calculator._id);

					return (
						// En el Box de cada cálculo
						<Box
							key={calculator._id}
							onClick={() => handlerAddress(calculator)}
							sx={{
								width: "100%",
								border: "1px solid",
								borderColor: isSelected ? theme.palette.primary.main : theme.palette.divider,
								borderRadius: 2,
								p: 3,
								my: 1, // Agregamos margen vertical
								cursor: "pointer",
								bgcolor: isSelected ? theme.palette.primary.lighter : theme.palette.background.paper,
								position: "relative",
								transition: "all 0.2s ease-in-out",
								"&:hover": {
									borderColor: theme.palette.primary.main,
									bgcolor: isSelected ? theme.palette.primary.lighter : theme.palette.primary.lighter,
									transform: "translateY(-2px)",
									boxShadow: `0 4px 8px ${theme.palette.primary.lighter}`,
									zIndex: 10,
									// Agregamos un margen top adicional en hover para evitar el "corte"
									marginTop: "10px",
									marginBottom: "6px",
								},
							}}
						>
							<Stack spacing={1.5}>
								<Stack direction="row" alignItems="center" spacing={1}>
									<Tooltip title={calculator.reclamante}>
										<Typography
											variant="subtitle1"
											sx={{
												flex: 1,
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
												fontWeight: isSelected ? 600 : 500,
											}}
										>
											{calculator.reclamante}
										</Typography>
									</Tooltip>
								</Stack>
								<Stack
									direction="row"
									spacing={2}
									sx={{
										color: theme.palette.text.secondary,
										bgcolor: theme.palette.background.default,
										p: 1,
										borderRadius: 1,
									}}
								>
									<Typography variant="body2">{calculator.reclamado}</Typography>
									<Typography variant="body2">{calculator.date}</Typography>
									<Typography variant="body2">${calculator.amount.toLocaleString()}</Typography>
								</Stack>
							</Stack>
						</Box>
					);
				})
			) : (
				<NoCalculatorsFound />
			)}
		</Stack>
	);
};

const ModalCalcTable = ({ open, setOpen, folderId = "", folderName = "" }: CalcModalType) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCalculators, setSelectedCalculators] = useState<Calculator[]>([]);

	const userId = useSelector((state: RootState) => state.auth.user?._id);

	useEffect(() => {
		if (open && userId) {
			dispatch(getCalculatorsByUserId(userId));
			setSelectedCalculators([]);
		}
	}, [open, userId, dispatch]);

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};

	const closeModal = () => {
		setOpen(false);
		setSelectedCalculators([]);
	};

	const handleClick = (calculator: Calculator) => {
		if (calculator.folderId) return; // No permitir seleccionar si ya tiene folderId

		setSelectedCalculators((prev) => {
			const isSelected = prev.some((calc) => calc._id === calculator._id);
			if (isSelected) {
				return prev.filter((calc) => calc._id !== calculator._id);
			}
			return [...prev, calculator];
		});
	};

	const handleVincular = () => {
		if (selectedCalculators.length > 0) {
			// Here you'll implement the logic to save the selected calculators
			// Example: dispatch(linkCalculatorsToFolder({ folderId, calculatorIds: selectedCalculators.map(calc => calc._id) }));
			closeModal();
		}
	};

	return (
		<ResponsiveDialog
			maxWidth="sm"
			open={open}
			onClose={closeModal}
			fullWidth
			PaperProps={{
				sx: {
					p: 0,
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					overflow: "hidden",
				},
			}}
			sx={{ "& .MuiBackdrop-root": { opacity: "0.5 !important" } }}
		>
			<DialogTitle
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.25,
					px: 2.5,
					py: 1.75,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				}}
			>
				<Box
					sx={{
						width: 32,
						height: 32,
						borderRadius: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						color: BRAND_BLUE,
					}}
				>
					<CalculatorIcon size={18} variant="Bulk" />
				</Box>
				<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
					<Stack direction="row" spacing={0.5} alignItems="center">
						<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
						<Typography
							sx={{
								fontSize: "0.6rem",
								fontWeight: 600,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: "text.secondary",
							}}
						>
							Vincular cálculos
						</Typography>
					</Stack>
					<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
						Seleccioná cálculos
					</Typography>
					<Typography
						sx={{
							fontSize: "0.72rem",
							color: "text.secondary",
							letterSpacing: "-0.005em",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{folderName} · {selectedCalculators.length}{" "}
						{selectedCalculators.length === 1 ? "cálculo seleccionado" : "cálculos seleccionados"}
					</Typography>
				</Stack>
			</DialogTitle>

			<DialogContent sx={{ p: 2.5, width: "100%", overflow: "visible" }}>
				{selectedCalculators.length > 0 && (
					<Box sx={{ mb: 2 }}>
						<Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
							<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{
									fontSize: "0.6rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								Cálculos seleccionados
							</Typography>
						</Stack>
						<Box
							sx={{
								p: 1.5,
								borderRadius: 1.5,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
							}}
						>
							<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
								{selectedCalculators.map((calc) => (
									<Tooltip key={calc._id} title={calc.reclamante}>
										<Box
											sx={{
												px: 1,
												py: 0.5,
												bgcolor: theme.palette.background.paper,
												borderRadius: 0.875,
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
												display: "flex",
												alignItems: "center",
												gap: 0.5,
											}}
										>
											<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
											<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>
												{calc.reclamante}
											</Typography>
										</Box>
									</Tooltip>
								))}
							</Stack>
						</Box>
					</Box>
				)}

				<FormControl sx={{ width: "100%", mb: 2 }}>
					<TextField
						autoFocus
						value={searchTerm}
						onChange={handleSearchChange}
						size="small"
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={16} variant="Bulk" color={BRAND_BLUE} />
								</InputAdornment>
							),
							sx: {
								bgcolor: theme.palette.background.paper,
								borderRadius: 1,
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
								},
								"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: BRAND_BLUE,
								},
							},
						}}
						placeholder="Buscar por reclamante, reclamado, tipo, categoría…"
						fullWidth
					/>
				</FormControl>

				<Box
					sx={{
						maxHeight: 500,
						width: "100%",
						overflowX: "hidden",
						overflowY: "auto",
						position: "relative",
					}}
				>
					<Stack spacing={1.5}>
						<CalcForm handlerAddress={handleClick} searchTerm={searchTerm} selectedCalculators={selectedCalculators} />
					</Stack>
				</Box>
			</DialogContent>

			<DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
				<Button
					onClick={closeModal}
					sx={{
						textTransform: "none",
						fontWeight: 600,
						letterSpacing: "-0.005em",
						color: "text.secondary",
						borderRadius: 1.25,
						px: 2,
						py: 0.875,
						border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
						"&:hover": {
							color: BRAND_BLUE,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
							borderColor: alpha(BRAND_BLUE, 0.28),
						},
					}}
				>
					Cancelar
				</Button>
				<Button
					onClick={handleVincular}
					variant="contained"
					disabled={selectedCalculators.length === 0}
					sx={{
						textTransform: "none",
						fontWeight: 600,
						letterSpacing: "-0.005em",
						bgcolor: BRAND_BLUE,
						color: "#fff",
						borderRadius: 1.25,
						px: 2,
						py: 0.875,
						boxShadow: "none",
						"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
					}}
				>
					Vincular ({selectedCalculators.length})
				</Button>
			</DialogActions>
		</ResponsiveDialog>
	);
};

export default ModalCalcTable;
