// material-ui
import { alpha, styled } from "@mui/material/styles";

// ===========================|| HORIZONTAL SCROLLER ||=========================== //

// Barra horizontal fina y translúcida, en línea con el SimpleBar de la barra lateral: antes era la
// barra nativa del sistema (gruesa, gris, siempre visible) debajo de las tablas.
const ScrollX = styled("div")(({ theme }) => {
	const thumb = alpha(theme.palette.grey[500], theme.palette.mode === "dark" ? 0.35 : 0.3);
	const thumbHover = alpha(theme.palette.grey[500], theme.palette.mode === "dark" ? 0.6 : 0.5);
	return {
		width: "100%",
		overflowX: "auto",
		display: "block",
		// Firefox y Chrome ≥ 121 (estándar)
		scrollbarWidth: "thin",
		scrollbarColor: `${thumb} transparent`,
		// Safari / Chrome viejos
		"&::-webkit-scrollbar": { height: 6 },
		"&::-webkit-scrollbar-track": { background: "transparent" },
		"&::-webkit-scrollbar-thumb": { backgroundColor: thumb, borderRadius: 6 },
		"&::-webkit-scrollbar-thumb:hover": { backgroundColor: thumbHover },
		"&:hover": { scrollbarColor: `${thumbHover} transparent` },
	};
});

export default ScrollX;
