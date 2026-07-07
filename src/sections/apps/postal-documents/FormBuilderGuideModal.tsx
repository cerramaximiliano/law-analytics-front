import { useState } from "react";
import { Box, Button, Collapse, Dialog, DialogActions, DialogContent, Stack, Typography, useMediaQuery } from "@mui/material";
import { alpha, keyframes, useTheme } from "@mui/material/styles";
import { Add, ArrowDown2, ClipboardText, CloseSquare, MagicStar, TickCircle, Warning2 } from "iconsax-react";
import { BRAND_BLUE } from "themes/dashboardTokens";

// ── Storyboard animado (13s loop): crear formulario → vincular .docx → clic Generar → transformación ──
const CYCLE = "13s";
const kEmptyOut = keyframes`0%,4%{opacity:0} 8%,46%{opacity:1} 52%,100%{opacity:0}`;
const kFormFill = keyframes`0%,48%{opacity:0;transform:translateY(4px)} 55%,90%{opacity:1;transform:none} 96%,100%{opacity:0;transform:translateY(4px)}`;
const kLinkDraw = keyframes`0%,26%{opacity:0;transform:scale(0.2)} 32%,90%{opacity:1;transform:scale(1)} 96%,100%{opacity:0;transform:scale(0.2)}`;
const kPhOut = keyframes`0%,62%{opacity:1;transform:none} 70%,90%{opacity:0;transform:translateY(-3px)} 96%,100%{opacity:1;transform:none}`;
const kValIn = keyframes`0%,62%{opacity:0;transform:translateY(3px)} 70%,90%{opacity:1;transform:none} 96%,100%{opacity:0;transform:translateY(3px)}`;
const kBtnPress = keyframes`0%,54%{transform:scale(1)} 57%{transform:scale(0.92)} 61%,100%{transform:scale(1)}`;
const kRipple = keyframes`0%,55%{opacity:0;transform:scale(0.25)} 58%{opacity:0.5;transform:scale(0.25)} 68%{opacity:0;transform:scale(1.7)} 100%{opacity:0}`;
const kMouse = keyframes`0%,38%{opacity:0;transform:translate(54px,32px) scale(1)} 45%{opacity:1;transform:translate(54px,32px) scale(1)} 54%{opacity:1;transform:translate(9px,10px) scale(1)} 57%{transform:translate(9px,10px) scale(0.8)} 61%,88%{opacity:1;transform:translate(9px,10px) scale(1)} 100%{opacity:0;transform:translate(54px,32px) scale(1)}`;
const kFormRing = keyframes`0%,3%{box-shadow:0 0 0 0 rgba(58,123,255,0)} 7%,24%{box-shadow:0 0 0 3.5px rgba(58,123,255,0.32)} 29%,100%{box-shadow:0 0 0 0 rgba(58,123,255,0)}`;
const kDocRing = keyframes`0%,60%{box-shadow:0 0 0 0 rgba(22,163,74,0)} 68%,90%{box-shadow:0 0 0 3.5px rgba(22,163,74,0.3)} 95%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}`;
const kCap1 = keyframes`0%,4%{opacity:0} 8%,24%{opacity:1} 28%,100%{opacity:0}`;
const kCap2 = keyframes`0%,27%{opacity:0} 31%,45%{opacity:1} 49%,100%{opacity:0}`;
const kCap3 = keyframes`0%,48%{opacity:0} 52%,62%{opacity:1} 66%,100%{opacity:0}`;
const kCap4 = keyframes`0%,66%{opacity:0} 70%,90%{opacity:1} 95%,100%{opacity:0}`;
// Indicador de pasos: la "chapa" activa (color) hace fade+scale sobre la base gris durante su fase.
const kStep1 = keyframes`0%,4%{opacity:0;transform:scale(0.85)} 8%,24%{opacity:1;transform:scale(1)} 28%,100%{opacity:0;transform:scale(0.85)}`;
const kStep2 = keyframes`0%,27%{opacity:0;transform:scale(0.85)} 31%,45%{opacity:1;transform:scale(1)} 49%,100%{opacity:0;transform:scale(0.85)}`;
const kStep3 = keyframes`0%,48%{opacity:0;transform:scale(0.85)} 52%,62%{opacity:1;transform:scale(1)} 66%,100%{opacity:0;transform:scale(0.85)}`;
const kStep4 = keyframes`0%,66%{opacity:0;transform:scale(0.85)} 70%,90%{opacity:1;transform:scale(1)} 95%,100%{opacity:0;transform:scale(0.85)}`;

