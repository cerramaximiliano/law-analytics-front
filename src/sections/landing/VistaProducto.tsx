// "Así se ve" — la landing no mostraba el producto en ningún lado: el recorrido
// era todo texto y tarjetas. Esta sección usa las mismas maquetas dibujadas de
// /funciones, así que no hay capturas con datos de causas reales y acompañan el
// tema claro y oscuro (2026-09-19).
//
// La disposición es asimétrica a propósito: una maqueta grande a la izquierda y
// dos apiladas a la derecha, en vez de tres columnas iguales.

import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";

import SectionEyebrow from "./SectionEyebrow";
import { MOCKS } from "sections/funciones/mocks/MockPantallas";

const AZUL = "#3A7BFF";

const entrada = (retraso: number) => ({
	initial: { opacity: 0, y: 26 },
	whileInView: { opacity: 1, y: 0 },
	viewport: { once: true, amount: 0.15 },
	transition: { duration: 0.55, delay: retraso, ease: [0.22, 0.61, 0.36, 1] as const },
});

const VistaProducto = () => {
	const theme = useTheme();
	const oscuro = theme.palette.mode === "dark";
	const Expedientes = MOCKS.expedientes;
	const Vencimientos = MOCKS.calendario;
	const Liquidacion = MOCKS.calculos;

	return (
		<Box
			component="section"
			sx={{
				position: "relative",
				overflow: "hidden",
				py: { xs: 7, md: 11 },
				bgcolor: oscuro ? "#0b101c" : "#f7f9fc",
				"&::before": {
					content: '""',
					position: "absolute",
					inset: 0,
					background: `radial-gradient(80% 60% at 70% 0%, ${alpha(AZUL, oscuro ? 0.18 : 0.1)} 0%, transparent 62%)`,
					pointerEvents: "none",
				},
			}}
		>
			<Container maxWidth="lg" sx={{ position: "relative" }}>
				<Box component={motion.div} {...entrada(0)} sx={{ maxWidth: 680, mb: { xs: 4, md: 6 } }}>
					<SectionEyebrow number="03" label="Así se ve" align="left" mb={2} />
					<Typography
						component="h2"
						sx={{
							fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.6rem" },
							fontWeight: 600,
							letterSpacing: "-0.035em",
							lineHeight: 1.1,
							textWrap: "balance",
							mb: 2,
						}}
					>
						El día que el juzgado publica algo, ya lo tenés
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: "60ch" }}>
						El movimiento entra en la carpeta de la causa, el plazo aparece en el calendario y la liquidación
						sale con los topes del mes. Tres pantallas del trabajo de todos los días.
					</Typography>
				</Box>

				<Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
					<Grid item xs={12} md={7}>
						<Box component={motion.div} {...entrada(0.08)}>
							<Expedientes />
						</Box>
					</Grid>
					<Grid item xs={12} md={5}>
						<Stack spacing={{ xs: 3, md: 4 }}>
							<Box component={motion.div} {...entrada(0.16)}>
								<Vencimientos />
							</Box>
							<Box component={motion.div} {...entrada(0.24)}>
								<Liquidacion />
							</Box>
						</Stack>
					</Grid>
				</Grid>

				<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3 }}>
					Las pantallas son ilustrativas. Los datos que se ven son inventados: no corresponden a ninguna causa.
				</Typography>
			</Container>
		</Box>
	);
};

export default VistaProducto;
