/**
 * Aviso "credencial PJN requiere acción" (lista de carpetas y detalle).
 * - En pantallas chicas va una sola línea ("Tu credencial PJN requiere acción." + "Actualizar");
 *   el texto completo queda en el tooltip (tap).
 * - Se puede cerrar (2026-09-30): en el detalle, "en esta carpeta" o "en todas las carpetas"; en la
 *   lista, en todas. Se guarda en el hub atado a la caída actual: si la credencial vuelve a caer, el
 *   aviso reaparece.
 */
import { useState } from "react";
import { Alert, Button, IconButton, ListItemText, Menu, MenuItem, Tooltip, Typography, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { CloseCircle, Warning2 } from "iconsax-react";
import { useNavigate } from "react-router-dom";
import { PJN_CRED_ERROR_BANNER_COPY, PJN_CRED_ERROR_BANNER_SHORT_COPY } from "utils/pjnBindingState";
import { dismissPjnCredBanner, pjnCredBannerCerrado, usePjnCredentialError } from "hooks/usePjnCredentialError";

export default function PjnCredErrorBanner({ to, sx, folderId }: { to: string; sx?: object; folderId?: string }) {
	const navigate = useNavigate();
	const compacto = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
	const cred = usePjnCredentialError();
	const [menu, setMenu] = useState<HTMLElement | null>(null);
	const [cerrando, setCerrando] = useState(false);
	if (pjnCredBannerCerrado(cred, folderId)) return null;

	const cerrar = async (scope: "global" | "folder") => {
		setMenu(null);
		setCerrando(true);
		const ok = await dismissPjnCredBanner(scope, scope === "folder" ? folderId : undefined);
		if (!ok) setCerrando(false);
	};

	const boton = (
		<Button
			color="warning"
			size="small"
			variant="outlined"
			onClick={() => navigate(to)}
			sx={{ textTransform: "none", whiteSpace: "nowrap", fontWeight: 600 }}
		>
			{compacto ? "Actualizar" : "Actualizar credencial"}
		</Button>
	);
	const cerrarBtn = (
		<>
			<Tooltip title={folderId ? "Ocultar aviso" : "Ocultar aviso en todas las carpetas"}>
				<span>
					<IconButton
						size="small"
						aria-label="Ocultar aviso"
						disabled={cerrando}
						onClick={(e) => (folderId ? setMenu(e.currentTarget) : cerrar("global"))}
						sx={{ color: "warning.dark", ml: 0.5 }}
					>
						<CloseCircle size={18} />
					</IconButton>
				</span>
			</Tooltip>
			{folderId && (
				<Menu
					anchorEl={menu}
					open={!!menu}
					onClose={() => setMenu(null)}
					anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
					transformOrigin={{ vertical: "top", horizontal: "right" }}
				>
					<MenuItem onClick={() => cerrar("folder")}>
						<ListItemText primary="Ocultar en esta carpeta" />
					</MenuItem>
					<MenuItem onClick={() => cerrar("global")}>
						<ListItemText primary="Ocultar en todas las carpetas" secondary="Vuelve a aparecer si la credencial falla de nuevo" />
					</MenuItem>
				</Menu>
			)}
		</>
	);
	const acciones = (
		<>
			{boton}
			{cerrarBtn}
		</>
	);
	if (compacto) {
		return (
			<Tooltip title={PJN_CRED_ERROR_BANNER_COPY} enterTouchDelay={0}>
				<Alert
					severity="warning"
					icon={<Warning2 variant="Bold" size={18} />}
					action={acciones}
					sx={{ py: 0, alignItems: "center", "& .MuiAlert-action": { pt: 0, mr: 0 }, ...sx }}
				>
					<Typography variant="body2" sx={{ fontWeight: 500 }}>
						{PJN_CRED_ERROR_BANNER_SHORT_COPY}
					</Typography>
				</Alert>
			</Tooltip>
		);
	}
	return (
		<Alert severity="warning" icon={<Warning2 variant="Bold" />} action={acciones} sx={{ alignItems: "center", ...sx }}>
			<Typography variant="body2">{PJN_CRED_ERROR_BANNER_COPY}</Typography>
		</Alert>
	);
}
