import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControlLabel,
	InputAdornment,
	MenuItem,
	Pagination,
	Paper,
	Select,
	Stack,
	Switch,
	TextField,
	Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DocumentText, SearchNormal1 } from "iconsax-react";
import { ResponsiveDialog } from "components/@extended/ResponsiveDialog";
import { useDispatch, useSelector } from "store";
import { fetchRichTextTemplates } from "store/reducers/richTextDocuments";
import type { RichTextTemplate, RichTextTemplateCategory } from "types/rich-text-document";

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

const CATEGORY_LABELS: Record<RichTextTemplateCategory, string> = {
	civil: "Civil",
	laboral: "Laboral",
	penal: "Penal",
	familia: "Familia",
	societario: "Societario",
	otro: "Otro",
};

const CATEGORY_COLORS: Record<RichTextTemplateCategory, "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error"> = {
	civil: "info",
	laboral: "warning",
	penal: "error",
	familia: "secondary",
	societario: "primary",
	otro: "default",
};

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
	open: boolean;
	onClose: () => void;
	/** Si se proporciona, el folderId se pasa al editor en la URL */
	folderId?: string | null;
}

// ── Component ──────────────────────────────────────────────────────────────────

const PickModelDialog = ({ open, onClose, folderId }: Props) => {
	const navigate = useNavigate();
	const theme = useTheme();
	const dispatch = useDispatch();
	const { templates, templatesTotal, isLoader } = useSelector((state: any) => state.richTextDocumentsReducer);

	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [category, setCategory] = useState<RichTextTemplateCategory | "">("");
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState<RichTextTemplate | null>(null);
	const [autoResolve, setAutoResolve] = useState(true);

	// Fetch cuando cambian filtros o página
	useEffect(() => {
		if (!open) return;
		dispatch(
			fetchRichTextTemplates({
				source: "user",
				search: search || undefined,
				category: category || undefined,
				page,
				limit: PAGE_SIZE,
			}) as any,
		);
	}, [open, search, category, page]); // eslint-disable-line react-hooks/exhaustive-deps

	// Reset al abrir
	useEffect(() => {
		if (!open) return;
		setSearchInput("");
		setSearch("");
		setCategory("");
		setPage(1);
		setSelected(null);
	}, [open]);

	// Debounce de búsqueda
	useEffect(() => {
		const t = setTimeout(() => {
			setSearch(searchInput);
			setPage(1);
		}, 350);
		return () => clearTimeout(t);
	}, [searchInput]);

	const totalPages = Math.ceil(templatesTotal / PAGE_SIZE);

	const handleContinue = () => {
		if (!selected) return;
		onClose();
		const params = new URLSearchParams({ templateId: selected._id });
		if (folderId) params.set("folderId", folderId);
		if (autoResolve) params.set("autoResolve", "true");
		navigate(`/documentos/escritos/nuevo?${params.toString()}`);
	};

	const handleBlank = () => {
		onClose();
		const params = new URLSearchParams();
		if (folderId) params.set("folderId", folderId);
		navigate(`/documentos/escritos/nuevo${folderId ? `?${params.toString()}` : ""}`);
	};

	return (
		<ResponsiveDialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{ elevation: 5, sx: { borderRadius: 2, overflow: "hidden" } }}
		>
			<DialogTitle sx={{ bgcolor: theme.palette.primary.lighter, p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
				<Stack spacing={1}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<DocumentText size={24} color={theme.palette.primary.main} variant="Bold" />
						<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
							Elegir Modelo
						</Typography>
					</Stack>
					<Typography variant="body2" color="textSecondary">
						Seleccioná un modelo para pre-cargar su contenido y campos dinámicos.
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />

			<DialogContent sx={{ pb: 1 }}>
				{/* Filtros */}
				<Stack direction="row" spacing={1.5} mb={2}>
					<TextField
						size="small"
						placeholder="Buscar modelo..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						sx={{ flex: 1 }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={14} />
								</InputAdornment>
							),
						}}
					/>
					<Select
						size="small"
						value={category}
						onChange={(e) => {
							setCategory(e.target.value as RichTextTemplateCategory | "");
							setPage(1);
						}}
						displayEmpty
						sx={{ minWidth: 180 }}
					>
						<MenuItem value="">Todas las categorías</MenuItem>
						{(Object.keys(CATEGORY_LABELS) as RichTextTemplateCategory[]).map((cat) => (
							<MenuItem key={cat} value={cat}>
								{CATEGORY_LABELS[cat]}
							</MenuItem>
						))}
					</Select>
				</Stack>

				{/* Lista de modelos */}
				{isLoader ? (
					<Stack alignItems="center" justifyContent="center" py={6}>
						<CircularProgress size={32} />
					</Stack>
				) : !Array.isArray(templates) || templates.length === 0 ? (
					<Stack alignItems="center" justifyContent="center" spacing={1} py={6}>
						<Typography variant="body2" color="text.secondary">
							{search || category
								? "No hay modelos que coincidan con los filtros."
								: "Todavía no creaste ningún modelo. Podés crear uno desde «Documentos › Modelos»."}
						</Typography>
					</Stack>
				) : (
					<Stack spacing={1}>
						{(templates as RichTextTemplate[]).map((tpl) => {
							const isSelected = selected?._id === tpl._id;
							return (
								<Paper
									key={tpl._id}
									variant="outlined"
									onClick={() => setSelected(isSelected ? null : tpl)}
									sx={{
										p: 1.5,
										cursor: "pointer",
										borderColor: isSelected ? "primary.main" : "divider",
										borderWidth: isSelected ? 2 : 1,
										bgcolor: isSelected ? "primary.lighter" : "background.paper",
										"&:hover": {
											borderColor: "primary.light",
											bgcolor: isSelected ? "primary.lighter" : "action.hover",
										},
										transition: "border-color 0.15s, background-color 0.15s",
									}}
								>
									<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
										<Stack spacing={0.5} flex={1} minWidth={0}>
											<Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={0.5}>
												<Typography variant="body2" fontWeight={600}>
													{tpl.name}
												</Typography>
												<Chip
													label={CATEGORY_LABELS[tpl.category]}
													size="small"
													color={CATEGORY_COLORS[tpl.category]}
													variant="outlined"
													sx={{ height: 18, fontSize: "0.65rem" }}
												/>
											</Stack>
											{tpl.description && (
												<Typography variant="caption" color="text.secondary" noWrap>
													{tpl.description}
												</Typography>
											)}
										</Stack>
										{tpl.mergeFields?.length > 0 && (
											<Chip
												label={`${tpl.mergeFields.length} campo${tpl.mergeFields.length !== 1 ? "s" : ""}`}
												size="small"
												variant="outlined"
												color="default"
												sx={{ flexShrink: 0, height: 20, fontSize: "0.65rem" }}
											/>
										)}
									</Stack>
								</Paper>
							);
						})}
					</Stack>
				)}

				{/* Paginación */}
				{totalPages > 1 && (
					<Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
						<Pagination count={totalPages} page={page} onChange={(_e, v) => setPage(v)} size="small" color="primary" />
					</Box>
				)}
			</DialogContent>
			<Divider />
			<DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
				<FormControlLabel
					control={<Switch checked={autoResolve} onChange={(e) => setAutoResolve(e.target.checked)} size="small" color="primary" />}
					label={
						<Typography variant="body2" color="text.secondary">
							Autocompletar automáticamente
						</Typography>
					}
				/>
				<Stack direction="row" spacing={1}>
					<Button variant="text" color="secondary" onClick={handleBlank}>
						Continuar sin modelo
					</Button>
					<Button variant="outlined" onClick={onClose}>
						Cancelar
					</Button>
					<Button variant="contained" onClick={handleContinue} disabled={!selected}>
						Crear documento
					</Button>
				</Stack>
			</DialogActions>
		</ResponsiveDialog>
	);
};

export default PickModelDialog;
