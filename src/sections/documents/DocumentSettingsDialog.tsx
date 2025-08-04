import { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Typography,
	Box,
	Alert,
	FormHelperText,
} from "@mui/material";
import { Setting2 } from "iconsax-react";

interface Skill {
	_id?: string;
	name: string;
	registrationNumber: string;
	taxCondition: string;
	taxCode: string;
	electronicAddress: string;
}

interface DocumentSettingsDialogProps {
	open: boolean;
	user: any;
	folderName: string;
	onConfirm: (settings: { preferredSkillId: string }) => void;
	onCancel: () => void;
}

function DocumentSettingsDialog({ open, user, folderName, onConfirm, onCancel }: DocumentSettingsDialogProps) {
	// Get skills array from user
	const skills = user?.skill || [];
	const hasMultipleSkills = Array.isArray(skills) && skills.length > 1;

	// Initialize with first skill if only one exists
	const [selectedSkillId, setSelectedSkillId] = useState<string>(() => {
		if (skills.length === 1 && skills[0]._id) {
			return skills[0]._id;
		}
		return "";
	});

	const handleConfirm = () => {
		if (selectedSkillId || skills.length === 1) {
			onConfirm({
				preferredSkillId: selectedSkillId || skills[0]._id || "0",
			});
		}
	};

	return (
		<Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth disableRestoreFocus>
			<DialogTitle>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Setting2 size={24} />
					<Typography variant="h5">Configuración del Documento</Typography>
				</Box>
			</DialogTitle>
			<DialogContent dividers>
				<Box sx={{ py: 2 }}>
					<Alert severity="info" sx={{ mb: 3 }}>
						Esta configuración se guardará para futuros documentos de la carpeta: <strong>{folderName}</strong>
					</Alert>

					{hasMultipleSkills ? (
						<FormControl fullWidth>
							<InputLabel>Matrícula Profesional</InputLabel>
							<Select value={selectedSkillId} onChange={(e) => setSelectedSkillId(e.target.value)} label="Matrícula Profesional">
								{skills.map((skill: Skill, index: number) => (
									<MenuItem key={skill._id || index} value={skill._id || index.toString()}>
										<Box>
											<Typography variant="body1">
												{skill.registrationNumber} - {skill.name}
											</Typography>
											<Typography variant="caption" color="textSecondary">
												{skill.taxCondition} - CUIT: {skill.taxCode}
											</Typography>
										</Box>
									</MenuItem>
								))}
							</Select>
							<FormHelperText>Seleccione qué matrícula usar para los documentos de esta carpeta</FormHelperText>
						</FormControl>
					) : skills.length === 1 ? (
						<Box>
							<Typography variant="body2" color="textSecondary" gutterBottom>
								Matrícula Profesional:
							</Typography>
							<Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
								<Typography variant="body1">
									{skills[0].registrationNumber} - {skills[0].name}
								</Typography>
								<Typography variant="caption" color="textSecondary">
									{skills[0].taxCondition} - CUIT: {skills[0].taxCode}
								</Typography>
							</Box>
						</Box>
					) : (
						<Alert severity="warning">No se encontraron matrículas profesionales configuradas</Alert>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onCancel} color="secondary">
					Cancelar
				</Button>
				<Button onClick={handleConfirm} variant="contained" disabled={hasMultipleSkills && !selectedSkillId}>
					Confirmar y Continuar
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default DocumentSettingsDialog;
