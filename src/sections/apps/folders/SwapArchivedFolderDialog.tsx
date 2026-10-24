import { useEffect, useMemo, useState } from "react";
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogContent,
	InputAdornment,
	OutlinedInput,
	Radio,
	Stack,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// icons
import { ArrangeHorizontal, SearchNormal1 } from "iconsax-react";

// project imports
import { PopupTransition } from "components/@extended/Transitions";
import { dispatch, useSelector, RootState } from "store";
import { useTeam } from "contexts/TeamContext";
import { archiveFolders, getFoldersByGroupId, getFoldersByUserId, getFolderById, unarchiveFolders } from "store/reducers/folder";
import { openSnackbar } from "store/reducers/snackbar";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { formatFolderName } from "utils/formatFolderName";

interface SwapArchivedFolderDialogProps {
	open: boolean;
	onClose: () => void;
	// Carpeta archivada que se quiere activar
	folder: any;
	// Se llama después de un intercambio exitoso (la carpeta actual ya está activa)
	onSwapped?: () => void;
}

// ==============================|| SWAP ARCHIVED FOLDER DIALOG ||============================== //
//
// "Activar esta en lugar de otra": el usuario elige una de sus causas activas,
// se archiva y se desarchiva la actual en su lugar. Se usa cuando la carpeta
// quedó archivada por el límite del plan y no hay lugar libre.

const notify = (message: string, color: "success" | "error") =>
	dispatch(
		openSnackbar({
			open: true,
			message,
			variant: "alert",
			alert: { color },
			close: true,
		}),
	);

