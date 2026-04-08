import React, { FC, useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
	Box,
	Button,
	Chip,
	Collapse,
	Divider,
	Grid,
	Paper,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
	useMediaQuery,
} from "@mui/material";

// third-party
import {
	Cell,
	Column,
	HeaderGroup,
	Row,
	useExpanded,
	useFilters,
	useGlobalFilter,
	usePagination,
	useRowSelect,
	useSortBy,
	useTable,
} from "react-table";
import dayjs from "utils/dayjs-config";

// project-imports
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import IconButton from "components/@extended/IconButton";
import { EmptyTable, HeaderSort, SortingSelect, TablePagination, TableRowSelection } from "components/third-party/ReactTable";
import { renderFilterTypes, GlobalFilter } from "utils/react-table";
import AlertCalculatorDelete from "pages/calculator/intereses/components/AlertCalculatorDelete";
import LinkCauseModal from "sections/forms/wizard/calc-laboral/components/linkCauseModal";
import { dispatch, useSelector } from "store";
import { getCalculatorsByFilter, clearSelectedCalculators } from "store/reducers/calculator";
import { InterestRate } from "store/reducers/interestRates";

// assets
import { Eye, EyeSlash, Link21, Trash } from "iconsax-react";

// ── Constantes ────────────────────────────────────────────────────────────────

const CustomGlobalFilter = GlobalFilter as any;
const CustomSortingSelect = SortingSelect as any;

const PRESTACION_LABELS: Record<string, string> = {
	jubilacion_ordinaria: "Jubilación Ordinaria",
	pension_derivada: "Pensión derivada",
};

const OBRA_SOCIAL_LABELS: Record<string, string> = {
	inssjyp_pami: "INSSJyP (PAMI)",
};

const TOPE_LABELS: Record<string, string> = {
	no: "No",
	si: "Sí",
	actis_caporale_menor_15: '"Actis Caporale" — si el tope es menor al 15%',
	actis_caporale_menor_15_sino_descuenta: '"Actis Caporale" — si es menor al 15%, sino descuenta el 15%',
};

const INDICE_LABELS: Record<string, string> = {
	aumentos_generales_anses: "Aumentos Generales ANSES",
};

// Las tasas vienen dinámicamente del store; este mapa es sólo fallback para
// valores ya guardados antes de cargar el listado completo.
const TASA_FALLBACK_LABELS: Record<string, string> = {
	tasaPasivaBNA: "Tasa Pasiva BNA",
	tasaPasivaBCRA: "Tasa Pasiva BCRA",
	tasaActivaBNA: "Tasa Activa BNA",
	tasaActivaTnaBNA: "Tasa Activa TNA BNA",
	cer: "CER",
	icl: "ICL BCRA",
	tasaActivaCNAT2601: "Tasa Activa BNA - Acta 2601",
	tasaActivaCNAT2658: "Tasa Activa BNA - Acta 2658",
	tasaActivaCNAT2764: "Tasa Activa BNA - Acta 2764",
	acta2601: "Acta 2601",
	acta2630: "Acta 2630",
};

const formatPesos = (value: number | null | undefined) =>
	value != null
		? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value)
		: "-";

const formatDate = (value: string | null | undefined) =>
	value ? dayjs(value).format("DD/MM/YYYY") : "-";

// ── ExpandedRow ───────────────────────────────────────────────────────────────

