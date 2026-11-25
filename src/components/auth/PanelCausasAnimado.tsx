import React, { useMemo } from "react";
import { useTheme, alpha } from "@mui/material/styles";

// ==============================|| PANEL ANIMADO: CAUSAS DEL PJN ||============================== //
//
// Panel derecho del registro para el tráfico de los correos de captación (/register?source=email-pjn y
// /registro/correo, 2026-11-25). SVG en línea con animaciones CSS: no baja imágenes ni librerías.
// Cuenta lo que pasa en el primer minuto: se conecta el PJN, entran las causas, llega un movimiento nuevo y a las
// 19 el aviso del día. Ciclo de 12 s.
//
// Los estilos base son el cuadro FINAL (todo visible): sin animación (prefers-reduced-motion) queda completo.
// Los datos son ficticios.

const CICLO = "12s";

type Fila = { caratula: string; expte: string; fuero: string; ultimo: string };

const FILAS: Fila[] = [
	{ caratula: "PÉREZ c/ GALENO ART s/ accidente", expte: "CNT 012345/2024", fuero: "Trabajo", ultimo: "Hoy" },
	{ caratula: "GÓMEZ c/ ACME S.A. s/ despido", expte: "CNT 034567/2023", fuero: "Trabajo", ultimo: "Hoy" },
	{ caratula: "LÓPEZ c/ ANSES s/ reajustes varios", expte: "CSS 045678/2022", fuero: "Seg. Social", ultimo: "Ayer" },
	{ caratula: "DÍAZ, MARÍA s/ sucesión ab intestato", expte: "CIV 078901/2021", fuero: "Civil", ultimo: "18/11" },
];

// Keyframes de aparición: oculto hasta `desde` %, visible a partir de `desde + 3` % hasta el final del ciclo.
const aparece = (nombre: string, desde: number, dy = 8) =>
	`@keyframes ${nombre}{0%,${desde}%{opacity:0;transform:translateY(${dy}px)}${desde + 3}%,100%{opacity:1;transform:none}}`;
// Visible solo entre `desde` y `hasta` %.
const ventana = (nombre: string, desde: number, hasta: number) =>
	`@keyframes ${nombre}{0%,${desde}%{opacity:0}${desde + 1}%,${hasta}%{opacity:1}${hasta + 1}%,100%{opacity:0}}`;

