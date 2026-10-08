/**
 * Asistentes de IA conectados a la cuenta (Claude.ai, ChatGPT, …) vía OAuth.
 *
 * Se muestra dentro de Integraciones (`/apps/profiles/account/pjn?view=ia`).
 * `/settings/connected-apps` redirige acá (link del mail "conectaste una app").
 *
 * Endpoints:
 *  - GET /api/connected-apps → { apps: [], count }
 *  - DELETE /api/connected-apps/:client_id → 204 (revoca el consent en Hydra y
 *    bloquea en el momento los tokens activos de esa app)
 */

import { useCallback, useEffect, useState } from "react";

import { Alert, Avatar, Box, Button, Chip, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import dayjs from "utils/dayjs-config";

import ConfirmDialog from "components/dialogs/ConfirmDialog";
import axiosInstance from "utils/axios";

import { Link1, ShieldTick, Trash, Warning2 } from "iconsax-react";

import ClaudeAiLogo from "components/icons/ClaudeAiLogo";
import ChatGptLogo from "components/icons/ChatGptLogo";
import { deriveAiProvider } from "utils/mcpLegal";
import { describeScopeChip } from "utils/mcpScopes";
import useMcpAccess from "hooks/useMcpAccess";
import McpConnectGuide from "sections/apps/profiles/account/McpConnectGuide";

interface ConnectedApp {
	client_id: string;
	name: string;
	vendor: string | null;
	verified: boolean;
	logo_url: string | null;
	vendor_url: string | null;
	granted_scopes: string[];
	granted_audiences: string[];
	granted_at: string | null;
	remember: boolean;
	remember_for_seconds: number | null;
}

interface ListResponse {
	apps: ConnectedApp[];
	count: number;
}

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; apps: ConnectedApp[] };

// Scope ID → nombre humano: etiquetas compartidas con el consent en utils/mcpScopes.
const describeScope = describeScopeChip;

function formatGrantedAt(iso: string | null): string {
	if (!iso) return "Fecha no disponible";
	const d = dayjs(iso);
	if (!d.isValid()) return "Fecha no disponible";
	return d.format("DD MMM YYYY · HH:mm");
}

// Logo del asistente: los mismos componentes de marca que usa la landing
// (Claude en #D97757, ChatGPT según el tema). Los clients DCR no traen logo_uri.
const AppLogo = ({ app }: { app: ConnectedApp }) => {
	const provider = deriveAiProvider(app.name, app.vendor, app.vendor_url);
	const frameSx = {
		width: 44,
		height: 44,
		borderRadius: "50%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
		bgcolor: "background.paper",
		border: (theme: any) => `1px solid ${theme.palette.divider}`,
	};
	if (provider === "anthropic") {
		return (
			<Box sx={frameSx}>
				<ClaudeAiLogo size={24} />
			</Box>
		);
	}
	if (provider === "openai") {
		return (
			<Box sx={frameSx}>
				<ChatGptLogo size={24} />
			</Box>
		);
	}
	return (
		<Avatar src={app.logo_url || undefined} alt={app.name} sx={{ width: 44, height: 44, bgcolor: "primary.lighter" }}>
			{!app.logo_url && app.name.charAt(0)}
		</Avatar>
	);
};

interface ConnectedAiAppsProps {
	/** Ocultar el aviso de plan/add-on de la guía (la vista ya muestra la tarjeta del add-on). */
	hidePlanNotice?: boolean;
}