function ExpandedRow({ row, rates }: { row: Row<any>; rates: InterestRate[] }) {
	const theme = useTheme();
	const vars = row.original.variables || {};

	const sectionStyle = {
		p: 2,
		bgcolor: alpha(theme.palette.primary.main, 0.04),
		borderRadius: 1,
		border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
	};

	const labelStyle = { color: "text.secondary", fontSize: "0.75rem", fontWeight: 500, mb: 0.25 };
	const valueStyle = { fontWeight: 500 };

	return (
		<Box sx={{ p: 2.5 }}>
			<Grid container spacing={2}>
				{/* Datos del expediente */}
				<Grid item xs={12}>
					<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
						Datos del Expediente
					</Typography>
					<Paper elevation={0} sx={sectionStyle}>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6} md={4}>
								<Typography sx={labelStyle}>Titular / Reclamante</Typography>
								<Typography sx={valueStyle}>{vars.reclamante || row.original.user || "-"}</Typography>
							</Grid>
							<Grid item xs={12} sm={6} md={4}>
								<Typography sx={labelStyle}>Nº Expediente Administrativo</Typography>
								<Typography sx={{ ...valueStyle, fontFamily: "monospace" }}>{vars.expedienteAdmin || "-"}</Typography>
							</Grid>
							<Grid item xs={12} sm={6} md={4}>
								<Typography sx={labelStyle}>Prestación</Typography>
								<Typography sx={valueStyle}>{PRESTACION_LABELS[vars.prestacion] || vars.prestacion || "-"}</Typography>
							</Grid>
							<Grid item xs={12} sm={6} md={4}>
								<Typography sx={labelStyle}>Descuento Obra Social</Typography>
								<Typography sx={valueStyle}>{OBRA_SOCIAL_LABELS[vars.obraSocial] || vars.obraSocial || "Sin descuento"}</Typography>
							</Grid>
							<Grid item xs={12} sm={6} md={4}>
								<Typography sx={labelStyle}>Fecha de Adquisición del Derecho</Typography>
								<Typography sx={valueStyle}>{formatDate(vars.fechaAdquisicion)}</Typography>
							</Grid>
							<Grid item xs={12} sm={6} md={4}>
								<Typography sx={labelStyle}>Fecha de Alta</Typography>
								<Typography sx={valueStyle}>{vars.fechaAlta || "-"}</Typography>
							</Grid>
						</Grid>
					</Paper>
				</Grid>

				{/* Haberes */}
				<Grid item xs={12} sm={6}>
					<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
						Haber Pagado ANSES
					</Typography>
					<Paper elevation={0} sx={sectionStyle}>
						<Stack spacing={1}>
							<Box>
								<Typography sx={labelStyle}>Importe</Typography>
								<Typography sx={valueStyle}>{formatPesos(vars.haberPagadoAnses)}</Typography>
							</Box>
							<Box>
								<Typography sx={labelStyle}>Pagado al</Typography>
								<Typography sx={valueStyle}>{formatDate(vars.haberPagadoAl)}</Typography>
							</Box>
						</Stack>
					</Paper>
				</Grid>

				<Grid item xs={12} sm={6}>
					<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
						Haber Reclamado
					</Typography>
					<Paper elevation={0} sx={sectionStyle}>
						<Stack spacing={1}>
							<Box>
								<Typography sx={labelStyle}>Importe</Typography>
								<Typography sx={{ ...valueStyle, color: "primary.main", fontSize: "1.1rem" }}>
									{formatPesos(vars.haberReclamado || row.original.amount)}
								</Typography>
							</Box>
							<Box>
								<Typography sx={labelStyle}>Moneda</Typography>
								<Typography sx={valueStyle}>{vars.monedaReclamado || "ARS"}</Typography>
							</Box>
						</Stack>
					</Paper>
				</Grid>

				{/* Haber reajustado (solo si corresponde) */}
				{vars.tieneReajuste && (
					<Grid item xs={12} sm={6}>
						<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
							Haber Reajustado por ANSES
						</Typography>
						<Paper elevation={0} sx={sectionStyle}>
							<Grid container spacing={1}>
								<Grid item xs={12} sm={6}>
									<Typography sx={labelStyle}>Fecha de Alta del Haber Reajustado</Typography>
									<Typography sx={valueStyle}>{formatDate(vars.fechaAltaReajuste)}</Typography>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Typography sx={labelStyle}>Importe</Typography>
									<Typography sx={valueStyle}>{formatPesos(vars.importeReajuste)}</Typography>
								</Grid>
							</Grid>
						</Paper>
					</Grid>
				)}

				{/* Criterios de movilidad */}
				{vars.criteriosMovilidad?.length > 0 && (
					<Grid item xs={12}>
						<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
							Criterios de Movilidad
						</Typography>
						<Paper elevation={0} sx={sectionStyle}>
							<Stack spacing={1}>
								{vars.criteriosMovilidad.map((c: any, idx: number) => (
									<Stack key={idx} direction="row" spacing={2} alignItems="center">
										<Chip
											size="small"
											label={idx + 1}
											color="primary"
											sx={{ minWidth: 28, height: 22, fontSize: "0.7rem" }}
										/>
										<Box>
											<Typography sx={labelStyle}>Índice</Typography>
											<Typography sx={valueStyle}>{INDICE_LABELS[c.indiceMovilidad] || c.indiceMovilidad}</Typography>
										</Box>
										<Box>
											<Typography sx={labelStyle}>Desde</Typography>
											<Typography sx={valueStyle}>{formatDate(c.fechaDesde)}</Typography>
										</Box>
									</Stack>
								))}
							</Stack>
						</Paper>
					</Grid>
				)}

				{/* Topes */}
				{vars.tipoTope && vars.tipoTope !== "no" && (
					<Grid item xs={12}>
						<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
							Aplicación de Topes
						</Typography>
						<Paper elevation={0} sx={sectionStyle}>
							<Grid container spacing={2}>
								<Grid item xs={12}>
									<Typography sx={labelStyle}>Criterio</Typography>
									<Typography sx={valueStyle}>{TOPE_LABELS[vars.tipoTope] || vars.tipoTope}</Typography>
								</Grid>
								<Grid item xs={6}>
									<Typography sx={labelStyle}>Desde</Typography>
									<Typography sx={valueStyle}>{formatDate(vars.topeDesde)}</Typography>
								</Grid>
								<Grid item xs={6}>
									<Typography sx={labelStyle}>Hasta</Typography>
									<Typography sx={valueStyle}>{formatDate(vars.topeHasta)}</Typography>
								</Grid>
							</Grid>
						</Paper>
					</Grid>
				)}

				{/* Tasa de interés de sentencia */}
				{vars.tasaInteresSentencia && (
					<Grid item xs={12} sm={6}>
						<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
							Tasa de Interés de Sentencia
						</Typography>
						<Paper elevation={0} sx={sectionStyle}>
							<Typography sx={labelStyle}>Tasa seleccionada</Typography>
							<Typography sx={valueStyle}>
								{rates.find((r) => r.value === vars.tasaInteresSentencia)?.label ||
									TASA_FALLBACK_LABELS[vars.tasaInteresSentencia] ||
									vars.tasaInteresSentencia}
							</Typography>
						</Paper>
					</Grid>
				)}
			</Grid>
		</Box>
	);
}

