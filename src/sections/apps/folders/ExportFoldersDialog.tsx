// Exportación del listado de carpetas (16/11/2026): el usuario elige CSV o PDF y se descargan todas las filas de la
// lista (no solo la página) con las columnas que tiene visibles. Los valores llegan ya como texto, uno por columna.
import { useState } from "react";
import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Radio,
	RadioGroup,
	Stack,
	Typography,
} from "@mui/material";
import dayjs from "utils/dayjs-config";
import { BRAND_BLUE } from "themes/dashboardTokens";

export interface ExportColumn {
	id: string;
	label: string;
}

interface ExportFoldersDialogProps {
	open: boolean;
	onClose: () => void;
	columns: ExportColumn[];
	/** Una fila por carpeta: texto por id de columna. */
	rows: Record<string, string>[];
	/** Qué filas son: «las 12 carpetas seleccionadas», «las 472 carpetas de la lista»… */
	scopeLabel: string;
}

type Formato = "csv" | "pdf";

const download = (blob: Blob, filename: string) => {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const csvCell = (v: string) => (/[",\n\r;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** CSV con BOM para que Excel lea bien los acentos. */
export const buildCsv = (columns: ExportColumn[], rows: Record<string, string>[]): string =>
	"﻿" +
	[columns.map((c) => csvCell(c.label)).join(","), ...rows.map((r) => columns.map((c) => csvCell(r[c.id] || "")).join(","))].join("\r\n");

// Ancho relativo de cada columna en el PDF: los textos largos se llevan más lugar.
const PDF_WEIGHT: Record<string, number> = {
	folderName: 3.2,
	description: 2.6,
	materia: 2,
	"judFolder.courtNumber": 2,
	ubicacionActual: 2.2,
	"folderJuris.label": 2,
	responsables: 1.8,
};

export async function buildPdf(
	columns: ExportColumn[],
	rows: Record<string, string>[],
	subtitle: string,
	/** Título del listado y anchos relativos por columna; por defecto, los de Mis Carpetas. */
	opts: { title?: string; weights?: Record<string, number> } = {},
): Promise<Blob> {
	const title = opts.title || "Carpetas";
	const weights = opts.weights || PDF_WEIGHT;
	// Carga diferida: la librería de PDF pesa y solo hace falta al exportar.
	const { Document, Page, StyleSheet, Text, View, pdf } = await import("@react-pdf/renderer");
	const total = columns.reduce((acc, c) => acc + (weights[c.id] || 1.3), 0);
	const width = (c: ExportColumn) => `${((weights[c.id] || 1.3) / total) * 100}%`;
	const fontSize = columns.length > 10 ? 6.5 : columns.length > 7 ? 7.5 : 8.5;
	const st = StyleSheet.create({
		page: { paddingTop: 28, paddingBottom: 36, paddingHorizontal: 28, fontSize, color: "#1b2533" },
		title: { fontSize: 14, fontWeight: 700, marginBottom: 3 },
		subtitle: { fontSize: 8.5, color: "#5d6b7e", marginBottom: 12 },
		head: { flexDirection: "row", backgroundColor: "#eef3fb", borderBottom: "1px solid #c9d6ea" },
		row: { flexDirection: "row", borderBottom: "0.5px solid #e3e8f0" },
		th: { paddingVertical: 5, paddingHorizontal: 4, fontWeight: 700, color: "#2a4a80" },
		td: { paddingVertical: 4, paddingHorizontal: 4 },
		foot: {
			position: "absolute",
			bottom: 16,
			left: 28,
			right: 28,
			fontSize: 7.5,
			color: "#7a8799",
			flexDirection: "row",
			justifyContent: "space-between",
		},
	});
	const doc = (
		<Document title={title}>
			<Page size="A4" orientation="landscape" style={st.page}>
				<Text style={st.title}>{title}</Text>
				<Text style={st.subtitle}>{subtitle}</Text>
				<View style={st.head} fixed>
					{columns.map((c) => (
						<Text key={c.id} style={[st.th, { width: width(c) }]}>
							{c.label}
						</Text>
					))}
				</View>
				{rows.map((r, i) => (
					<View key={i} style={st.row} wrap={false}>
						{columns.map((c) => (
							<Text key={c.id} style={[st.td, { width: width(c) }]}>
								{r[c.id] || "—"}
							</Text>
						))}
					</View>
				))}
				<View style={st.foot} fixed>
					<Text>Law Analytics</Text>
					<Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
				</View>
			</Page>
		</Document>
	);
	return pdf(doc).toBlob();
}

const ExportFoldersDialog = ({ open, onClose, columns, rows, scopeLabel }: ExportFoldersDialogProps) => {
	const [formato, setFormato] = useState<Formato>("csv");
	const [working, setWorking] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleDownload = async () => {
		setError(null);
		setWorking(true);
		const stamp = dayjs().format("YYYY-MM-DD");
		try {
			if (formato === "csv") {
				download(new Blob([buildCsv(columns, rows)], { type: "text/csv;charset=utf-8" }), `carpetas-${stamp}.csv`);
			} else {
				const subtitle = `${rows.length} ${rows.length === 1 ? "carpeta" : "carpetas"} · ${dayjs().format("DD/MM/YYYY HH:mm")}`;
				download(await buildPdf(columns, rows, subtitle), `carpetas-${stamp}.pdf`);
			}
			onClose();
		} catch {
			setError("No se pudo generar el archivo. Probá de nuevo o elegí el otro formato.");
		} finally {
			setWorking(false);
		}
	};

	return (
		<Dialog open={open} onClose={working ? undefined : onClose} maxWidth="xs" fullWidth data-testid="export-folders-dialog">
			<DialogTitle sx={{ fontWeight: 600 }}>Exportar carpetas</DialogTitle>
			<DialogContent>
				<Stack spacing={2}>
					<Typography variant="body2" color="text.secondary">
						Se descargan {scopeLabel}, con las {columns.length} columnas que tenés visibles: {columns.map((c) => c.label).join(", ")}.
					</Typography>
					<RadioGroup value={formato} onChange={(e) => setFormato(e.target.value as Formato)}>
						<FormControlLabel
							value="csv"
							control={<Radio size="small" />}
							label={
								<Stack>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										CSV (planilla)
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Para abrir y trabajar en Excel o Google Sheets.
									</Typography>
								</Stack>
							}
							sx={{ alignItems: "flex-start", mb: 1, "& .MuiRadio-root": { pt: 0.25 } }}
						/>
						<FormControlLabel
							value="pdf"
							control={<Radio size="small" />}
							label={
								<Stack>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										PDF
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Listado en hoja A4 apaisada, para imprimir o compartir.
									</Typography>
								</Stack>
							}
							sx={{ alignItems: "flex-start", "& .MuiRadio-root": { pt: 0.25 } }}
						/>
					</RadioGroup>
					{error && <Alert severity="error">{error}</Alert>}
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} disabled={working} sx={{ textTransform: "none" }}>
					Cancelar
				</Button>
				<Button
					variant="contained"
					onClick={handleDownload}
					disabled={working || rows.length === 0 || columns.length === 0}
					startIcon={working ? <CircularProgress size={14} color="inherit" /> : undefined}
					data-testid="export-folders-download"
					sx={{ textTransform: "none", bgcolor: BRAND_BLUE, "&:hover": { bgcolor: BRAND_BLUE } }}
				>
					{working ? "Generando…" : "Descargar"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ExportFoldersDialog;