const rm = (opacity?: number) => ({
	"@media (prefers-reduced-motion: reduce)": { animation: "none", ...(opacity !== undefined ? { opacity } : {}) },
});

// Campo del documento que morphea [placeholder] (azul) → valor (verde), sincronizado al clic.
const MergeField = ({ placeholder, value, delay = 0 }: { placeholder: string; value: string; delay?: number }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const green = theme.palette.success.main;
	const chip = (color: string, mono: boolean) => ({
		gridArea: "1 / 1",
		px: 0.5,
		borderRadius: 0.5,
		fontFamily: mono ? "monospace" : "inherit",
		fontSize: mono ? "0.72rem" : "inherit",
		fontWeight: 600,
		whiteSpace: "nowrap",
		color,
		bgcolor: alpha(color, isDark ? 0.18 : 0.1),
		border: `1px solid ${alpha(color, isDark ? 0.35 : 0.22)}`,
	});
	return (
		<Box component="span" sx={{ display: "inline-grid", verticalAlign: "middle", mx: 0.25, textAlign: "center" }}>
			<Box component="span" sx={{ ...chip(BRAND_BLUE, true), animation: `${kPhOut} ${CYCLE} ${delay}s ease-in-out infinite`, ...rm(1) }}>
				[{placeholder}]
			</Box>
			<Box component="span" sx={{ ...chip(green, false), animation: `${kValIn} ${CYCLE} ${delay}s ease-in-out infinite`, ...rm(0) }}>
				{value}
			</Box>
		</Box>
	);
};

