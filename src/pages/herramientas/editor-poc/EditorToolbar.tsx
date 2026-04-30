import { useRef } from "react";
import { useEditorState } from "@tiptap/react";
import {
	Box,
	Button,
	Divider,
	IconButton,
	Select,
	MenuItem,
	Tooltip,
	ToggleButton,
	ToggleButtonGroup,
	Popover,
	Stack,
	Typography,
} from "@mui/material";
import { type Editor } from "@tiptap/react";
import {
	TextBold,
	TextItalic,
	TextUnderline,
	TextBlock,
	TextalignLeft,
	TextalignCenter,
	TextalignRight,
	TextalignJustifycenter,
	HambergerMenu,
	ArrowRotateLeft,
	ArrowRotateRight,
	Colorfilter,
	RowVertical,
	MenuBoard,
} from "iconsax-react";
import { useState } from "react";

// ==============================|| EDITOR TOOLBAR ||============================== //

interface EditorToolbarProps {
	editor: Editor;
	onExportPdf?: () => void;
}

const HEADINGS = [
	{ value: "paragraph", label: "Párrafo" },
	{ value: "h1", label: "Título 1" },
	{ value: "h2", label: "Título 2" },
	{ value: "h3", label: "Título 3" },
];

const FONT_SIZES = ["10", "11", "12", "14", "16", "18", "20", "24", "28", "32"];

const LINE_HEIGHTS = [
	{ value: "1", label: "Simple" },
	{ value: "1.15", label: "1.15" },
	{ value: "1.5", label: "1.5" },
	{ value: "2", label: "Doble" },
];

const PRESET_COLORS = [
	"#000000",
	"#1a1a2e",
	"#16213e",
	"#0f3460",
	"#1565c0",
	"#0288d1",
	"#00695c",
	"#2e7d32",
	"#c62828",
	"#ad1457",
	"#6a1b9a",
	"#f57f17",
	"#546e7a",
	"#795548",
	"#616161",
	"#ffffff",
];

