import { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Card,
	CardActionArea,
	CardContent,
	Typography,
	Box,
	Grid,
	Chip,
	TextField,
	InputAdornment,
	IconButton,
	Tooltip,
} from "@mui/material";
import { DocumentText, SearchNormal1, Add, Eye } from "iconsax-react";

export interface DocumentTemplate {
	id: string;
	name: string;
	description: string;
	category: string;
	content?: string;
	preview?: string;
	tags?: string[];
	isDefault?: boolean;
}

interface TemplateSelectionDialogProps {
	open: boolean;
	onSelect: (template: DocumentTemplate | null) => void;
	onCancel: () => void;
	templates?: DocumentTemplate[];
}

// Mock templates for now - will come from backend later
const defaultTemplates: DocumentTemplate[] = [
	{
		id: "blank",
		name: "Documento en Blanco",
		description: "Comience con un documento vacío",
		category: "general",
		content: "",
		isDefault: true,
	},
	{
		id: "escrito_presentacion",
		name: "Escrito de Presentación",
		description: "Presentación como patrocinante o apoderado en juicio",
		category: "escritos",
		preview: "Sr. Juez: [NOMBRE], DNI [DOCUMENTO], por derecho propio...",
		tags: ["presentación", "patrocinio", "apoderamiento"],
	},
	{
		id: "demanda_laboral",
		name: "Demanda Laboral",
		description: "Plantilla para iniciar demanda por despido o reclamos laborales",
		category: "demandas",
		preview: "PROMUEVE DEMANDA POR DESPIDO...",
		tags: ["laboral", "despido", "indemnización"],
	},
	{
		id: "contestacion_demanda",
		name: "Contestación de Demanda",
		description: "Responder a una demanda iniciada en su contra",
		category: "escritos",
		preview: "CONTESTA DEMANDA - OPONE EXCEPCIONES...",
		tags: ["contestación", "excepciones", "defensa"],
	},
	{
		id: "recurso_apelacion",
		name: "Recurso de Apelación",
		description: "Apelar una resolución judicial desfavorable",
		category: "recursos",
		preview: "INTERPONE RECURSO DE APELACIÓN...",
		tags: ["apelación", "recurso", "agravios"],
	},
	{
		id: "solicitud_medida_cautelar",
		name: "Solicitud de Medida Cautelar",
		description: "Solicitar embargo preventivo, prohibición de innovar, etc.",
		category: "escritos",
		preview: "SOLICITA MEDIDA CAUTELAR...",
		tags: ["cautelar", "embargo", "urgente"],
	},
];

function TemplateSelectionDialog({ open, onSelect, onCancel, templates = defaultTemplates }: TemplateSelectionDialogProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
	const [showPreview, setShowPreview] = useState(false);

	// Get unique categories
	const categories = Array.from(new Set(templates.map((t) => t.category)));

	// Filter templates based on search and category
	const filteredTemplates = templates.filter((template) => {
		const matchesSearch =
			!searchTerm ||
			template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			template.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

		const matchesCategory = !selectedCategory || template.category === selectedCategory;

		return matchesSearch && matchesCategory;
	});

	const handleSelectTemplate = (template: DocumentTemplate) => {
		setSelectedTemplate(template);
		if (template.preview) {
			setShowPreview(true);
		} else {
			onSelect(template.id === "blank" ? null : template);
		}
	};

	const handleConfirmSelection = () => {
		if (selectedTemplate) {
			onSelect(selectedTemplate.id === "blank" ? null : selectedTemplate);
		}
	};

	const getCategoryLabel = (category: string) => {
		const labels: Record<string, string> = {
			general: "General",
			escritos: "Escritos",
			demandas: "Demandas",
			recursos: "Recursos",
			contratos: "Contratos",
		};
		return labels[category] || category;
	};

	return (
		<>
			<Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
				<DialogTitle>
					<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<DocumentText size={24} />
							<Typography variant="h5">Seleccionar Plantilla</Typography>
						</Box>
						<Tooltip title="Crear sin plantilla">
							<IconButton onClick={() => onSelect(null)} color="primary">
								<Add />
							</IconButton>
						</Tooltip>
					</Box>
				</DialogTitle>
				<DialogContent dividers>
					<Box sx={{ mb: 3 }}>
						<TextField
							fullWidth
							placeholder="Buscar plantillas..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchNormal1 size={18} />
									</InputAdornment>
								),
							}}
							size="small"
						/>
					</Box>

					<Box sx={{ mb: 2 }}>
						<Chip
							label="Todas"
							onClick={() => setSelectedCategory(null)}
							color={!selectedCategory ? "primary" : "default"}
							sx={{ mr: 1 }}
						/>
						{categories.map((category) => (
							<Chip
								key={category}
								label={getCategoryLabel(category)}
								onClick={() => setSelectedCategory(category)}
								color={selectedCategory === category ? "primary" : "default"}
								sx={{ mr: 1, mb: 1 }}
							/>
						))}
					</Box>

					<Grid container spacing={2}>
						{filteredTemplates.map((template) => (
							<Grid item xs={12} sm={6} key={template.id}>
								<Card
									sx={{
										height: "100%",
										cursor: "pointer",
										"&:hover": {
											boxShadow: 3,
										},
										...(template.isDefault && {
											border: "2px dashed",
											borderColor: "divider",
										}),
									}}
								>
									<CardActionArea onClick={() => handleSelectTemplate(template)} sx={{ height: "100%" }}>
										<CardContent>
											<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
												<Typography variant="h6" component="div">
													{template.name}
												</Typography>
												{template.preview && (
													<Tooltip title="Vista previa">
														<Eye size={18} />
													</Tooltip>
												)}
											</Box>
											<Typography variant="body2" color="text.secondary" gutterBottom>
												{template.description}
											</Typography>
											{template.tags && (
												<Box sx={{ mt: 1 }}>
													{template.tags.map((tag) => (
														<Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
													))}
												</Box>
											)}
										</CardContent>
									</CardActionArea>
								</Card>
							</Grid>
						))}
					</Grid>

					{filteredTemplates.length === 0 && (
						<Box sx={{ textAlign: "center", py: 4 }}>
							<Typography color="textSecondary">No se encontraron plantillas que coincidan con la búsqueda</Typography>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={onCancel} color="secondary">
						Cancelar
					</Button>
				</DialogActions>
			</Dialog>

			{/* Preview Dialog */}
			<Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Vista Previa: {selectedTemplate?.name}</DialogTitle>
				<DialogContent dividers>
					<Typography
						variant="body2"
						sx={{
							whiteSpace: "pre-wrap",
							fontFamily: "'Times New Roman', Times, serif",
							fontSize: "12pt",
							lineHeight: 1.8,
						}}
					>
						{selectedTemplate?.preview || "Sin vista previa disponible"}
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowPreview(false)} color="secondary">
						Volver
					</Button>
					<Button onClick={handleConfirmSelection} variant="contained">
						Usar esta plantilla
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default TemplateSelectionDialog;
