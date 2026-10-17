import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import dayjs from "utils/dayjs-config";
import { FilaRetroactivo, RetroactivoResultado } from "services/previsionalService";

// Tabla mes a mes del retroactivo previsional. La comparten el resultado del wizard y el detalle
// de los cálculos guardados; las columnas opcionales (tope / bono) se muestran sólo si hay datos.

interface TablaRetroactivoProps {
	filas: FilaRetroactivo[];
	conTope?: boolean;
	conBono?: boolean;
	bonoAparte?: boolean;
	/** Si se pasa, agrega una fila final con los totales de capital e interés. */
	totales?: RetroactivoResultado["totales"] | null;
	maxHeight?: number;
}

const money = (v: number | null | undefined) =>
	v === null || v === undefined
		? "—"
		: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(v);
const mes = (p: string) => dayjs(`${p}-01`).format("MM/YYYY");
const num = { whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" } as const;

/** Flags de columnas opcionales a partir de las filas y del tratamiento del bono. */
export function flagsDeFilas(filas: FilaRetroactivo[], tratamientoBono?: string) {
	const conTope = filas.some((f) => f.quitaTope);
	const conBono = filas.some((f) => f.bonoPercibido || f.bonoReclamado);
	return { conTope, conBono, bonoAparte: conBono && tratamientoBono !== "integrado" };
}

const TablaRetroactivo = ({ filas, conTope, conBono, bonoAparte, totales, maxHeight = 520 }: TablaRetroactivoProps) => {
	const derivados = flagsDeFilas(filas);
	const tope = conTope ?? derivados.conTope;
	const bono = conBono ?? derivados.conBono;
	const aparte = bonoAparte ?? derivados.bonoAparte;
	// columnas fijas (Mes, Percibido, Reclamado, Diferencia, SAC, Obra social, Capital, Interés) + opcionales
	const columnas = 8 + (tope ? 1 : 0) + (bono ? 2 : 0) + (aparte ? 1 : 0);

	return (
		<TableContainer component={Paper} variant="outlined" sx={{ maxHeight, mb: 2 }}>
			<Table size="small" stickyHeader>
				<TableHead>
					<TableRow>
						<TableCell>Mes</TableCell>
						<TableCell align="right">Percibido</TableCell>
						<TableCell align="right">Reclamado</TableCell>
						<TableCell align="right">Diferencia</TableCell>
						{tope && <TableCell align="right">Quita tope</TableCell>}
						{bono && <TableCell align="right">Bono percibido</TableCell>}
						{bono && <TableCell align="right">Bono reclamado</TableCell>}
						<TableCell align="right">SAC</TableCell>
						<TableCell align="right">Obra social</TableCell>
						{aparte && <TableCell align="right">Diferencia de bono</TableCell>}
						<TableCell align="right">Capital</TableCell>
						<TableCell align="right">Interés</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{filas.map((f) => (
						<TableRow key={f.periodo} hover>
							<TableCell>{mes(f.periodo)}</TableCell>
							<TableCell align="right" sx={num}>
								{money(f.percibido)}
							</TableCell>
							<TableCell align="right" sx={num}>
								{money(f.reclamado)}
							</TableCell>
							<TableCell align="right" sx={num}>
								{money(f.diferencia)}
							</TableCell>
							{tope && (
								<TableCell align="right" sx={num}>
									{f.quitaTope ? money(f.quitaTope) : "—"}
								</TableCell>
							)}
							{bono && (
								<TableCell align="right" sx={num}>
									{f.bonoPercibido ? money(f.bonoPercibido) : "—"}
								</TableCell>
							)}
							{bono && (
								<TableCell align="right" sx={num}>
									{f.bonoReclamado ? money(f.bonoReclamado) : "—"}
								</TableCell>
							)}
							<TableCell align="right" sx={num}>
								{f.sac ? money(f.sac) : "—"}
							</TableCell>
							<TableCell align="right" sx={num}>
								{money(f.obraSocial)}
							</TableCell>
							{aparte && (
								<TableCell align="right" sx={num}>
									{f.diferenciaBono ? money(f.diferenciaBono) : "—"}
								</TableCell>
							)}
							<TableCell align="right" sx={num}>
								{money(f.capital)}
							</TableCell>
							<TableCell align="right" sx={num}>
								{money(f.interes)}
							</TableCell>
						</TableRow>
					))}
					{totales && (
						<TableRow sx={{ "& td": { fontWeight: 600, bgcolor: "action.hover" } }}>
							<TableCell colSpan={columnas - 2}>Totales</TableCell>
							<TableCell align="right" sx={num}>
								{money(totales.capital)}
							</TableCell>
							<TableCell align="right" sx={num}>
								{money(totales.intereses)}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default TablaRetroactivo;
