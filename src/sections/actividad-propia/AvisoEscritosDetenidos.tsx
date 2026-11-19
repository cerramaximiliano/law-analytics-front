import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Warning2 } from "iconsax-react";
import { AMBAR_TEXTO, avisoEscritosDetenidos, type SincronizacionEscritos } from "services/actividadPropiaService";

/**
 * Aviso de datos congelados: la credencial PJN dejó de leer la bandeja (caída, contraseña vencida,
 * desvinculada) o la última lectura es vieja. Los días siguen corriendo sobre el último dato conocido.
 */
const AvisoEscritosDetenidos = ({
	sincronizacion,
	compacto = false,
}: {
	sincronizacion?: SincronizacionEscritos | null;
	compacto?: boolean;
}) => {
	const theme = useTheme();
	const texto = avisoEscritosDetenidos(sincronizacion);
	if (!texto) return null;
	const ambar = theme.palette.mode === "dark" ? AMBAR_TEXTO.dark : AMBAR_TEXTO.light;
	return (
		<Stack direction="row" spacing={0.75} alignItems="flex-start">
			<Warning2 size={compacto ? 13 : 15} variant="Bulk" color={ambar} style={{ marginTop: 2, flexShrink: 0 }} />
			<Typography sx={{ fontSize: compacto ? "0.72rem" : "0.75rem", color: ambar, letterSpacing: "-0.005em", textWrap: "pretty" }}>
				{texto}. Lo presentado después no figura todavía.
			</Typography>
		</Stack>
	);
};

export default AvisoEscritosDetenidos;
