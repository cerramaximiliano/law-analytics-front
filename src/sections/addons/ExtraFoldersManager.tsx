/**
 * Controles del add-on «Causas adicionales» (extra_folders): uso, avisos, cantidad de bloques y
 * confirmación. Bloques de +250 causas activas y +100 MB que se suman al plan Premium; se acumulan.
 * Lo usan Cuenta → Suscripción (ExtraFoldersSection) y la tarjeta Premium de la página de planes
 * (ExtraFoldersPlanNote), para que las dos pantallas no puedan quedar distintas.
 *
 * Contrato con el hub (GET/PUT /api/subscriptions/extra-folders, services/extraFoldersAddonService.js):
 *  - subir cobra el prorrateo en el momento (402 si la tarjeta falla: no se cobra ni se agrega nada);
 *  - bajar o pasar a 0 se aplica al fin del período, sin crédito;
 *  - pedir la cantidad actual deshace una baja programada.
 * Si al renovar las causas activas superan el nuevo límite, el hub abre la misma gracia del
 * downgrade (`grace`) y al vencer archiva las que sobran.
 */

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Stack,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Add, Minus } from "iconsax-react";

import ApiService, { type ExtraFoldersStatus } from "store/reducers/ApiService";
import { fetchCurrentSubscription } from "store/reducers/auth";
import { openSnackbar } from "store/reducers/snackbar";
import { formatMonthlyPrice } from "utils/mcpBannerCopy";
import dayjs from "utils/dayjs-config";

export const EXTRA_FOLDERS_NAME = "Causas adicionales";

export const INELIGIBLE_COPY: Record<NonNullable<ExtraFoldersStatus["eligibilityReason"]>, string> = {
	paid_plan_required: "Las causas adicionales se suman al plan Premium.",
	premium_required: "Las causas adicionales se suman solo al plan Premium.",
	subscription_inactive: "Tu suscripción tiene un pago pendiente. Regularizá el medio de pago para sumar bloques.",
	subscription_canceling: "Tu suscripción está programada para cancelarse: los bloques terminan con ella. Reactivala para sumar bloques.",
	plan_change_scheduled: "Tenés un cambio de plan programado: las causas adicionales terminan con Premium.",
};

const formatDate = (iso: string | null | undefined) => (iso ? dayjs(iso).format("D [de] MMMM [de] YYYY") : null);
export const blocksLabel = (n: number) => (n === 1 ? "1 bloque" : `${n} bloques`);
export const limitLabel = (n: number) => (n < 0 ? "ilimitadas" : n.toLocaleString("es-AR"));

/** Bloques con los que renueva: la baja programada si hay, si no los vigentes. */
export function renewalBlocks(status: ExtraFoldersStatus): number {
	return status.blocks.scheduled ?? status.blocks.purchased;
}

/** Límite de causas si quedara con `blocks` comprados (los regalados se mantienen). */
export function folderLimitWith(status: ExtraFoldersStatus, blocks: number): number {
	if (status.folders.plan < 0) return status.folders.plan;
	return status.folders.plan + (blocks + status.blocks.granted) * status.block.folders;
}

/** Cantidad inicial del selector: sin bloques y con la compra habilitada, arranca en 1 para ofrecer el primero. */
export function initialTarget(status: ExtraFoldersStatus): number {
	const renewal = renewalBlocks(status);
	return renewal === 0 && status.blocks.purchased === 0 && status.canIncrease ? 1 : renewal;
}

export function isExtraFoldersVisible(status: ExtraFoldersStatus | null): boolean {
	if (!status) return false;
	if (status.blocks.counted > 0 || status.blocks.purchased > 0) return true;
	return status.plan === "premium" && (status.publicAvailable || !!status.purchaseBypass);
}

export function extraFoldersSubtitle(status: ExtraFoldersStatus): string {
	const price = status.price ? formatMonthlyPrice(status.price.amount, status.price.currency) : null;
	return `Cada bloque suma ${status.block.folders} causas activas y ${status.block.storage} MB${price ? ` por ${price}` : ""}`;
}

type Pending = { blocks: number; kind: "increase" | "decrease" | "keep" };

interface ExtraFoldersManagerProps {
	status: ExtraFoldersStatus;
	/** Se llama después de un cambio aplicado, con el hub ya actualizado. */
	onChanged: () => Promise<void> | void;
}

