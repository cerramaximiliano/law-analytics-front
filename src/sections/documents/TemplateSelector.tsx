import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	Box,
	Grid,
	Card,
	CardContent,
	CardActionArea,
	Typography,
	TextField,
	InputAdornment,
	Chip,
	Stack,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	CircularProgress,
	Alert,
} from "@mui/material";
import { SearchNormal1, DocumentText, Add } from "iconsax-react";
import { DocumentTemplate } from "types/documents";
import { RootState } from "store";
import { fetchTemplates } from "store/reducers/documents";

interface TemplateSelectorProps {
	onSelect: (template: DocumentTemplate | null) => void;
	showCreateBlank?: boolean;
}

function TemplateSelector({ onSelect, showCreateBlank = true }: TemplateSelectorProps) {
	const dispatch = useDispatch();
	const { templates, isLoading, error } = useSelector((state: RootState) => state.documents);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");

	// Cargar plantillas desde la API al montar el componente
	useEffect(() => {
		dispatch(fetchTemplates() as any);
	}, [dispatch]);

	// Get unique categories
	const categories = ["all", ...new Set(templates.map((t) => t.category))];

	// Filter templates
	const filteredTemplates = templates.filter((template) => {
		const matchesSearch =
			!searchTerm ||
			template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			template.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

		const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;

		return matchesSearch && matchesCategory;
	});

	const getCategoryLabel = (category: string) => {
		const labels: Record<string, string> = {
			all: "Todas",
			presentaciones: "Presentaciones",
			demandas: "Demandas",
			escritos: "Escritos",
			recursos: "Recursos",
			medidas_cautelares: "Medidas Cautelares",
			otros: "Otros",
			inicializacion: "Inicialización",
			contestaciones: "Contestaciones",
			contratos: "Contratos",
		};
		return labels[category] || category;
	};

	return (
		<Box>
			{/* Search and Filter Controls */}
			<Grid container spacing={2} sx={{ mb: 3 }}>
				<Grid item xs={12} md={8}>
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
				</Grid>
				<Grid item xs={12} md={4}>
					<FormControl fullWidth size="small">
						<InputLabel>Categoría</InputLabel>
						<Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} label="Categoría">
							{categories.map((cat) => (
								<MenuItem key={cat} value={cat}>
									{getCategoryLabel(cat)}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
			</Grid>

			{/* Loading State */}
			{isLoading && (
				<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
					<CircularProgress />
				</Box>
			)}

			{/* Error State */}
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{/* Template Grid */}
			{!isLoading && (
				<Grid container spacing={2}>
					{/* Blank Document Option */}
					{showCreateBlank && (
						<Grid item xs={12} sm={6} md={4}>
							<Card variant="outlined">
								<CardActionArea onClick={() => onSelect(null)}>
									<CardContent
										sx={{ height: 180, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
									>
										<Add size={48} color="#666" />
										<Typography variant="h6" sx={{ mt: 2 }}>
											Documento en Blanco
										</Typography>
										<Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
											Comenzar con un documento vacío
										</Typography>
									</CardContent>
								</CardActionArea>
							</Card>
						</Grid>
					)}

					{/* Template Cards */}
					{filteredTemplates.map((template) => (
						<Grid item xs={12} sm={6} md={4} key={template._id || template.id}>
							<Card variant="outlined" sx={{ height: "100%" }}>
								<CardActionArea onClick={() => onSelect(template)} sx={{ height: "100%" }}>
									<CardContent sx={{ height: 180, display: "flex", flexDirection: "column" }}>
										<Box sx={{ display: "flex", alignItems: "start", mb: 1 }}>
											<DocumentText size={24} color="#1976d2" />
											<Box sx={{ ml: 1, flex: 1 }}>
												<Typography variant="h6" gutterBottom>
													{template.name}
												</Typography>
												<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
													{template.description}
												</Typography>
											</Box>
										</Box>

										<Box sx={{ mt: "auto" }}>
											{template.tags && template.tags.length > 0 && (
												<Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
													{template.tags.slice(0, 3).map((tag, index) => (
														<Chip key={index} label={tag} size="small" />
													))}
													{template.tags.length > 3 && <Chip label={`+${template.tags.length - 3}`} size="small" />}
												</Stack>
											)}
										</Box>
									</CardContent>
								</CardActionArea>
							</Card>
						</Grid>
					))}
				</Grid>
			)}

			{!isLoading && filteredTemplates.length === 0 && (
				<Box sx={{ textAlign: "center", py: 4 }}>
					<Typography variant="h6" color="textSecondary">
						No se encontraron plantillas
					</Typography>
					<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
						Intente con otros términos de búsqueda o categoría
					</Typography>
				</Box>
			)}
		</Box>
	);
}

export default TemplateSelector;