// ── ReactTable ────────────────────────────────────────────────────────────────

interface ReactTableProps {
	columns: Column[];
	data: any[];
	renderRowSubComponent: FC<{ row: Row<any> }>;
	isLoading: boolean;
	expandedRowId: string | null;
	onToggleExpanded: (id: string) => void;
}

function ReactTable({ columns, data, renderRowSubComponent, isLoading, expandedRowId, onToggleExpanded }: ReactTableProps) {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const filterTypes = useMemo(() => renderFilterTypes, []);
	const sortBy = { id: "date", desc: true };

	const {
		getTableProps,
		getTableBodyProps,
		headerGroups,
		prepareRow,
		setHiddenColumns,
		allColumns,
		rows,
		page,
		gotoPage,
		setPageSize,
		state: { globalFilter, selectedRowIds, pageIndex, pageSize },
		preGlobalFilteredRows,
		setGlobalFilter,
		setSortBy,
		selectedFlatRows,
	} = useTable(
		{
			columns,
			data,
			filterTypes,
			initialState: {
				pageIndex: 0,
				pageSize: 10,
				hiddenColumns: ["_id", "folderId"],
				sortBy: [sortBy],
			},
		},
		useGlobalFilter,
		useFilters,
		useSortBy,
		useExpanded,
		usePagination,
		useRowSelect,
	);

	useEffect(() => {
		setHiddenColumns(["_id", "folderId"]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [matchDownSM]);

	if (isLoading) {
		return (
			<Stack spacing={2} sx={{ p: 3 }}>
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} variant="rounded" height={52} />
				))}
			</Stack>
		);
	}

	return (
		<>
			<TableRowSelection selected={Object.keys(selectedRowIds).length} />
			<Stack spacing={3}>
				<Stack
					direction={matchDownSM ? "column" : "row"}
					spacing={2}
					justifyContent="space-between"
					alignItems={matchDownSM ? "flex-start" : "flex-start"}
					sx={{ p: 3, pb: 0 }}
				>
					<Stack direction="column" spacing={2} sx={{ width: matchDownSM ? "100%" : "300px" }}>
						<CustomGlobalFilter
							preGlobalFilteredRows={preGlobalFilteredRows}
							globalFilter={globalFilter}
							setGlobalFilter={setGlobalFilter}
						/>
						<CustomSortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
					</Stack>
				</Stack>

				<ScrollX>
					<Table {...getTableProps()}>
						<TableHead>
							{headerGroups.map((headerGroup: HeaderGroup<any>) => (
								<TableRow {...headerGroup.getHeaderGroupProps()}>
									{headerGroup.headers.map((column: HeaderGroup<any>) => (
										<TableCell {...column.getHeaderProps([{ className: (column as any).className }])}>
											<HeaderSort column={column as any} />
										</TableCell>
									))}
								</TableRow>
							))}
						</TableHead>
						<TableBody {...getTableBodyProps()}>
							{page.length > 0 ? (
								page.map((row: Row<any>) => {
									prepareRow(row);
									const isExpanded = expandedRowId === row.original._id;
									return (
										<Fragment key={row.original._id}>
											<TableRow
												{...row.getRowProps()}
												sx={{
													cursor: "pointer",
													bgcolor: isExpanded ? alpha(theme.palette.primary.lighter, 0.35) : "inherit",
												}}
												onClick={() => onToggleExpanded(row.original._id)}
											>
												{row.cells.map((cell: Cell<any>) => (
													<TableCell {...cell.getCellProps([{ className: (cell.column as any).className }])}>
														{cell.render("Cell")}
													</TableCell>
												))}
											</TableRow>
											{isExpanded && (
												<TableRow>
													<TableCell colSpan={row.cells.length} sx={{ p: 0, borderBottom: "none" }}>
														<Collapse in={isExpanded} timeout="auto">
															{renderRowSubComponent({ row })}
														</Collapse>
													</TableCell>
												</TableRow>
											)}
										</Fragment>
									);
								})
							) : (
								<EmptyTable msg="Sin cálculos guardados" colSpan={columns.length} />
							)}
						</TableBody>
					</Table>
				</ScrollX>

				<Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
					<TablePagination gotoPage={gotoPage} rows={rows} setPageSize={setPageSize} pageSize={pageSize} pageIndex={pageIndex} />
				</Box>
			</Stack>
		</>
	);
}