const ExtraFoldersManager = ({ status, onChanged }: ExtraFoldersManagerProps) => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const [target, setTarget] = useState(() => initialTarget(status));
	const [pending, setPending] = useState<Pending | null>(null);
	const [busy, setBusy] = useState(false);
	const [dialogError, setDialogError] = useState<string | null>(null);

	useEffect(() => {
		setTarget(initialTarget(status));
	}, [status]);

	const renewal = renewalBlocks(status);
	const purchased = status.blocks.purchased;
	const reductionScheduled = status.blocks.scheduled !== null && status.blocks.scheduled < purchased;
	const nextBilling = formatDate(status.nextBillingDate);
	const maxSelectable = status.canIncrease ? status.maxBlocks : purchased;
	const canEdit = status.canIncrease || status.canDecrease;

	const notify = (message: string, color: "success" | "error" | "info") =>
		dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color }, close: false }));

	const ask = (blocks: number) => {
		setDialogError(null);
		if (blocks > purchased) setPending({ blocks, kind: "increase" });
		else if (blocks < purchased) setPending({ blocks, kind: "decrease" });
		else setPending({ blocks, kind: "keep" });
	};

	const confirm = async () => {
		if (!pending) return;
		setBusy(true);
		setDialogError(null);
		try {
			const res = await ApiService.setExtraFolders(pending.blocks);
			if (!res.success) {
				setDialogError(res.message || "No pudimos aplicar el cambio. Probá de nuevo.");
				return;
			}
			setPending(null);
			notify(
				res.result === "increased"
					? `Listo: ahora tenés ${blocksLabel(pending.blocks)} de ${EXTRA_FOLDERS_NAME.toLowerCase()}.`
					: res.message || "Cambio aplicado.",
				"success",
			);
			await onChanged();
			// Los límites del plan viven en la suscripción: refrescarla actualiza el uso de recursos.
			dispatch(fetchCurrentSubscription(true) as any);
		} catch (err: any) {
			setDialogError(err?.message || "No pudimos aplicar el cambio. Probá de nuevo.");
		} finally {
			setBusy(false);
		}
	};

	const newLimit = pending ? folderLimitWith(status, pending.blocks) : 0;
	const overLimit = pending ? Math.max(0, status.folders.used - newLimit) : 0;
	const totalLabel = (blocks: number) =>
		status.price && blocks > 0 ? formatMonthlyPrice(status.price.amount * blocks, status.price.currency) : null;

	const statBox = (label: string, value: string, detail: string) => (
		<Box
			sx={{ flex: 1, p: 1.5, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.1 : 0.04) }}
		>
			<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.04em" }}>
				{label}
			</Typography>
			<Typography sx={{ fontSize: "1.1rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
			<Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>{detail}</Typography>
		</Box>
	);

	return (
		<>
			<Stack spacing={2} data-testid="extra-folders-section">
				<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
					{statBox(
						"Causas activas",
						`${status.folders.used.toLocaleString("es-AR")} / ${limitLabel(status.folders.limit)}`,
						status.folders.extra > 0
							? `${limitLabel(status.folders.plan)} del plan + ${status.folders.extra.toLocaleString("es-AR")} adicionales`
							: "Límite de tu plan",
					)}
					{statBox(
						"Almacenamiento",
						`${limitLabel(status.storage.limit)} MB`,
						status.storage.extra > 0
							? `${limitLabel(status.storage.plan)} MB del plan + ${status.storage.extra} MB adicionales`
							: "Límite de tu plan",
					)}
				</Stack>

				{status.blocks.granted > 0 && (
					<Alert severity="info" variant="outlined">
						{status.blocks.granted === 1
							? "Tenés 1 bloque sin cargo otorgado por el equipo de Law||Analytics. Se suma a los que compres."
							: `Tenés ${status.blocks.granted} bloques sin cargo otorgados por el equipo de Law||Analytics. Se suman a los que compres.`}
					</Alert>
				)}

				{status.grace && (
					<Alert severity="warning">
						Bajaste bloques y tenés más causas activas que tu límite. Hasta el {formatDate(status.grace.expiresAt)} no archivamos nada:
						archivá las que ya no seguís o volvé a sumar bloques. Después archivamos automáticamente las de menor actividad.
					</Alert>
				)}

				{reductionScheduled && (
					<Alert
						severity="info"
						action={
							status.canDecrease && (
								<Button color="inherit" size="small" onClick={() => ask(purchased)} disabled={busy}>
									Mantener mis bloques
								</Button>
							)
						}
					>
						{status.blocks.scheduled === 0
							? `Tus ${EXTRA_FOLDERS_NAME.toLowerCase()} terminan el ${formatDate(status.blocks.scheduledAt)}.`
							: `El ${formatDate(status.blocks.scheduledAt)} pasás de ${blocksLabel(purchased)} a ${blocksLabel(
									status.blocks.scheduled!,
							  )}.`}
					</Alert>
				)}

				{status.eligibilityReason && <Alert severity="info">{INELIGIBLE_COPY[status.eligibilityReason]}</Alert>}
				{!status.eligibilityReason && status.maintenanceMessage && <Alert severity="warning">{status.maintenanceMessage}</Alert>}

				{canEdit && (
					<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
						<Stack direction="row" alignItems="center" spacing={1}>
							<IconButton
								aria-label="Quitar un bloque"
								onClick={() => setTarget((t) => Math.max(0, t - 1))}
								disabled={busy || target <= 0 || (!status.canDecrease && target <= purchased)}
							>
								<Minus size={18} />
							</IconButton>
							<Box sx={{ minWidth: 120, textAlign: "center" }}>
								<Typography sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }} data-testid="extra-folders-target">
									{blocksLabel(target)}
								</Typography>
								<Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
									{totalLabel(target) ? `${totalLabel(target)} en total` : "Sin cargo adicional"}
								</Typography>
							</Box>
							<IconButton
								aria-label="Sumar un bloque"
								onClick={() => setTarget((t) => Math.min(maxSelectable, t + 1))}
								disabled={busy || target >= maxSelectable}
							>
								<Add size={18} />
							</IconButton>
						</Stack>
						<Box sx={{ flex: 1 }} />
						<Button variant="contained" disabled={busy || target === renewal} onClick={() => ask(target)} data-testid="extra-folders-apply">
							{target > purchased || purchased === 0 ? "Sumar bloques" : target === purchased ? "Mantener mis bloques" : "Bajar bloques"}
						</Button>
					</Stack>
				)}

				{status.purchaseBypass && !status.publicAvailable && (
					<Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
						Venta cerrada al público: lo ves porque tu cuenta es{" "}
						{status.purchaseBypass.reason === "admin" ? "de administrador" : "de prueba"}.
					</Typography>
				)}
			</Stack>

			<Dialog open={!!pending} onClose={() => !busy && setPending(null)} maxWidth="xs" fullWidth>
				{pending && (
					<>
						<DialogTitle>
							{pending.kind === "increase"
								? "Sumar causas adicionales"
								: pending.kind === "decrease"
								? "Bajar causas adicionales"
								: "Mantener tus bloques"}
						</DialogTitle>
						<DialogContent>
							<Stack spacing={1.5}>
								{pending.kind === "increase" && (
									<>
										<Typography>
											Pasás de {blocksLabel(purchased)} a {blocksLabel(pending.blocks)}: tu límite sube a {limitLabel(newLimit)} causas
											activas.
										</Typography>
										<Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
											Te cobramos ahora la parte proporcional hasta {nextBilling ? `el ${nextBilling}` : "tu próxima renovación"}. Desde
											ahí, el add-on suma {totalLabel(pending.blocks)} a tu factura.
										</Typography>
									</>
								)}
								{pending.kind === "decrease" && (
									<>
										<Typography>
											{pending.blocks === 0
												? `Das de baja tus ${EXTRA_FOLDERS_NAME.toLowerCase()}`
												: `Pasás de ${blocksLabel(purchased)} a ${blocksLabel(pending.blocks)}`}{" "}
											{nextBilling ? `el ${nextBilling}` : "al final del período"}. Hasta entonces seguís con los bloques de hoy, sin
											reintegro.
										</Typography>
										<Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
											Tu nuevo límite será de {limitLabel(newLimit)} causas activas.
										</Typography>
										{overLimit > 0 && (
											<Alert severity="warning">
												Hoy tenés {status.folders.used.toLocaleString("es-AR")} causas activas ({overLimit.toLocaleString("es-AR")} por
												encima). Si al renovar seguís por encima, tenés un período de gracia para ordenarlas y después archivamos las de
												menor actividad. Archivar no borra nada.
											</Alert>
										)}
									</>
								)}
								{pending.kind === "keep" && (
									<Typography>Cancelás la baja programada y seguís con {blocksLabel(purchased)}. No hay ningún cargo nuevo.</Typography>
								)}
								{dialogError && <Alert severity="error">{dialogError}</Alert>}
							</Stack>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setPending(null)} disabled={busy} color="inherit">
								Volver
							</Button>
							<Button
								variant="contained"
								onClick={confirm}
								disabled={busy}
								color={pending.kind === "decrease" ? "warning" : "primary"}
								startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}
								data-testid="extra-folders-confirm"
							>
								{pending.kind === "increase" ? "Confirmar y pagar" : "Confirmar"}
							</Button>
						</DialogActions>
					</>
				)}
			</Dialog>
		</>
	);
};

export default ExtraFoldersManager;
