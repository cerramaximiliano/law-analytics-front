import React from "react";
import { Box, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import TablaRetroactivo, { flagsDeFilas } from "components/calculator/TablaRetroactivo";
import { RetroactivoResultado } from "services/previsionalService";
import { armarBloquesTramos, fechaCorta, mesCorto, FilaDetalleTramo, TramoBloque } from "utils/previsionalTramos";

// Liquidación por tramos del retroactivo previsional con pagos a cuenta (formato de los liquidadores): por cada
// tramo la tabla mensual cortada en el mes del pago y debajo el cuadro "Detalle"; al final el cuadro "Pagos a
// cuenta" con el remanente. El último "Saldo al <cierre>" es el resultado: no hay un total global aparte.

interface LiquidacionPorTramosProps {
	resultado: RetroactivoResultado;
	maxHeight?: number;
}

const money = (v: number | null | undefined) =>
	v === null || v === undefined
		? "—"
		: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(v);
const num = { whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" } as const;

const estiloFila = (f: FilaDetalleTramo) => ({
	"& td": {
		...(f.negrita ? { fontWeight: 700, bgcolor: "action.hover" } : {}),
		...(f.negativo ? { color: "error.main" } : {}),
	},
});

const CuadroDetalle = ({ tramo }: { tramo: TramoBloque }) => (
	<TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 760 }}>
		<Table size="small">
			<TableHead>
				<TableRow>
					<TableCell>Detalle</TableCell>
					<TableCell align="right">Capital</TableCell>
					<TableCell align="right">Intereses</TableCell>
					<TableCell align="right">Total</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{tramo.detalle.map((f) => (
					<TableRow key={f.label} sx={estiloFila(f)}>
						<TableCell>{f.label}</TableCell>
						<TableCell align="right" sx={num}>
							{f.capital === null ? "—" : money(f.capital)}
						</TableCell>
						<TableCell align="right" sx={num}>
							{money(f.intereses)}
						</TableCell>
						<TableCell align="right" sx={num}>
							{money(f.total)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	</TableContainer>
);

const LiquidacionPorTramos = ({ resultado: r, maxHeight = 440 }: LiquidacionPorTramosProps) => {
	const bloques = armarBloquesTramos(r);
	if (!bloques.tramos.length) return null;
	// Las columnas opcionales (tope / bono) se deciden sobre todas las filas para que las tablas de los tramos coincidan
	const flags = flagsDeFilas(r.filas, r.bono?.tratamiento);
	const { remanente } = bloques;

	return (
		<Stack spacing={3}>
			{bloques.tramos.map((t) => {
				const pago = t.corte.pago;
				const suma = { capital: t.filas.reduce((a, f) => a + f.capital, 0), intereses: t.filas.reduce((a, f) => a + f.interes, 0) };
				return (
					<Box key={t.indice}>
						<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
							Tramo {t.indice + 1} · {mesCorto(t.desde)} a {mesCorto(t.hasta.slice(0, 7))}
							{pago ? ` · corte por pago del ${fechaCorta(pago.fecha)}` : ` · hasta el cierre del ${fechaCorta(t.hasta)}`}
						</Typography>
						{t.filas.length ? (
							<TablaRetroactivo filas={t.filas} {...flags} totales={suma} sumaLabel="Suma del tramo" maxHeight={maxHeight} />
						) : (
							<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
								Sin diferencias mensuales en este tramo.
							</Typography>
						)}
						<CuadroDetalle tramo={t} />
					</Box>
				);
			})}

			<Box>
				<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
					Pagos a cuenta
				</Typography>
				<TableContainer component={Paper} variant="outlined">
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Fecha</TableCell>
								<TableCell>Tipo</TableCell>
								<TableCell align="right">Importe</TableCell>
								<TableCell align="right">Imputado a intereses</TableCell>
								<TableCell align="right">Imputado a capital</TableCell>
								<TableCell align="right">Saldo luego del pago</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{bloques.pagos.map((p, i) => (
								<TableRow key={`${p.fecha}-${i}`}>
									<TableCell sx={num}>{fechaCorta(p.fecha)}</TableCell>
									<TableCell>{p.label}</TableCell>
									<TableCell align="right" sx={num}>
										{money(p.importe)}
									</TableCell>
									<TableCell align="right" sx={num}>
										{money(p.imputadoInteres)}
									</TableCell>
									<TableCell align="right" sx={num}>
										{money(p.imputadoCapital)}
									</TableCell>
									<TableCell align="right" sx={num}>
										{money(p.saldoLuego)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
				{remanente && (
					<Typography variant="body2" sx={{ mt: 1 }}>
						Remanente del último pago actualizado al {fechaCorta(remanente.hasta)}: {money(remanente.saldoLuego)} + intereses sobre ese
						saldo {money(remanente.interesesPosteriores)} = <strong>{money(remanente.actualizado)}</strong>.
					</Typography>
				)}
			</Box>
		</Stack>
	);
};

export default LiquidacionPorTramos;
