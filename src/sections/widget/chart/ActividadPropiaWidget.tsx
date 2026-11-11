import { useEffect, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, ButtonBase, Stack, Typography, Tooltip } from "@mui/material";
import MainCard from "components/MainCard";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Edit2 } from "iconsax-react";

import { BRAND_BLUE } from "themes/dashboardTokens";
import AyudaActosPjn, { NOMBRE_ACTOS_PJN } from "sections/actividad-propia/AyudaActosPjn";
import { fetchResumenActividadPropia, TRAMOS, AMBAR_TEXTO, type ResumenActividadPropia } from "services/actividadPropiaService";

const LISTADO = "/apps/folders/list";

/**
 * Widget del panel «Actos del letrado en PJN» (10/11/2026): carpetas PJN activas por días desde el
 * último acto propio y las que están por cumplir los 6 meses de referencia (150 a 180 días).
 * No se muestra si el usuario no tiene credencial PJN con bandeja ni actos registrados.
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

	const sinConfirmar = data?.tramos.sinConfirmar ?? 0;
	const conActos = data ? data.total - data.tramos.sinActos - sinConfirmar : 0;
	const visible = !!data && data.habilitado && conActos > 0;
	useEffect(() => {
		onVisible?.(visible);
	}, [visible, onVisible]);
	if (!data || !visible) return null;

	// Las que no tienen una presentación en el expediente: también cuentan en el total y en la barra.
	const gris = alpha(theme.palette.text.primary, isDark ? 0.28 : 0.18);
	const ambar = isDark ? AMBAR_TEXTO.dark : AMBAR_TEXTO.light;
	const otros = [
		{
			key: "sinConfirmar",
			label: "Solo presentaciones sin proveer",
			ayuda: "Presentaste en estas causas, pero el juzgado todavía no agregó ninguna al expediente: no hay días que contar.",
			n: sinConfirmar,
			color: alpha(ambar, 0.55),
		},
		{
			key: "sinActos",
			label: "Sin presentaciones propias",
			ayuda: "Ningún escrito, cédula ni DEOX presentado con tu credencial PJN en estas causas.",
			n: data.tramos.sinActos,
			color: gris,
		},
	].filter((o) => o.n > 0);

	const ir = (filtro: string) => navigate(`${LISTADO}?actividadPropia=${filtro}`);

	return (
		<MainCard>
			<Stack spacing={1.75}>
				<Stack direction="row" alignItems="center" spacing={1.5}>
					<Box
						sx={{
							width: 40,
							height: 40,
							borderRadius: 1.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
							color: BRAND_BLUE,
							flexShrink: 0,
						}}
					>
						<Edit2 size={20} variant="Bulk" />
					</Box>
					<Stack spacing={0.25}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Typography variant="subtitle1" sx={{ letterSpacing: "-0.005em" }}>
								{NOMBRE_ACTOS_PJN}
							</Typography>
							<AyudaActosPjn />
						</Stack>
						<Typography variant="caption" sx={{ color: "text.secondary" }}>
							{data.total} causas PJN activas por días desde la última presentación en el expediente
						</Typography>
					</Stack>
				</Stack>

				<Box sx={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", bgcolor: alpha(theme.palette.text.primary, 0.06) }}>
					{TRAMOS.map((t) =>
						data.tramos[t.key] > 0 ? (
							<Tooltip key={t.key} title={`${t.label}: ${data.tramos[t.key]}`} arrow>
								<Box sx={{ width: `${(data.tramos[t.key] / data.total) * 100}%`, minWidth: 4, bgcolor: t.color }} />
							</Tooltip>
						) : null,
					)}
					{otros.map((o) => (
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
									<Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: o.color }} />
									<Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{o.label}</Typography>
								</Stack>
								<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{o.n}</Typography>
							</ButtonBase>
						</Tooltip>
					))}
				</Box>

				{data.pendientes > 0 && (
					<ButtonBase onClick={() => ir("pendientes")} sx={{ justifyContent: "flex-start", borderRadius: 0.75, px: 0.75, py: 0.5 }}>
						<Typography sx={{ fontSize: "0.75rem", color: BRAND_BLUE, fontWeight: 500 }}>
							{data.pendientes === 1 ? "1 causa con escritos sin proveer" : `${data.pendientes} causas con escritos sin proveer`}
						</Typography>
					</ButtonBase>
				)}

				<Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 1.25 }}>
					<Typography
						sx={{
							fontSize: "0.62rem",
							fontWeight: 700,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "text.secondary",
							mb: 0.75,
						}}
					>
						Entre 150 y 180 días
					</Typography>
					{data.proximas.length === 0 ? (
						<Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Ninguna causa está por cumplir los 6 meses.</Typography>
					) : (
						<Stack spacing={0.5}>
							{data.proximas.map((p) => (
								<ButtonBase
									key={p._id}
									onClick={() => navigate(`/apps/folders/details/${p._id}`)}
									sx={{
										justifyContent: "space-between",
										gap: 1,
										px: 0.75,
										py: 0.5,
										borderRadius: 0.75,
										"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06) },
									}}
								>
									<Typography
										sx={{ fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}
									>
										{p.folderName}
									</Typography>
									<Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: isDark ? TRAMOS[1].color : TRAMOS[1].fg, flexShrink: 0 }}>
										{p.dias} d
									</Typography>
								</ButtonBase>
							))}
							{data.proximasTotal > data.proximas.length && (
								<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", px: 0.75 }}>
									y {data.proximasTotal - data.proximas.length} más
								</Typography>
							)}
						</Stack>
					)}
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
