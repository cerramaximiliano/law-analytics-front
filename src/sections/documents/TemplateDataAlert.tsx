import { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Alert,
	AlertTitle,
	Box,
	Typography,
	List,
	ListItem,
	ListItemIcon,
	Skeleton,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
} from "@mui/material";
import { Warning2, UserSquare, Folder2, Briefcase, InfoCircle } from "iconsax-react";

interface MissingDataInfo {
	variable: string;
	label: string;
	type: "contact" | "folder" | "user" | "other";
	required: boolean;
	description?: string;
}

interface TemplateDataAlertProps {
	open: boolean;
	templateName: string;
	missingData: MissingDataInfo[];
	currentFolder?: { folderName: string; _id: string };
	isFolderLoading?: boolean;
	user?: any;
	currentSkillId?: string;
	onContinue: () => void;
	onCancel: () => void;
	onConfigure?: (dataType: string) => void;
	onSelectFolder?: () => void;
	onSkillChange?: (skillId: string) => void;
}

function TemplateDataAlert({
	open,
	templateName,
	missingData,
	currentFolder,
	isFolderLoading = false,
	user,
	currentSkillId,
	onContinue,
	onCancel,
	onConfigure,
	onSelectFolder,
	onSkillChange,
}: TemplateDataAlertProps) {
	const [showDetails, setShowDetails] = useState(false);
	const [selectedSkillId, setSelectedSkillId] = useState(currentSkillId || "");

	const getIcon = (type: string) => {
		switch (type) {
			case "contact":
				return <UserSquare size={20} />;
			case "folder":
				return <Folder2 size={20} />;
			case "user":
				return <Briefcase size={20} />;
			default:
				return <InfoCircle size={20} />;
		}
	};

	const getGroupLabel = (type: string) => {
		switch (type) {
			case "contact":
				return "Datos del Cliente";
			case "folder":
				return "Datos de la Carpeta";
			case "user":
				return "Datos Profesionales (Matrícula)";
			default:
				return "Otros Datos";
		}
	};

	const getActionLabel = (type: string, hasCurrentData: boolean = false) => {
		switch (type) {
			case "contact":
				return hasCurrentData ? "Editar Contacto" : "Seleccionar Contacto";
			case "folder":
				return hasCurrentData ? "Editar Carpeta" : "Seleccionar Carpeta";
			case "user":
				return "Ver Perfil";
			default:
				return "Configurar";
		}
	};

	// Group missing data by type
	const groupedData = missingData.reduce((acc, item) => {
		if (!acc[item.type]) {
			acc[item.type] = {
				type: item.type,
				items: [],
				hasRequired: false,
			};
		}
		acc[item.type].items.push(item);
		if (item.required) {
			acc[item.type].hasRequired = true;
		}
		return acc;
	}, {} as Record<string, { type: string; items: MissingDataInfo[]; hasRequired: boolean }>);

	const requiredGroups = Object.values(groupedData).filter((group) => group.hasRequired);
	const optionalGroups = Object.values(groupedData).filter((group) => !group.hasRequired);

	// Check if folder data is missing
	const isFolderMissing = missingData.some((item) => item.type === "folder");

	return (
		<Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth disableRestoreFocus>
			<DialogTitle>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Warning2 size={24} color="#ff9800" />
					<Typography variant="h5">Datos Faltantes para la Plantilla</Typography>
				</Box>
			</DialogTitle>
			<DialogContent dividers>
				{/* Show current folder or folder selection option */}
				{isFolderLoading ? (
					<Alert severity="info" sx={{ mb: 2 }}>
						<Box>
							<AlertTitle>
								<Skeleton variant="text" width={250} />
							</AlertTitle>
							<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 1 }}>
								<Skeleton variant="text" width={350} />
								{onSelectFolder && (
									<Button variant="outlined" size="small" startIcon={<Folder2 size={16} />} disabled sx={{ ml: 2 }}>
										Cambiar Carpeta
									</Button>
								)}
							</Box>
						</Box>
					</Alert>
				) : currentFolder ? (
					<Alert severity="info" sx={{ mb: 2 }}>
						<Box>
							<AlertTitle
								sx={{
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
									pr: 2,
								}}
							>
								Carpeta actual: {currentFolder.folderName}
							</AlertTitle>
							<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 1 }}>
								<Typography variant="body2">Los datos de la carpeta están disponibles para la plantilla.</Typography>
								{onSelectFolder && (
									<Button variant="outlined" size="small" startIcon={<Folder2 size={16} />} onClick={onSelectFolder} sx={{ ml: 2 }}>
										Cambiar Carpeta
									</Button>
								)}
							</Box>
						</Box>
					</Alert>
				) : (
					<Alert severity="warning" sx={{ mb: 2 }}>
						<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
							<Box sx={{ flex: 1 }}>
								<AlertTitle>No hay carpeta seleccionada</AlertTitle>
								{isFolderMissing ? (
									<Typography variant="body2" sx={{ mt: 1 }}>
										Esta plantilla requiere datos de una carpeta. Seleccione una carpeta para autocompletar los campos.
									</Typography>
								) : (
									<Typography variant="body2" sx={{ mt: 1 }}>
										Puede continuar sin carpeta, pero algunos campos no se completarán automáticamente.
									</Typography>
								)}
							</Box>
							{onSelectFolder && isFolderMissing && (
								<Button variant="contained" size="small" startIcon={<Folder2 size={16} />} onClick={onSelectFolder} sx={{ ml: 2, mt: 0.5 }}>
									Seleccionar Carpeta
								</Button>
							)}
						</Box>
					</Alert>
				)}

				{/* Matrícula selector for users with multiple skills */}
				{user && Array.isArray(user.skill) && user.skill.length > 1 && (
					<Alert severity="info" sx={{ mb: 2 }}>
						<Box>
							<AlertTitle>Matrícula Profesional</AlertTitle>
							<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
								<FormControl size="small" sx={{ minWidth: 200 }}>
									<InputLabel id="skill-select-label">Seleccionar Matrícula</InputLabel>
									<Select
										labelId="skill-select-label"
										value={selectedSkillId}
										onChange={(e) => {
											setSelectedSkillId(e.target.value);
											if (onSkillChange) {
												onSkillChange(e.target.value);
											}
										}}
										label="Seleccionar Matrícula"
									>
										{user.skill.map((skill: any) => (
											<MenuItem key={skill._id} value={skill._id}>
												{skill.name} - {skill.registrationNumber}
											</MenuItem>
										))}
									</Select>
								</FormControl>
								<Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
									Seleccione la matrícula que desea usar en el documento
								</Typography>
							</Box>
						</Box>
					</Alert>
				)}

				{/* No skill warning */}
				{user && (!user.skill || (Array.isArray(user.skill) && user.skill.length === 0)) && (
					<Alert severity="warning" sx={{ mb: 2 }}>
						<Box>
							<AlertTitle>No tiene matrículas configuradas</AlertTitle>
							<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
								<Typography variant="body2">
									Debe configurar al menos una matrícula profesional para poder crear documentos legales.
								</Typography>
								<Button
									variant="contained"
									size="small"
									onClick={() => {
										window.open("/apps/profiles/user/professional", "_blank");
									}}
									sx={{ ml: 2 }}
								>
									Configurar Matrícula
								</Button>
							</Box>
						</Box>
					</Alert>
				)}

				<Alert severity="warning" sx={{ mb: 2 }}>
					<AlertTitle>La plantilla "{templateName}" requiere datos que no están disponibles</AlertTitle>
					{currentFolder && isFolderMissing ? (
						<Typography variant="body2">
							Algunos datos de la carpeta "{currentFolder.folderName}" están incompletos. Puede editar la carpeta para agregar los datos
							faltantes o continuar con marcadores de posición.
						</Typography>
					) : (
						<Typography variant="body2">
							Algunos campos se completarán con marcadores de posición que deberá reemplazar manualmente.
						</Typography>
					)}
				</Alert>

				{requiredGroups.length > 0 && (
					<Box sx={{ mb: 3 }}>
						<Typography variant="subtitle1" fontWeight="medium" gutterBottom>
							Datos Requeridos Faltantes:
						</Typography>
						<List>
							{requiredGroups.map((group) => (
								<ListItem key={group.type} sx={{ flexDirection: "column", alignItems: "flex-start", gap: 1, py: 2 }}>
									<Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
										<ListItemIcon sx={{ minWidth: "auto" }}>{getIcon(group.type)}</ListItemIcon>
										<Box sx={{ flex: 1 }}>
											<Typography variant="subtitle2" fontWeight="medium">
												{getGroupLabel(group.type)}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{group.items.length === 1 ? group.items[0].label : `${group.items.length} campos faltantes`}
											</Typography>
										</Box>
										{group.type === "folder" ? (
											currentFolder ? (
												<Button
													size="small"
													onClick={() => {
														// TODO: Implement folder edit functionality
														alert(`Por favor, edite la carpeta "${currentFolder.folderName}" para agregar los datos faltantes`);
													}}
													variant="contained"
													color="primary"
												>
													{getActionLabel(group.type, true)}
												</Button>
											) : (
												onSelectFolder && (
													<Button size="small" onClick={onSelectFolder} variant="contained" color="primary">
														{getActionLabel(group.type, false)}
													</Button>
												)
											)
										) : group.type === "contact" && onConfigure ? (
											<Button size="small" onClick={() => onConfigure(group.type)} variant="contained" color="primary">
												{getActionLabel(group.type)}
											</Button>
										) : group.type === "user" ? (
											<Button
												size="small"
												onClick={() => window.open("/apps/profiles/user/professional", "_blank")}
												variant="contained"
												color="info"
											>
												Configurar Matrícula
											</Button>
										) : null}
									</Box>
									{/* Show individual items if more than one */}
									{group.items.length > 1 && (
										<Box sx={{ pl: 5, width: "100%" }}>
											{group.items.map((item, idx) => (
												<Typography key={idx} variant="caption" color="text.secondary" display="block">
													• {item.label}
												</Typography>
											))}
										</Box>
									)}
								</ListItem>
							))}
						</List>
					</Box>
				)}

				{optionalGroups.length > 0 && (
					<Box>
						<Button size="small" onClick={() => setShowDetails(!showDetails)} sx={{ mb: 1 }}>
							{showDetails ? "Ocultar" : "Mostrar"} datos opcionales
						</Button>
						{showDetails && (
							<List>
								{optionalGroups.map((group) => (
									<ListItem key={group.type} sx={{ flexDirection: "column", alignItems: "flex-start", gap: 1, py: 1 }}>
										<Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
											<ListItemIcon sx={{ minWidth: "auto" }}>{getIcon(group.type)}</ListItemIcon>
											<Box sx={{ flex: 1 }}>
												<Typography variant="body2">{getGroupLabel(group.type)}</Typography>
												<Typography variant="caption" color="text.secondary">
													{group.items.map((item) => item.label).join(", ")}
												</Typography>
											</Box>
										</Box>
									</ListItem>
								))}
							</List>
						)}
					</Box>
				)}

				<Alert severity="info" sx={{ mt: 2 }}>
					<Typography variant="body2">
						Los campos faltantes aparecerán como <strong>[CAMPO EN MAYÚSCULAS]</strong> en el documento para que pueda identificarlos y
						completarlos fácilmente.
					</Typography>
				</Alert>
			</DialogContent>
			<DialogActions>
				<Button onClick={onCancel} color="secondary">
					Cancelar
				</Button>
				<Button
					onClick={onContinue}
					variant="contained"
					sx={{
						backgroundColor: "#ff9800",
						color: "#000",
						"&:hover": {
							backgroundColor: "#f57c00",
							color: "#000",
						},
					}}
				>
					Continuar con Datos Faltantes
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default TemplateDataAlert;