const PanelCausasAnimado: React.FC = () => {
	const theme = useTheme();
	const dark = theme.palette.mode === "dark";

	const c = {
		fondo: dark ? theme.palette.grey[900] : "#FFFFFF",
		barra: dark ? alpha("#FFFFFF", 0.04) : "#F4F6FA",
		linea: dark ? alpha("#FFFFFF", 0.1) : "#E3E8F0",
		texto: dark ? theme.palette.grey[100] : "#1B2233",
		tenue: dark ? theme.palette.grey[400] : "#6B7486",
		acento: "#3A7BFF",
		verde: "#22C55E",
		pjn: "#232D4F",
		nuevoFondo: dark ? alpha("#3A7BFF", 0.16) : "#EEF4FF",
	};

	const css = useMemo(() => {
		const filas = FILAS.map((_, i) => aparece(`pca-fila${i}`, 20 + i * 5)).join("");
		return [
			// Envoltorio: entra al principio, se va al final del ciclo
			`@keyframes pca-ciclo{0%{opacity:0}2%,94%{opacity:1}99%,100%{opacity:0}}`,
			`@keyframes pca-progreso{0%,3%{transform:scaleX(0)}20%,100%{transform:scaleX(1)}}`,
			ventana("pca-conectando", 0, 19),
			aparece("pca-aldia", 20, 0),
			ventana("pca-n0", 0, 7),
			ventana("pca-n1", 8, 12),
			ventana("pca-n2", 13, 18),
			aparece("pca-n3", 19, 0),
			filas,
			aparece("pca-nuevo", 46, 0),
			`@keyframes pca-resalte{0%,46%{fill-opacity:0}49%,100%{fill-opacity:1}}`,
			aparece("pca-aviso", 62, 14),
			`.pca-a{animation-duration:${CICLO};animation-iteration-count:infinite;animation-timing-function:ease-out;transform-box:fill-box}`,
			`.pca-ciclo{animation-name:pca-ciclo}`,
			`.pca-progreso{animation-name:pca-progreso;transform-origin:left center}`,
			`.pca-conectando{animation-name:pca-conectando}.pca-aldia{animation-name:pca-aldia}`,
			`.pca-n0{animation-name:pca-n0}.pca-n1{animation-name:pca-n1}.pca-n2{animation-name:pca-n2}.pca-n3{animation-name:pca-n3}`,
			FILAS.map((_, i) => `.pca-fila${i}{animation-name:pca-fila${i}}`).join(""),
			`.pca-nuevo{animation-name:pca-nuevo}.pca-resalte{animation-name:pca-resalte}.pca-aviso{animation-name:pca-aviso}`,
			// Sin animación: cuadro final completo (los textos de transición quedan ocultos)
			`.pca-solo-anim{opacity:0}`,
			`@media (prefers-reduced-motion:no-preference){.pca-solo-anim{opacity:1}}`,
			`@media (prefers-reduced-motion:reduce){.pca-a{animation:none!important}}`,
		].join("");
	}, []);

	const X0 = 24;
	const ANCHO = 472;
	const FILA_Y0 = 132;
	const FILA_ALTO = 62;

	return (
		<svg
			viewBox="0 0 520 486"
			width="100%"
			role="img"
			aria-label="Tus causas del PJN cargándose solas: 47 causas al día, un movimiento nuevo y el aviso diario de las 19"
			style={{ display: "block", maxWidth: 540, fontFamily: "Inter, system-ui, sans-serif", overflow: "visible" }}
		>
			<style>{css}</style>
			<defs>
				<filter id="pca-sombra" x="-10%" y="-10%" width="120%" height="130%">
					<feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0F172A" floodOpacity={dark ? 0.45 : 0.14} />
				</filter>
				<filter id="pca-sombra-aviso" x="-20%" y="-30%" width="140%" height="180%">
					<feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F172A" floodOpacity={dark ? 0.5 : 0.18} />
				</filter>
			</defs>

			{/* Ventana de la app */}
			<g filter="url(#pca-sombra)">
				<rect x="8" y="16" width="504" height="440" rx="14" fill={c.fondo} stroke={c.linea} />
			</g>
			<rect x="8" y="16" width="504" height="34" rx="14" fill={c.barra} />
			<rect x="8" y="36" width="504" height="14" fill={c.barra} />
			<line x1="8" y1="50" x2="512" y2="50" stroke={c.linea} />
			{["#FF5F57", "#FEBC2E", "#28C840"].map((col, i) => (
				<circle key={col} cx={28 + i * 16} cy={33} r={5} fill={col} />
			))}
			<rect x="190" y="24" width="140" height="18" rx="9" fill={c.fondo} stroke={c.linea} />
			<text x="260" y="37" textAnchor="middle" fontSize="10" fill={c.tenue}>
				lawanalytics.app
			</text>

			<g className="pca-a pca-ciclo">
				{/* Encabezado */}
				<rect x={X0} y="66" width="34" height="34" rx="8" fill={c.pjn} />
				<text x={X0 + 17} y="88" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
					PJN
				</text>
				<text x={X0 + 46} y="80" fontSize="14" fontWeight="600" fill={c.texto}>
					Mis causas
				</text>
				<text className="pca-a pca-conectando pca-solo-anim" x={X0 + 46} y="96" fontSize="11" fill={c.tenue}>
					Conectando con el PJN…
				</text>
				<g className="pca-a pca-aldia">
					<circle cx={X0 + 50} cy="92.5" r="3.5" fill={c.verde} />
					<text x={X0 + 58} y="96" fontSize="11" fill={c.tenue}>
						Sincronizado · se actualiza solo
					</text>
				</g>

				{/* Contador */}
				<g fontSize="22" fontWeight="700" fill={c.texto} textAnchor="end">
					<text className="pca-a pca-n0 pca-solo-anim" x={X0 + ANCHO - 54} y="90">
						0
					</text>
					<text className="pca-a pca-n1 pca-solo-anim" x={X0 + ANCHO - 54} y="90">
						12
					</text>
					<text className="pca-a pca-n2 pca-solo-anim" x={X0 + ANCHO - 54} y="90">
						31
					</text>
					<text className="pca-a pca-n3" x={X0 + ANCHO - 54} y="90">
						47
					</text>
				</g>
				<text x={X0 + ANCHO} y="90" textAnchor="end" fontSize="11" fill={c.tenue}>
					causas
				</text>

				{/* Progreso de la conexión */}
				<rect x={X0} y="112" width={ANCHO} height="5" rx="2.5" fill={c.linea} />
				<rect className="pca-a pca-progreso" x={X0} y="112" width={ANCHO} height="5" rx="2.5" fill={c.verde} />

				{/* Causas */}
				{FILAS.map((f, i) => {
					const y = FILA_Y0 + i * FILA_ALTO;
					const esNueva = i === 1;
					return (
						<g key={f.expte} className={`pca-a pca-fila${i}`}>
							{esNueva && (
								<rect
									className="pca-a pca-resalte"
									x={X0 - 8}
									y={y}
									width={ANCHO + 16}
									height={FILA_ALTO - 6}
									rx="10"
									fill={c.nuevoFondo}
								/>
							)}
							{/* Carpeta */}
							<path
								d={`M${X0} ${y + 16} a4 4 0 0 1 4 -4 h10 l4 4 h14 a4 4 0 0 1 4 4 v18 a4 4 0 0 1 -4 4 h-28 a4 4 0 0 1 -4 -4 z`}
								fill={alpha(c.acento, dark ? 0.3 : 0.14)}
								stroke={c.acento}
								strokeWidth="1.2"
							/>
							<text x={X0 + 48} y={y + 24} fontSize="12.5" fontWeight="600" fill={c.texto}>
								{f.caratula}
							</text>
							<text x={X0 + 48} y={y + 41} fontSize="10.5" fill={c.tenue}>
								{f.expte} · {f.fuero}
							</text>
							<text x={X0 + ANCHO} y={y + 24} textAnchor="end" fontSize="10.5" fill={c.tenue}>
								{f.ultimo}
							</text>
							{esNueva && (
								<g className="pca-a pca-nuevo">
									<rect x={X0 + ANCHO - 140} y={y + 31} width="140" height="17" rx="8.5" fill={c.acento} />
									<text x={X0 + ANCHO - 70} y={y + 43} textAnchor="middle" fontSize="10" fontWeight="600" fill="#FFFFFF">
										Nuevo: se dictó sentencia
									</text>
								</g>
							)}
							{i < FILAS.length - 1 && <line x1={X0} y1={y + FILA_ALTO - 3} x2={X0 + ANCHO} y2={y + FILA_ALTO - 3} stroke={c.linea} />}
						</g>
					);
				})}

				{/* Aviso de las 19 */}
				<g className="pca-a pca-aviso" filter="url(#pca-sombra-aviso)">
					<rect x="254" y="418" width="256" height="62" rx="12" fill={c.fondo} stroke={c.linea} />
					<circle cx="282" cy="449" r="15" fill={alpha(c.acento, dark ? 0.25 : 0.12)} />
					<path d="M282 440 a6 6 0 0 1 6 6 v4 l2 3 h-16 l2 -3 v-4 a6 6 0 0 1 6 -6 z M279.5 455 a2.5 2.5 0 0 0 5 0 z" fill={c.acento} />
					<text x="306" y="444" fontSize="11.5" fontWeight="700" fill={c.texto}>
						19:00 · Novedades del día
					</text>
					<text x="306" y="461" fontSize="10.5" fill={c.tenue}>
						3 causas tuvieron movimientos
					</text>
				</g>
			</g>
		</svg>
	);
};

export default PanelCausasAnimado;
