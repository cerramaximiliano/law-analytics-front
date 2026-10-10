import { useEffect, useState } from "react";
import { Box, Button, Chip, FormControlLabel, Skeleton, Stack, Switch, TextField, Typography } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import {
	cuitValido,
	getPlazosAutomaticosConfig,
	savePlazosAutomaticosConfig,
	PlazosAutomaticosConfig as Config,
} from "api/plazosAutomaticos";

// Activación y CUIT para las sugerencias automáticas de vencimiento (beta). El CUIT sirve para saber
// qué cédulas te notifican a vos: la cédula electrónica trae el CUIT del domicilio del destinatario.
const PlazosAutomaticosConfig = () => {
	const [config, setConfig] = useState<Config | null>(null);
	const [cuit, setCuit] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		getPlazosAutomaticosConfig()
			.then((c) => {
				setConfig(c);
				setCuit(c.cuit || "");
			})
			.catch(() => setConfig({ activo: false, cuit: null, activadoEn: null }));
	}, []);

	const cuitLimpio = cuit.replace(/\D/g, "");
	const cuitError = cuitLimpio.length > 0 && !cuitValido(cuitLimpio);

	const guardar = async (cambios: { activo?: boolean; cuit?: string | null }) => {
		setSaving(true);
		try {
			const c = await savePlazosAutomaticosConfig(cambios);
			setConfig(c);
			setCuit(c.cuit || "");
			enqueueSnackbar("Guardado", { variant: "success" });
		} catch (e: any) {
			enqueueSnackbar(e?.response?.data?.message || "No se pudo guardar", { variant: "error" });
		} finally {
			setSaving(false);
		}
	};

	if (!config) return <Skeleton variant="rounded" height={120} />;

	return (
		<Stack spacing={1.5}>
			<Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
				<FormControlLabel
					control={<Switch checked={config.activo} disabled={saving} onChange={(e) => guardar({ activo: e.target.checked })} />}
					label="Sugerirme vencimientos a partir de las cédulas"
				/>
				<Chip size="small" label="Beta" color="primary" variant="outlined" />
			</Stack>
			<Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
				Cuando llega una cédula electrónica a una de tus causas del PJN, calculamos el vencimiento (días hábiles, feriados y ferias) y te lo
				proponemos en el calendario con su fundamento. Es una sugerencia: verificala siempre. Solo proponemos los plazos que la cédula
				indica o que surgen de una regla revisada.
			</Typography>
			<Box>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "flex-start" }}>
					<TextField
						size="small"
						label="Tu CUIT"
						placeholder="20-12345678-9"
						value={cuit}
						onChange={(e) => setCuit(e.target.value)}
						error={cuitError}
						helperText={cuitError ? "El CUIT no es válido" : "Para saber qué cédulas están dirigidas a vos (y no a la otra parte)."}
						sx={{ maxWidth: 320 }}
					/>
					<Button
						variant="outlined"
						disabled={saving || cuitError || cuitLimpio === (config.cuit || "")}
						onClick={() => guardar({ cuit: cuitLimpio || null })}
						sx={{ mt: { sm: 0.25 } }}
					>
						Guardar CUIT
					</Button>
				</Stack>
				{config.activo && !config.cuit && (
					<Typography sx={{ fontSize: "0.8rem", color: "warning.dark", mt: 0.5 }}>
						Sin CUIT solo podemos avisarte que llegó una cédula con plazo, sin agregarla al calendario.
					</Typography>
				)}
			</Box>
		</Stack>
	);
};

export default PlazosAutomaticosConfig;
