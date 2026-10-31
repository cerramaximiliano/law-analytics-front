// sections/apps/teams/TeamResponsablesDistributionCard.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Avatar, Box, Button, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowDown2, ArrowUp2, DocumentDownload, People, Printer } from "iconsax-react";

import { useTeam } from "contexts/TeamContext";
import { fetchGroupFoldersForDistribution } from "store/reducers/folder";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { getTeamAssignees } from "utils/teamAssignees";
import { wrapOnMobileSx } from "./stackedTableSx";
import {
	buildDistributionCsv,
	buildPrintHtml,
	DistributionFolder,
	downloadCsv,
	folderExpediente,
	folderJurisLabel,
	groupByResponsable,
	groupSubheading,
	printHtml,
	reportFilename,
	SIN_RESPONSABLE,
	todayLabel,
} from "utils/teamReports";

const PREVIEW_LIMIT = 5;

// Tarjeta «Distribución de responsables» en Mi equipo: carpetas activas del equipo agrupadas
// por responsable, con impresión y CSV. Visible para todos los integrantes. Hace su propia
// llamada al listado del grupo para no pisar `state.folder.folders`.
export default function TeamResponsablesDistributionCard() {
	const { activeTeam } = useTeam();
	const groupId = activeTeam?._id;
	const assignees = useMemo(() => getTeamAssignees(activeTeam), [activeTeam]);

	const [folders, setFolders] = useState<DistributionFolder[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});

	const load = useCallback(async () => {
		if (!groupId) return;
		setLoading(true);
		setLoadError(null);
		const result = await fetchGroupFoldersForDistribution(groupId);
		if (result) setFolders(result as DistributionFolder[]);
		else setLoadError("No se pudo cargar la distribución de carpetas");
		setLoading(false);
	}, [groupId]);

	useEffect(() => {
		load();
	}, [load]);

	const groups = useMemo(
		() =>
			groupByResponsable(
				[...folders].sort((a, b) => (a.folderName || "").localeCompare(b.folderName || "", "es")),
				(f) => f.responsables,
				assignees,
				{ includeEmptyGroups: true },
			),
		[folders, assignees],
	);

	const title = `${activeTeam?.name || "Equipo"} · Distribución de responsables`;

	const handlePrint = () => {
		printHtml(
			buildPrintHtml({
				title,
				subtitle: `Carpetas activas al ${todayLabel()} · ${folders.length} ${folders.length === 1 ? "carpeta" : "carpetas"}`,
				sections: groups.map((g) => ({
					heading: `${g.label}${g.isOwner ? " (propietario)" : ""}`,
					subheading: groupSubheading(g, "carpeta", "carpetas"),
					columns: ["Carátula", "Jurisdicción", "Fuero", "Expediente"],
					rows: g.items.map((f) => [f.folderName || "", folderJurisLabel(f.folderJuris), f.folderFuero || "", folderExpediente(f)]),
					emptyText: "Sin carpetas",
				})),
			}),
		);
	};

	const handleCsv = () => {
		downloadCsv(buildDistributionCsv(groups), reportFilename("distribucion-responsables", activeTeam?.name, "csv"));
	};

	if (!activeTeam) return null;

	const headSx = {
		fontSize: "0.7rem",
		fontWeight: 600,
		letterSpacing: "0.08em",
		textTransform: "uppercase",
		color: "text.secondary",
	} as const;

	return (
		<Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, borderColor: alpha(BRAND_BLUE, 0.14) }}>
			<Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} sx={{ mb: 0.5 }}>
				<Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
					<People size={18} />
					<Typography variant="subtitle2" fontWeight={600}>
						Distribución de responsables
					</Typography>
				</Stack>
				<Stack direction="row" spacing={1}>
					<Button
						size="small"
						variant="outlined"
						color="secondary"
						startIcon={<Printer size={16} />}
						onClick={handlePrint}
						disabled={loading || !!loadError}
						sx={{ textTransform: "none" }}
					>
						Imprimir
					</Button>
					<Button
						size="small"
						variant="outlined"
						color="secondary"
						startIcon={<DocumentDownload size={16} />}
						onClick={handleCsv}
						disabled={loading || !!loadError}
						sx={{ textTransform: "none" }}
					>
						Descargar CSV
					</Button>
				</Stack>
			</Stack>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				Carpetas activas del equipo agrupadas por responsable. Una carpeta con varios responsables aparece en cada uno. Los responsables se
				asignan desde el detalle de la carpeta o, de a varias, desde el listado de carpetas.
			</Typography>

			{loading ? (
				<Stack spacing={1}>
					<Skeleton variant="text" width={240} />
					<Skeleton variant="rounded" height={96} />
				</Stack>
			) : loadError ? (
				<Alert
					severity="error"
					action={
						<Button color="inherit" size="small" onClick={load}>
							Reintentar
						</Button>
					}
				>
					{loadError}
				</Alert>
			) : (
				<Stack spacing={1}>
					{groups.map((g) => {
						const isOpen = !!expanded[g.key];
						const visible = isOpen ? g.items : g.items.slice(0, PREVIEW_LIMIT);
						const hidden = g.items.length - visible.length;
						const isNone = g.key === SIN_RESPONSABLE;
						const assignee = assignees.find((a) => a.id === g.key);
						return (
							<Box
								key={g.key}
								sx={{
									p: 1.5,
									borderRadius: 1.5,
									border: `1px solid ${alpha(BRAND_BLUE, 0.1)}`,
									bgcolor: isNone ? "transparent" : alpha(BRAND_BLUE, 0.02),
								}}
							>
								<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: g.items.length > 0 ? 1 : 0 }}>
									{!isNone && (
										<Avatar src={assignee?.avatar} sx={{ width: 30, height: 30, fontSize: "0.72rem", fontWeight: 700 }}>
											{assignee?.initials || "?"}
										</Avatar>
									)}
									<Box sx={{ minWidth: 0, flex: 1 }}>
										<Typography
											variant="body2"
											fontWeight={600}
											noWrap
											sx={isNone ? { fontStyle: "italic", color: "text.secondary" } : wrapOnMobileSx}
										>
											{g.label}
											{g.isOwner ? " · Propietario" : ""}
										</Typography>
										{g.email && g.email !== g.label && (
											<Typography variant="caption" color="text.secondary" noWrap component="div" sx={wrapOnMobileSx}>
												{g.email}
											</Typography>
										)}
									</Box>
									<Typography sx={{ ...headSx, whiteSpace: "nowrap" }}>
										{g.items.length} {g.items.length === 1 ? "carpeta" : "carpetas"}
									</Typography>
								</Stack>
								{g.items.length > 0 && (
									<>
										<Stack component="ul" spacing={0.25} sx={{ m: 0, pl: isNone ? 2.5 : { xs: 2.5, sm: 7 } }}>
											{visible.map((f) => (
												<Typography component="li" key={f._id} variant="body2" sx={{ fontSize: "0.82rem", overflowWrap: "anywhere" }}>
													{f.folderName || "Sin carátula"}
													{folderExpediente(f) && (
														<Typography component="span" variant="caption" color="text.secondary">
															{" "}
															· {folderExpediente(f)}
														</Typography>
													)}
												</Typography>
											))}
										</Stack>
										{g.items.length > PREVIEW_LIMIT && (
											<Button
												size="small"
												onClick={() => setExpanded((prev) => ({ ...prev, [g.key]: !isOpen }))}
												endIcon={isOpen ? <ArrowUp2 size={14} /> : <ArrowDown2 size={14} />}
												sx={{ textTransform: "none", ml: isNone ? 1.5 : { xs: 1.5, sm: 6 }, mt: 0.5, color: BRAND_BLUE, fontSize: "0.75rem" }}
											>
												{isOpen ? "Ver menos" : `Ver ${hidden} más`}
											</Button>
										)}
									</>
								)}
							</Box>
						);
					})}
				</Stack>
			)}
		</Paper>
	);
}
