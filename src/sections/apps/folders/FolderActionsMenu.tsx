import React from "react";
import { Box, ButtonBase, Drawer, Popover, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
	Add,
	ArrowRight2,
	Calculator,
	Calendar,
	DocumentDownload,
	DocumentText,
	DocumentText1,
	Eye,
	Maximize,
	MessageText1,
	Moneys,
	Profile2User,
	TableDocument,
	TaskSquare,
} from "iconsax-react";
import { BRAND_BLUE } from "themes/dashboardTokens";

// ==============================|| MENÚ DE ACCIONES DE UNA CARPETA (LISTADO) ||============================== //
//
// Menú "Más acciones" de cada fila del listado de carpetas. Tres zonas:
//   1. Expediente (solo carpetas PJN): descarga del expediente completo y,
//      cuando se active, el chat con IA.
//   2. Ver detalles (expande la fila) y, en móvil, Abrir carpeta (la tarjeta
//      compacta no tiene ese botón).
//   3. Crear en esta carpeta: grilla de dos columnas.
//
// En escritorio/tablet es un popover de 300 px; en móvil (< sm) una hoja
// inferior a todo el ancho con áreas táctiles más altas.
//
// El menú solo se abre en carpetas verificadas (el botón "Más acciones" está
// deshabilitado en pendientes y con error), así que acá no hay estado
// "causa sin verificar".

// Chat con IA sobre el expediente: el RAG por causa está desactivado (ver
// la-infra-docs/runbooks/rag-por-causa-desactivado.md). El renglón queda
// diseñado y apagado; al relanzarlo, pasar a true y crear la tab "chat" en el
// detalle de la carpeta (hoy ?tab=chat no existe).
export const EXPEDIENTE_CHAT_ENABLED = false;

export type FolderCreateKind = "documento" | "calculo" | "tarea" | "nota" | "contacto" | "movimiento" | "evento" | "oferta";

const CREATE_ITEMS: { kind: FolderCreateKind; label: string; Icon: typeof Add }[] = [
	{ kind: "documento", label: "Documento", Icon: DocumentText1 },
	{ kind: "calculo", label: "Cálculo", Icon: Calculator },
	{ kind: "tarea", label: "Tarea", Icon: TaskSquare },
	{ kind: "nota", label: "Nota", Icon: DocumentText },
	{ kind: "contacto", label: "Contacto", Icon: Profile2User },
	{ kind: "movimiento", label: "Movimiento", Icon: TableDocument },
	{ kind: "evento", label: "Evento", Icon: Calendar },
	{ kind: "oferta", label: "Oferta / Reclamo", Icon: Moneys },
];

interface FolderActionsMenuProps {
	anchorEl: HTMLElement | null;
	open: boolean;
	onClose: () => void;
	folder: { _id?: string; folderName?: string; pjn?: boolean } | null;
	detailsExpanded: boolean;
	canCreate: boolean;
	onToggleDetails: () => void;
	onOpenFolder: () => void;
	onDownloadExpediente: () => void;
	onChatExpediente: () => void;
	onCreate: (kind: FolderCreateKind) => void;
}

