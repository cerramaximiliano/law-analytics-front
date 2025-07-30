import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
// Removed unused import

// material-ui
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Box,
	IconButton,
	Typography,
	Grid,
	Chip,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
	Divider,
} from "@mui/material";

// project imports
import { RootState } from "store";
import { addDocument, updateDocument, setCurrentDocument } from "store/reducers/documents";

// assets
import {
	CloseCircle,
	Save2,
	DocumentText,
	Printer,
	Eye,
	TextBold,
	TextItalic,
	TextUnderline,
	AlignLeft,
	TextalignCenter,
	AlignRight,
	TextalignJustifycenter,
	ArrowRotateLeft,
	ArrowRotateRight,
} from "iconsax-react";

// types
import { DocumentType, DocumentStatus, Document } from "types/documents";

interface TiptapCSSPagedEditorProps {
	onClose: () => void;
}

// Constants for A4 page dimensions at 96 DPI
const PAGE_WIDTH = 794; // 210mm
const PAGE_HEIGHT = 1123; // 297mm
const PAGE_PADDING_TOP = 94; // 25mm
const PAGE_PADDING_BOTTOM = 94; // 25mm
const PAGE_PADDING_LEFT = 75; // 20mm
const PAGE_PADDING_RIGHT = 75; // 20mm