// Campo del formulario: pasa de vacío (barra) → valor cargado.
const FormField = ({ label, value, delay = 0 }: { label: string; value: string; delay?: number }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box sx={{ mb: 1, "&:last-of-type": { mb: 0 } }}>
			<Typography sx={{ display: "block", fontSize: "0.6rem", color: "text.secondary", letterSpacing: "0.02em", mb: 0.375 }}>
				{label}
			</Typography>
			<Box
				sx={{
					display: "grid",
					alignItems: "center",
					justifyItems: "start",
					minHeight: 28,
					px: 1.125,
					py: 0.5,
					borderRadius: 1,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.24)}`,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
				}}
			>
				<Typography
					component="span"
					sx={{
						gridArea: "1 / 1",
						fontSize: "0.78rem",
						fontWeight: 600,
						color: "text.primary",
						animation: `${kFormFill} ${CYCLE} ${delay}s ease-in-out infinite`,
						...rm(1),
					}}
				>
					{value}
				</Typography>
				<Box
					sx={{
						gridArea: "1 / 1",
						height: 6,
						width: "62%",
						borderRadius: 1,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
						animation: `${kEmptyOut} ${CYCLE} ${delay}s ease-in-out infinite`,
						...rm(0),
					}}
				/>
			</Box>
		</Box>
	);
};

const MergeStoryboard = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const green = theme.palette.success.main;
	const panelSx = {
		flex: 1,
		minWidth: 0,
		borderRadius: 1.5,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.24)}`,
		overflow: "hidden",
		bgcolor: "background.paper",
	};
	const headSx = {
		px: 1.25,
		py: 0.875,
		fontSize: "0.6rem",
		fontWeight: 700,
		letterSpacing: "0.05em",
		textTransform: "uppercase" as const,
		color: "text.secondary",
		bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
		borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)}`,
	};
	const cap = (kf: string, n: number, node: React.ReactNode, rmVisible = false) => (
		<Typography
			sx={{
				position: "absolute",
				left: 0,
				right: 0,
				fontSize: "0.8rem",
				fontWeight: 600,
				color: "text.primary",
				opacity: 0,
				animation: `${kf} ${CYCLE} ease-in-out infinite`,
				...rm(rmVisible ? 1 : 0),
			}}
		>
			<Box
				component="span"
				sx={{
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					width: 18,
					height: 18,
					borderRadius: "50%",
					bgcolor: BRAND_BLUE,
					color: "#fff",
					fontSize: "0.66rem",
					fontWeight: 700,
					mr: 0.875,
					verticalAlign: "-3px",
				}}
			>
				{n}
			</Box>
			{node}
		</Typography>
	);
	const blue = (t: string) => (
		<Box component="span" sx={{ color: BRAND_BLUE, fontWeight: 700 }}>
			{t}
		</Box>
	);
	const stepDot = (n: number, kf: string, activeColor: string) => {
		const base = {
			position: "absolute" as const,
			inset: 0,
			borderRadius: "50%",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			fontSize: "0.72rem",
			fontWeight: 700,
		};
		return (
			<Box sx={{ position: "relative", width: 24, height: 24, flexShrink: 0 }}>
				<Box sx={{ ...base, color: "text.secondary", border: `1.5px solid ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.16)}` }}>{n}</Box>
				<Box sx={{ ...base, color: "#fff", bgcolor: activeColor, opacity: 0, animation: `${kf} ${CYCLE} ease-in-out infinite`, ...rm(0) }}>
					{n}
				</Box>
			</Box>
		);
	};
	const stepBar = <Box sx={{ width: 26, height: 2, borderRadius: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.32 : 0.22) }} />;

	return (
		<Box sx={{ position: "relative" }}>
			{/* Indicador de pasos */}
			<Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75} sx={{ mb: 2.5 }}>
				{stepDot(1, kStep1, BRAND_BLUE)}
				{stepBar}
				{stepDot(2, kStep2, BRAND_BLUE)}
				{stepBar}
				{stepDot(3, kStep3, BRAND_BLUE)}
				{stepBar}
				{stepDot(4, kStep4, green)}
			</Stack>
			<Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
				{/* Formulario */}
				<Box sx={{ ...panelSx, animation: `${kFormRing} ${CYCLE} ease-in-out infinite`, ...rm() }}>
					<Stack direction="row" alignItems="center" sx={headSx}>
						<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: BRAND_BLUE, mr: 1.25 }} />
						Formulario
					</Stack>
					<Box sx={{ px: 1.5, py: 1.25 }}>
						<FormField label="Nombre del actor" value="LÓPEZ, Marcela" delay={0} />
						<FormField label="DNI" value="27.654.321" delay={0.3} />
						<FormField label="Monto reclamado" value="$ 2.400.000" delay={0.6} />
					</Box>
				</Box>

				{/* Conector: vincular */}
				<Stack sx={{ flex: { xs: "0 0 auto", sm: "0 0 34px" }, justifyContent: "center", alignItems: "center", py: { xs: 0.5, sm: 0 } }}>
					<Box
						sx={{
							width: 30,
							height: 30,
							borderRadius: "50%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: BRAND_BLUE,
							bgcolor: "background.paper",
							border: `1.5px solid ${BRAND_BLUE}`,
							boxShadow: `0 2px 8px ${alpha(BRAND_BLUE, 0.25)}`,
							animation: `${kLinkDraw} ${CYCLE} ease-in-out infinite`,
							"@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: 1, transform: "none" },
						}}
					>
						<svg viewBox="0 0 24 24" width={15} height={15}>
							<path
								d="M9 13a4 4 0 0 0 6 0l2-2a4 4 0 0 0-6-6l-1 1M15 11a4 4 0 0 0-6 0l-2 2a4 4 0 0 0 6 6l1-1"
								fill="none"
								stroke="currentColor"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</Box>
				</Stack>

				{/* Documento */}
				<Box sx={{ ...panelSx, animation: `${kDocRing} ${CYCLE} ease-in-out infinite`, ...rm() }}>
					<Stack direction="row" alignItems="center" sx={headSx}>
						<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: green, mr: 1.25 }} />
						Documento .docx
					</Stack>
					<Box sx={{ px: 1.75, py: 1.5 }}>
						<Typography
							sx={{
								fontFamily: "'Times New Roman', serif",
								fontWeight: 700,
								fontSize: "0.72rem",
								letterSpacing: "0.1em",
								textAlign: "center",
								color: "text.primary",
								pb: 0.875,
								mb: 1,
								borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)}`,
							}}
						>
							DEMANDA
						</Typography>
						<Typography
							sx={{
								fontFamily: "'Times New Roman', serif",
								fontSize: "0.82rem",
								lineHeight: 2.15,
								color: "text.primary",
								textAlign: "justify",
							}}
						>
							Comparece <MergeField placeholder="nombre del actor" value="LÓPEZ, Marcela" delay={0} />, DNI{" "}
							<MergeField placeholder="dni del actor" value="27.654.321" delay={0.16} />, y reclama la suma de $
							<MergeField placeholder="monto" value="2.400.000" delay={0.32} />.
						</Typography>
					</Box>
				</Box>
			</Stack>

			{/* Acción: botón + mouse + ripple */}
			<Box sx={{ position: "relative", display: "flex", justifyContent: "center", mt: 2 }}>
				<Box
					sx={{
						position: "absolute",
						left: "50%",
						top: "50%",
						width: 130,
						height: 42,
						mt: "-21px",
						ml: "-65px",
						borderRadius: 1.5,
						bgcolor: alpha(BRAND_BLUE, 0.35),
						pointerEvents: "none",
						opacity: 0,
						animation: `${kRipple} ${CYCLE} ease-out infinite`,
						...rm(0),
					}}
				/>
				<Box
					component="span"
					sx={{
						display: "inline-flex",
						alignItems: "center",
						gap: 0.75,
						px: 2.25,
						py: 1,
						borderRadius: 1.25,
						bgcolor: BRAND_BLUE,
						color: "#fff",
						fontSize: "0.8rem",
						fontWeight: 600,
						boxShadow: `0 4px 14px ${alpha(BRAND_BLUE, 0.32)}`,
						transformOrigin: "center",
						animation: `${kBtnPress} ${CYCLE} ease-in-out infinite`,
						...rm(),
					}}
				>
					<MagicStar size={15} variant="Bulk" color="#fff" /> Generar documento
				</Box>
				<Box
					sx={{
						position: "absolute",
						left: "50%",
						top: "50%",
						width: 22,
						height: 22,
						pointerEvents: "none",
						opacity: 0,
						color: "text.primary",
						filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
						animation: `${kMouse} ${CYCLE} ease-in-out infinite`,
						...rm(0),
					}}
				>
					<svg viewBox="0 0 24 24" width={22} height={22}>
						<path
							d="M5 3l14 8-6.2 1.4L10 20 5 3z"
							fill="currentColor"
							stroke={theme.palette.background.paper}
							strokeWidth={1.3}
							strokeLinejoin="round"
						/>
					</svg>
				</Box>
			</Box>

			{/* Captions por paso */}
			<Box sx={{ position: "relative", height: 24, mt: 2, textAlign: "center" }}>
				{cap(kCap1, 1, <>Creás el {blue("formulario")} con sus campos</>, true)}
				{cap(kCap2, 2, <>Vinculás tu documento {blue(".docx")}</>)}
				{cap(kCap3, 3, <>Clic en {blue("«Generar documento»")}</>)}
				{cap(kCap4, 4, <>Los {blue("[corchetes]")} se completan con tus datos</>)}
			</Box>
		</Box>
	);
};