// ── SavedPrevisional ──────────────────────────────────────────────────────────

export default function SavedPrevisional() {
	const theme = useTheme();
	const userId = useSelector((state: any) => state.auth.user?._id);
	const { selectedCalculators, isLoader } = useSelector((state: any) => state.calculator);
	const rates: InterestRate[] = useSelector((state: any) => state.interestRates.rates || []);

	const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteId, setDeleteId] = useState("");
	const [deleteTitle, setDeleteTitle] = useState("");
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [linkCalculationId, setLinkCalculationId] = useState("");

	const isMountedRef = useRef(false);
	const isFirstRenderRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;

		const timeoutId = setTimeout(
			() => {
				if (userId && isMountedRef.current) {
					dispatch(
						getCalculatorsByFilter({
							userId,
							type: "Calculado",
							classType: "previsional",
						}),
					);
				}
			},
			isFirstRenderRef.current ? 100 : 0,
		);

		isFirstRenderRef.current = false;

		return () => {
			clearTimeout(timeoutId);
			isMountedRef.current = false;
			dispatch(clearSelectedCalculators());
		};
	}, [userId]);

	const handleToggleExpanded = useCallback((id: string) => {
		setExpandedRowId((prev) => (prev === id ? null : id));
	}, []);

	const handleDeleteOpen = useCallback((id: string, title: string) => {
		setDeleteId(id);
		setDeleteTitle(title);
		setDeleteOpen(true);
	}, []);

	const handleDeleteClose = useCallback(() => {
		setDeleteOpen(false);
		setDeleteId("");
		setDeleteTitle("");
	}, []);


	const columns: Column[] = useMemo(
		() => [
			{
				Header: "#",
				accessor: "_id",
				className: "cell-center",
			},
			{
				Header: "folderId",
				accessor: "folderId",
			},
			{
				Header: "Fecha",
				accessor: "date",
				Cell: ({ row }: { row: Row<any> }) => (
					<Typography noWrap>{row.original.date ? dayjs(row.original.date).format("DD/MM/YYYY") : "-"}</Typography>
				),
			},
			{
				Header: "Titular / Carátula",
				accessor: "user",
				Cell: ({ row }: { row: Row<any> }) => {
					const titular = row.original.user || row.original.variables?.reclamante;
					const carpeta = row.original.folderName;

					return (
						<Stack spacing={0.25}>
							{titular && (
								<Tooltip title={titular}>
									<Typography noWrap sx={{ maxWidth: 200, fontWeight: 500 }}>
										{titular}
									</Typography>
								</Tooltip>
							)}
							{carpeta ? (
								<Tooltip title={carpeta}>
									<Typography noWrap variant="caption" color="text.secondary" sx={{ maxWidth: 200 }}>
										{carpeta}
									</Typography>
								</Tooltip>
							) : (
								<Button
									variant="text"
									size="small"
									sx={{ p: 0, minWidth: 0, fontSize: "0.7rem", color: "primary.main", justifyContent: "flex-start" }}
									onClick={(e) => {
										e.stopPropagation();
										setLinkCalculationId(row.original._id);
										setLinkModalOpen(true);
									}}
								>
									Vincular carpeta
								</Button>
							)}
						</Stack>
					);
				},
			},
			{
				Header: "Prestación",
				accessor: "subClassType",
				Cell: ({ row }: { row: Row<any> }) => {
					const prestacion = row.original.variables?.prestacion;
					return <Typography noWrap>{PRESTACION_LABELS[prestacion] || prestacion || "-"}</Typography>;
				},
			},
			{
				Header: "Haber Reclamado",
				accessor: "amount",
				Cell: ({ row }: { row: Row<any> }) => (
					<Typography noWrap fontWeight={500}>
						{formatPesos(row.original.variables?.haberReclamado || row.original.amount)}
					</Typography>
				),
			},
			{
				Header: "Expediente",
				accessor: "variables",
				Cell: ({ row }: { row: Row<any> }) => (
					<Typography noWrap sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
						{row.original.variables?.expedienteAdmin || "-"}
					</Typography>
				),
			},
			{
				Header: "Tasa sentencia",
				accessor: "subClassType",
				Cell: ({ row }: { row: Row<any> }) => {
					const tasaValue = row.original.variables?.tasaInteresSentencia || row.original.subClassType;
					const label =
						rates.find((r) => r.value === tasaValue)?.label ||
						TASA_FALLBACK_LABELS[tasaValue] ||
						tasaValue ||
						"-";
					return (
						<Tooltip title={label} arrow>
							<Typography noWrap sx={{ maxWidth: 160 }}>
								{label}
							</Typography>
						</Tooltip>
					);
				},
			},
			{
				Header: "Acciones",
				className: "cell-center",
				disableSortBy: true,
				Cell: ({ row }: { row: Row<any> }) => {
					const isExpanded = expandedRowId === row.original._id;
					const titular = row.original.user || row.original.variables?.reclamante || "este cálculo";
					return (
						<Stack direction="row" spacing={0.5} justifyContent="center" onClick={(e) => e.stopPropagation()}>
							<Tooltip title={isExpanded ? "Cerrar detalle" : "Ver detalle"}>
								<IconButton
									size="small"
									color={isExpanded ? "primary" : "secondary"}
									onClick={() => handleToggleExpanded(row.original._id)}
								>
									{isExpanded ? <EyeSlash size={18} /> : <Eye size={18} />}
								</IconButton>
							</Tooltip>
							<Tooltip title="Vincular carpeta">
								<IconButton
									size="small"
									color="secondary"
									onClick={() => {
										setLinkCalculationId(row.original._id);
										setLinkModalOpen(true);
									}}
								>
									<Link21 size={18} />
								</IconButton>
							</Tooltip>
							<Tooltip title="Eliminar">
								<IconButton
									size="small"
									color="error"
									onClick={() => handleDeleteOpen(row.original._id, titular)}
								>
									<Trash size={18} />
								</IconButton>
							</Tooltip>
						</Stack>
					);
				},
			},
		],
		[expandedRowId, handleToggleExpanded, handleDeleteOpen],
	);

	return (
		<>
			<MainCard content={false}>
				<ReactTable
					columns={columns}
					data={selectedCalculators}
					renderRowSubComponent={({ row }: { row: Row<any> }) => <ExpandedRow row={row} rates={rates} />}
					isLoading={isLoader}
					expandedRowId={expandedRowId}
					onToggleExpanded={handleToggleExpanded}
				/>
			</MainCard>

			<AlertCalculatorDelete
				id={deleteId}
				title={deleteTitle}
				open={deleteOpen}
				handleClose={handleDeleteClose}
			/>

			<LinkCauseModal
				open={linkModalOpen}
				onClose={() => setLinkModalOpen(false)}
				calculationId={linkCalculationId}
			/>
		</>
	);
}
