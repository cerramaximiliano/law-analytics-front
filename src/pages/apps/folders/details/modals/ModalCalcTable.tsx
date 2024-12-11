import React, { useState, useEffect } from "react";
import { SearchNormal1 } from "iconsax-react";
import { useSelector, useDispatch } from "react-redux";
import {
	Box,
	Button,
	Divider,
	Dialog,
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
import { useTheme } from "@mui/material/styles";
import { getCalculatorsByUserId } from "store/reducers/calculator";
import { RootState, AppDispatch } from "store";
import { Add } from "iconsax-react";
import { useNavigate, useParams } from "react-router";
//types
import { CalcModalType, Calculator, CalcFormProps } from "types/calculator";

const NoCalculatorsFound = () => {
	const theme = useTheme();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const navigate = useNavigate();
	const { id } = useParams();
	console.log(id);
	const calculatorTypes = [
		{ name: "Cálculo Laboral", path: `/apps/calc/labor?folder=${id}` },
		{ name: "Cálculo Civil", path: `/apps/calc/civil?folder=${id}` },
		{ name: "Cálculo de Intereses", path: `/apps/calc/intereses?folder=${id}` },
		// Agregar más tipos según sea necesario
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
	const dispatch = useDispatch<AppDispatch>();
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
		<Dialog
			open={open}
			onClose={closeModal}
			PaperProps={{
				sx: {
					width: "600px",
					maxWidth: "600px",
					p: 0,
				},
			}}
			sx={{
				"& .MuiBackdrop-root": { opacity: "0.5 !important" },
			}}
		>
			<DialogTitle sx={{ bgcolor: theme.palette.primary.lighter, pb: 2 }}>
				<Stack spacing={1}>
					<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
						Seleccione Cálculos
					</Typography>
					<Typography variant="body2" color="textSecondary">
						Carpeta: {folderName}
					</Typography>
					<Typography variant="body2" color="textSecondary">
						{selectedCalculators.length} {selectedCalculators.length === 1 ? "cálculo seleccionado" : "cálculos seleccionados"}
					</Typography>
				</Stack>
			</DialogTitle>

			<Divider />

			<DialogContent sx={{ p: 2.5, width: "100%", overflow: "visible" }}>
				{selectedCalculators.length > 0 && (
					<Box sx={{ mb: 2.5 }}>
						<Stack spacing={1}>
							<Typography variant="subtitle2" color="textSecondary">
								Cálculos Seleccionados:
							</Typography>
							<Box
								sx={{
									p: 2,
									border: `2px solid ${theme.palette.primary.main}`,
									borderRadius: 2,
									bgcolor: theme.palette.primary.lighter,
								}}
							>
								<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
									{selectedCalculators.map((calc) => (
										<Tooltip key={calc._id} title={calc.reclamante}>
											<Box
												sx={{
													p: 1,
													bgcolor: theme.palette.background.paper,
													borderRadius: 1,
													border: "1px solid",
													borderColor: theme.palette.primary.main,
													display: "flex",
													alignItems: "center",
													gap: 1,
												}}
											>
												<Typography variant="body2">{calc.reclamante}</Typography>
											</Box>
										</Tooltip>
									))}
								</Stack>
							</Box>
						</Stack>
					</Box>
				)}

				<FormControl sx={{ width: "100%", mb: 2.5 }}>
					<TextField
						autoFocus
						value={searchTerm}
						onChange={handleSearchChange}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={18} color={theme.palette.primary.main} />
								</InputAdornment>
							),
							sx: {
								bgcolor: theme.palette.background.paper,
								"&:hover": {
									bgcolor: theme.palette.action.hover,
								},
							},
						}}
						placeholder="Buscar por reclamante, reclamado, tipo, categoría..."
						fullWidth
					/>
				</FormControl>

				<Box
					sx={{
						maxHeight: "500px",
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

			<Divider />

			<DialogActions sx={{ p: 2.5, bgcolor: theme.palette.background.default }}>
				<Button
					color="inherit"
					onClick={closeModal}
					sx={{
						color: theme.palette.text.secondary,
						"&:hover": {
							bgcolor: theme.palette.action.hover,
						},
					}}
				>
					Cancelar
				</Button>
				<Button onClick={handleVincular} color="primary" variant="contained" disabled={selectedCalculators.length === 0}>
					Vincular ({selectedCalculators.length})
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ModalCalcTable;