const ConnectedAiApps = ({ hidePlanNotice = false }: ConnectedAiAppsProps) => {
	const [state, setState] = useState<LoadState>({ status: "loading" });
	const [confirmTarget, setConfirmTarget] = useState<ConnectedApp | null>(null);
	const [isRevoking, setIsRevoking] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const { access, loading: accessLoading } = useMcpAccess();

	const loadApps = useCallback(async () => {
		setState({ status: "loading" });
		try {
			const res = await axiosInstance.get<ListResponse>("/api/connected-apps");
			setState({ status: "ready", apps: res.data.apps });
		} catch (err: any) {
			const msg = err.response?.data?.error_description || "No se pudieron cargar los asistentes conectados.";
			setState({ status: "error", message: msg });
		}
	}, []);

	useEffect(() => {
		loadApps();
	}, [loadApps]);

	const handleRevoke = async () => {
		if (!confirmTarget) return;
		setIsRevoking(true);
		setActionError(null);
		try {
			await axiosInstance.delete(`/api/connected-apps/${encodeURIComponent(confirmTarget.client_id)}`);
			setConfirmTarget(null);
			await loadApps();
		} catch (err: any) {
			setActionError(err.response?.data?.error_description || "No se pudo revocar el acceso. Intentá de nuevo.");
		} finally {
			setIsRevoking(false);
		}
	};

	return (
		<Stack spacing={1.5}>
			<McpConnectGuide access={access} loading={accessLoading} hidePlanNotice={hidePlanNotice} />

			{actionError && <Alert severity="error">{actionError}</Alert>}

			{state.status === "loading" && (
				<Box sx={{ textAlign: "center", py: 4 }}>
					<CircularProgress size={24} />
				</Box>
			)}

			{state.status === "error" && (
				<Alert
					severity="error"
					action={
						<Button color="inherit" size="small" onClick={loadApps}>
							Reintentar
						</Button>
					}
				>
					{state.message}
				</Alert>
			)}

			{state.status === "ready" && state.apps.length === 0 && (
				<Box sx={{ textAlign: "center", py: 3 }}>
					<Link1 size={36} color="#9e9e9e" variant="Bulk" />
					<Typography sx={{ mt: 1.5, fontWeight: 600 }}>Todavía no conectaste ningún asistente</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 440, mx: "auto" }}>
						Cuando autorices un asistente de IA como Claude.ai o ChatGPT, aparecerá acá para que puedas verlo y revocarlo cuando
						quieras.
					</Typography>
				</Box>
			)}

			{state.status === "ready" &&
				state.apps.map((app) => (
					<Box
						key={app.client_id}
						sx={{ p: 1.5, borderRadius: 1.25, border: (theme) => `1px solid ${theme.palette.divider}` }}
					>
						<Stack direction="row" spacing={1.5} alignItems="center">
							<AppLogo app={app} />
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Stack direction="row" spacing={0.75} alignItems="center">
									<Typography sx={{ fontWeight: 600 }}>{app.name}</Typography>
									{app.verified ? (
										<ShieldTick size={16} color="#2e7d32" variant="Bold" />
									) : (
										<Warning2 size={16} color="#ed6c02" variant="Bold" />
									)}
								</Stack>
								{app.vendor && (
									<Typography variant="caption" color="text.secondary">
										{app.vendor}
									</Typography>
								)}
								<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
									Autorizado: {formatGrantedAt(app.granted_at)}
								</Typography>
								<Stack direction="row" sx={{ mt: 0.75, flexWrap: "wrap", gap: 0.5 }}>
									{app.granted_scopes.map((scope) => (
										<Chip key={scope} label={describeScope(scope)} size="small" variant="outlined" sx={{ height: 22 }} />
									))}
								</Stack>
							</Box>
							<IconButton color="error" onClick={() => setConfirmTarget(app)} aria-label={`Desconectar ${app.name}`}>
								<Trash size={20} />
							</IconButton>
						</Stack>
					</Box>
				))}

			{state.status === "ready" && state.apps.length > 0 && (
				<Typography variant="caption" color="text.secondary">
					Al desconectarlo, el asistente pierde el acceso en el momento. Para volver a usarlo vas a tener que autorizarlo de nuevo.
				</Typography>
			)}

			<ConfirmDialog
				open={!!confirmTarget}
				title="Desconectar asistente"
				content={
					confirmTarget
						? `${confirmTarget.name} deja de poder consultar tu cuenta en el momento. Para volver a usarlo vas a tener que autorizarlo de nuevo desde el asistente.`
						: ""
				}
				confirmText="Desconectar"
				confirmColor="error"
				onConfirm={handleRevoke}
				onCancel={() => setConfirmTarget(null)}
				isLoading={isRevoking}
			/>
		</Stack>
	);
};

export default ConnectedAiApps;
