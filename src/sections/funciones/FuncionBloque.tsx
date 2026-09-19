// Bloque de una función en /funciones.
//
// Layout en zig-zag: texto y visual alternan lado según el índice. Se evita a
// propósito la grilla de tres tarjetas iguales, que es la disposición por
// defecto de cualquier landing y no deja mirar ninguna función con atención.
//
// La captura entra en un marco con sombra tintada del color de marca (no negra)
// y aparece con un desplazamiento leve al entrar en pantalla.

import { useRef } from "react";
import { Link as RouterLink } from "react-router-dom";

// material-ui
import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// third-party
import { motion, useInView } from "framer-motion";

// project-imports
import { TickCircle, ArrowRight } from "iconsax-react";
import { Funcion } from "./funcionesData";
import { MOCKS } from "./mocks/MockPantallas";

const AZUL = "#3A7BFF";

interface Props {
	funcion: Funcion;
	indice: number;
	onCtaClick: (funcion: Funcion) => void;
}

const FuncionBloque = ({ funcion, indice, onCtaClick }: Props) => {
	const theme = useTheme();
	const oscuro = theme.palette.mode === "dark";
	const ref = useRef<HTMLDivElement>(null);
	const visible = useInView(ref, { once: true, margin: "-80px" });
	const invertido = indice % 2 === 1;
	const Icono = funcion.icono;

	const entrada = (retraso: number) => ({
		initial: { opacity: 0, y: 24 },
		animate: visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
		transition: { duration: 0.5, delay: retraso, ease: [0.22, 0.61, 0.36, 1] as const },
	});

	const Maqueta = MOCKS[funcion.id];

	const visual = Maqueta ? (
		<Box component={motion.div} {...entrada(0.12)}>
			<Maqueta />
		</Box>
	) : funcion.imagen ? (
		<Box
			component={motion.div}
			{...entrada(0.12)}
			sx={{
				position: "relative",
				borderRadius: 3,
				overflow: "hidden",
				border: `1px solid ${alpha(AZUL, oscuro ? 0.22 : 0.14)}`,
				// Sombra tintada con el azul de marca en vez de negro puro.
				boxShadow: `0 24px 60px -30px ${alpha(AZUL, oscuro ? 0.5 : 0.35)}`,
				bgcolor: oscuro ? alpha("#0d1220", 0.6) : "#fff",
			}}
		>
			{/* Barra del marco: sugiere ventana de aplicación sin simular un navegador real. */}
			<Stack direction="row" spacing={0.75} sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${theme.palette.divider}` }}>
				{["#E5564E", "#E9B44C", "#4CAF7D"].map((c) => (
					<Box key={c} sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: alpha(c, 0.75) }} />
				))}
			</Stack>
			<Box
				component="img"
				src={funcion.imagen}
				alt={funcion.imagenAlt || funcion.titulo}
				loading="lazy"
				sx={{ display: "block", width: "100%", height: "auto" }}
			/>
		</Box>
	) : (
		<Box
			component={motion.div}
			{...entrada(0.12)}
			sx={{
				position: "relative",
				borderRadius: 3,
				p: { xs: 3, md: 4.5 },
				border: `1px solid ${alpha(AZUL, oscuro ? 0.22 : 0.14)}`,
				boxShadow: `0 24px 60px -30px ${alpha(AZUL, oscuro ? 0.5 : 0.3)}`,
				background: oscuro
					? `radial-gradient(120% 120% at 20% 0%, ${alpha(AZUL, 0.16)} 0%, transparent 60%), ${alpha("#0d1220", 0.6)}`
					: `radial-gradient(120% 120% at 20% 0%, ${alpha(AZUL, 0.1)} 0%, transparent 60%), #fff`,
			}}
		>
			<Box
				sx={{
					width: 56,
					height: 56,
					borderRadius: 2.5,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(AZUL, oscuro ? 0.18 : 0.1),
					border: `1px solid ${alpha(AZUL, 0.24)}`,
					mb: 3,
				}}
			>
				<Icono size={28} color={AZUL} variant="Bulk" />
			</Box>
			<Stack spacing={2.5}>
				{(funcion.datos || []).map((d) => (
					<Box key={d.etiqueta}>
						<Typography
							sx={{
								fontSize: { xs: "1.9rem", md: "2.3rem" },
								fontWeight: 600,
								letterSpacing: "-0.03em",
								lineHeight: 1.05,
								fontVariantNumeric: "tabular-nums",
								color: theme.palette.text.primary,
							}}
						>
							{d.valor}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{d.etiqueta}
						</Typography>
					</Box>
				))}
			</Stack>
		</Box>
	);

	return (
		<Box
			component="article"
			ref={ref}
			id={funcion.id}
			sx={{ py: { xs: 7, md: 11 }, scrollMarginTop: 96 }}
		>
			<Container maxWidth="lg">
				{/* En móvil la captura va siempre arriba: entra por la imagen y después lee.
				    En escritorio alterna lado para romper la simetría. */}
				<Grid
					container
					spacing={{ xs: 4, md: 9 }}
					alignItems="center"
					direction={{ xs: "row-reverse", md: invertido ? "row-reverse" : "row" }}
				>
					<Grid item xs={12} md={6}>
						<Box component={motion.div} {...entrada(0)}>
							<Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
								<Box
									sx={{
										width: 34,
										height: 34,
										borderRadius: 1.5,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: alpha(AZUL, oscuro ? 0.18 : 0.1),
									}}
								>
									<Icono size={18} color={AZUL} variant="Bold" />
								</Box>
								<Typography
									component="span"
									sx={{
										fontSize: "0.7rem",
										fontWeight: 600,
										letterSpacing: "0.14em",
										textTransform: "uppercase",
										color: AZUL,
									}}
								>
									{funcion.eyebrow}
								</Typography>
							</Stack>

							<Typography
								component="h2"
								sx={{
									fontSize: { xs: "1.75rem", sm: "2.1rem", md: "2.5rem" },
									fontWeight: 600,
									letterSpacing: "-0.032em",
									lineHeight: 1.1,
									textWrap: "balance",
									mb: 2,
								}}
							>
								{funcion.titulo}
							</Typography>

							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ maxWidth: "62ch", lineHeight: 1.65, mb: 3.5 }}
							>
								{funcion.bajada}
							</Typography>

							<Stack component="ul" spacing={1.5} sx={{ listStyle: "none", p: 0, m: 0, mb: 4 }}>
								{funcion.puntos.map((p) => (
									<Stack key={p} component="li" direction="row" spacing={1.5} alignItems="flex-start">
										<TickCircle size={19} color={AZUL} variant="Bold" style={{ flex: "none", marginTop: 2 }} />
										<Typography variant="body2" sx={{ lineHeight: 1.55 }}>
											{p}
										</Typography>
									</Stack>
								))}
							</Stack>

							<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
								<Button
									variant="contained"
									disableElevation
									onClick={() => onCtaClick(funcion)}
									endIcon={<ArrowRight size={17} />}
									sx={{
										alignSelf: { xs: "stretch", sm: "flex-start" },
										bgcolor: AZUL,
										px: 2.75,
										py: 1.15,
										borderRadius: 2,
										fontWeight: 600,
										textTransform: "none",
										transition: "transform .2s ease, background-color .2s ease, box-shadow .2s ease",
										boxShadow: `0 10px 24px -12px ${alpha(AZUL, 0.9)}`,
										"&:hover": { bgcolor: "#2f6ae8", transform: "translateY(-1px)" },
										"&:active": { transform: "scale(0.985)" },
									}}
								>
									Usar esta función
								</Button>
								{funcion.enlace && (
									<Button
										component={RouterLink}
										to={funcion.enlace.a}
										variant="text"
										sx={{
											alignSelf: "flex-start",
											color: "text.secondary",
											fontWeight: 500,
											textTransform: "none",
											"&:hover": { color: AZUL, bgcolor: "transparent" },
										}}
									>
										{funcion.enlace.texto}
									</Button>
								)}
							</Stack>
						</Box>
					</Grid>

					<Grid item xs={12} md={6}>
						{visual}
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default FuncionBloque;
