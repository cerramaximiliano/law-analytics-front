import React from "react";
import { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Grid,
	FormControl,
	FormControlLabel,
	Switch,
	InputLabel,
	MenuItem,
	Select,
	Typography,
	Box,
	IconButton,
	Alert,
} from "@mui/material";
import { CloseCircle, Add, Trash } from "iconsax-react";
import { PlanPricingInfo, ResourceLimit, PlanFeature, Plan } from "store/reducers/ApiService";

interface PlanFormModalProps {
	open: boolean;
	onClose: () => void;
	onSave: (planData: Partial<Plan>) => Promise<void>;
	plan?: Plan | null;
}

const PlanFormModal: React.FC<PlanFormModalProps> = ({ open, onClose, onSave, plan }) => {
	const [formData, setFormData] = useState<Partial<Plan>>({
		planId: "",
		displayName: "",
		description: "",
		isActive: true,
		isDefault: false,
		resourceLimits: [],
		features: [],
		pricingInfo: {
			basePrice: 0,
			currency: "COP",
			billingPeriod: "monthly",
		},
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (plan) {
			setFormData(plan);
		} else {
			setFormData({
				planId: "",
				displayName: "",
				description: "",
				isActive: true,
				isDefault: false,
				resourceLimits: [],
				features: [],
				pricingInfo: {
					basePrice: 0,
					currency: "COP",
					billingPeriod: "monthly",
				},
			});
		}
	}, [plan]);

	const handleChange = (field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handlePricingChange = (field: keyof PlanPricingInfo, value: any) => {
		setFormData((prev) => ({
			...prev,
			pricingInfo: {
				...prev.pricingInfo!,
				[field]: value,
			},
		}));
	};

	const addResourceLimit = () => {
		setFormData((prev) => ({
			...prev,
			resourceLimits: [...prev.resourceLimits!, { name: "", limit: 0, description: "" }],
		}));
	};

	const updateResourceLimit = (index: number, field: keyof ResourceLimit, value: any) => {
		const newLimits = [...formData.resourceLimits!];
		newLimits[index] = { ...newLimits[index], [field]: value };
		setFormData((prev) => ({
			...prev,
			resourceLimits: newLimits,
		}));
	};

	const removeResourceLimit = (index: number) => {
		const newLimits = formData.resourceLimits!.filter((_, i) => i !== index);
		setFormData((prev) => ({
			...prev,
			resourceLimits: newLimits,
		}));
	};

	const addFeature = () => {
		setFormData((prev) => ({
			...prev,
			features: [...prev.features!, { name: "", enabled: true, description: "" }],
		}));
	};

	const updateFeature = (index: number, field: keyof PlanFeature, value: any) => {
		const newFeatures = [...formData.features!];
		newFeatures[index] = { ...newFeatures[index], [field]: value };
		setFormData((prev) => ({
			...prev,
			features: newFeatures,
		}));
	};

	const removeFeature = (index: number) => {
		const newFeatures = formData.features!.filter((_, i) => i !== index);
		setFormData((prev) => ({
			...prev,
			features: newFeatures,
		}));
	};

	const handleSubmit = async () => {
		setLoading(true);
		setError(null);
		try {
			await onSave(formData);
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al guardar el plan");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>
				<Box display="flex" alignItems="center" justifyContent="space-between">
					<Typography variant="h5">{plan ? "Editar Plan" : "Crear Nuevo Plan"}</Typography>
					<IconButton onClick={onClose} size="small">
						<CloseCircle />
					</IconButton>
				</Box>
			</DialogTitle>
			<DialogContent>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}
				<Grid container spacing={3} sx={{ mt: 1 }}>
					<Grid item xs={12} sm={6}>
						<TextField
							fullWidth
							label="ID del Plan"
							value={formData.planId}
							onChange={(e) => handleChange("planId", e.target.value)}
							disabled={!!plan}
							required
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<TextField
							fullWidth
							label="Nombre del Plan"
							value={formData.displayName}
							onChange={(e) => handleChange("displayName", e.target.value)}
							required
						/>
					</Grid>
					<Grid item xs={12}>
						<TextField
							fullWidth
							label="Descripción"
							value={formData.description}
							onChange={(e) => handleChange("description", e.target.value)}
							multiline
							rows={3}
							required
						/>
					</Grid>

					{/* Pricing Info */}
					<Grid item xs={12}>
						<Typography variant="h6" gutterBottom>
							Información de Precio
						</Typography>
					</Grid>
					<Grid item xs={12} sm={4}>
						<TextField
							fullWidth
							label="Precio Base"
							type="number"
							value={formData.pricingInfo?.basePrice}
							onChange={(e) => handlePricingChange("basePrice", Number(e.target.value))}
							required
						/>
					</Grid>
					<Grid item xs={12} sm={4}>
						<FormControl fullWidth>
							<InputLabel>Moneda</InputLabel>
							<Select
								value={formData.pricingInfo?.currency}
								onChange={(e) => handlePricingChange("currency", e.target.value)}
								label="Moneda"
							>
								<MenuItem value="COP">COP</MenuItem>
								<MenuItem value="USD">USD</MenuItem>
							</Select>
						</FormControl>
					</Grid>
					<Grid item xs={12} sm={4}>
						<FormControl fullWidth>
							<InputLabel>Período</InputLabel>
							<Select
								value={formData.pricingInfo?.billingPeriod}
								onChange={(e) => handlePricingChange("billingPeriod", e.target.value)}
								label="Período"
							>
								<MenuItem value="monthly">Mensual</MenuItem>
								<MenuItem value="yearly">Anual</MenuItem>
							</Select>
						</FormControl>
					</Grid>

					{/* Resource Limits */}
					<Grid item xs={12}>
						<Box display="flex" alignItems="center" justifyContent="space-between">
							<Typography variant="h6">Límites de Recursos</Typography>
							<Button startIcon={<Add />} onClick={addResourceLimit} size="small">
								Agregar
							</Button>
						</Box>
					</Grid>
					{formData.resourceLimits?.map((limit, index) => (
						<Grid item xs={12} key={index}>
							<Box display="flex" gap={2} alignItems="center">
								<TextField
									label="Nombre"
									value={limit.name}
									onChange={(e) => updateResourceLimit(index, "name", e.target.value)}
									size="small"
									style={{ flex: 1 }}
								/>
								<TextField
									label="Límite"
									type="number"
									value={limit.limit}
									onChange={(e) => updateResourceLimit(index, "limit", Number(e.target.value))}
									size="small"
									style={{ width: 100 }}
								/>
								<TextField
									label="Descripción"
									value={limit.description}
									onChange={(e) => updateResourceLimit(index, "description", e.target.value)}
									size="small"
									style={{ flex: 2 }}
								/>
								<IconButton onClick={() => removeResourceLimit(index)} size="small">
									<Trash size={20} />
								</IconButton>
							</Box>
						</Grid>
					))}

					{/* Features */}
					<Grid item xs={12}>
						<Box display="flex" alignItems="center" justifyContent="space-between">
							<Typography variant="h6">Características</Typography>
							<Button startIcon={<Add />} onClick={addFeature} size="small">
								Agregar
							</Button>
						</Box>
					</Grid>
					{formData.features?.map((feature, index) => (
						<Grid item xs={12} key={index}>
							<Box display="flex" gap={2} alignItems="center">
								<TextField
									label="Nombre"
									value={feature.name}
									onChange={(e) => updateFeature(index, "name", e.target.value)}
									size="small"
									style={{ flex: 1 }}
								/>
								<TextField
									label="Descripción"
									value={feature.description}
									onChange={(e) => updateFeature(index, "description", e.target.value)}
									size="small"
									style={{ flex: 2 }}
								/>
								<FormControlLabel
									control={<Switch checked={feature.enabled} onChange={(e) => updateFeature(index, "enabled", e.target.checked)} />}
									label="Habilitado"
								/>
								<IconButton onClick={() => removeFeature(index)} size="small">
									<Trash size={20} />
								</IconButton>
							</Box>
						</Grid>
					))}

					{/* Status */}
					<Grid item xs={12}>
						<Box display="flex" gap={3}>
							<FormControlLabel
								control={<Switch checked={formData.isActive} onChange={(e) => handleChange("isActive", e.target.checked)} />}
								label="Plan Activo"
							/>
							<FormControlLabel
								control={<Switch checked={formData.isDefault} onChange={(e) => handleChange("isDefault", e.target.checked)} />}
								label="Plan Default"
							/>
						</Box>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancelar</Button>
				<Button onClick={handleSubmit} variant="contained" disabled={loading}>
					{loading ? "Guardando..." : plan ? "Actualizar" : "Crear"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default PlanFormModal;
