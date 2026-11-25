import React, { useMemo } from "react";
import { useTheme, alpha } from "@mui/material/styles";

// ==============================|| PANEL ANIMADO: CAUSAS DEL PJN ||============================== //
//
// Panel derecho del registro para el tráfico de los correos de captación (/register?source=email-pjn y
// /registro/correo, 2026-11-25). SVG en línea con animaciones CSS: no baja imágenes ni librerías.
//
// Cuenta el primer minuto en un ciclo de 14 s: se conecta el PJN y se importan las causas, aparece el resumen
// (movimientos de hoy, plazos de la semana, aviso diario), llega una sentencia, se marca un plazo que vence y a
// las 19:30 el aviso del día. Cierra con «Sin entrar al portal del PJN».
//
// Copy honesto con el plan gratuito (tope de 5 carpetas activas): el contador dice «importadas», no «al día».
// Los estilos base son el cuadro FINAL (todo visible): sin animación (prefers-reduced-motion) queda completo.
// Los datos son ficticios.

const CICLO = "14s";

type Fila = { caratula: string; expte: string; juzgado: string; ultimo: string; fecha: string };

const FILAS: Fila[] = [
	{
		caratula: "PÉREZ c/ GALENO ART s/ accidente",
		expte: "CNT 012345/2024",
		juzgado: "Juzg. Trabajo 45",
		ultimo: "Cédula electrónica notificada",
		fecha: "Hoy",
	},
	{
		caratula: "GÓMEZ c/ ACME S.A. s/ despido",
		expte: "CNT 034567/2023",
		juzgado: "Juzg. Trabajo 12",
		ultimo: "Sentencia definitiva",
		fecha: "Hoy",
	},
	{
		caratula: "LÓPEZ c/ ANSES s/ reajustes varios",
		expte: "CSS 045678/2022",
		juzgado: "Juzg. Seg. Social 7",
		ultimo: "Traslado de la liquidación",
		fecha: "Ayer",
	},
	{
		caratula: "DÍAZ, MARÍA s/ sucesión ab intestato",
		expte: "CIV 078901/2021",
		juzgado: "Juzg. Civil 104",
		ultimo: "Pase a despacho",
		fecha: "18/11",
	},
];