const FolderActionsMenu: React.FC<FolderActionsMenuProps> = ({
	anchorEl,
	open,
	onClose,
	folder,
	detailsExpanded,
	canCreate,
	onToggleDetails,
	onOpenFolder,
	onDownloadExpediente,
	onChatExpediente,
	onCreate,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const isPjn = folder?.pjn === true;
	const border = alpha(BRAND_BLUE, isDark ? 0.34 : 0.28);
	const divider = alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1);
	const rowH = isMobile ? 48 : 40;
	const tileH = isMobile ? 48 : 44;
	const iconSize = isMobile ? 20 : 18;

	const sectionLabelSx = {
		px: 1.25,
		pt: 0.5,
		fontSize: "0.625rem",
		fontWeight: 600,
		letterSpacing: "0.08em",
		textTransform: "uppercase" as const,
		color: "text.secondary",
	};
	const hoverSx = { "&:hover, &.Mui-focusVisible": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) } };

	// Renglón del bloque Expediente: ícono en caja + título + subtítulo.
	const expedienteRow = (
		icon: React.ReactNode,
		title: string,
		subtitle: string,
		onClick: () => void,
		navigates: boolean,
		testId: string,
	) => (
		<ButtonBase
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			data-testid={testId}
			sx={{
				display: "flex",
				alignItems: "center",
				gap: 1.25,
				px: 1.25,
				py: 1,
				minHeight: isMobile ? 56 : 48,
				textAlign: "left",
				...hoverSx,
			}}
		>
			<Box
				sx={{
					width: isMobile ? 36 : 32,
					height: isMobile ? 36 : 32,
					borderRadius: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
					border: `1px solid ${border}`,
					color: BRAND_BLUE,
				}}
			>
				{icon}
			</Box>
			<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
				<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>{title}</Typography>
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{subtitle}</Typography>
			</Stack>
			{navigates && <ArrowRight2 size={16} color={BRAND_BLUE} />}
		</ButtonBase>
	);

	const plainRow = (icon: React.ReactNode, label: string, onClick: () => void) => (
		<ButtonBase
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-start",
				gap: 1.25,
				px: 1.25,
				height: rowH,
				borderRadius: 1,
				fontSize: "0.85rem",
				color: "text.primary",
				...hoverSx,
			}}
		>
			<Box sx={{ display: "flex", color: "text.secondary" }}>{icon}</Box>
			{label}
		</ButtonBase>
	);

	const content = (
		<Stack spacing={0.75} onClick={(e) => e.stopPropagation()}>
			{isMobile && folder?.folderName && (
				<Stack spacing={0.25} sx={{ px: 0.25, pb: 0.5 }}>
					<Typography sx={{ ...sectionLabelSx, px: 0, pt: 0 }}>Carpeta</Typography>
					<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "text.primary" }} noWrap>
						{folder.folderName}
					</Typography>
				</Stack>
			)}

			{isPjn && (
				<>
					{!isMobile && <Typography sx={sectionLabelSx}>Expediente</Typography>}
					<Stack
						sx={{
							border: `1px solid ${border}`,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06),
							borderRadius: 1.25,
							overflow: "hidden",
						}}
					>
						{expedienteRow(
							<DocumentDownload size={iconSize} variant="Bulk" />,
							"Descargar expediente",
							"PDF completo con índice",
							onDownloadExpediente,
							false,
							"folder-download-expediente",
						)}
						{EXPEDIENTE_CHAT_ENABLED && (
							<>
								<Box sx={{ height: "1px", bgcolor: border, mx: 1.25 }} />
								{expedienteRow(
									<MessageText1 size={iconSize} variant="Bulk" />,
									"Consultar con IA",
									"Abre el chat del expediente",
									onChatExpediente,
									true,
									"folder-chat-expediente",
								)}
							</>
						)}
					</Stack>
				</>
			)}

			{isMobile && plainRow(<Maximize size={iconSize} variant="Bulk" />, "Abrir carpeta", onOpenFolder)}
			{plainRow(
				detailsExpanded ? (
					<Add size={iconSize} style={{ color: theme.palette.error.main, transform: "rotate(45deg)" }} />
				) : (
					<Eye size={iconSize} variant="Bulk" />
				),
				detailsExpanded ? "Cerrar detalles" : "Ver detalles",
				onToggleDetails,
			)}

			{canCreate && (
				<>
					<Box sx={{ height: "1px", bgcolor: divider, mx: 0.5 }} />
					<Typography sx={sectionLabelSx}>Crear en esta carpeta</Typography>
					<Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 0.75 }}>
						{CREATE_ITEMS.map(({ kind, label, Icon }) => (
							<ButtonBase
								key={kind}
								onClick={(e) => {
									e.stopPropagation();
									onCreate(kind);
								}}
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "flex-start",
									gap: 1,
									px: 1.25,
									height: tileH,
									borderRadius: 1.25,
									border: `1px solid ${divider}`,
									fontSize: "0.82rem",
									color: "text.primary",
									textAlign: "left",
									"&:hover, &.Mui-focusVisible": { borderColor: border, bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05) },
								}}
							>
								<Box sx={{ display: "flex", color: "text.secondary", flexShrink: 0 }}>
									<Icon size={18} variant="Bulk" />
								</Box>
								{label}
							</ButtonBase>
						))}
					</Box>
				</>
			)}
		</Stack>
	);

	if (isMobile) {
		return (
			<Drawer
				anchor="bottom"
				open={open}
				onClose={onClose}
				PaperProps={{ sx: { borderRadius: "18px 18px 0 0", px: 2, pt: 1, pb: 3, backgroundImage: "none" } }}
			>
				<Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: divider, mx: "auto", mb: 1.25 }} />
				{content}
			</Drawer>
		);
	}

	return (
		<Popover
			anchorEl={anchorEl}
			open={open}
			onClose={onClose}
			anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			transformOrigin={{ vertical: "top", horizontal: "right" }}
			slotProps={{
				paper: {
					elevation: 0,
					sx: {
						width: 300,
						p: 1,
						mt: 0.5,
						borderRadius: 1.5,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
						boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
						backgroundImage: "none",
					},
				},
			}}
		>
			{content}
		</Popover>
	);
};

export default FolderActionsMenu;