// CSS for paged editor
const editorStyles = `
/* Editor wrapper */
.css-paged-editor-wrapper {
	background: #f0f0f0;
	padding: 20px;
	overflow-y: auto;
	height: 100%;
}

/* Pages container */
.css-pages-container {
	margin: 0 auto;
	width: ${PAGE_WIDTH}px;
	background: white;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* Editor content area */
.css-paged-content {
	padding: ${PAGE_PADDING_TOP}px ${PAGE_PADDING_RIGHT}px ${PAGE_PADDING_BOTTOM}px ${PAGE_PADDING_LEFT}px;
	min-height: ${PAGE_HEIGHT}px;
	column-width: ${PAGE_WIDTH - PAGE_PADDING_LEFT - PAGE_PADDING_RIGHT}px;
	column-gap: 0;
	column-fill: auto;
	height: auto;
	position: relative;
	cursor: text;
}

/* Tiptap editor styles */
.css-paged-tiptap {
	width: 100%;
	height: 100%;
}

.css-paged-tiptap .ProseMirror {
	font-family: 'Times New Roman', Times, serif;
	font-size: 12pt;
	line-height: 1.8;
	color: #000;
	outline: none;
	min-height: ${PAGE_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM}px;
	cursor: text;
}

.css-paged-tiptap .ProseMirror p {
	margin-bottom: 12px;
	text-align: justify;
	orphans: 3;
	widows: 3;
}

.css-paged-tiptap .ProseMirror h1,
.css-paged-tiptap .ProseMirror h2,
.css-paged-tiptap .ProseMirror h3 {
	page-break-after: avoid;
	break-after: avoid;
}

.css-paged-tiptap .ProseMirror h1 {
	font-size: 18pt;
	font-weight: bold;
	margin: 24px 0 12px;
	text-align: left;
}

.css-paged-tiptap .ProseMirror h2 {
	font-size: 16pt;
	font-weight: bold;
	margin: 20px 0 10px;
	text-align: left;
}

.css-paged-tiptap .ProseMirror h3 {
	font-size: 14pt;
	font-weight: bold;
	margin: 16px 0 8px;
	text-align: left;
}

.css-paged-tiptap .ProseMirror ul,
.css-paged-tiptap .ProseMirror ol {
	margin-bottom: 12px;
	padding-left: 30px;
}

.css-paged-tiptap .ProseMirror li {
	margin-bottom: 6px;
	page-break-inside: avoid;
	break-inside: avoid;
}

.css-paged-tiptap .ProseMirror p.is-editor-empty:first-child::before {
	content: attr(data-placeholder);
	float: left;
	color: #999;
	font-style: italic;
	pointer-events: none;
	height: 0;
}

/* Ensure the editor is focusable */
.css-paged-tiptap .ProseMirror-focused {
	outline: none;
}

/* Make sure the editor content is visible */
.tiptap {
	width: 100%;
	height: 100%;
}

/* Page break lines */
.page-break-line {
	position: absolute;
	left: 0;
	right: 0;
	height: 2px;
	background: #e0e0e0;
	pointer-events: none;
	z-index: 1;
}

.page-break-line::after {
	content: attr(data-page);
	position: absolute;
	bottom: 10px;
	right: 20px;
	background: white;
	padding: 2px 8px;
	color: #666;
	font-size: 11px;
	font-family: 'Times New Roman', Times, serif;
}

/* Current page indicator */
.current-page-indicator {
	position: fixed;
	bottom: 20px;
	right: 20px;
	background: rgba(0, 0, 0, 0.8);
	color: white;
	padding: 8px 16px;
	border-radius: 20px;
	font-size: 14px;
	z-index: 100;
}

/* Toolbar */
.toolbar {
	background: #f5f5f5;
	border: 1px solid #ccc;
	padding: 8px;
	display: flex;
	gap: 4px;
	flex-wrap: wrap;
	align-items: center;
	margin-bottom: 10px;
	position: sticky;
	top: 0;
	z-index: 10;
}

/* Preview mode */
.preview-mode .css-paged-content {
	background: white;
}

/* Print styles */
@media print {
	@page {
		size: A4;
		margin: 0;
	}
	
	body {
		margin: 0;
		padding: 0;
	}
	
	body * {
		visibility: hidden;
	}
	
	.print-content, .print-content * {
		visibility: visible;
	}
	
	.print-content {
		position: absolute;
		left: 0;
		top: 0;
	}
	
	.css-pages-container {
		width: 210mm;
		box-shadow: none;
	}
	
	.css-paged-content {
		padding: 25mm 20mm;
	}
	
	.page-break-line,
	.current-page-indicator,
	.toolbar {
		display: none !important;
	}
	
	/* Force page breaks at specific heights */
	.css-paged-tiptap .ProseMirror {
		page-break-after: always;
	}
}

/* Page simulation */
@media screen {
	.css-paged-content {
		background-image: repeating-linear-gradient(
			to bottom,
			transparent,
			transparent ${PAGE_HEIGHT - 1}px,
			#e0e0e0 ${PAGE_HEIGHT - 1}px,
			#e0e0e0 ${PAGE_HEIGHT}px
		);
		background-size: 100% ${PAGE_HEIGHT}px;
		background-position: 0 -${PAGE_PADDING_TOP}px;
	}
}
`;