interface FormBuilderGuideModalProps {
	open: boolean;
	onClose: () => void;
	onCreate?: () => void;
}

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => {
	return (
		<Stack direction="row" spacing={1.5} alignItems="flex-start">
			<Box
				sx={{
					width: 24,
					height: 24,
					flexShrink: 0,
					borderRadius: "50%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: "0.72rem",
					fontWeight: 700,
					color: "#fff",
					bgcolor: BRAND_BLUE,
					mt: 0.1,
				}}
			>
				{n}
			</Box>
			<Box sx={{ minWidth: 0 }}>
				<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em", mb: 0.25 }}>
					{title}
				</Typography>
				<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em", lineHeight: 1.5, textWrap: "pretty" }}>
					{children}
				</Typography>
			</Box>
		</Stack>
	);
};

const FormBuilderGuideModal = ({ open, onClose, onCreate }: FormBuilderGuideModalProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
	const [stepsOpen, setStepsOpen] = useState(false);

	const brandPrimarySx = {
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		borderRadius: 1.25,
		boxShadow: "none",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
	};
	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		color: "text.secondary",
		borderRadius: 1.25,
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04) },
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			fullScreen={fullScreen}
			PaperProps={{
				sx: {
					borderRadius: fullScreen ? 0 : 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					overflow: "hidden",
				},
			}}
		>
			{/* Header */}
			<Box
				sx={{
					position: "relative",
					overflow: "hidden",
					p: { xs: 2.25, sm: 2.5 },
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				}}
			>
				<Box
					sx={{
						position: "absolute",
						top: -60,
						right: -40,
						width: 200,
						height: 200,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.1)} 0%, transparent 70%)`,
						pointerEvents: "none",
					}}
				/>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
					<Box
						sx={{
							width: 40,
							height: 40,
							borderRadius: 1.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.16)}`,
							color: BRAND_BLUE,
							flexShrink: 0,
						}}
					>
						<ClipboardText size={22} variant="Bulk" />
					</Box>
					<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
						<Typography
							sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
						>
							Guía
						</Typography>
						<Typography
							sx={{ fontSize: { xs: "1.05rem", sm: "1.2rem" }, fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}
						>
							Cómo crear un formulario con documento
						</Typography>
					</Stack>
					<Button
						onClick={onClose}
						sx={{ minWidth: 0, p: 0.75, color: "text.secondary", "&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, 0.08) } }}
					>
						<CloseSquare size={20} variant="Linear" />
					</Button>
				</Stack>
			</Box>

			<DialogContent sx={{ p: { xs: 2.25, sm: 3 } }}>
				<Stack spacing={3}>
					<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
						Capturás los datos una vez en un formulario y generás un documento Word ya completado. La clave: en tu <b>.docx</b> marcás con{" "}
						<Box component="span" sx={{ fontFamily: "monospace", fontWeight: 600, color: BRAND_BLUE }}>
							[corchetes]
						</Box>{" "}
						dónde va cada dato.
					</Typography>

					{/* Ejemplo animado: se oculta al ver los pasos en detalle */}
					<Collapse in={!stepsOpen}>
						<Box>
							<Typography
								sx={{
									fontSize: "0.7rem",
									fontWeight: 700,
									letterSpacing: "0.05em",
									textTransform: "uppercase",
									color: "text.secondary",
									mb: 1.5,
								}}
							>
								Mirá cómo funciona
							</Typography>
							<MergeStoryboard />
						</Box>
					</Collapse>

					{/* Instrucciones en detalle — colapsadas para no competir con la animación */}
					<Box>
						<Button
							fullWidth
							onClick={() => setStepsOpen((v) => !v)}
							endIcon={
								<ArrowDown2 size={15} style={{ transform: stepsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />
							}
							sx={{
								justifyContent: "space-between",
								textTransform: "none",
								fontWeight: 600,
								fontSize: "0.82rem",
								color: "text.secondary",
								borderRadius: 1.25,
								px: 1.5,
								py: 1,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
								"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03), borderColor: alpha(BRAND_BLUE, 0.28) },
							}}
						>
							{stepsOpen ? "Volver a la animación" : "Ver los pasos en detalle"}
						</Button>
						<Collapse in={stepsOpen}>
							<Stack spacing={2.5} sx={{ pt: 2 }}>
								{/* Pasos */}
								<Stack spacing={1.75}>
									<Step n={1} title="Definí los campos del formulario">
										Cada dato que se repite (nombre, DNI, monto…) es un campo. Pueden ser texto, fecha, checkbox, opción o lista.
									</Step>
									<Step n={2} title="Escribí los corchetes en tu .docx">
										Donde quieras que se inserte un dato, escribí el nombre del campo entre corchetes:{" "}
										<Box component="span" sx={{ fontFamily: "monospace", fontWeight: 600, color: BRAND_BLUE }}>
											[nombre del actor]
										</Box>
										. El texto adentro debe <b>coincidir exactamente</b> con el campo (mayúsculas y espacios incluidos).
									</Step>
									<Step n={3} title="Subí el .docx y vinculá">
										Al subirlo, comparamos cada corchete con tus campos y te mostramos el estado:{" "}
										<TickCircle size={13} variant="Bold" color={theme.palette.success.main} style={{ verticalAlign: "-2px" }} /> coincide ·{" "}
										<Warning2 size={13} variant="Bold" color="#E3A008" style={{ verticalAlign: "-2px" }} /> falta el campo (agregalo o
										corregí el nombre).
									</Step>
									<Step n={4} title="Campos con IA (opcional)">
										Un campo puede redactarlo la IA a partir de una instrucción. Al generar podés adjuntar documentos de contexto (hechos,
										prueba) para que el texto sea más preciso.
									</Step>
									<Step n={5} title="Completá y generá">
										Cuando uses el modelo, cargás los datos una vez y el documento sale listo para descargar o imprimir en PDF.
									</Step>
								</Stack>

								{/* Tip */}
								<Stack
									direction="row"
									spacing={1}
									alignItems="flex-start"
									sx={{
										p: 1.5,
										borderRadius: 1.5,
										bgcolor: alpha("#E3A008", isDark ? 0.12 : 0.08),
										border: `1px solid ${alpha("#E3A008", isDark ? 0.3 : 0.2)}`,
									}}
								>
									<Warning2 size={16} color="#E3A008" variant="Bulk" style={{ flexShrink: 0, marginTop: 1 }} />
									<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em", lineHeight: 1.5 }}>
										Si un corchete no coincide con ningún campo, ese texto queda <b>literal</b> en el documento (con los corchetes). Por eso
										el nombre tiene que ser idéntico.
									</Typography>
								</Stack>
							</Stack>
						</Collapse>
					</Box>
				</Stack>
			</DialogContent>

			<DialogActions sx={{ px: { xs: 2.25, sm: 3 }, py: 2, gap: 1 }}>
				<Button onClick={onClose} sx={ghostBtnSx}>
					Entendido
				</Button>
				{onCreate && (
					<Button
						startIcon={<Add size={16} variant="Linear" />}
						onClick={() => {
							onClose();
							onCreate();
						}}
						sx={brandPrimarySx}
					>
						Crear formulario
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default FormBuilderGuideModal;
