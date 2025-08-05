import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { useSnackbar } from "notistack";

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
	Alert,
	AlertTitle,
	Snackbar,
	Skeleton,
	CircularProgress,
} from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import { RootState } from "store";
import { setSearchTerm, setStatusFilter, setTypeFilter, fetchDocuments, fetchTemplates, createDocument } from "store/reducers/documents";

// components
import DocumentList from "sections/documents/DocumentList";
import TiptapCSSPagedEditor from "sections/documents/TiptapCSSPagedEditor";
import ContactSelectionDialog from "sections/documents/ContactSelectionDialog";
import DocumentSettingsDialog from "sections/documents/DocumentSettingsDialog";
import TemplateDataAlert from "sections/documents/TemplateDataAlert";
import FolderSelectionDialog from "sections/documents/FolderSelectionDialog";
import TemplateSelector from "sections/documents/TemplateSelector";

// assets
import { Add, SearchNormal1, DocumentDownload, Folder2 } from "iconsax-react";

// actions
import { getFolderById } from "store/reducers/folder";
import { setCurrentDocument } from "store/reducers/documents";
import { getContactsByUserId, filterContactsByFolder } from "store/reducers/contacts";

// types
import { DocumentStatus, DocumentType } from "types/documents";

// data
import { getTemplateById } from "data/documentTemplates";

// utils
import { validateTemplateData } from "utils/templateValidation";

