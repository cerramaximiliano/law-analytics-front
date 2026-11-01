/**
 * Cuenta → Suscripción: sección del add-on «Causas adicionales» (extra_folders). Los controles y
 * el contrato con el hub están en ExtraFoldersManager.
 *
 * Se renderiza solo si hay algo que mostrar: Premium con la venta abierta (o bypass de admin /
 * cuenta de prueba), o bloques vigentes (comprados o regalados).
 */

import { useCallback, useEffect, useState } from "react";
import { Grid } from "@mui/material";
import { FolderAdd } from "iconsax-react";

import ApiService, { type ExtraFoldersStatus } from "store/reducers/ApiService";
import McpSectionShell from "sections/mcp/McpSectionShell";
import ExtraFoldersManager, { EXTRA_FOLDERS_NAME, extraFoldersSubtitle, isExtraFoldersVisible } from "sections/addons/ExtraFoldersManager";

export { folderLimitWith, isExtraFoldersVisible, renewalBlocks } from "sections/addons/ExtraFoldersManager";

const ExtraFoldersSection = () => {
	const [status, setStatus] = useState<ExtraFoldersStatus | null>(null);

	const load = useCallback(async () => {
		try {
			setStatus(await ApiService.getExtraFolders());
		} catch {
			setStatus(null); // fail-soft: la sección no se muestra
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	if (!isExtraFoldersVisible(status) || !status) return null;

	return (
		<Grid item xs={12}>
			<McpSectionShell
				eyebrow="Add-on"
				title={EXTRA_FOLDERS_NAME}
				subtitle={extraFoldersSubtitle(status)}
				icon={<FolderAdd size={18} variant="Bulk" />}
			>
				<ExtraFoldersManager status={status} onChanged={load} />
			</McpSectionShell>
		</Grid>
	);
};

export default ExtraFoldersSection;