const EditorToolbar = ({ editor, onExportPdf }: EditorToolbarProps) => {
	const [colorAnchor, setColorAnchor] = useState<HTMLButtonElement | null>(null);
	const colorInputRef = useRef<HTMLInputElement>(null);

	const { canUndo, canRedo } = useEditorState({
		editor,
		selector: (ctx) => ({
			canUndo: ctx.editor.can().undo(),
			canRedo: ctx.editor.can().redo(),
		}),
	});

	const getHeadingValue = () => {
		if (editor.isActive("heading", { level: 1 })) return "h1";
		if (editor.isActive("heading", { level: 2 })) return "h2";
		if (editor.isActive("heading", { level: 3 })) return "h3";
		return "paragraph";
	};

	const handleHeadingChange = (value: string) => {
		if (value === "paragraph") {
			editor.chain().focus().setParagraph().run();
		} else {
			const level = parseInt(value.replace("h", "")) as 1 | 2 | 3;
			editor.chain().focus().toggleHeading({ level }).run();
		}
	};

	const getAlignValue = () => {
		if (editor.isActive({ textAlign: "center" })) return "center";
		if (editor.isActive({ textAlign: "right" })) return "right";
		if (editor.isActive({ textAlign: "justify" })) return "justify";
		return "left";
	};

	const getCurrentFontSize = () => {
		const attrs = editor.getAttributes("textStyle");
		return attrs?.fontSize ?? "12";
	};

	const getCurrentLineHeight = () => {
		const pAttrs = editor.getAttributes("paragraph");
		return pAttrs?.lineHeight ?? "";
	};

	const getCurrentColor = () => {
		const attrs = editor.getAttributes("textStyle");
		return attrs?.color ?? "#000000";
	};

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				gap: 0.5,
				px: 1,
				py: 0.5,
				borderBottom: "1px solid",
				borderColor: "divider",
				flexWrap: "wrap",
				bgcolor: "background.paper",
			}}
		>
			{/* Deshacer / Rehacer */}
			<Tooltip title="Deshacer">
				<span>
					<IconButton size="small" onClick={() => editor.chain().focus().undo().run()} disabled={!canUndo}>
						<ArrowRotateLeft size={16} />
					</IconButton>
				</span>
			</Tooltip>
			<Tooltip title="Rehacer">
				<span>
					<IconButton size="small" onClick={() => editor.chain().focus().redo().run()} disabled={!canRedo}>
						<ArrowRotateRight size={16} />
					</IconButton>
				</span>
			</Tooltip>

			<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

			{/* Estilo de párrafo */}
			<Select
				size="small"
				value={getHeadingValue()}
				onChange={(e) => handleHeadingChange(e.target.value)}
				sx={{ fontSize: "0.75rem", height: 28, minWidth: 100 }}
			>
				{HEADINGS.map((h) => (
					<MenuItem key={h.value} value={h.value} sx={{ fontSize: "0.75rem" }}>
						{h.label}
					</MenuItem>
				))}
			</Select>

			{/* Tamaño de fuente */}
			<Select
				size="small"
				value={getCurrentFontSize()}
				onChange={(e) => {
					const val = e.target.value as string;
					if (val) {
						editor.chain().focus().setFontSize(val).run();
					} else {
						editor.chain().focus().unsetFontSize().run();
					}
				}}
				sx={{ fontSize: "0.75rem", height: 28, minWidth: 60 }}
			>
				{FONT_SIZES.map((s) => (
					<MenuItem key={s} value={s} sx={{ fontSize: "0.75rem" }}>
						{s}
					</MenuItem>
				))}
			</Select>

			<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

			{/* Formato de texto */}
			<ToggleButtonGroup size="small" sx={{ "& .MuiToggleButton-root": { border: "none", borderRadius: 1, p: 0.5 } }}>
				<Tooltip title="Negrita (Ctrl+B)">
					<ToggleButton value="bold" selected={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
						<TextBold size={16} />
					</ToggleButton>
				</Tooltip>
				<Tooltip title="Cursiva (Ctrl+I)">
					<ToggleButton value="italic" selected={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
						<TextItalic size={16} />
					</ToggleButton>
				</Tooltip>
				<Tooltip title="Subrayado (Ctrl+U)">
					<ToggleButton
						value="underline"
						selected={editor.isActive("underline")}
						onClick={() => editor.chain().focus().toggleUnderline().run()}
					>
						<TextUnderline size={16} />
					</ToggleButton>
				</Tooltip>
				<Tooltip title="Tachado">
					<ToggleButton value="strike" selected={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
						<TextBlock size={16} />
					</ToggleButton>
				</Tooltip>
			</ToggleButtonGroup>

			<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

			{/* Color de texto */}
			<Tooltip title="Color de texto">
				<IconButton size="small" onClick={(e) => setColorAnchor(e.currentTarget)} sx={{ position: "relative" }}>
					<Box sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
						<Colorfilter size={16} />
						<Box
							sx={{
								width: 14,
								height: 3,
								borderRadius: 0.5,
								bgcolor: getCurrentColor(),
								mt: "1px",
								border: "1px solid",
								borderColor: "divider",
							}}
						/>
					</Box>
				</IconButton>
			</Tooltip>

			<Popover
				open={Boolean(colorAnchor)}
				anchorEl={colorAnchor}
				onClose={() => setColorAnchor(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
				transformOrigin={{ vertical: "top", horizontal: "left" }}
				PaperProps={{ sx: { p: 1.5, width: 200 } }}
			>
				<Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
					Color de texto
				</Typography>
				{/* Paleta de colores */}
				<Box sx={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 0.5, mb: 1.5 }}>
					{PRESET_COLORS.map((color) => (
						<Box
							key={color}
							onClick={() => {
								editor.chain().focus().setColor(color).run();
								setColorAnchor(null);
							}}
							sx={{
								width: 20,
								height: 20,
								bgcolor: color,
								borderRadius: 0.5,
								border: "1px solid",
								borderColor: getCurrentColor() === color ? "primary.main" : "divider",
								cursor: "pointer",
								"&:hover": { transform: "scale(1.15)", zIndex: 1 },
								transition: "transform 0.1s",
							}}
						/>
					))}
				</Box>
				{/* Color personalizado */}
				<Stack direction="row" alignItems="center" spacing={1}>
					<Typography variant="caption" color="text.secondary">
						Personalizado:
					</Typography>
					<input
						ref={colorInputRef}
						type="color"
						value={getCurrentColor()}
						onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
						style={{ width: 32, height: 24, padding: 0, border: "none", cursor: "pointer", background: "none" }}
					/>
					<Box
						sx={{ fontSize: "0.7rem", color: "text.secondary", cursor: "pointer", "&:hover": { color: "text.primary" } }}
						onClick={() => {
							editor.chain().focus().unsetColor().run();
							setColorAnchor(null);
						}}
					>
						Limpiar
					</Box>
				</Stack>
			</Popover>

			<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

			{/* Alineación */}
			<ToggleButtonGroup
				size="small"
				exclusive
				value={getAlignValue()}
				onChange={(_, val) => val && editor.chain().focus().setTextAlign(val).run()}
				sx={{ "& .MuiToggleButton-root": { border: "none", borderRadius: 1, p: 0.5 } }}
			>
				<Tooltip title="Alinear izquierda">
					<ToggleButton value="left">
						<TextalignLeft size={16} />
					</ToggleButton>
				</Tooltip>
				<Tooltip title="Centrar">
					<ToggleButton value="center">
						<TextalignCenter size={16} />
					</ToggleButton>
				</Tooltip>
				<Tooltip title="Alinear derecha">
					<ToggleButton value="right">
						<TextalignRight size={16} />
					</ToggleButton>
				</Tooltip>
				<Tooltip title="Justificar">
					<ToggleButton value="justify">
						<TextalignJustifycenter size={16} />
					</ToggleButton>
				</Tooltip>
			</ToggleButtonGroup>

			<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

			{/* Interlineado */}
			<Tooltip title="Interlineado">
				<Select
					size="small"
					value={getCurrentLineHeight()}
					onChange={(e) => {
						const val = e.target.value as string;
						if (val) {
							editor.chain().focus().setLineHeight(val).run();
						} else {
							editor.chain().focus().unsetLineHeight().run();
						}
					}}
					displayEmpty
					renderValue={(val) => (
						<Stack direction="row" alignItems="center" spacing={0.5}>
							<RowVertical size={14} />
							<span style={{ fontSize: "0.75rem" }}>{val || "—"}</span>
						</Stack>
					)}
					sx={{ height: 28, minWidth: 74, "& .MuiSelect-select": { display: "flex", alignItems: "center", fontSize: "0.75rem" } }}
				>
					<MenuItem value="" sx={{ fontSize: "0.75rem" }}>
						Por defecto
					</MenuItem>
					{LINE_HEIGHTS.map((lh) => (
						<MenuItem key={lh.value} value={lh.value} sx={{ fontSize: "0.75rem" }}>
							{lh.label}
						</MenuItem>
					))}
				</Select>
			</Tooltip>

			<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

			{/* Listas */}
			<Tooltip title="Lista con viñetas">
				<ToggleButton
					value="bulletList"
					size="small"
					selected={editor.isActive("bulletList")}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					sx={{ border: "none", borderRadius: 1, p: 0.5 }}
				>
					<HambergerMenu size={16} />
				</ToggleButton>
			</Tooltip>

			<Tooltip title="Lista numerada">
				<ToggleButton
					value="orderedList"
					size="small"
					selected={editor.isActive("orderedList")}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					sx={{ border: "none", borderRadius: 1, p: 0.5 }}
				>
					<MenuBoard size={16} />
				</ToggleButton>
			</Tooltip>

			{onExportPdf && (
				<>
					<Box sx={{ flex: 1 }} />
					<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
					<Button size="small" variant="outlined" onClick={onExportPdf} sx={{ fontSize: "0.75rem", height: 28, whiteSpace: "nowrap" }}>
						Vista previa PDF
					</Button>
				</>
			)}
		</Box>
	);
};

export default EditorToolbar;
