import { useState } from "react";
import { Box, Typography, Stack, Collapse, Chip, TextField, InputAdornment, Divider } from "@mui/material";
import { type Editor } from "@tiptap/react";
import { ArrowDown2, ArrowRight2, SearchNormal1 } from "iconsax-react";
import { MERGE_FIELD_GROUPS, GROUP_COLORS, type MergeFieldDef } from "./mergeFieldsDefs";

interface MergeFieldsPanelProps {
	editor: Editor;
	embedded?: boolean;
}

const MergeFieldsPanel = ({ editor, embedded }: MergeFieldsPanelProps) => {
	const [search, setSearch] = useState("");
	const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ bloque: true });

	const toggleGroup = (id: string) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

	const handleInsert = (field: MergeFieldDef) => {
		editor.commands.insertMergeField(field.key, field.label);
	};

	const query = search.toLowerCase().trim();
	const filtered = MERGE_FIELD_GROUPS.map((group) => ({
		...group,
		fields: query ? group.fields.filter((f) => f.label.toLowerCase().includes(query) || f.key.includes(query)) : group.fields,
	})).filter((g) => g.fields.length > 0);

	return (
		<Box
			sx={{
				...(embedded ? { flex: 1 } : { width: 220, flexShrink: 0, borderLeft: "1px solid", borderColor: "divider" }),
				display: "flex",
				flexDirection: "column",
				bgcolor: "background.paper",
				overflow: "hidden",
			}}
		>
			{/* Header — solo en modo standalone */}
			<Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
				{!embedded && (
					<Typography variant="subtitle2" fontWeight={600} gutterBottom>
						Campos dinámicos
					</Typography>
				)}
				<TextField
					size="small"
					placeholder="Buscar campo..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					fullWidth
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchNormal1 size={14} />
							</InputAdornment>
						),
					}}
					sx={{ "& .MuiInputBase-root": { fontSize: "0.75rem" } }}
				/>
			</Box>

			{/* Campo list */}
			<Box sx={{ flex: 1, overflowY: "auto" }}>
				{filtered.map((group, i) => (
					<Box key={group.id}>
						{i > 0 && <Divider />}
						{/* Group header */}
						<Box
							onClick={() => toggleGroup(group.id)}
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								px: 1.5,
								py: 0.75,
								cursor: "pointer",
								userSelect: "none",
								"&:hover": { bgcolor: "action.hover" },
							}}
						>
							<Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase">
								{group.title}
							</Typography>
							{openGroups[group.id] ? <ArrowDown2 size={12} /> : <ArrowRight2 size={12} />}
						</Box>

						<Collapse in={!!openGroups[group.id] || !!query}>
							<Stack spacing={0.5} sx={{ px: 1, pb: 1 }}>
								{group.fields.map((field) => {
									const c = GROUP_COLORS[group.id] ?? { bg: "#f5f5f5", color: "#333", border: "#ccc" };
									return (
										<Chip
											key={field.key}
											label={field.label}
											size="small"
											variant="outlined"
											onClick={() => handleInsert(field)}
											sx={{
												justifyContent: "flex-start",
												fontFamily: "monospace",
												fontSize: "0.7rem",
												height: 24,
												cursor: "pointer",
												borderColor: c.border,
												color: c.color,
												bgcolor: c.bg,
												"&:hover": { filter: "brightness(0.95)" },
											}}
										/>
									);
								})}
							</Stack>
						</Collapse>
					</Box>
				))}

				{filtered.length === 0 && (
					<Box sx={{ px: 2, py: 3, textAlign: "center" }}>
						<Typography variant="caption" color="text.disabled">
							Sin resultados
						</Typography>
					</Box>
				)}
			</Box>

			{/* Footer hint */}
			<Box sx={{ px: 1.5, py: 1, borderTop: "1px solid", borderColor: "divider" }}>
				<Typography variant="caption" color="text.disabled">
					Hacé clic para insertar en el cursor
				</Typography>
			</Box>
		</Box>
	);
};

export default MergeFieldsPanel;
