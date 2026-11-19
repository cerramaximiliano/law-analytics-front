import { useEffect, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, ButtonBase, Stack, Typography, Tooltip } from "@mui/material";
import MainCard from "components/MainCard";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Warning2 } from "iconsax-react";
import logoPJNacion from "assets/images/logos/logo_pj_nacion.png";

import { BRAND_BLUE } from "themes/dashboardTokens";
import AyudaActosPjn from "sections/actividad-propia/AyudaActosPjn";
import AvisoEscritosDetenidos from "sections/actividad-propia/AvisoEscritosDetenidos";
import { fetchResumenActividadPropia, TRAMOS, AMBAR_TEXTO, type ResumenActividadPropia } from "services/actividadPropiaService";

// Jurisdicción del widget: hoy solo PJN; cuando haya bandejas de otras jurisdicciones, un widget por cada una.
const JURISDICCION = { sigla: "PJN", logo: logoPJNacion, fondo: "#232D4F" };

const LISTADO = "/apps/folders/list";

/**
 * Widget del panel «Actos del letrado en PJN» (10/11/2026): carpetas PJN activas por días desde el
 * último acto propio, por tramos. No lista carpetas: los tramos y los enlaces llevan al listado filtrado.
 * No se muestra si el usuario no tiene credencial PJN con bandeja, si apagó los escritos en Integraciones → PJN
 * o si no hay actos registrados. Con la lectura detenida se muestra con el aviso de datos congelados.
 */
/** `onVisible`: avisa al panel si el widget se muestra, para acomodar la fila. */
const ActividadPropiaWidget = ({ onVisible }: { onVisible?: (visible: boolean) => void }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const navigate = useNavigate();
	const [data, setData] = useState<ResumenActividadPropia | null>(null);

	useEffect(() => {
		let vivo = true;
		fetchResumenActividadPropia().then((r) => vivo && setData(r));
		return () => {
			vivo = false;
		};
	}, []);

	const conActos = data ? data.total - data.tramos.sinActos : 0;
	const visible = !!data && data.habilitado && data.activo === true && (conActos > 0 || data.pendientes > 0);
	useEffect(() => {
		onVisible?.(visible);
	}, [visible, onVisible]);
	if (!data || !visible) return null;

	const gris = alpha(theme.palette.text.primary, isDark ? 0.28 : 0.18);
	const ambar = isDark ? AMBAR_TEXTO.dark : AMBAR_TEXTO.light;
	// Las que no tienen días que contar: cuentan en el total y en la barra.
	// «Sin proveer» va aparte: no es un tramo, una carpeta con días contados también puede tener escritos sin proveer.
	const otros = [
		{
			key: "sinActos",
			label: "Sin escritos en el expediente",
			ayuda:
				"Ningún escrito, cédula ni DEOX presentado con tu credencial PJN figura todavía como movimiento en estas causas: no hay días que contar.",
			n: data.tramos.sinActos,
			color: gris,
			enBarra: true,
		},
		{
			key: "pendientes",
			label: "Con escritos sin proveer",
			ayuda: "Causas con escritos presentados que el juzgado todavía no proveyó. No corren el contador hasta que figuren en el expediente.",
			n: data.pendientes,
			color: ambar,
			enBarra: false,
		},
	].filter((o) => o.n > 0);

	const ir = (filtro: string) => navigate(`${LISTADO}?actividadPropia=${filtro}`);

	return (
		<MainCard>
			<Stack spacing={1.75}>
				<Stack direction="row" alignItems="center" spacing={1.5}>
					<Box
						component="img"
						src={JURISDICCION.logo}
						alt={JURISDICCION.sigla}
						title={JURISDICCION.sigla}
						sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: "contain", bgcolor: JURISDICCION.fondo, p: 0.5, flexShrink: 0 }}
					/>
					<Stack spacing={0.25}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Typography variant="subtitle1" sx={{ letterSpacing: "-0.005em" }}>
								Escritos presentados en PJN
							</Typography>
							<AyudaActosPjn />
						</Stack>
						<Typography variant="caption" sx={{ color: "text.secondary" }}>
							{data.total.toLocaleString("es-AR")} carpetas activas · días desde la última presentación
						</Typography>
					</Stack>
				</Stack>

				<AvisoEscritosDetenidos sincronizacion={data.sincronizacion} />

				<Box sx={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", bgcolor: alpha(theme.palette.text.primary, 0.06) }}>
					{TRAMOS.map((t) =>
						data.tramos[t.key] > 0 ? (
							<Tooltip key={t.key} title={`${t.label}: ${data.tramos[t.key]}`} arrow>
								<Box sx={{ width: `${(data.tramos[t.key] / data.total) * 100}%`, minWidth: 4, bgcolor: t.color }} />
							</Tooltip>
						) : null,
					)}
					{otros
						.filter((o) => o.enBarra)
						.map((o) => (
							<Tooltip key={o.key} title={`${o.label}: ${o.n}`} arrow>
								<Box sx={{ width: `${(o.n / data.total) * 100}%`, minWidth: 4, bgcolor: o.color }} />
							</Tooltip>
						))}
				</Box>

				<Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
					{TRAMOS.map((t) => (
						<ButtonBase
							key={t.key}
							onClick={() => ir(t.key)}
							sx={{
								justifyContent: "space-between",
								px: 0.75,
								py: 0.5,
								borderRadius: 0.75,
								"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06) },
							}}
						>
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: t.color }} />
								<Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{t.corto}</Typography>
							</Stack>
							<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
								{data.tramos[t.key]}
							</Typography>
						</ButtonBase>
					))}
					{otros.map((o) => (
						<Tooltip key={o.key} title={o.ayuda} arrow placement="left">
							<ButtonBase
								onClick={() => ir(o.key)}
								sx={{
									gridColumn: "1 / -1",
									justifyContent: "space-between",
									px: 0.75,
									py: 0.5,
									borderRadius: 0.75,
									"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06) },
								}}
							>
								<Stack direction="row" spacing={0.75} alignItems="center">
									{/* Sin proveer no es un tramo: ícono de aviso (como en la columna), no un cuadrado de color que en oscuro se confunde con 91–180 d. */}
									{o.enBarra ? (
										<Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: o.color }} />
									) : (
										<Warning2 size={12} variant="Bold" color={o.color} />
									)}
									<Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{o.label}</Typography>
								</Stack>
								<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{o.n}</Typography>
							</ButtonBase>
						</Tooltip>
					))}
				</Box>

				<Button
					endIcon={<ArrowRight size={14} />}
					onClick={() => ir("mas180")}
					sx={{ alignSelf: "flex-start", color: BRAND_BLUE, fontWeight: 600, fontSize: "0.8rem", textTransform: "none", px: 0.75 }}
				>
					Ver las de más de 180 días
				</Button>
			</Stack>
		</MainCard>
	);
};

export default ActividadPropiaWidget;