// Oculto hasta `desde` %, visible desde `desde + 3` % hasta el final del ciclo.
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
		medio: dark ? theme.palette.grey[300] : "#3A4356",
		tenue: dark ? theme.palette.grey[400] : "#6B7486",
		acento: "#3A7BFF",
		verde: "#22C55E",
		ambar: "#F59E0B",
		pjn: "#232D4F",
		nuevoFondo: dark ? alpha("#3A7BFF", 0.16) : "#EEF4FF",
		plazoFondo: dark ? alpha("#F59E0B", 0.14) : "#FFF7E8",
	};

	const css = useMemo(() => {
		const reglas = [
			`@keyframes pca-ciclo{0%{opacity:0}2%,95%{opacity:1}99%,100%{opacity:0}}`,
			`@keyframes pca-progreso{0%,3%{transform:scaleX(0)}18%,100%{transform:scaleX(1)}}`,
			ventana("pca-conectando", 0, 17),
			aparece("pca-aldia", 18, 0),
			ventana("pca-n0", 0, 6),
			ventana("pca-n1", 7, 11),
			ventana("pca-n2", 12, 17),
			aparece("pca-n3", 18, 0),
			...[0, 1, 2].map((i) => aparece(`pca-kpi${i}`, 20 + i * 3)),
			...FILAS.map((_, i) => aparece(`pca-fila${i}`, 24 + i * 4)),
			aparece("pca-nuevo", 44, 0),
			`@keyframes pca-resalte{0%,44%{fill-opacity:0}47%,100%{fill-opacity:1}}`,
			aparece("pca-plazo", 54, 0),
			`@keyframes pca-resalte2{0%,54%{fill-opacity:0}57%,100%{fill-opacity:1}}`,
			aparece("pca-aviso", 64, 14),
			aparece("pca-sello", 76, 14),
			`.pca-a{animation-duration:${CICLO};animation-iteration-count:infinite;animation-timing-function:ease-out;transform-box:fill-box}`,
			`.pca-ciclo{animation-name:pca-ciclo}.pca-progreso{animation-name:pca-progreso;transform-origin:left center}`,
			`.pca-conectando{animation-name:pca-conectando}.pca-aldia{animation-name:pca-aldia}`,
			`.pca-n0{animation-name:pca-n0}.pca-n1{animation-name:pca-n1}.pca-n2{animation-name:pca-n2}.pca-n3{animation-name:pca-n3}`,
			[0, 1, 2].map((i) => `.pca-kpi${i}{animation-name:pca-kpi${i}}`).join(""),
			FILAS.map((_, i) => `.pca-fila${i}{animation-name:pca-fila${i}}`).join(""),
			`.pca-nuevo{animation-name:pca-nuevo}.pca-resalte{animation-name:pca-resalte}`,
			`.pca-plazo{animation-name:pca-plazo}.pca-resalte2{animation-name:pca-resalte2}`,
			`.pca-aviso{animation-name:pca-aviso}.pca-sello{animation-name:pca-sello}`,
			// Sin animación: cuadro final completo (los textos de transición quedan ocultos)
			`@media (prefers-reduced-motion:reduce){.pca-a{animation:none!important}.pca-solo-anim{opacity:0}}`,
		];
		return reglas.join("");
	}, []);

	const X0 = 28;
	const ANCHO = 504;
	const KPI_Y = 124;
	const KPI_ANCHO = (ANCHO - 24) / 3;
	const FILA_Y0 = 198;
	const FILA_ALTO = 66;

	const kpis = [
		{ valor: "6", texto: "movimientos hoy", color: c.acento },
		{ valor: "2", texto: "plazos esta semana", color: c.ambar },
		{ valor: "19:30", texto: "aviso diario", color: c.verde },
	];

	return (
		<svg
			viewBox="0 0 560 548"
			width="100%"
			role="img"
			aria-label="Tus causas del PJN importadas solas: resumen de movimientos y plazos, una sentencia nueva, un plazo que vence y el aviso diario de las 19:30, sin entrar al portal"
			style={{ display: "block", maxWidth: 560, fontFamily: "Inter, system-ui, sans-serif", overflow: "visible" }}
		>
			<style>{css}</style>
			<defs>
				<filter id="pca-sombra" x="-10%" y="-10%" width="120%" height="130%">
					<feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0F172A" floodOpacity={dark ? 0.45 : 0.14} />
				</filter>
				<filter id="pca-sombra-flota" x="-20%" y="-30%" width="140%" height="180%">
					<feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F172A" floodOpacity={dark ? 0.5 : 0.18} />
				</filter>
			</defs>

			{/* Ventana de la app */}
			<g filter="url(#pca-sombra)">
				<rect x="8" y="16" width="544" height="488" rx="14" fill={c.fondo} stroke={c.linea} />
			</g>
			<rect x="8" y="16" width="544" height="34" rx="14" fill={c.barra} />
			<rect x="8" y="36" width="544" height="14" fill={c.barra} />
			<line x1="8" y1="50" x2="552" y2="50" stroke={c.linea} />
			{["#FF5F57", "#FEBC2E", "#28C840"].map((col, i) => (
				<circle key={col} cx={28 + i * 16} cy={33} r={5} fill={col} />
			))}
			<rect x="210" y="24" width="140" height="18" rx="9" fill={c.fondo} stroke={c.linea} />
			<text x="280" y="37" textAnchor="middle" fontSize="10" fill={c.tenue}>
				lawanalytics.app
			</text>

			<g className="pca-a pca-ciclo">
				{/* Encabezado */}
				<rect x={X0} y="64" width="34" height="34" rx="8" fill={c.pjn} />
				<text x={X0 + 17} y="86" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
					PJN
				</text>
				<text x={X0 + 46} y="78" fontSize="14" fontWeight="600" fill={c.texto}>
					Mis causas
				</text>
				<text className="pca-a pca-conectando pca-solo-anim" x={X0 + 46} y="94" fontSize="11" fill={c.tenue}>
					Conectando con el PJN…
				</text>
				<g className="pca-a pca-aldia">
					<circle cx={X0 + 50} cy="90.5" r="3.5" fill={c.verde} />
					<text x={X0 + 58} y="94" fontSize="11" fill={c.tenue}>
						Conectado · se actualiza solo todos los días
					</text>
				</g>

				{/* Contador de causas importadas */}
				<g fontSize="22" fontWeight="700" fill={c.texto} textAnchor="end">
					<text className="pca-a pca-n0 pca-solo-anim" x={X0 + ANCHO - 72} y="88">
						0
					</text>
					<text className="pca-a pca-n1 pca-solo-anim" x={X0 + ANCHO - 72} y="88">
						12
					</text>
					<text className="pca-a pca-n2 pca-solo-anim" x={X0 + ANCHO - 72} y="88">
						31
					</text>
					<text className="pca-a pca-n3" x={X0 + ANCHO - 72} y="88">
						47
					</text>
				</g>
				<text x={X0 + ANCHO} y="88" textAnchor="end" fontSize="11" fill={c.tenue}>
					importadas
				</text>

				{/* Progreso de la conexión */}
				<rect x={X0} y="106" width={ANCHO} height="5" rx="2.5" fill={c.linea} />
				<rect className="pca-a pca-progreso" x={X0} y="106" width={ANCHO} height="5" rx="2.5" fill={c.verde} />

				{/* Resumen */}
				{kpis.map((k, i) => {
					const x = X0 + i * (KPI_ANCHO + 12);
					return (
						<g key={k.texto} className={`pca-a pca-kpi${i}`}>
							<rect
								x={x}
								y={KPI_Y}
								width={KPI_ANCHO}
								height="58"
								rx="10"
								fill={alpha(k.color, dark ? 0.12 : 0.07)}
								stroke={alpha(k.color, 0.28)}
							/>
							<text x={x + 14} y={KPI_Y + 28} fontSize="20" fontWeight="700" fill={k.color}>
								{k.valor}
							</text>
							<text x={x + 14} y={KPI_Y + 46} fontSize="10.5" fill={c.medio}>
								{k.texto}
							</text>
						</g>
					);
				})}

				{/* Causas */}
				{FILAS.map((f, i) => {
					const y = FILA_Y0 + i * FILA_ALTO;
					const esNueva = i === 1;
					const tienePlazo = i === 2;
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
							{tienePlazo && (
								<rect
									className="pca-a pca-resalte2"
									x={X0 - 8}
									y={y}
									width={ANCHO + 16}
									height={FILA_ALTO - 6}
									rx="10"
									fill={c.plazoFondo}
								/>
							)}
							<path
								d={`M${X0} ${y + 18} a4 4 0 0 1 4 -4 h10 l4 4 h14 a4 4 0 0 1 4 4 v18 a4 4 0 0 1 -4 4 h-28 a4 4 0 0 1 -4 -4 z`}
								fill={alpha(c.acento, dark ? 0.3 : 0.14)}
								stroke={c.acento}
								strokeWidth="1.2"
							/>
							<text x={X0 + 48} y={y + 18} fontSize="12.5" fontWeight="600" fill={c.texto}>
								{f.caratula}
							</text>
							<text x={X0 + 48} y={y + 34} fontSize="10.5" fill={c.tenue}>
								{f.expte} · {f.juzgado}
							</text>
							<text x={X0 + 48} y={y + 50} fontSize="10.5" fill={c.medio}>
								Último movimiento: {f.ultimo}
							</text>
							<text x={X0 + ANCHO} y={y + 18} textAnchor="end" fontSize="10.5" fill={c.tenue}>
								{f.fecha}
							</text>
							{esNueva && (
								<g className="pca-a pca-nuevo">
									<rect x={X0 + ANCHO - 118} y={y + 32} width="118" height="18" rx="9" fill={c.acento} />
									<text x={X0 + ANCHO - 59} y={y + 44.5} textAnchor="middle" fontSize="10" fontWeight="600" fill="#FFFFFF">
										Nuevo · sentencia
									</text>
								</g>
							)}
							{tienePlazo && (
								<g className="pca-a pca-plazo">
									<rect x={X0 + ANCHO - 118} y={y + 32} width="118" height="18" rx="9" fill={c.ambar} />
									<text x={X0 + ANCHO - 59} y={y + 44.5} textAnchor="middle" fontSize="10" fontWeight="600" fill="#FFFFFF">
										Plazo · vence en 3 días
									</text>
								</g>
							)}
							{i < FILAS.length - 1 && <line x1={X0} y1={y + FILA_ALTO - 3} x2={X0 + ANCHO} y2={y + FILA_ALTO - 3} stroke={c.linea} />}
						</g>
					);
				})}

				{/* Sello: sin entrar al portal */}
				<g className="pca-a pca-sello" filter="url(#pca-sombra-flota)">
					<rect x="18" y="476" width="214" height="40" rx="20" fill={c.fondo} stroke={alpha(c.verde, 0.5)} />
					<circle cx="40" cy="496" r="10" fill={c.verde} />
					<path d="M35.5 496.2 l3 3 l6 -6.2" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
					<text x="58" y="500" fontSize="11.5" fontWeight="600" fill={c.texto}>
						Sin entrar al portal del PJN
					</text>
				</g>

				{/* Aviso de las 19:30 */}
				<g className="pca-a pca-aviso" filter="url(#pca-sombra-flota)">
					<rect x="270" y="462" width="282" height="78" rx="12" fill={c.fondo} stroke={c.linea} />
					<circle cx="298" cy="494" r="15" fill={alpha(c.acento, dark ? 0.25 : 0.12)} />
					<path d="M298 485 a6 6 0 0 1 6 6 v4 l2 3 h-16 l2 -3 v-4 a6 6 0 0 1 6 -6 z M295.5 500 a2.5 2.5 0 0 0 5 0 z" fill={c.acento} />
					<text x="322" y="484" fontSize="11.5" fontWeight="700" fill={c.texto}>
						19:30 · Novedades del día
					</text>
					<text x="322" y="501" fontSize="10.5" fill={c.medio}>
						GÓMEZ c/ ACME: sentencia definitiva
					</text>
					<text x="322" y="517" fontSize="10.5" fill={c.tenue}>
						y 5 movimientos más en 3 causas
					</text>
				</g>
			</g>
		</svg>
	);
};

