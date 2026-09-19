// Cierre de /funciones: el pedido de registro llega recién acá, después de que
// la persona vio lo que hace el producto. La barra fija aparece al pasar el
// encabezado, que es donde en el celular se pierde el botón de arriba.

import { useEffect, useState } from "react";

import { Box, Button, Container, Slide, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ArrowRight, ShieldTick, Clock, CardSlash } from "iconsax-react";

const AZUL = "#3A7BFF";

interface Props {
	onEmpezar: () => void;
}

const GARANTIAS = [
	{ icono: CardSlash, texto: "Sin tarjeta de crédito" },
	{ icono: Clock, texto: "Dos minutos de configuración" },
	{ icono: ShieldTick, texto: "Tus datos quedan en tu cuenta" },
];

export const BarraFija = ({ onEmpezar }: Props) => {
	const theme = useTheme();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const alScrollear = () => setVisible(window.scrollY > 640);
		alScrollear();
		window.addEventListener("scroll", alScrollear, { passive: true });
		return () => window.removeEventListener("scroll", alScrollear);
	}, []);

	return (
		<Slide direction="up" in={visible} mountOnEnter unmountOnExit>
			<Box
				sx={{
					position: "fixed",
					left: 0,
					right: 0,
					bottom: 0,
					zIndex: theme.zIndex.appBar,
					px: 2,
					py: 1.5,
					display: { xs: "block", md: "none" },
					bgcolor: alpha(theme.palette.background.paper, 0.92),
					backdropFilter: "blur(10px)",
					borderTop: `1px solid ${theme.palette.divider}`,
					boxShadow: `0 -10px 30px -18px ${alpha(AZUL, 0.6)}`,
				}}
			>
				<Button
					fullWidth
					variant="contained"
					disableElevation
					onClick={onEmpezar}
					endIcon={<ArrowRight size={17} />}
					sx={{
						bgcolor: AZUL,
						py: 1.35,
						borderRadius: 2,
						fontWeight: 600,
						textTransform: "none",
						"&:hover": { bgcolor: "#2f6ae8" },
						"&:active": { transform: "scale(0.985)" },
					}}
				>
					Empezar gratis
				</Button>
			</Box>
		</Slide>
	);
};

const CierreFunciones = ({ onEmpezar }: Props) => {
	const theme = useTheme();
	const oscuro = theme.palette.mode === "dark";

	return (
		<Box
			component="section"
			sx={{
				position: "relative",
				overflow: "hidden",
				py: { xs: 9, md: 13 },
				// Mismo tono que el encabezado: se evita el salto de una sección
				// oscura suelta en medio de una página clara.
				bgcolor: oscuro ? "#0b101c" : "#f7f9fc",
				"&::before": {
					content: '""',
					position: "absolute",
					inset: 0,
					background: `radial-gradient(70% 90% at 50% 100%, ${alpha(AZUL, oscuro ? 0.2 : 0.12)} 0%, transparent 65%)`,
					pointerEvents: "none",
				},
			}}
		>
			<Container maxWidth="md" sx={{ position: "relative", textAlign: "center" }}>
				<Typography
					component="h2"
					sx={{
						fontSize: { xs: "1.9rem", md: "2.6rem" },
						fontWeight: 600,
						letterSpacing: "-0.035em",
						lineHeight: 1.1,
						textWrap: "balance",
						mb: 2,
					}}
				>
					Empezá con una causa y mirá qué pasa mañana
				</Typography>
				<Typography
					variant="h5"
					component="p"
					color="text.secondary"
					sx={{ fontWeight: 400, lineHeight: 1.6, maxWidth: "56ch", mx: "auto", mb: 4.5 }}
				>
					Vinculás un expediente, lo dejás corriendo y al día siguiente ves los movimientos nuevos en la carpeta.
					Si no te sirve, no hiciste nada más que cargar un número.
				</Typography>

				<Button
					variant="contained"
					disableElevation
					size="large"
					onClick={onEmpezar}
					endIcon={<ArrowRight size={18} />}
					sx={{
						bgcolor: AZUL,
						px: 4,
						py: 1.5,
						borderRadius: 2,
						fontWeight: 600,
						textTransform: "none",
						fontSize: "1rem",
						boxShadow: `0 16px 34px -16px ${alpha(AZUL, 0.95)}`,
						transition: "transform .2s ease, background-color .2s ease",
						"&:hover": { bgcolor: "#2f6ae8", transform: "translateY(-1px)" },
						"&:active": { transform: "scale(0.985)" },
					}}
				>
					Crear mi cuenta gratis
				</Button>

				<Stack
					direction={{ xs: "column", sm: "row" }}
					spacing={{ xs: 1.5, sm: 4 }}
					justifyContent="center"
					alignItems="center"
					sx={{ mt: 4 }}
				>
					{GARANTIAS.map(({ icono: Icono, texto }) => (
						<Stack key={texto} direction="row" spacing={1} alignItems="center">
							<Icono size={17} color={AZUL} variant="Bold" />
							<Typography variant="body2" color="text.secondary">
								{texto}
							</Typography>
						</Stack>
					))}
				</Stack>
			</Container>
		</Box>
	);
};

export default CierreFunciones;
