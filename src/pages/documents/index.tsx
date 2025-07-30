import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// material-ui
import {
	Box,
	Button,
	Grid,
	Stack,
	Tab,
	Tabs,
	Typography,
	TextField,
	InputAdornment,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
} from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import { RootState } from "store";
import { setDocuments, setTemplates, setSearchTerm, setStatusFilter, setTypeFilter } from "store/reducers/documents";
import { mockDocuments, mockTemplates } from "data/mockDocuments";

// components
import DocumentList from "sections/documents/DocumentList";
import TiptapCSSPagedEditor from "sections/documents/TiptapCSSPagedEditor";

// assets
import { Add, SearchNormal1, DocumentDownload } from "iconsax-react";

// types
import { DocumentStatus, DocumentType } from "types/documents";

function DocumentsLayout() {
	const dispatch = useDispatch();
	const { documents, filters } = useSelector((state: RootState) => state.documents);
	const searchTerm = filters.searchTerm || "";

	const [activeTab, setActiveTab] = useState(0);
	const [showEditor, setShowEditor] = useState(false);

	// Load mock data on mount
	useEffect(() => {
		dispatch(setDocuments(mockDocuments));
		dispatch(setTemplates(mockTemplates));
	}, [dispatch]);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	const handleNewDocument = () => {
		setShowEditor(true);
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		dispatch(setSearchTerm(event.target.value));
	};

	const handleStatusFilterChange = (event: any) => {
		dispatch(setStatusFilter(event.target.value === "" ? undefined : (event.target.value as DocumentStatus)));
	};

	const handleTypeFilterChange = (event: any) => {
		dispatch(setTypeFilter(event.target.value === "" ? undefined : (event.target.value as DocumentType)));
	};

	const handleExportAllPDF = async () => {
		try {
			if (filteredDocuments.length === 0) {
				alert("No hay documentos para exportar");
				return;
			}
			// TODO: Implement batch PDF export
			console.log("Exporting PDFs:", filteredDocuments);
		} catch (error) {
			console.error("Error exporting PDFs:", error);
			alert("Error al exportar los documentos");
		}
	};

	// Filter documents based on search and filters
	const filteredDocuments = documents.filter((doc) => {
		const matchesSearch =
			!searchTerm ||
			doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			doc.content.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = !filters.status || doc.status === filters.status;
		const matchesType = !filters.type || doc.type === filters.type;
		return matchesSearch && matchesStatus && matchesType;
	});

	return (
		<Grid container spacing={3}>
			<Grid item xs={12}>
				<MainCard title="Documentos Legales">
					<Stack spacing={3}>
						{/* Filters and Actions */}
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} md={4}>
								<TextField
									fullWidth
									placeholder="Buscar documentos..."
									value={searchTerm}
									onChange={handleSearchChange}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<SearchNormal1 size={18} />
											</InputAdornment>
										),
									}}
								/>
							</Grid>
							<Grid item xs={12} sm={6} md={2}>
								<FormControl fullWidth size="small">
									<InputLabel>Estado</InputLabel>
									<Select value={filters.status || ""} onChange={handleStatusFilterChange} label="Estado">
										<MenuItem value="">Todos</MenuItem>
										<MenuItem value="draft">Borrador</MenuItem>
										<MenuItem value="final">Final</MenuItem>
										<MenuItem value="archived">Archivado</MenuItem>
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6} md={2}>
								<FormControl fullWidth size="small">
									<InputLabel>Tipo</InputLabel>
									<Select value={filters.type || ""} onChange={handleTypeFilterChange} label="Tipo">
										<MenuItem value="">Todos</MenuItem>
										<MenuItem value="demanda">Demanda</MenuItem>
										<MenuItem value="escrito">Escrito</MenuItem>
										<MenuItem value="contestacion">Contestación</MenuItem>
										<MenuItem value="notificacion">Notificación</MenuItem>
										<MenuItem value="contrato">Contrato</MenuItem>
										<MenuItem value="poder">Poder</MenuItem>
										<MenuItem value="recurso">Recurso</MenuItem>
										<MenuItem value="otros">Otros</MenuItem>
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>
								<Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
									{filteredDocuments.length > 0 && (
										<Button variant="outlined" startIcon={<DocumentDownload />} onClick={handleExportAllPDF} size="medium">
											Exportar Todo
										</Button>
									)}
									<Button variant="contained" startIcon={<Add />} onClick={handleNewDocument}>
										Nuevo Documento
									</Button>
								</Stack>
							</Grid>
						</Grid>

						{/* Tabs */}
						<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
							<Tabs value={activeTab} onChange={handleTabChange}>
								<Tab label="Mis Documentos" />
								<Tab label="Plantillas" />
								<Tab label="Editor" />
							</Tabs>
						</Box>

						{/* Content */}
						{activeTab === 0 && <DocumentList documents={filteredDocuments} onEdit={() => setShowEditor(true)} />}

						{activeTab === 1 && <Typography color="textSecondary">Las plantillas estarán disponibles próximamente</Typography>}

						{activeTab === 2 && !showEditor && (
							<Box sx={{ textAlign: "center", py: 4 }}>
								<Typography variant="h6" gutterBottom>
									Editor de Documentos Legales
								</Typography>
								<Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
									Cree y edite documentos con formato profesional
								</Typography>
								<Button variant="contained" startIcon={<Add />} onClick={() => setShowEditor(true)}>
									Crear Nuevo Documento
								</Button>
							</Box>
						)}

						{showEditor && <TiptapCSSPagedEditor onClose={() => setShowEditor(false)} />}
					</Stack>
				</MainCard>
			</Grid>
		</Grid>
	);
}

export default DocumentsLayout;