export default PanelCausasAnimado;

// Panel + pie de valor: lo que ven a la derecha /register?source=email-pjn y /registro/correo.
// «Gratis hasta 5 causas activas» es el tope real del plan gratuito (subscriptionService: maxFolders 5).
export const PanelCausasConPie: React.FC = () => {
	const theme = useTheme();
	const senales = ["Gratis hasta 5 causas activas", "Sin tarjeta", "Listo en 1 minuto"];
	return (
		<div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
			<PanelCausasAnimado />
			<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
				<p
					style={{
						margin: 0,
						maxWidth: 440,
						fontSize: "0.95rem",
						lineHeight: 1.5,
						color: theme.palette.text.primary,
						fontWeight: 500,
						textWrap: "pretty",
					}}
				>
					Conectás el PJN una vez. Tus causas se importan solas, se actualizan todos los días y a las 19:30 te avisamos qué se movió.
				</p>
				<div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px" }}>
					{senales.map((s) => (
						<span
							key={s}
							style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: theme.palette.text.secondary }}
						>
							<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
								<circle cx="7" cy="7" r="7" fill="#22C55E" />
								<path d="M4 7.2 l2 2 l4 -4.2" stroke="#FFFFFF" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							{s}
						</span>
					))}
				</div>
			</div>
		</div>
	);
};
