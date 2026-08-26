import { Box, Checkbox, FormControlLabel, Stack, Typography, alpha, useTheme } from "@mui/material";

/**
 * Checkbox de "sobrescribir" + aviso de qué datos propios se van a perder.
 *
 * Antes cada modal de vinculación (PJN, Buenos Aires, CABA) repetía su propio
 * checkbox con el texto "carátula, juzgado y número de expediente", que era
 * inexacto en las dos direcciones: no mencionaba materia, jurisdicción ni fuero
 * —que sí se pisan— y prometía reemplazar el número de expediente, que es
 * justamente el único dato que se preserva. Además el usuario tildaba sin ver
 * qué valores suyos estaba por perder.
 *
 * Relevamiento completo: docs/vinculacion-overwrite-2026-08-26.md (pjsalta-workers).
 */

export type SyncTarget = "pjn" | "mev" | "eje" | "iol";

type Campo = { label: string; get: (f: any) => any };

const CARATULA: Campo = { label: "Carátula", get: (f) => f?.folderName };
const MATERIA: Campo = { label: "Materia", get: (f) => f?.materia };
const JUZGADO: Campo = { label: "Juzgado", get: (f) => f?.judFolder?.courtNumber };
const SECRETARIA: Campo = { label: "Secretaría", get: (f) => f?.judFolder?.secretaryNumber };
const JURISDICCION: Campo = { label: "Jurisdicción", get: (f) => f?.folderJuris?.label || f?.folderJuris };
const FUERO: Campo = { label: "Fuero", get: (f) => f?.folderFuero };

// Qué reemplaza realmente cada sistema cuando `overwrite` está activo.
const CAMPOS: Record<SyncTarget, Campo[]> = {
	pjn: [CARATULA, MATERIA, JUZGADO, SECRETARIA],
	mev: [CARATULA, MATERIA, JUZGADO, JURISDICCION, FUERO],
	eje: [CARATULA, MATERIA, JURISDICCION],
	iol: [CARATULA, MATERIA, JUZGADO, SECRETARIA, JURISDICCION],
};

const ORIGEN: Record<SyncTarget, string> = {
	pjn: "el Poder Judicial de la Nación",
	mev: "la Mesa de Entradas Virtual",
	eje: "el sistema EJE",
	iol: "el portal judicial",
};

interface OverwriteNoticeProps {
	checked: boolean;
	onChange: (value: boolean) => void;
	/** Carpeta actual — de acá salen los valores que se van a reemplazar. */
	folder?: any;
	target: SyncTarget;
	accent?: string;
}

const OverwriteNotice = ({ checked, onChange, folder, target, accent }: OverwriteNoticeProps) => {
	const theme = useTheme();
	const color = accent || theme.palette.primary.main;

	// Solo se listan los campos que HOY tienen un valor cargado: son los únicos
	// que el usuario puede perder. Un campo vacío no es una advertencia.
	const aReemplazar = CAMPOS[target]
		.map((c) => ({ label: c.label, value: c.get(folder) }))
		.filter((r) => r.value !== undefined && r.value !== null && String(r.value).trim() !== "");

	return (
		<Stack spacing={1}>
			<FormControlLabel
				sx={{ m: 0, alignItems: "flex-start" }}
				control={
					<Checkbox
						checked={checked}
						onChange={(e) => onChange(e.target.checked)}
						size="small"
						sx={{ color: alpha(color, 0.5), "&.Mui-checked": { color }, pt: 0 }}
					/>
				}
				label={
					<Typography sx={{ fontSize: "0.78rem", color: "text.primary", lineHeight: 1.5, ml: 0.5 }}>
						Reemplazar los datos de esta carpeta con los que publique {ORIGEN[target]}.{" "}
						<Box component="span" sx={{ color: "text.secondary" }}>
							El número de expediente que cargaste se conserva siempre.
						</Box>
					</Typography>
				}
			/>

			{checked && aReemplazar.length > 0 && (
				<Box
					sx={{
						p: 1.25,
						borderRadius: 1.25,
						bgcolor: alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.1 : 0.06),
						border: `1px solid ${alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.28 : 0.2)}`,
					}}
				>
					<Typography
						sx={{
							fontSize: "0.66rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "text.secondary",
							mb: 0.75,
						}}
					>
						Se van a reemplazar estos datos tuyos
					</Typography>
					<Stack spacing={0.375}>
						{aReemplazar.map((r) => (
							<Typography key={r.label} sx={{ fontSize: "0.76rem", color: "text.secondary", lineHeight: 1.45 }}>
								<Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
									{r.label}:
								</Box>{" "}
								{String(r.value)}
							</Typography>
						))}
					</Stack>
					<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.75, fontStyle: "italic" }}>
						Destildá la opción si preferís conservarlos.
					</Typography>
				</Box>
			)}
		</Stack>
	);
};

export default OverwriteNotice;
