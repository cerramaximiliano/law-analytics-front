import React from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Card,
	CardContent,
	Divider,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
	useMediaQuery,
} from "@mui/material";

// types
import { ResponsiveTableProps, ResponsiveColumn } from "./types";

// ==============================|| RESPONSIVE TABLE ||============================== //

/**
 * ResponsiveTable
 *
 * Renders a standard MUI table on desktop (>= sm breakpoint) and a list of
 * outlined Cards on mobile (< sm breakpoint).
 *
 * Compatible with data shapes already used by react-table v7 consumers: pass
 * the same `data` array as `rows` and map your column definitions to
 * `ResponsiveColumn<T>`.
 */
function ResponsiveTable<T>({
	columns,
	rows,
	getRowId,
	onRowClick,
	emptyMessage = "Sin datos",
	mobileActions,
	actionsColumn,
}: ResponsiveTableProps<T>) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	// All visible desktop columns (body columns + optional actions column)
	const desktopColumns: ResponsiveColumn<T>[] = actionsColumn ? [...columns, actionsColumn] : columns;

	// Columns shown in mobile card body (excludes hideOnMobile, excludes primary)
	const primaryColumn: ResponsiveColumn<T> | undefined = columns.find((c) => c.primaryOnMobile) ?? columns[0];

	const mobileBodyColumns: ResponsiveColumn<T>[] = columns.filter((c) => !c.hideOnMobile && c.id !== (primaryColumn?.id ?? ""));

	// ── Empty state ─────────────────────────────────────────────────────────────

	if (rows.length === 0) {
		return (
			<Box
				sx={{
					py: theme.spacing(4),
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<Typography variant="body2" color="text.secondary">
					{emptyMessage}
				</Typography>
			</Box>
		);
	}

	// ── Mobile view ─────────────────────────────────────────────────────────────

	if (isMobile) {
		return (
			<Stack spacing={2}>
				{rows.map((row) => {
					const rowId = getRowId(row);
					const primaryValue = primaryColumn ? (primaryColumn.mobileAccessor ?? primaryColumn.accessor)(row) : null;

					return (
						<Card
							key={rowId}
							variant="outlined"
							onClick={onRowClick ? () => onRowClick(row) : undefined}
							sx={{
								cursor: onRowClick ? "pointer" : "default",
								"&:hover": onRowClick
									? {
											borderColor: theme.palette.primary.main,
											boxShadow: theme.shadows[2],
									  }
									: undefined,
								transition: "border-color 0.2s, box-shadow 0.2s",
							}}
						>
							<CardContent sx={{ p: theme.spacing(2), "&:last-child": { pb: theme.spacing(2) } }}>
								<Stack spacing={1}>
									{/* Primary / title row */}
									{primaryValue !== null && (
										<Typography variant="subtitle2" fontWeight={600} gutterBottom={false}>
											{primaryValue}
										</Typography>
									)}

									{/* Body fields */}
									{mobileBodyColumns.map((col) => {
										const value = (col.mobileAccessor ?? col.accessor)(row);
										return (
											<Stack key={col.id} direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
												<Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, minWidth: 80 }}>
													{col.label}
												</Typography>
												<Box sx={{ textAlign: col.align ?? "right" }}>
													<Typography variant="body2">{value}</Typography>
												</Box>
											</Stack>
										);
									})}

									{/* Optional action slot */}
									{mobileActions && (
										<>
											<Divider sx={{ my: theme.spacing(0.5) }} />
											<Stack direction="row" justifyContent="flex-end" spacing={1}>
												{mobileActions(row)}
											</Stack>
										</>
									)}
								</Stack>
							</CardContent>
						</Card>
					);
				})}
			</Stack>
		);
	}

	// ── Desktop view ─────────────────────────────────────────────────────────────

	return (
		<TableContainer>
			<Table>
				<TableHead>
					<TableRow>
						{desktopColumns.map((col) => (
							<TableCell key={col.id} align={col.align ?? "left"} width={col.width} sx={{ whiteSpace: "nowrap" }}>
								<Typography variant="subtitle2" color="text.primary">
									{col.label}
								</Typography>
							</TableCell>
						))}
					</TableRow>
				</TableHead>

				<TableBody>
					{rows.map((row) => {
						const rowId = getRowId(row);
						return (
							<TableRow
								key={rowId}
								hover={!!onRowClick}
								onClick={onRowClick ? () => onRowClick(row) : undefined}
								sx={{
									cursor: onRowClick ? "pointer" : "default",
									"&.MuiTableRow-hover:hover": {
										backgroundColor: theme.palette.action.hover,
									},
								}}
							>
								{desktopColumns.map((col) => (
									<TableCell key={col.id} align={col.align ?? "left"} width={col.width}>
										{col.accessor(row)}
									</TableCell>
								))}
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
}

// Tooltip wrapper utility — re-exported so consumers can wrap action icons
// with a consistent accessible pattern without importing MUI directly.
interface ActionTooltipProps {
	title: string;
	children: React.ReactElement;
}

export function ActionTooltip({ title, children }: ActionTooltipProps) {
	return (
		<Tooltip title={title} arrow>
			{React.cloneElement(children, { "aria-label": title })}
		</Tooltip>
	);
}

export default ResponsiveTable;
