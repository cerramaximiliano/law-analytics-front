/**
 * /settings/connected-apps — gestión de apps OAuth conectadas a la cuenta.
 *
 * El user ve qué clientes externos (Claude.ai, ChatGPT, etc.) tienen acceso a
 * su cuenta vía OAuth + qué scopes les otorgó. Puede revocar individualmente.
 *
 * Auth: requiere JWT del hub (AuthGuard en MainRoutes). El subject se pasa
 * server-side desde req.user._id — el cliente NO especifica.
 *
 * Endpoints consumidos:
 *  - GET /api/connected-apps → { apps: [], count }
 *  - DELETE /api/connected-apps/:client_id → 204
 */

import { useCallback, useEffect, useState } from "react";

import {
	Alert,
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Grid,
	IconButton,
	Stack,
	Typography,
} from "@mui/material";
import dayjs from "utils/dayjs-config";

import MainCard from "components/MainCard";
import ConfirmDialog from "components/dialogs/ConfirmDialog";
import axiosInstance from "utils/axios";

import { Link1, ShieldTick, Trash, Warning2 } from "iconsax-react";

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

type LoadState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "ready"; apps: ConnectedApp[] };

/**
 * Scope ID → nombre humano (sincronizado con consent.tsx).
 */
const SCOPE_LABELS: Record<string, string> = {
	openid: "Identidad",
	offline_access: "Sesión persistente",
	"mcp:access": "Causas + datos",
};

function describeScope(scope: string): string {
	return SCOPE_LABELS[scope] || scope;
}

function formatGrantedAt(iso: string | null): string {
	if (!iso) return "Fecha no disponible";
	const d = dayjs(iso);
	if (!d.isValid()) return "Fecha no disponible";
	return d.format("DD MMM YYYY · HH:mm");
}

const ConnectedAppsPage = () => {
	const [state, setState] = useState<LoadState>({ status: "loading" });
	const [confirmTarget, setConfirmTarget] = useState<ConnectedApp | null>(null);
	const [isRevoking, setIsRevoking] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const loadApps = useCallback(async () => {
		setState({ status: "loading" });
		try {
			const res = await axiosInstance.get<ListResponse>("/api/connected-apps");
			setState({ status: "ready", apps: res.data.apps });
		} catch (err: any) {
			const msg = err.response?.data?.error_description || "No se pudieron cargar las apps conectadas.";
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
		<Box sx={{ maxWidth: 720, mx: "auto", py: 3, px: { xs: 2, md: 0 } }}>
			<Stack spacing={3}>
				<Box>
					<Typography variant="h3">Apps conectadas</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						Aplicaciones de IA (Claude.ai, ChatGPT, etc.) con acceso a tu cuenta vía OAuth.
					</Typography>
				</Box>

				{actionError && <Alert severity="error">{actionError}</Alert>}

				{state.status === "loading" && (
					<Box sx={{ textAlign: "center", py: 6 }}>
						<CircularProgress />
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
					<MainCard>
						<Box sx={{ textAlign: "center", py: 6 }}>
							<Link1 size={48} color="#9e9e9e" variant="Bulk" />
							<Typography variant="h5" sx={{ mt: 2 }}>
								Todavía no conectaste ninguna app
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 480, mx: "auto" }}>
								Cuando un asistente de IA como Claude.ai te pida acceso a tu cuenta lawanalytics, aparecerá acá para que
								puedas verlo y revocarlo cuando quieras.
							</Typography>
							<Button
								variant="outlined"
								color="primary"
								sx={{ mt: 3 }}
								href="https://docs.lawanalytics.app/integraciones/claude-ai"
								target="_blank"
								rel="noopener"
							>
								Cómo conectar Claude.ai
							</Button>
						</Box>
					</MainCard>
				)}

				{state.status === "ready" &&
					state.apps.length > 0 &&
					state.apps.map((app) => (
						<MainCard key={app.client_id} content={false} sx={{ p: 2 }}>
							<Grid container spacing={2} alignItems="center">
								<Grid item>
									<Avatar
										src={app.logo_url || undefined}
										alt={app.name}
										sx={{ width: 56, height: 56, bgcolor: "primary.lighter" }}
									>
										{!app.logo_url && app.name.charAt(0)}
									</Avatar>
								</Grid>
								<Grid item xs>
									<Stack direction="row" spacing={1} alignItems="center">
										<Typography variant="h5">{app.name}</Typography>
										{app.verified ? (
											<ShieldTick size={18} color="#2e7d32" variant="Bold" />
										) : (
											<Warning2 size={18} color="#ed6c02" variant="Bold" />
										)}
									</Stack>
									{app.vendor && (
										<Typography variant="caption" color="text.secondary">
											{app.vendor}
											{app.vendor_url && (
												<>
													{" · "}
													<a
														href={app.vendor_url}
														target="_blank"
														rel="noopener noreferrer"
														style={{ color: "inherit" }}
													>
														{app.vendor_url.replace(/^https?:\/\//, "")}
													</a>
												</>
											)}
										</Typography>
									)}
									<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
										Autorizado: {formatGrantedAt(app.granted_at)}
									</Typography>
									<Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
										{app.granted_scopes.map((scope) => (
											<Chip
												key={scope}
												label={describeScope(scope)}
												size="small"
												variant="outlined"
												sx={{ height: 22 }}
											/>
										))}
									</Stack>
								</Grid>
								<Grid item>
									<IconButton color="error" onClick={() => setConfirmTarget(app)} aria-label="Revocar acceso">
										<Trash size={20} />
									</IconButton>
								</Grid>
							</Grid>
						</MainCard>
					))}

				{state.status === "ready" && state.apps.length > 0 && (
					<Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
						Revocar el acceso invalida el refresh token; el access token actual seguirá válido hasta su expiración (~1h).
					</Typography>
				)}
			</Stack>

			<ConfirmDialog
				open={!!confirmTarget}
				title="Revocar acceso"
				content={
					confirmTarget
						? `¿Confirmás que querés revocar el acceso de ${confirmTarget.name} a tu cuenta? Esta acción es inmediata.`
						: ""
				}
				confirmText="Revocar"
				confirmColor="error"
				onConfirm={handleRevoke}
				onCancel={() => setConfirmTarget(null)}
				isLoading={isRevoking}
			/>
		</Box>
	);
};

export default ConnectedAppsPage;
