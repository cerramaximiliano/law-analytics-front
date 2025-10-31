import React from "react";
import { useNavigate } from "react-router-dom";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Grid,
	Card,
	CardContent,
	CardActions as MuiCardActions,
	Button,
	Typography,
	Box,
	Chip,
	Stack,
	useTheme,
} from "@mui/material";
import { PopupTransition } from "components/@extended/Transitions";
import { Calculator, Coin, Chart2 } from "iconsax-react";

interface SelectCalculatorTypeModalProps {
	open: boolean;
	onClose: () => void;
	folderId: string;
}

interface CalculatorType {
	title: string;
	description: string;
	icon: React.ReactNode;
	path: string;
	disabled?: boolean;
	comingSoon?: boolean;
	color: string;
}

const SelectCalculatorTypeModal: React.FC<SelectCalculatorTypeModalProps> = ({ open, onClose, folderId }) => {
	const navigate = useNavigate();
	const theme = useTheme();

	const calculatorTypes: CalculatorType[] = [
		{
			title: "Laboral",
			description: "Calcula liquidaciones laborales, indemnizaciones y otros conceptos del ámbito laboral.",
			icon: <Calculator size={48} variant="Bulk" />,
			path: `/apps/calc/labor?folder=${folderId}`,
			disabled: false,
			comingSoon: false,
			color: theme.palette.primary.main,
		},
		{
			title: "Intereses",
			description: "Calcula intereses según diferentes tasas y periodos para tus procesos legales.",
			icon: <Coin size={48} variant="Bulk" />,
			path: `/apps/calc/intereses?folder=${folderId}`,
			disabled: false,
			comingSoon: false,
			color: theme.palette.success.main,
		},
		{
			title: "Civil",
			description: "Calcula liquidaciones del ámbito civil, indemnizaciones y otros conceptos relacionados.",
			icon: <Chart2 size={48} variant="Bulk" />,
			path: `/apps/calc/civil?folder=${folderId}`,
			disabled: true,
			comingSoon: true,
			color: theme.palette.warning.main,
		},
	];

	const handleSelectCalculator = (path: string, disabled: boolean) => {
		if (!disabled) {
			onClose();
			navigate(path);
		}
	};

	return (
		<Dialog
			open={open}
			TransitionComponent={PopupTransition}
			keepMounted
			onClose={onClose}
			maxWidth="md"
			fullWidth
			sx={{
				"& .MuiDialog-paper": {
					p: 0,
				},
			}}
		>
			<DialogTitle
				sx={{
					bgcolor: theme.palette.primary.lighter,
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Stack spacing={1}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<Calculator size={24} color={theme.palette.primary.main} />
						<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
							Seleccionar tipo de cálculo
						</Typography>
					</Stack>
					<Typography variant="body2" color="textSecondary">
						Selecciona el tipo de cálculo que deseas realizar para esta carpeta
					</Typography>
				</Stack>
			</DialogTitle>

			<DialogContent sx={{ p: 3 }}>
				<Grid container spacing={3}>
					{calculatorTypes.map((calc, index) => (
						<Grid item xs={12} sm={6} md={4} key={index}>
							<Card
								sx={{
									height: "100%",
									display: "flex",
									flexDirection: "column",
									position: "relative",
									opacity: calc.disabled ? 0.7 : 1,
									cursor: calc.disabled ? "not-allowed" : "pointer",
									transition: "all 0.3s ease",
									boxShadow: "0 2px 14px 0 rgba(32, 40, 45, 0.08)",
									"&:hover": {
										boxShadow: !calc.disabled ? "0 2px 14px 0 rgba(32, 40, 45, 0.18)" : undefined,
										transform: !calc.disabled ? "translateY(-4px)" : undefined,
									},
								}}
								onClick={() => handleSelectCalculator(calc.path, calc.disabled || false)}
							>
								{calc.comingSoon && (
									<Chip
										label="Próximamente"
										color="secondary"
										size="small"
										variant="light"
										sx={{
											position: "absolute",
											top: 16,
											right: 16,
										}}
									/>
								)}
								<CardContent sx={{ flexGrow: 1, p: 3 }}>
									<Box mb={2} display="flex" justifyContent="center">
										<Box sx={{ color: calc.color }}>{calc.icon}</Box>
									</Box>
									<Typography variant="h5" component="div" textAlign="center" gutterBottom>
										{calc.title}
									</Typography>
									<Typography variant="body2" color="text.secondary" textAlign="center">
										{calc.description}
									</Typography>
								</CardContent>
								<MuiCardActions sx={{ p: 3, pt: 1, justifyContent: "center" }}>
									<Button
										variant="contained"
										size="medium"
										disabled={calc.disabled}
										color="primary"
										fullWidth
										startIcon={<Calculator variant="Bold" />}
									>
										Seleccionar
									</Button>
								</MuiCardActions>
							</Card>
						</Grid>
					))}
				</Grid>
			</DialogContent>

			<DialogActions
				sx={{
					p: 2.5,
					bgcolor: theme.palette.background.default,
					borderTop: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Button color="error" onClick={onClose} sx={{ minWidth: 100 }}>
					Cancelar
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default SelectCalculatorTypeModal;