function TiptapCSSPagedEditor({ onClose }: TiptapCSSPagedEditorProps) {
	const dispatch = useDispatch();
	const { currentDocument, templates } = useSelector((state: RootState) => state.documents);
	const { user } = useSelector((state: RootState) => state.auth);

	const [title, setTitle] = useState(currentDocument?.title || "");
	const [type, setType] = useState<DocumentType>(currentDocument?.type || "escrito");
	const [status, setStatus] = useState<DocumentStatus>(currentDocument?.status || "draft");
	const [selectedTemplate, setSelectedTemplate] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	const contentRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<HTMLDivElement>(null);

	// Create editor instance
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
			}),
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			Underline,
			Placeholder.configure({
				placeholder: "Comience a escribir su documento legal...",
			}),
		],
		content: currentDocument?.content || "",
		editable: true,
		editorProps: {
			attributes: {
				class: "css-paged-tiptap",
			},
		},
		onUpdate: ({ editor }) => {
			calculatePages();
		},
		onCreate: ({ editor }) => {
			console.log("Editor created:", editor);
			editor.commands.focus();
		},
	});

	// Calculate pages based on content height
	const calculatePages = () => {
		if (!contentRef.current) return;

		const contentHeight = contentRef.current.scrollHeight;
		const pageHeight = PAGE_HEIGHT;
		const pages = Math.max(1, Math.ceil(contentHeight / pageHeight));

		if (pages !== totalPages) {
			setTotalPages(pages);
		}

		// Calculate current page based on scroll position
		if (editorRef.current) {
			const scrollTop = editorRef.current.scrollTop;
			const currentPageNum = Math.floor(scrollTop / pageHeight) + 1;
			if (currentPageNum !== currentPage) {
				setCurrentPage(currentPageNum);
			}
		}
	};

	// Initial setup
	useEffect(() => {
		if (currentDocument && editor) {
			setTitle(currentDocument.title);
			setType(currentDocument.type);
			setStatus(currentDocument.status);
			editor.commands.setContent(currentDocument.content);
		}

		// Calculate pages after content loads
		setTimeout(calculatePages, 100);
	}, [currentDocument, editor]);

	// Update pages on scroll
	useEffect(() => {
		const handleScroll = () => {
			calculatePages();
		};

		const editorElement = editorRef.current;
		if (editorElement) {
			editorElement.addEventListener("scroll", handleScroll);
			return () => editorElement.removeEventListener("scroll", handleScroll);
		}
	}, []);

	// Handle formatting commands
	const handleCommand = (command: string) => {
		if (!editor) return;

		switch (command) {
			case "undo":
				editor.chain().focus().undo().run();
				break;
			case "redo":
				editor.chain().focus().redo().run();
				break;
		}
	};

	const toggleFormat = (format: string) => {
		if (!editor) return;

		switch (format) {
			case "bold":
				editor.chain().focus().toggleBold().run();
				break;
			case "italic":
				editor.chain().focus().toggleItalic().run();
				break;
			case "underline":
				editor.chain().focus().toggleUnderline().run();
				break;
		}
	};

	const setTextAlignment = (_event: React.MouseEvent<HTMLElement>, alignment: string | null) => {
		if (!editor || !alignment) return;
		editor.chain().focus().setTextAlign(alignment).run();
	};

	const setBlockType = (_event: React.MouseEvent<HTMLElement>, blockType: string | null) => {
		if (!editor || !blockType) return;

		switch (blockType) {
			case "paragraph":
				editor.chain().focus().setParagraph().run();
				break;
			case "h1":
				editor.chain().focus().toggleHeading({ level: 1 }).run();
				break;
			case "h2":
				editor.chain().focus().toggleHeading({ level: 2 }).run();
				break;
			case "h3":
				editor.chain().focus().toggleHeading({ level: 3 }).run();
				break;
			case "bulletList":
				editor.chain().focus().toggleBulletList().run();
				break;
			case "orderedList":
				editor.chain().focus().toggleOrderedList().run();
				break;
		}
	};

	const handleSave = async () => {
		if (!title.trim() || !editor) {
			alert("Por favor ingrese un título para el documento");
			return;
		}

		setIsSaving(true);

		const documentData: Document = {
			id: currentDocument?.id || `doc_${Date.now()}`,
			title,
			type,
			status,
			content: editor.getHTML(),
			version: currentDocument?.version || 1,
			folderId: currentDocument?.folderId,
			templateId: selectedTemplate || currentDocument?.templateId,
			createdBy: currentDocument?.createdBy || user?.id || "user_1",
			lastModifiedBy: user?.id || "user_1",
			createdAt: currentDocument?.createdAt || new Date(),
			updatedAt: new Date(),
			tags: currentDocument?.tags || [],
			metadata: currentDocument?.metadata || {},
		};

		if (currentDocument) {
			dispatch(updateDocument(documentData));
		} else {
			dispatch(addDocument(documentData));
		}

		setTimeout(() => {
			setIsSaving(false);
			handleClose();
		}, 500);
	};

	const handleClose = () => {
		dispatch(setCurrentDocument(null));
		onClose();
	};

	const handleTemplateSelect = (templateId: string) => {
		setSelectedTemplate(templateId);
		const template = templates.find((t) => t.id === templateId);
		if (template && editor) {
			editor.commands.setContent(template.content);
			setType(template.category === "laboral" ? "demanda" : "escrito");
		}
	};

	const handlePrint = () => {
		window.print();
	};

	// Get editor states for toolbar
	const getActiveBlockType = () => {
		if (!editor) return "paragraph";

		if (editor.isActive("heading", { level: 1 })) return "h1";
		if (editor.isActive("heading", { level: 2 })) return "h2";
		if (editor.isActive("heading", { level: 3 })) return "h3";
		if (editor.isActive("bulletList")) return "bulletList";
		if (editor.isActive("orderedList")) return "orderedList";

		return "paragraph";
	};

	const getActiveAlignment = () => {
		if (!editor) return "left";

		if (editor.isActive({ textAlign: "center" })) return "center";
		if (editor.isActive({ textAlign: "right" })) return "right";
		if (editor.isActive({ textAlign: "justify" })) return "justify";

		return "left";
	};

	return (
		<>
			<style>{editorStyles}</style>
			<Dialog
				open
				maxWidth={false}
				fullWidth
				sx={{
					"& .MuiDialog-paper": {
						height: "95vh",
						maxHeight: "95vh",
						maxWidth: "95vw",
					},
				}}
			>
				<DialogTitle>
					<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Typography variant="h5">{currentDocument ? "Editar Documento" : "Nuevo Documento"}</Typography>
						<Stack direction="row" spacing={1}>
							<Button startIcon={<Eye />} onClick={() => setShowPreview(!showPreview)} variant="outlined" size="small">
								{showPreview ? "Editar" : "Vista Previa"}
							</Button>
							<Button startIcon={<Printer />} onClick={handlePrint} variant="outlined" size="small">
								Imprimir
							</Button>
							<IconButton onClick={handleClose}>
								<CloseCircle />
							</IconButton>
						</Stack>
					</Box>
				</DialogTitle>
				<DialogContent sx={{ display: "flex", flexDirection: "column", overflow: "hidden", p: 2 }}>
					<Grid container spacing={2} sx={{ mb: 2 }}>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="Título del Documento"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								required
								variant="outlined"
								size="small"
							/>
						</Grid>
						<Grid item xs={12} md={3}>
							<FormControl fullWidth size="small" variant="outlined">
								<InputLabel>Tipo</InputLabel>
								<Select value={type} onChange={(e) => setType(e.target.value as DocumentType)} label="Tipo">
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
						<Grid item xs={12} md={3}>
							<FormControl fullWidth size="small" variant="outlined">
								<InputLabel>Estado</InputLabel>
								<Select value={status} onChange={(e) => setStatus(e.target.value as DocumentStatus)} label="Estado">
									<MenuItem value="draft">Borrador</MenuItem>
									<MenuItem value="final">Final</MenuItem>
									<MenuItem value="archived">Archivado</MenuItem>
								</Select>
							</FormControl>
						</Grid>

						{!currentDocument && templates.length > 0 && (
							<Grid item xs={12}>
								<FormControl fullWidth size="small" variant="outlined">
									<InputLabel>Usar Plantilla (Opcional)</InputLabel>
									<Select value={selectedTemplate} onChange={(e) => handleTemplateSelect(e.target.value)} label="Usar Plantilla (Opcional)">
										<MenuItem value="">
											<em>Sin plantilla</em>
										</MenuItem>
										{templates.map((template) => (
											<MenuItem key={template.id} value={template.id}>
												{template.name} - {template.description}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
						)}
					</Grid>

					{!showPreview && editor && (
						<Box className="toolbar">
							<ToggleButtonGroup size="small" exclusive value={getActiveBlockType()} onChange={setBlockType}>
								<ToggleButton value="paragraph">P</ToggleButton>
								<ToggleButton value="h1">H1</ToggleButton>
								<ToggleButton value="h2">H2</ToggleButton>
								<ToggleButton value="h3">H3</ToggleButton>
							</ToggleButtonGroup>

							<Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

							<IconButton size="small" onClick={() => toggleFormat("bold")} color={editor.isActive("bold") ? "primary" : "default"}>
								<TextBold size={18} />
							</IconButton>
							<IconButton size="small" onClick={() => toggleFormat("italic")} color={editor.isActive("italic") ? "primary" : "default"}>
								<TextItalic size={18} />
							</IconButton>
							<IconButton
								size="small"
								onClick={() => toggleFormat("underline")}
								color={editor.isActive("underline") ? "primary" : "default"}
							>
								<TextUnderline size={18} />
							</IconButton>

							<Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

							<ToggleButtonGroup size="small" exclusive value={getActiveAlignment()} onChange={setTextAlignment}>
								<ToggleButton value="left">
									<AlignLeft size={18} />
								</ToggleButton>
								<ToggleButton value="center">
									<TextalignCenter size={18} />
								</ToggleButton>
								<ToggleButton value="right">
									<AlignRight size={18} />
								</ToggleButton>
								<ToggleButton value="justify">
									<TextalignJustifycenter size={18} />
								</ToggleButton>
							</ToggleButtonGroup>

							<Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

							<IconButton
								size="small"
								onClick={() => {
									if (editor) {
										editor.chain().focus().toggleBulletList().run();
									}
								}}
								color={editor.isActive("bulletList") ? "primary" : "default"}
							>
								• ─
							</IconButton>
							<IconButton
								size="small"
								onClick={() => {
									if (editor) {
										editor.chain().focus().toggleOrderedList().run();
									}
								}}
								color={editor.isActive("orderedList") ? "primary" : "default"}
							>
								1. ─
							</IconButton>

							<Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

							<IconButton size="small" onClick={() => handleCommand("undo")}>
								<ArrowRotateLeft size={18} />
							</IconButton>
							<IconButton size="small" onClick={() => handleCommand("redo")}>
								<ArrowRotateRight size={18} />
							</IconButton>
						</Box>
					)}

					<Box className={`css-paged-editor-wrapper ${showPreview ? "preview-mode" : ""}`} sx={{ flex: 1 }} ref={editorRef}>
						<div className="print-content">
							<div className="css-pages-container">
								<div className="css-paged-content" ref={contentRef}>
									{showPreview ? (
										<div dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }} />
									) : (
										<>
											<EditorContent editor={editor} className="css-paged-tiptap" />
											{/* Page break indicators */}
											{Array.from({ length: totalPages - 1 }, (_, i) => (
												<div
													key={i}
													className="page-break-line"
													style={{
														top: `${(i + 1) * PAGE_HEIGHT - PAGE_PADDING_TOP}px`,
													}}
													data-page={`Página ${i + 1}`}
												/>
											))}
										</>
									)}
								</div>
							</div>
						</div>

						{!showPreview && (
							<div className="current-page-indicator">
								Página {currentPage} de {totalPages}
							</div>
						)}
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 3 }}>
					<Stack direction="row" spacing={2} sx={{ width: "100%" }} justifyContent="space-between">
						<Box>{currentDocument?.folderId && <Chip icon={<DocumentText size={16} />} label="Vinculado a carpeta" color="primary" />}</Box>
						<Stack direction="row" spacing={2}>
							<Button onClick={handleClose} color="secondary">
								Cancelar
							</Button>
							<Button variant="contained" onClick={handleSave} startIcon={<Save2 />} disabled={!title.trim() || isSaving}>
								{isSaving ? "Guardando..." : currentDocument ? "Actualizar" : "Crear"} Documento
							</Button>
						</Stack>
					</Stack>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default TiptapCSSPagedEditor;