const SwapArchivedFolderDialog = ({ open, onClose, folder, onSwapped }: SwapArchivedFolderDialogProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { isTeamMode, activeTeam, getRequestHeaders } = useTeam();

	const userId = useSelector((state: RootState) => (state as any).auth?.user?._id as string | undefined);
	const folders = useSelector((state: RootState) => ((state as any).folder?.folders || []) as any[]);

	const [loadingList, setLoadingList] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [swapping, setSwapping] = useState(false);

	// Al abrir: asegurar el listado de carpetas activas (si se entró por deep link
	// al detalle, el store puede no tenerlo).
	useEffect(() => {
		if (!open || !userId) return;
		setSelectedId(null);
		setSearch("");
		let cancelled = false;
		(async () => {
			setLoadingList(true);
			try {
				if (isTeamMode && activeTeam?._id) {
					await dispatch(getFoldersByGroupId(activeTeam._id));
				} else {
					await dispatch(getFoldersByUserId(userId));
				}
			} finally {
				if (!cancelled) setLoadingList(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [open, userId, isTeamMode, activeTeam?._id]);

	const activeFolders = useMemo(() => folders.filter((f) => f && f._id !== folder?._id && f.archived !== true), [folders, folder?._id]);

	const visibleFolders = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return activeFolders;
		return activeFolders.filter((f) => `${f.folderName || ""} ${f.materia || ""}`.toLowerCase().includes(term));
	}, [activeFolders, search]);

	const handleConfirm = async () => {
		if (!userId || !selectedId || !folder?._id || swapping) return;
		const options = { headers: getRequestHeaders() };
		setSwapping(true);
		try {
			const archived = await dispatch(archiveFolders(userId, [selectedId], options));
			if (!archived?.success) {
				notify(archived?.message || "No se pudo archivar la causa elegida", "error");
				return;
			}
			const unarchived = await dispatch(unarchiveFolders(userId, [folder._id], options));
			if (!unarchived?.success) {
				// Volver atrás: la elegida recupera su lugar.
				await dispatch(unarchiveFolders(userId, [selectedId], options));
				notify(unarchived?.message || "No se pudo activar esta causa. La elegida sigue activa.", "error");
				return;
			}
			await dispatch(getFolderById(folder._id, true));
			notify("Listo: la causa elegida pasó a archivadas y esta quedó activa", "success");
			onClose();
			onSwapped?.();
		} catch {
			notify("No se pudo hacer el intercambio. Intentá de nuevo.", "error");
		} finally {
			setSwapping(false);
		}
	};

	const secondaryBtnSx = {
		textTransform: "none",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		py: 1,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04), borderColor: alpha(BRAND_BLUE, 0.28) },
	} as const;

	return (
		<Dialog
			open={open}
			onClose={swapping ? undefined : onClose}
			TransitionComponent={PopupTransition}
			maxWidth="sm"
			fullWidth
			aria-labelledby="swap-archived-title"
			PaperProps={{
				sx: {
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					overflow: "hidden",
				},
			}}
		>
			<DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
				<Stack spacing={2}>
					<Stack direction="row" spacing={1.5} alignItems="flex-start">
						<Box
							sx={{
								flexShrink: 0,
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
								color: BRAND_BLUE,
							}}
						>
							<ArrangeHorizontal size={20} variant="Bulk" />
						</Box>
						<Stack spacing={0.25} sx={{ minWidth: 0 }}>
							<Typography
								id="swap-archived-title"
								sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary", lineHeight: 1.3 }}
							>
								Activar esta en lugar de otra
							</Typography>
							<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" as any }}>
								Elegí cuál de tus causas activas pasa a archivada para liberar el lugar.
							</Typography>
						</Stack>
					</Stack>

					<OutlinedInput
						size="small"
						fullWidth
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Buscar causa"
						startAdornment={
							<InputAdornment position="start">
								<SearchNormal1 size={16} />
							</InputAdornment>
						}
						sx={{ borderRadius: 1.25, fontSize: "0.85rem" }}
					/>

					<Box
						sx={{
							maxHeight: 320,
							overflowY: "auto",
							borderRadius: 1.25,
							border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.12 : 0.08)}`,
						}}
					>
						{loadingList && activeFolders.length === 0 ? (
							<Stack alignItems="center" sx={{ py: 4 }}>
								<CircularProgress size={22} />
							</Stack>
						) : visibleFolders.length === 0 ? (
							<Typography sx={{ py: 3, px: 2, fontSize: "0.82rem", color: "text.secondary", textAlign: "center" }}>
								{activeFolders.length === 0 ? "No tenés causas activas para intercambiar." : "Ninguna causa coincide con la búsqueda."}
							</Typography>
						) : (
							visibleFolders.map((f) => {
								const checked = selectedId === f._id;
								return (
									<Stack
										key={f._id}
										direction="row"
										alignItems="center"
										spacing={1}
										onClick={() => setSelectedId(f._id)}
										sx={{
											px: 1,
											py: 0.75,
											cursor: "pointer",
											bgcolor: checked ? alpha(BRAND_BLUE, isDark ? 0.12 : 0.06) : "transparent",
											"&:not(:last-of-type)": { borderBottom: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.08 : 0.06)}` },
											"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04) },
										}}
									>
										<Radio
											size="small"
											checked={checked}
											onChange={() => setSelectedId(f._id)}
											inputProps={{ "aria-label": f.folderName }}
										/>
										<Stack sx={{ minWidth: 0, flex: 1 }}>
											<Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 500, color: "text.primary" }}>
												{f.folderName ? formatFolderName(f.folderName, 90) : "Carpeta sin nombre"}
											</Typography>
											{(f.materia || f.folderJuris) && (
												<Typography noWrap sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
													{[f.materia, typeof f.folderJuris === "string" ? f.folderJuris : f.folderJuris?.label]
														.filter(Boolean)
														.join(" · ")}
												</Typography>
											)}
										</Stack>
									</Stack>
								);
							})
						)}
					</Box>

					<Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.25} justifyContent="flex-end">
						<Button onClick={onClose} disabled={swapping} sx={secondaryBtnSx}>
							Cancelar
						</Button>
						<Button
							variant="contained"
							onClick={handleConfirm}
							disabled={!selectedId || swapping}
							startIcon={swapping ? <CircularProgress size={14} color="inherit" /> : undefined}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								borderRadius: 1.25,
								py: 1,
								bgcolor: BRAND_BLUE,
								boxShadow: "none",
								"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
								"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
							}}
						>
							{swapping ? "Intercambiando…" : "Archivar la elegida y activar esta"}
						</Button>
					</Stack>
				</Stack>
			</DialogContent>
		</Dialog>
	);
};

export default SwapArchivedFolderDialog;