function DocumentsLayout() {
	const dispatch = useDispatch();
	const location = useLocation();
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { documents, filters, templates } = useSelector((state: RootState) => state.documents);
	const searchTerm = filters.searchTerm || "";
	const { user } = useSelector((state: RootState) => state.auth);
	const { selectedContacts } = useSelector((state: RootState) => state.contacts);

	// Get folderId from query params - reactive to URL changes
	const folderId = useMemo(() => new URLSearchParams(location.search).get("folderId"), [location.search]);

	const [activeTab, setActiveTab] = useState(0);
	const [showEditor, setShowEditor] = useState(false);
	const [folderData, setFolderData] = useState<any>(null);
	const [showContactDialog, setShowContactDialog] = useState(false);
	const [pendingDocumentData, setPendingDocumentData] = useState<any>(null);
	const [showSettingsDialog, setShowSettingsDialog] = useState(false);
	const [documentSettings, setDocumentSettings] = useState<any>(null);
	const [showDataAlert, setShowDataAlert] = useState(false);
	const [dataAlertInfo, setDataAlertInfo] = useState<any>(null);
	const [showFolderDialog, setShowFolderDialog] = useState(false);
	const [infoMessage, setInfoMessage] = useState<{ open: boolean; message: string; severity: "info" | "warning" | "error" }>({
		open: false,
		message: "",
		severity: "info",
	});
	const [isFolderLoading, setIsFolderLoading] = useState(false);
	const [isCreatingDocument, setIsCreatingDocument] = useState(false);

	// Function to create document with selected contact
	const createDocumentWithContact = useCallback(
		(folder: any, contact: any, user: any, folderId: string, settings?: any, templateId?: string) => {
			// Prepare user data with selected skill
			let processedUser = { ...user };
			if (settings?.preferredSkillId && Array.isArray(user.skill)) {
				const selectedSkill = user.skill.find((s: any) => s._id === settings.preferredSkillId) || user.skill[0];
				processedUser = { ...user, skill: [selectedSkill] };
			}

			let templateContent: string;
			let documentType: DocumentType = "escrito";
			let documentTitle = folder ? `Escrito - ${folder.folderName}` : "Nuevo Documento";

			// Check if a specific template was selected
			if (templateId) {
				const template = getTemplateById(templateId);
				if (template) {
					// Replace literal \n with actual line breaks and unescape quotes
					templateContent = template.content.replace(/\\n/g, "\n").replace(/\\"/g, '"');
					// Set document type based on template category
					if (template.category === "laboral") documentType = "demanda";
					else if (template.category === "penal" || template.category === "civil") documentType = "recurso";
					else documentType = "escrito";

					documentTitle = template.name;
				} else {
					templateContent = "";
				}
			} else if (folder) {
				// Try to find "Presentación como Patrocinante" template from database
				const defaultTemplate = templates.find((t) => t.name === "Presentación como Patrocinante" && t.isGeneral === true);

				if (defaultTemplate) {
					// Use template from database
					// Replace literal \n with actual line breaks and unescape quotes
					templateContent = defaultTemplate.content.replace(/\\n/g, "\n").replace(/\\"/g, '"');
					templateId = defaultTemplate._id || defaultTemplate.id;
					documentTitle = `${defaultTemplate.name} - ${folder.folderName}`;
				} else {
					// Fallback to hardcoded template only if database template not found
					if (contact) {
						// Template with contact data
						templateContent = `<p>Sr. Juez:</p>
<p>{{contact.name}} {{contact.lastName}}, DNI {{contact.document}}, por derecho propio, con domicilio en {{contact.address}}, {{contact.city}}, {{contact.state}}, conjuntamente con mi letrado patrocinante Dr. {{user.firstName}} {{user.lastName}}, {{user.skill.registrationNumber}} - {{user.skill.name}}, con domicilio electrónico {{user.skill.electronicAddress}}, condición tributaria {{user.skill.taxCondition}}, CUIT {{user.skill.taxCode}}, en autos "{{folder.folderName}} s/ {{folder.materia}}", EXPTE. {{folder.judFolder.numberJudFolder}}, a V.S. decimos:</p>`;
					} else {
						// Template without contact data - leave placeholders for manual completion
						templateContent = `<p>Sr. Juez:</p>
<p>{{NOMBRE_CLIENTE}} {{APELLIDO_CLIENTE}}, DNI {{DNI_CLIENTE}}, por derecho propio, con domicilio en {{DIRECCION_CLIENTE}}, {{CIUDAD_CLIENTE}}, {{PROVINCIA_CLIENTE}}, conjuntamente con mi letrado patrocinante Dr. {{user.firstName}} {{user.lastName}}, {{user.skill.registrationNumber}} - {{user.skill.name}}, con domicilio electrónico {{user.skill.electronicAddress}}, condición tributaria {{user.skill.taxCondition}}, CUIT {{user.skill.taxCode}}, en autos "{{folder.folderName}} s/ {{folder.materia}}", EXPTE. {{folder.judFolder.numberJudFolder}}, a V.S. decimos:</p>`;
					}
				}
			} else {
				// Empty document
				templateContent = "";
			}

			// Create document in backend first to get real ID
			const documentData = {
				title: documentTitle,
				content: templateContent,
				status: "draft" as const,
				folderId: folderId || undefined,
				userId: user?._id || user?.id,
				templateId: templateId || undefined,
				metadata: {
					createdFrom: templateId ? "template" : "blank",
					tags: [],
					collaborators: [],
				},
			};

			// Show loading state
			setIsCreatingDocument(true);

			// Create the document in backend
			dispatch(createDocument(documentData) as any)
				.then((result: any) => {
					setIsCreatingDocument(false);
					if (result.success && result.document) {
						// Set the document with the real ID from backend
						dispatch(
							setCurrentDocument({
								...result.document,
								id: result.document._id || result.document.id,
								type: documentType,
								metadata: {
									...result.document.metadata,
									folderData: folder,
									user: processedUser,
									contact: contact,
									templateVariables: !!folder || !!templateId,
									documentSettings: settings,
									templateId: templateId,
								},
							} as any),
						);
						// Show the editor
						setShowEditor(true);
					} else {
						enqueueSnackbar(result.message || "Error al crear el documento", { variant: "error" });
					}
				})
				.catch((error) => {
					setIsCreatingDocument(false);
					enqueueSnackbar("Error al crear el documento", { variant: "error" });
				});
		},
		[dispatch, templates],
	);

	// Load documents from backend on mount
	useEffect(() => {
		// Load documents from API
		dispatch(fetchDocuments({ folderId: folderId || undefined }) as any);
		// Load templates if not already loaded
		if (templates.length === 0) {
			dispatch(fetchTemplates() as any);
		}
	}, [dispatch, folderId]);

	// Watch for selectedContacts changes
	const [waitingForContacts, setWaitingForContacts] = useState(false);

	// Function to load folder data
	const handleFolderLoad = useCallback(
		async (folderId: string) => {
			if (!user?._id) {
				return;
			}

			setIsFolderLoading(true);
			try {
				// Load folder and contacts in parallel
				const [folderResult] = await Promise.all([
					dispatch(getFolderById(folderId) as any),
					dispatch(getContactsByUserId(user._id) as any),
				]);

				if (folderResult?.success && folderResult?.folder) {
					setFolderData(folderResult.folder);
					// Filter contacts by folder
					await dispatch(filterContactsByFolder(folderId) as any);
				}
			} catch (error) {
				console.error("Error loading folder:", error);
			} finally {
				setIsFolderLoading(false);
			}
		},
		[dispatch, user?._id],
	);

	// Watch for URL folderId changes
	useEffect(() => {
		const currentFolderId = new URLSearchParams(location.search).get("folderId");
		if (currentFolderId) {
			// Always load the folder when URL has folderId
			if (!folderData || folderData._id !== currentFolderId) {
				handleFolderLoad(currentFolderId);
			}
		} else {
			// Clear folder data if folderId is removed from URL
			setFolderData(null);
		}
	}, [location.search, folderData, handleFolderLoad]);

	// Handle folder-based document creation settings
	useEffect(() => {
		// Only handle settings and contacts when we have both folder data and user
		if (!folderData || !user?._id || folderData._id !== folderId) {
			return;
		}

		// Check if folder has document settings or if user has multiple skills
		const hasMultipleSkills = Array.isArray(user.skill) && user.skill.length > 1;
		const needsSettings = hasMultipleSkills && !folderData.documentSettings?.preferredSkillId;

		if (needsSettings) {
			// Show settings dialog first
			setShowSettingsDialog(true);
		} else {
			// Use existing settings or default
			const settings = folderData.documentSettings || {
				preferredSkillId:
					user.skill && Array.isArray(user.skill) && user.skill.length > 0 && typeof user.skill[0] === "object" && "_id" in user.skill[0]
						? user.skill[0]._id
						: "0",
			};
			setDocumentSettings(settings);

			// Wait a bit more for contacts to be properly filtered
			setTimeout(() => {
				setWaitingForContacts(true);
			}, 1000);
		}
	}, [folderData, folderId, user]);

	// Watch for contacts to be loaded and process document creation
	useEffect(() => {
		if (waitingForContacts && folderData && user) {
			// Check if there's a Cliente contact
			const clienteContact = selectedContacts.find((c) => c.role === "Cliente");

			if (clienteContact) {
				// Use the Cliente contact directly - switch to templates tab
				setActiveTab(1);
				setWaitingForContacts(false);
			} else if (selectedContacts.length > 0) {
				// Show contact selection dialog
				setPendingDocumentData({
					folder: folderData,
					user: user,
					folderId: folderId,
					settings: documentSettings,
				});
				setShowContactDialog(true);
				setWaitingForContacts(false);
			} else {
				// No contacts - switch to templates tab
				setActiveTab(1);
				setWaitingForContacts(false);
			}
		}
	}, [waitingForContacts, folderData, user, selectedContacts, folderId, createDocumentWithContact, documentSettings]);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	const handleNewDocument = () => {
		// Switch to templates tab
		setActiveTab(1);
	};

	const proceedWithDocumentCreation = (template: any) => {
		// Check if we have pending document data from contact selection
		if (pendingDocumentData) {
			createDocumentWithContact(
				pendingDocumentData.folder,
				pendingDocumentData.contact,
				pendingDocumentData.user,
				pendingDocumentData.folderId,
				pendingDocumentData.settings,
				template?.id,
			);
			setPendingDocumentData(null);
		} else if (folderData && dataAlertInfo) {
			// Coming from data alert with folder
			const clienteContact = selectedContacts.find((c) => c.role === "Cliente");
			createDocumentWithContact(folderData, clienteContact || null, user, folderData._id, documentSettings, template?.id);
		} else if (folderData && user && folderId) {
			// Direct from folder
			const clienteContact = selectedContacts.find((c) => c.role === "Cliente");
			createDocumentWithContact(folderData, clienteContact || null, user, folderId, documentSettings, template?.id);
		} else {
			// Creating a new document without folder context
			createDocumentWithContact(null, null, user, "", null, template?.id);
		}
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
				enqueueSnackbar("No hay documentos para exportar", { variant: "warning" });
				return;
			}
			// TODO: Implement batch PDF export
			console.log("Exporting PDFs:", filteredDocuments);
			enqueueSnackbar("Función de exportación en desarrollo", { variant: "info" });
		} catch (error) {
			console.error("Error exporting PDFs:", error);
			enqueueSnackbar("Error al exportar los documentos", { variant: "error" });
		}
	};

	const handleFolderSelect = async (folder: any) => {
		setShowFolderDialog(false);

		// Update URL using navigate to trigger location change
		const searchParams = new URLSearchParams(location.search);
		searchParams.set("folderId", folder._id);
		navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });

		// The URL change will trigger the effect that calls handleFolderLoad
		// We don't need to load the folder here, just handle the data alert if needed
		if (dataAlertInfo) {
			// We need to wait for the folder to be loaded by the effect
			// For now, we'll load it here too to update the data alert
			const folderResult = await dispatch(getFolderById(folder._id) as any);

			if (folderResult?.success && folderResult?.folder) {
				const fullFolderData = folderResult.folder;
				const updatedAvailableData = {
					...dataAlertInfo.availableData,
					folder: fullFolderData,
				};

				// Re-validate template with new folder data
				const validation = validateTemplateData(dataAlertInfo.template, updatedAvailableData);

				setDataAlertInfo({
					...dataAlertInfo,
					availableData: updatedAvailableData,
					validation,
				});

				// Show data alert again with updated information
				setShowDataAlert(true);
			}
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
						{/* Loading overlay when creating document */}
						{isCreatingDocument && (
							<Box
								sx={{
									position: "fixed",
									top: 0,
									left: 0,
									right: 0,
									bottom: 0,
									backgroundColor: "rgba(0, 0, 0, 0.5)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									zIndex: 9999,
								}}
							>
								<Box sx={{ textAlign: "center", backgroundColor: "white", p: 3, borderRadius: 2 }}>
									<CircularProgress />
									<Typography sx={{ mt: 2 }}>Creando documento...</Typography>
								</Box>
							</Box>
						)}
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

						{showEditor ? (
							// Show editor when a document is being edited
							<TiptapCSSPagedEditor
								onClose={() => {
									setShowEditor(false);
									// Don't clear folder data or URL parameter - keep the folder context
									// The folder was selected intentionally and should persist
								}}
								folderData={folderData}
								selectedContacts={selectedContacts}
							/>
						) : (
							<>
								{/* Tabs */}
								<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
									<Tabs value={activeTab} onChange={handleTabChange}>
										<Tab label="Mis Documentos" />
										<Tab label="Plantillas" />
									</Tabs>
								</Box>

								{/* Content */}
								{activeTab === 0 && (
									<DocumentList
										documents={filteredDocuments}
										onEdit={() => {
											// For now, show the editor with a blank document
											// TODO: Implement document selection and editing
											setShowEditor(true);
										}}
									/>
								)}

								{activeTab === 1 && (
									<Box sx={{ py: 2 }}>
										{/* Folder context */}
										{isFolderLoading ? (
											<Alert severity="info" sx={{ mb: 3 }}>
												<Box>
													<AlertTitle>
														<Skeleton variant="text" width={300} />
													</AlertTitle>
													<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 1 }}>
														<Skeleton variant="text" width={400} />
														<Button variant="outlined" size="small" startIcon={<Folder2 size={16} />} disabled sx={{ ml: 2 }}>
															Cambiar Carpeta
														</Button>
													</Box>
												</Box>
											</Alert>
										) : folderData ? (
											<Alert severity="info" sx={{ mb: 3 }}>
												<Box>
													<AlertTitle
														sx={{
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
															pr: 2,
														}}
													>
														Carpeta seleccionada: {folderData.folderName}
													</AlertTitle>
													<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 1 }}>
														<Typography variant="body2">Los documentos creados se asociarán a esta carpeta</Typography>
														<Button
															variant="outlined"
															size="small"
															startIcon={<Folder2 size={16} />}
															onClick={() => setShowFolderDialog(true)}
															sx={{ ml: 2 }}
														>
															Cambiar Carpeta
														</Button>
													</Box>
												</Box>
											</Alert>
										) : (
											<Alert severity="warning" sx={{ mb: 3 }}>
												<AlertTitle>No hay carpeta seleccionada</AlertTitle>
												<Box sx={{ mt: 1 }}>
													<Typography variant="body2" sx={{ mb: 1 }}>
														Seleccione una carpeta para asociar los documentos y autocompletar datos
													</Typography>
													<Button
														variant="contained"
														size="small"
														startIcon={<Folder2 size={16} />}
														onClick={() => setShowFolderDialog(true)}
													>
														Seleccionar Carpeta
													</Button>
												</Box>
											</Alert>
										)}

										<TemplateSelector
											onSelect={(template) => {
												// Handle template selection
												// Prepare user data with skill as array and preferred skill if available
												let processedUser = { ...user };
												if (user && user.skill) {
													if (documentSettings?.preferredSkillId && Array.isArray(user.skill) && user.skill.length > 0) {
														// Check if skills are objects (LawyerCollegeWithRegistration) not strings
														if (typeof user.skill[0] === "object") {
															const selectedSkill =
																(user.skill as any[]).find((s: any) => s._id === documentSettings.preferredSkillId) || user.skill[0];
															processedUser = { ...user, skill: [selectedSkill] };
														}
													} else if (!Array.isArray(user.skill)) {
														// Convert single skill to array
														processedUser = { ...user, skill: [user.skill] };
													}
												}

												const availableData: any = {
													user: processedUser,
													folder: folderData,
													contact: selectedContacts.find((c) => c.role === "Cliente") || null,
												};

												// If a specific template is selected, validate data
												if (template) {
													const validation = validateTemplateData(template, availableData);

													// If data is missing, show alert
													if (validation.missingData.length > 0) {
														setDataAlertInfo({
															template,
															validation,
															availableData,
															action: "new",
														});
														setShowDataAlert(true);
													} else {
														// Create document directly
														createDocumentWithContact(
															folderData || null,
															availableData.contact,
															user,
															folderData?._id || "",
															null,
															template._id || template.id,
														);
													}
												} else {
													// Blank document
													createDocumentWithContact(null, null, user, "", null, undefined);
												}
											}}
										/>
									</Box>
								)}
							</>
						)}
					</Stack>
				</MainCard>
			</Grid>

			{/* Contact Selection Dialog */}
			<ContactSelectionDialog
				open={showContactDialog}
				contacts={selectedContacts}
				folderId={folderId || pendingDocumentData?.folderId}
				onSelect={(contact) => {
					setShowContactDialog(false);
					if (pendingDocumentData) {
						// Check if we have a pending template from data alert
						if (pendingDocumentData.pendingTemplate) {
							// Create document with the selected contact and pending template
							createDocumentWithContact(
								pendingDocumentData.folder,
								contact,
								pendingDocumentData.user,
								pendingDocumentData.folderId,
								pendingDocumentData.settings,
								pendingDocumentData.pendingTemplate.id,
							);
							setPendingDocumentData(null);
						} else {
							// Store the selected contact and switch to templates tab
							setPendingDocumentData({ ...pendingDocumentData, contact });
							setActiveTab(1);
						}
					}
				}}
				onCancel={() => {
					setShowContactDialog(false);
					// Check if we came from data alert
					if (pendingDocumentData?.pendingTemplate) {
						// Return to data alert instead of clearing everything
						setShowDataAlert(true);
					} else {
						// Normal flow - clear pending data
						setPendingDocumentData(null);
					}
				}}
				onContactCreated={(_newContact) => {
					// Refresh contacts if needed
					if (folderId || pendingDocumentData?.folderId) {
						dispatch(filterContactsByFolder((folderId || pendingDocumentData?.folderId)!) as any);
					}
				}}
			/>

			{/* Document Settings Dialog */}
			<DocumentSettingsDialog
				open={showSettingsDialog}
				user={user}
				folderName={folderData?.folderName || ""}
				onConfirm={(settings) => {
					setShowSettingsDialog(false);
					setDocumentSettings(settings);

					// TODO: Save settings to folder when backend API is available
					// await dispatch(updateFolder({ id: folderId, documentSettings: settings }));

					// Continue with document creation flow
					setTimeout(() => {
						setWaitingForContacts(true);
					}, 100);
				}}
				onCancel={() => {
					setShowSettingsDialog(false);
					// Navigate back or close the flow
					const searchParams = new URLSearchParams(location.search);
					searchParams.delete("folderId");
					const newUrl = searchParams.toString() ? `${location.pathname}?${searchParams.toString()}` : location.pathname;
					navigate(newUrl, { replace: true });
				}}
			/>

			{/* Template Data Alert */}
			{showDataAlert && dataAlertInfo && (
				<TemplateDataAlert
					open={showDataAlert}
					templateName={dataAlertInfo.template.name}
					missingData={dataAlertInfo.validation.missingData}
					currentFolder={folderData}
					isFolderLoading={isFolderLoading}
					user={user}
					currentSkillId={
						documentSettings?.preferredSkillId ||
						(user &&
							Array.isArray(user.skill) &&
							user.skill.length > 0 &&
							typeof user.skill[0] === "object" &&
							(user.skill[0] as any)._id) ||
						""
					}
					onContinue={() => {
						setShowDataAlert(false);
						proceedWithDocumentCreation(dataAlertInfo.template);
						setDataAlertInfo(null);
					}}
					onSkillChange={(skillId) => {
						// Update document settings with new skill
						const newSettings = { ...documentSettings, preferredSkillId: skillId };
						setDocumentSettings(newSettings);

						// Update the available data with the new skill
						if (dataAlertInfo && user && Array.isArray(user.skill) && user.skill.length > 0 && typeof user.skill[0] === "object") {
							const selectedSkill = (user.skill as any[]).find((s: any) => s._id === skillId) || user.skill[0];
							const processedUser = { ...user, skill: [selectedSkill] };

							const updatedAvailableData = {
								...dataAlertInfo.availableData,
								user: processedUser,
							};

							// Re-validate template with new skill
							const validation = validateTemplateData(dataAlertInfo.template, updatedAvailableData);

							setDataAlertInfo({
								...dataAlertInfo,
								availableData: updatedAvailableData,
								validation,
							});
						}
					}}
					onCancel={() => {
						setShowDataAlert(false);
						setDataAlertInfo(null);
						// Go back to template selection
						setActiveTab(1);
					}}
					onConfigure={(dataType) => {
						setShowDataAlert(false);
						// Handle configuration based on data type
						if (dataType === "contact") {
							// Show contact selection dialog
							if (folderData) {
								setPendingDocumentData({
									folder: folderData,
									user: user,
									folderId: folderData._id,
									settings: documentSettings,
									pendingTemplate: dataAlertInfo.template,
								});
								setShowContactDialog(true);
							} else {
								// No folder selected, show message
								setInfoMessage({
									open: true,
									message: "Debe seleccionar una carpeta primero para poder configurar contactos",
									severity: "warning",
								});
								setShowDataAlert(true);
							}
						} else if (dataType === "folder") {
							// Show folder selection dialog
							setShowFolderDialog(true);
						} else if (dataType === "user") {
							// For user data, show an informative message
							setInfoMessage({
								open: true,
								message: "Los datos del usuario deben configurarse en el perfil de usuario",
								severity: "info",
							});
							setShowDataAlert(true);
						} else {
							// For other types, show a generic message
							setInfoMessage({
								open: true,
								message: `La configuración de tipo "${dataType}" aún no está disponible`,
								severity: "info",
							});
							setShowDataAlert(true);
						}
					}}
					onSelectFolder={() => {
						setShowDataAlert(false);
						setShowFolderDialog(true);
					}}
				/>
			)}

			{/* Folder Selection Dialog */}
			<FolderSelectionDialog
				open={showFolderDialog}
				onSelect={handleFolderSelect}
				onCancel={() => {
					setShowFolderDialog(false);
					// If we came from data alert, show it again
					if (dataAlertInfo) {
						setShowDataAlert(true);
					}
				}}
			/>

			{/* Info Snackbar */}
			<Snackbar
				open={infoMessage.open}
				autoHideDuration={6000}
				onClose={() => setInfoMessage({ ...infoMessage, open: false })}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert onClose={() => setInfoMessage({ ...infoMessage, open: false })} severity={infoMessage.severity} sx={{ width: "100%" }}>
					{infoMessage.message}
				</Alert>
			</Snackbar>
		</Grid>
	);
}

export default DocumentsLayout;
