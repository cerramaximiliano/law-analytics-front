import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";

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
import ContactSelectionDialog from "sections/documents/ContactSelectionDialog";

// assets
import { Add, SearchNormal1, DocumentDownload } from "iconsax-react";

// actions
import { getFolderById } from "store/reducers/folder";
import { setCurrentDocument } from "store/reducers/documents";
import { getContactsByUserId, filterContactsByFolder } from "store/reducers/contacts";

// types
import { DocumentStatus, DocumentType } from "types/documents";

function DocumentsLayout() {
	const dispatch = useDispatch();
	const location = useLocation();
	const { documents, filters } = useSelector((state: RootState) => state.documents);
	const searchTerm = filters.searchTerm || "";
	const { user } = useSelector((state: RootState) => state.auth);
	const { selectedContacts } = useSelector((state: RootState) => state.contacts);

	// Get folderId from query params
	const queryParams = new URLSearchParams(location.search);
	const folderId = queryParams.get("folderId");

	const [activeTab, setActiveTab] = useState(0);
	const [showEditor, setShowEditor] = useState(false);
	const [folderData, setFolderData] = useState<any>(null);
	const [showContactDialog, setShowContactDialog] = useState(false);
	const [pendingDocumentData, setPendingDocumentData] = useState<any>(null);
	
	
	// Function to create document with selected contact
	const createDocumentWithContact = useCallback((folder: any, contact: any, user: any, folderId: string) => {
		let templateContent: string;
		
		if (contact) {
			// Template with contact data
			templateContent = `Sr. Juez: 
{{contact.name}} {{contact.lastName}}, DNI {{contact.document}}, por derecho propio, con domicilio en {{contact.address}}, {{contact.city}}, {{contact.state}}, conjuntamente con mi letrado patrocinante Dr. {{user.firstName}} {{user.lastName}}, {{user.skill.registrationNumber}} - {{user.skill.name}}, con domicilio electrónico {{user.skill.electronicAddress}}, condición tributaria {{user.skill.taxCondition}}, CUIT {{user.skill.taxCode}}, en autos "{{folder.folderName}} s/ {{folder.materia}}", EXPTE. {{folder.judFolder.numberJudFolder}}, a V.S. decimos:`;
		} else {
			// Template without contact data - leave placeholders for manual completion
			templateContent = `Sr. Juez: 
[NOMBRE Y APELLIDO DEL CLIENTE], DNI [NÚMERO DE DOCUMENTO], por derecho propio, con domicilio en [DIRECCIÓN], [CIUDAD], [PROVINCIA], conjuntamente con mi letrado patrocinante Dr. {{user.firstName}} {{user.lastName}}, {{user.skill.registrationNumber}} - {{user.skill.name}}, con domicilio electrónico {{user.skill.electronicAddress}}, condición tributaria {{user.skill.taxCondition}}, CUIT {{user.skill.taxCode}}, en autos "{{folder.folderName}} s/ {{folder.materia}}", EXPTE. {{folder.judFolder.numberJudFolder}}, a V.S. decimos:`;
		}

		dispatch(
			setCurrentDocument({
				id: `doc_${Date.now()}`,
				title: `Escrito - ${folder.folderName}`,
				type: "escrito",
				status: "draft",
				content: `<p>${templateContent}</p>`,
				folderId: folderId,
				version: 1,
				tags: [],
				metadata: {
					folderData: folder,
					user: user,
					contact: contact,
					templateVariables: true,
				},
			} as any),
		);
		
		// Switch to editor tab and show editor
		setActiveTab(2);
		setShowEditor(true);
	}, [dispatch]);

	// Load mock data on mount
	useEffect(() => {
		dispatch(setDocuments(mockDocuments));
		dispatch(setTemplates(mockTemplates));
	}, [dispatch]);

	// Watch for selectedContacts changes
	const [waitingForContacts, setWaitingForContacts] = useState(false);
	
	// Handle folder-based document creation
	useEffect(() => {
		const handleFolderDocument = async () => {
			if (!folderId || !user?._id) {
				return;
			}

			try {
				// Fetch folder data and contacts
				const [folderResult, _contactsResult] = await Promise.all([
					dispatch(getFolderById(folderId) as any),
					dispatch(getContactsByUserId(user._id) as any)
				]);

				if (folderResult?.success && folderResult?.folder) {
					// Filter contacts by folder
					await dispatch(filterContactsByFolder(folderId) as any);

					setFolderData(folderResult.folder);
					// Wait a bit more for contacts to be properly filtered
					setTimeout(() => {
						setWaitingForContacts(true);
					}, 1000);
				}
			} catch (error) {
				console.error('Error loading folder document:', error);
			}
		};

		handleFolderDocument();
	}, [folderId, user, dispatch]);
	
	// Watch for contacts to be loaded and process document creation
	useEffect(() => {
		if (waitingForContacts && folderData && user) {
			// Check if there's a Cliente contact
			const clienteContact = selectedContacts.find((c) => c.role === "Cliente");
			
			if (clienteContact) {
				// Use the Cliente contact directly
				createDocumentWithContact(folderData, clienteContact, user, folderId!);
				setWaitingForContacts(false);
			} else if (selectedContacts.length > 0) {
				// Show contact selection dialog
				setPendingDocumentData({
					folder: folderData,
					user: user,
					folderId: folderId
				});
				setShowContactDialog(true);
				setWaitingForContacts(false);
			} else {
				// No contacts, create document without contact data
				createDocumentWithContact(folderData, null, user, folderId!);
				setWaitingForContacts(false);
			}
		}
	}, [waitingForContacts, folderData, user, selectedContacts, folderId, createDocumentWithContact]);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
		// Reset editor state when changing tabs
		if (newValue !== 2) {
			setShowEditor(false);
			setFolderData(null);
		}
	};

	const handleNewDocument = () => {
		setActiveTab(2);
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
						{activeTab === 0 && <DocumentList documents={filteredDocuments} onEdit={() => {
							setActiveTab(2);
							setShowEditor(true);
						}} />}

						{activeTab === 1 && <Typography color="textSecondary">Las plantillas estarán disponibles próximamente</Typography>}

						{activeTab === 2 && (
							showEditor ? (
								<TiptapCSSPagedEditor 
									onClose={() => {
										setShowEditor(false);
										setFolderData(null);
										// Clear the URL parameter when closing editor
										const searchParams = new URLSearchParams(location.search);
										searchParams.delete('folderId');
										const newUrl = searchParams.toString() ? `${location.pathname}?${searchParams.toString()}` : location.pathname;
										window.history.replaceState({}, '', newUrl);
									}} 
									folderData={folderData} 
									selectedContacts={selectedContacts} 
								/>
							) : (
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
							)
						)}
					</Stack>
				</MainCard>
			</Grid>
			
			{/* Contact Selection Dialog */}
			<ContactSelectionDialog
				open={showContactDialog}
				contacts={selectedContacts}
				onSelect={(contact) => {
					setShowContactDialog(false);
					if (pendingDocumentData) {
						createDocumentWithContact(
							pendingDocumentData.folder,
							contact,
							pendingDocumentData.user,
							pendingDocumentData.folderId
						);
						setPendingDocumentData(null);
					}
				}}
				onCancel={() => {
					setShowContactDialog(false);
					setPendingDocumentData(null);
				}}
			/>
		</Grid>
	);
}

export default DocumentsLayout;
