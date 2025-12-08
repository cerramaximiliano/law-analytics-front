import React from "react";
import { useCallback, useEffect, useMemo, useState, FC, Fragment, MouseEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
	Skeleton,
	Dialog,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
	Tooltip,
	useMediaQuery,
	Button,
	Box,
	Collapse,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	CircularProgress,
} from "@mui/material";
import { dispatch, useSelector } from "store";
import dayjs from "utils/dayjs-config";
import {
	useFilters,
	useExpanded,
	useGlobalFilter,
	useRowSelect,
	useSortBy,
	useTable,
	usePagination,
	Column,
	HeaderGroup,
	Row,
	Cell,
} from "react-table";

// project-imports
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import IconButton from "components/@extended/IconButton";
import { PopupTransition } from "components/@extended/Transitions";
import { EmptyTable, HeaderSort, SortingSelect, TablePagination, TableRowSelection } from "components/third-party/ReactTable";
import { CSVLink } from "react-csv";
import AlertCalculatorDelete from "./AlertCalculatorDelete";
import { renderFilterTypes, GlobalFilter } from "utils/react-table";
import { CalculationDetailsView } from "components/calculator/CalculationDetailsView";

// assets
import { Add, Eye, Trash, DocumentDownload, Coin, Refresh, Copy, Sms, Printer, Link21, More } from "iconsax-react";

// types
import { ThemeMode } from "types/config";
import { getCalculatorsByFilter, clearSelectedCalculators, updateCalculator } from "store/reducers/calculator";
import { openSnackbar } from "store/reducers/snackbar";
import despidoFormModel from "sections/forms/wizard/calc-laboral/despido/formModel/despidoFormModel";
import LinkCauseModal from "sections/forms/wizard/calc-laboral/components/linkCauseModal";

// ==============================|| REACT TABLE ||============================== //

interface CalculatorData {
	_id: string;
	date: string;
	folderName?: string;
	folderId?: string;
	type: string;
	subClassType: string;
	amount: number;
	capital?: number;
	interest?: number;
	variables?: Record<string, any>;
	keepUpdated?: boolean;
	originalData?: {
		amount?: number;
		capital?: number;
		interest?: number;
		endDate?: string | Date;
		createdAt?: string | Date;
	};
	lastUpdate?: {
		amount?: number;
		interest?: number;
		updatedAt?: string | Date;
		updatedToDate?: string | Date;
		segments?: Array<{
			startDate?: string | Date;
			endDate?: string | Date;
			interest?: number;
			isExtension?: boolean;
		}>;
	};
}

// Update Props interface
interface Props {
	columns: Column<CalculatorData>[];
	data: CalculatorData[];
	handleAdd: () => void;
	renderRowSubComponent: FC<{ row: Row<CalculatorData> }>;
	isLoading: boolean;
	expandedRowId?: string | null;
	onToggleExpanded?: (rowId: string) => void;
}

interface ResultItem {
	key: string;
	value: number | string;
}

interface GroupedResults {
	reclamo: ResultItem[];
	indemnizacion: ResultItem[];
	liquidacion: ResultItem[];
	multas: ResultItem[];
	otros: ResultItem[];
	intereses: ResultItem[];
	[key: string]: ResultItem[];
}

interface CalculationDetailsProps {
	data: {
		_id: string;
		folderId?: string;
		amount: number;
		variables?: Record<string, any>;
		subClassType?: string;
		type?: string;
		interest?: number;
		capital?: number;
		keepUpdated?: boolean;
		originalData?: {
			amount?: number;
			capital?: number;
			interest?: number;
			endDate?: string | Date;
			createdAt?: string | Date;
		};
		lastUpdate?: {
			amount?: number;
			interest?: number;
			updatedAt?: string | Date;
			updatedToDate?: string | Date;
			segments?: Array<{
				startDate?: string | Date;
				endDate?: string | Date;
				interest?: number;
				isExtension?: boolean;
			}>;
		};
	};
	onKeepUpdatedChange?: (calculatorId: string, keepUpdated: boolean) => void;
	isKeepUpdatedLoading?: boolean;
	// Props para control externo
	openEmailModal?: boolean;
	onEmailModalClose?: () => void;
	triggerPrint?: boolean;
	onPrintComplete?: () => void;
}

const CustomGlobalFilter = GlobalFilter as any;
const CustomTablePagination = TablePagination as any;

// Update the HeaderSort component
const CustomHeaderSort = HeaderSort as any;

const CustomSortingSelect = SortingSelect as any;

const CalculationDetails: React.FC<CalculationDetailsProps> = ({
	data,
	onKeepUpdatedChange,
	isKeepUpdatedLoading,
	openEmailModal,
	onEmailModalClose,
	triggerPrint,
	onPrintComplete,
}) => {
	const { formField } = despidoFormModel;

	// Handler para el cambio de keepUpdated
	const handleKeepUpdatedChange = (keepUpdated: boolean) => {
		if (onKeepUpdatedChange) {
			onKeepUpdatedChange(data._id, keepUpdated);
		}
	};

	const getLabelForKey = (key: string): string => {
		// Etiquetas personalizadas
		const customLabels: Record<string, string> = {
			caratula: "Carátula",
			montoIntereses: "Monto de intereses",
			montoTotalConIntereses: "Total con intereses",
			fechaInicialIntereses: "Fecha inicial de intereses",
			fechaFinalIntereses: "Fecha final de intereses",
			tasaIntereses: "Tasa de interés",
		};

		if (customLabels[key]) {
			return customLabels[key];
		}

		const field = formField[key as keyof typeof formField];
		return field?.label || key;
	};

	// Función para generar texto plano
	const generatePlainText = () => {
		let text = "RESULTADOS DE LA LIQUIDACIÓN\n\n";

		const groupedData = groupResults(data?.variables);

		Object.entries(groupedData).forEach(([group, items]: [string, ResultItem[]]) => {
			if (items.length) {
				text += `${group.toUpperCase()}\n`;
				items.forEach((item: ResultItem) => {
					text += `${getLabelForKey(item.key)}: ${
						typeof item.value === "number" && item.key !== "Periodos" && item.key !== "Días Vacaciones"
							? new Intl.NumberFormat("es-AR", {
									style: "currency",
									currency: "ARS",
							  }).format(item.value)
							: item.value
					}\n`;
				});
				text += "\n";
			}
		});

		// Incluir tramos de intereses si keepUpdated está activo
		if (data.keepUpdated && data.lastUpdate?.segments && data.lastUpdate.segments.length > 0) {
			const formatDate = (date: string | Date | undefined) => {
				if (!date) return "-";
				const d = new Date(date);
				return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
			};
			const formatCurrency = (value: number | undefined) => {
				if (value === undefined || value === null) return "-";
				return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
			};

			text += "INTERESES\n";
			data.lastUpdate.segments.forEach((segment) => {
				text += `Intereses (${formatDate(segment.startDate)} - ${formatDate(segment.endDate)}): ${formatCurrency(segment.interest)}\n`;
			});
			text += "\n";
		}

		// Usar el monto actualizado si está disponible
		const finalAmount = data.keepUpdated && data.lastUpdate?.amount ? data.lastUpdate.amount : data.amount;
		text += `TOTAL: ${new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
		}).format(finalAmount)}`;

		return text;
	};

	// Función para generar contenido HTML
	const generateHtmlContent = () => {
		const styles = `
	      <style>
	        body {
	          font-family: Arial, sans-serif;
	          line-height: 1.6;
	          color: #333;
	          max-width: 800px;
	          margin: 0 auto;
	          padding: 20px;
	        }
	        .container { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
	        .header { text-align: center; margin-bottom: 24px; }
	        .header h1, .header h2 { color: #333; margin: 0; }
	        .card {
	          border: 1px solid #ddd;
	          border-radius: 8px;
	          margin-bottom: 16px;
	          break-inside: avoid;
	          page-break-inside: avoid;
	          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
	          overflow: hidden;
	        }
	        .card-header {
	          background-color: #f5f5f5;
	          padding: 12px 16px;
	          border-bottom: 1px solid #ddd;
	          border-radius: 8px 8px 0 0;
	          font-weight: bold;
	          color: #333;
	        }
	        .card-content { padding: 16px; }
	        .data-table { width: 100%; border-collapse: collapse; }
	        .data-table td { padding: 8px 0; border-bottom: 1px solid #eee; }
	        .data-table tr:last-child td { border-bottom: none; }
	        .label { color: #666; text-align: left; width: 40%; }
	        .value { font-weight: 500; color: #333; text-align: right; width: 60%; }
	        .total-card {
	          background-color: #1976d2;
	          color: white;
	          padding: 16px;
	          border-radius: 8px;
	          margin-top: 16px;
	        }
	        .total-table { width: 100%; }
	        .total-table td { padding: 0; }
	        .total-label {
	          font-size: 18px;
	          font-weight: bold;
	          text-align: left;
	        }
	        .total-value {
	          font-size: 18px;
	          font-weight: bold;
	          text-align: right;
	        }
	        .footer {
	          margin-top: 24px;
	          text-align: center;
	          font-size: 12px;
	          color: #666;
	        }
	        .message-card {
	          border: 1px solid #ddd;
	          border-radius: 8px;
	          margin-bottom: 16px;
	          padding: 16px;
	          background-color: #f9f9f9;
	          line-height: 1.5;
	        }
	      </style>
	    `;

		const renderCard = (title: string, items: ResultItem[], showSubtotal = false) => {
			if (!items.length) return "";

			const formatCurrency = (value: number) =>
				new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);

			const rows = items
				.map(
					({ key, value }) => `
				<tr>
					<td class="label">${getLabelForKey(key) || key}:</td>
					<td class="value">${
						typeof value === "number" && key !== "Periodos" && key !== "Días Vacaciones"
							? formatCurrency(value)
							: value
					}</td>
				</tr>`,
				)
				.join("");

			// Calcular subtotal si es necesario
			let subtotalHtml = "";
			if (showSubtotal) {
				const subtotal = items.reduce((sum, item) => {
					if (item.key === "Periodos" || item.key === "Días Vacaciones") return sum;
					const numValue = typeof item.value === "number" ? item.value : 0;
					return sum + numValue;
				}, 0);

				if (subtotal > 0) {
					subtotalHtml = `
				<tr style="background: #f5f5f5;">
					<td class="label" style="font-weight: bold; border-top: 2px solid #ddd; padding-top: 12px;">Subtotal:</td>
					<td class="value" style="font-weight: bold; color: #1976d2; border-top: 2px solid #ddd; padding-top: 12px;">${formatCurrency(subtotal)}</td>
				</tr>`;
				}
			}

			return `
				<div class="card">
					<div class="card-header">${title}</div>
					<div class="card-content">
						<table class="data-table">
							${rows}
							${subtotalHtml}
						</table>
					</div>
				</div>`;
		};

		const groupedData = groupResults(data?.variables);
		const sections = [
			{ title: "Datos del Reclamo", data: groupedData.reclamo, showSubtotal: false },
			{ title: "Indemnización", data: groupedData.indemnizacion, showSubtotal: true },
			{ title: "Liquidación Final", data: groupedData.liquidacion, showSubtotal: true },
			{ title: "Multas", data: groupedData.multas, showSubtotal: true },
		];

		const cardsHtml = sections
			.map((section) => renderCard(section.title, section.data, section.showSubtotal))
			.filter((card) => card !== "")
			.join("");

		// Generar sección de tramos de intereses si keepUpdated está activo
		let keepUpdatedHtml = "";
		if (data.keepUpdated && data.lastUpdate?.segments && data.lastUpdate.segments.length > 0) {
			const formatDate = (date: string | Date | undefined) => {
				if (!date) return "-";
				const d = new Date(date);
				return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
			};
			const formatCurrency = (value: number | undefined) => {
				if (value === undefined || value === null) return "-";
				return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
			};

			const segmentsHtml = data.lastUpdate.segments
				.map((segment) => {
					const valueStyle = segment.isExtension ? "color: #1976d2; font-weight: 500;" : "";
					return `
				<tr>
					<td class="label">Intereses (${formatDate(segment.startDate)} - ${formatDate(segment.endDate)}):</td>
					<td class="value" style="${valueStyle}">${formatCurrency(segment.interest)}</td>
				</tr>`;
				})
				.join("");

			const totalInterest = data.lastUpdate.segments.reduce((sum, seg) => sum + (seg.interest || 0), 0);

			keepUpdatedHtml = `
			<div class="card">
				<div class="card-header">Intereses</div>
				<div class="card-content">
					<table class="data-table">
						${segmentsHtml}
						<tr style="background: #f5f5f5;">
							<td class="label" style="font-weight: bold; border-top: 2px solid #ddd; padding-top: 12px;">Subtotal:</td>
							<td class="value" style="font-weight: bold; color: #1976d2; border-top: 2px solid #ddd; padding-top: 12px;">${formatCurrency(totalInterest)}</td>
						</tr>
					</table>
				</div>
			</div>`;
		}

		// Usar el monto actualizado si está disponible
		const finalAmount = data.keepUpdated && data.lastUpdate?.amount ? data.lastUpdate.amount : data.amount;

		return `
	        <!DOCTYPE html>
	        <html>
	            <head>
	                <meta charset="utf-8">
	                <meta name="viewport" content="width=device-width, initial-scale=1.0">
	                ${styles}
	            </head>
	            <body>
	                <div class="container">
	                    <div class="header">
	                        <h1>Resultados de la Liquidación</h1>
	                    </div>
	                    ${cardsHtml}
	                    ${keepUpdatedHtml}
	                    <div class="total-card">
	                        <table class="total-table">
	                            <tr>
	                                <td class="total-label">TOTAL</td>
	                                <td class="total-value">${new Intl.NumberFormat("es-AR", {
														style: "currency",
														currency: "ARS",
													}).format(finalAmount)}</td>
	                            </tr>
	                        </table>
	                    </div>

	                    <div class="footer">
	                      <p>Este documento fue generado automáticamente por Law||Analytics.</p>
	                    </div>
	                </div>
	            </body>
	        </html>
	    `;
	};

	const groupResults = (variables: Record<string, any> | undefined): GroupedResults => {
		const groups: GroupedResults = {
			reclamo: [],
			indemnizacion: [],
			liquidacion: [],
			multas: [],
			otros: [],
			intereses: [],
		};

		if (!variables) return groups;

		// Detectar si hay una carpeta vinculada
		const isLinkedToFolder =
			variables.reclamante && typeof variables.reclamante === "string" && variables.reclamante.startsWith("__CAUSA_VINCULADA__");

		// Si hay carpeta vinculada, extraer el nombre de la carpeta
		if (isLinkedToFolder) {
			const folderName =
				variables.folderName ||
				(typeof variables.reclamante === "string" ? variables.reclamante.replace("__CAUSA_VINCULADA__", "").trim() : "");

			if (folderName) {
				groups.reclamo.push({ key: "caratula", value: folderName });
			}
		}

		// Procesar datos de calculationResult si existe
		if (variables.calculationResult) {
			const result = variables.calculationResult;

			// Procesar cada sección del resultado
			if (result.reclamo) {
				result.reclamo.forEach((item: ResultItem) => {
					// Evitar duplicar carátula si ya se agregó
					if (item.key === "caratula" && isLinkedToFolder) {
						return;
					}
					if (item.value != null && item.value !== "") {
						groups.reclamo.push(item);
					}
				});
			}

			if (result.indemnizacion) {
				result.indemnizacion.forEach((item: ResultItem) => {
					if (item.value != null && item.value !== "") {
						groups.indemnizacion.push(item);
					}
				});
			}

			if (result.liquidacion) {
				result.liquidacion.forEach((item: ResultItem) => {
					if (item.value != null && item.value !== "") {
						groups.liquidacion.push(item);
					}
				});
			}

			if (result.multas) {
				result.multas.forEach((item: ResultItem) => {
					if (item.value != null && item.value !== "") {
						groups.multas.push(item);
					}
				});
			}

			if (result.intereses) {
				// Mapeo de nombres de tasas
				const tasasMapping: Record<string, string> = {
					tasaActivaCNAT2601: "Tasa Activa Banco Nación - Acta 2601",
					tasaActivaCNAT2658: "Tasa Activa Banco Nación - Acta 2658",
					tasaActivaCNAT2764: "Tasa Activa Banco Nación - Acta 2764",
				};

				result.intereses.forEach((item: ResultItem) => {
					if (item.value != null && item.value !== "") {
						// Si es la tasa y hay segments, moverla a reclamo con nombre legible
						if (item.key === "tasaIntereses" && data.keepUpdated && data.lastUpdate?.segments?.length) {
							const tasaLegible = tasasMapping[item.value as string] || item.value;
							groups.reclamo.push({
								key: "tasaIntereses",
								value: tasaLegible,
							});
						} else {
							groups.intereses.push(item);
						}
					}
				});
			}

			return groups;
		}

		// Fallback al procesamiento anterior si no hay calculationResult
		Object.entries(variables).forEach(([key, value]) => {
			if (value == null || value === "" || value === false) return;
			if (typeof value === "object" || typeof value === "boolean") return;
			if (typeof value === "number" && value === 0) return;

			const item: ResultItem = { key, value };

			// Excluir reclamante y reclamado si hay carpeta vinculada
			if (isLinkedToFolder && (key === "reclamante" || key === "reclamado")) {
				return;
			}

			if (["reclamante", "reclamado", "fechaIngreso", "fechaEgreso", "remuneracion"].includes(key)) {
				groups.reclamo.push(item);
			} else if (key === "Indemnizacion" || key === "Periodos") {
				groups.indemnizacion.push(item);
			} else if (
				key.includes("Preaviso") ||
				key.includes("SAC") ||
				key.includes("Integracion") ||
				key.includes("Vacaciones") ||
				key.includes("Días Trabajados")
			) {
				groups.liquidacion.push(item);
			} else if (key.includes("Multa")) {
				groups.multas.push(item);
			}
		});

		return groups;
	};

	const formatValue = (key: string, value: number | string): string => {
		if (typeof value === "number" && key !== "Periodos" && key !== "Días Vacaciones") {
			return new Intl.NumberFormat("es-AR", {
				style: "currency",
				currency: "ARS",
			}).format(value);
		}
		return String(value);
	};

	return (
		<CalculationDetailsView
			data={data}
			getLabelForKey={getLabelForKey}
			formatValue={formatValue}
			groupResults={groupResults}
			generateHtmlContent={generateHtmlContent}
			generatePlainText={generatePlainText}
			customTitle="Liquidación por Despido - Law||Analytics"
			hideInterestButton={true}
			isSaved={true}
			onKeepUpdatedChange={handleKeepUpdatedChange}
			isKeepUpdatedLoading={isKeepUpdatedLoading}
			openEmailModal={openEmailModal}
			onEmailModalClose={onEmailModalClose}
			triggerPrint={triggerPrint}
			onPrintComplete={onPrintComplete}
		/>
	);
};

function ReactTable({ columns, data, renderRowSubComponent, handleAdd, isLoading, expandedRowId, onToggleExpanded }: Props) {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

	const filterTypes = useMemo(() => renderFilterTypes, []);
	const sortBy = { id: "_id", desc: false };

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
		if (matchDownSM) {
			setHiddenColumns(["_id", "folderId"]);
		} else {
			setHiddenColumns(["_id", "folderId"]);
		}
		// eslint-disable-next-line
	}, [matchDownSM]);

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
					{/* Lado izquierdo - Filtro y ordenamiento */}
					<Stack direction="column" spacing={2} sx={{ width: matchDownSM ? "100%" : "300px" }}>
						{/* Primera línea: Barra de búsqueda */}
						<CustomGlobalFilter
							preGlobalFilteredRows={preGlobalFilteredRows}
							globalFilter={globalFilter}
							setGlobalFilter={setGlobalFilter}
						/>

						{/* Segunda línea: Selector de ordenamiento */}
						<CustomSortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
					</Stack>

					{/* Lado derecho - Botón de exportación */}
					<Stack direction="column" spacing={2} sx={{ width: matchDownSM ? "100%" : "auto" }}>
						<Tooltip title="Exportar a CSV">
							<IconButton
								color="primary"
								size="medium"
								sx={{
									position: "relative",
								}}
							>
								<CSVLink
									data={selectedFlatRows.length > 0 ? selectedFlatRows.map((d: Row<CalculatorData>) => d.original) : data}
									filename={"calculos-laborales.csv"}
									style={{
										color: "inherit",
										display: "flex",
										alignItems: "center",
										textDecoration: "none",
									}}
								>
									<DocumentDownload variant="Bulk" size={22} />
								</CSVLink>
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>
				<Table {...getTableProps()}>
					<TableHead>
						{headerGroups.map((headerGroup: HeaderGroup<CalculatorData>) => (
							<TableRow {...headerGroup.getHeaderGroupProps()} sx={{ "& > th:first-of-type": { width: "40px" } }}>
								{headerGroup.headers.map((column: HeaderGroup<CalculatorData>) => (
									<TableCell {...column.getHeaderProps([{ className: column.className }])}>
										<CustomHeaderSort column={column} sort />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableHead>
					<TableBody {...getTableBodyProps()}>
						{isLoading ? (
							<>
								{Array.from({ length: 10 }).map((_, rowIndex) => (
									<TableRow key={rowIndex}>
										{headerGroups[0].headers.map((column, cellIndex) => (
											<TableCell key={cellIndex}>
												<Skeleton />
											</TableCell>
										))}
									</TableRow>
								))}
							</>
						) : (
							<>
								{data.length > 0 ? (
									<>
										{page.map((row: Row<CalculatorData>, i: number) => {
											prepareRow(row);
											const isRowExpanded = expandedRowId === row.original._id;

											return (
												<Fragment key={i}>
													<TableRow
														{...row.getRowProps()}
														onClick={() => {
															row.toggleRowSelected();
														}}
														sx={{
															cursor: "pointer",
															bgcolor: row.isSelected ? alpha(theme.palette.primary.lighter, 0.35) : "inherit",
														}}
													>
														{row.cells.map((cell: Cell<CalculatorData>) => (
															<TableCell {...cell.getCellProps([{ className: cell.column.className }])}>{cell.render("Cell")}</TableCell>
														))}
													</TableRow>
													<TableRow sx={{ "&:hover": { bgcolor: "inherit !important" } }}>
														<TableCell colSpan={columns.length + 1} sx={{ p: 0 }}>
															<Collapse in={isRowExpanded} timeout="auto" unmountOnExit>
																<Box
																	sx={{
																		margin: 2,
																		bgcolor: theme.palette.mode === "dark" ? "grey.800" : "#f5f5f5",
																		borderRadius: 2,
																		p: 0,
																		border: `1px solid ${theme.palette.divider}`,
																		boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
																		"&:hover": {
																			bgcolor: theme.palette.mode === "dark" ? "grey.800" : "#f5f5f5",
																		},
																	}}
																>
																	{renderRowSubComponent({ row })}
																</Box>
															</Collapse>
														</TableCell>
													</TableRow>
												</Fragment>
											);
										})}
										<TableRow sx={{ "&:hover": { bgcolor: "transparent !important" } }}>
											<TableCell sx={{ p: 2, py: 3 }} colSpan={9}>
												<CustomTablePagination
													gotoPage={gotoPage}
													rows={rows}
													setPageSize={setPageSize}
													pageSize={pageSize}
													pageIndex={pageIndex}
												/>
											</TableCell>
										</TableRow>
									</>
								) : (
									<EmptyTable msg="No Hay Datos" colSpan={7} />
								)}
							</>
						)}
					</TableBody>
				</Table>
			</Stack>
		</>
	);
}

const SavedLabor = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const mode = theme.palette.mode;
	const { selectedCalculators, isLoader } = useSelector((state: any) => state.calculator);
	const auth = useSelector((state: any) => state.auth);
	const userId = auth.user?._id;

	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [selectedCalculationId, setSelectedCalculationId] = useState("");

	const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
	const [calculatorIdToDelete, setCalculatorIdToDelete] = useState<string>("");
	const [add, setAdd] = useState<boolean>(false);
	const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
	const [keepUpdatedLoading, setKeepUpdatedLoading] = useState<string | null>(null);
	const isMountedRef = useRef(false);
	const isFirstRenderRef = useRef(true);

	// Estados para el menú de acciones
	const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
	const [selectedRowData, setSelectedRowData] = useState<CalculatorData | null>(null);
	const [triggerEmailForRow, setTriggerEmailForRow] = useState<string | null>(null);
	const [triggerPrintForRow, setTriggerPrintForRow] = useState<string | null>(null);

	useEffect(() => {
		// Marcar como montado
		isMountedRef.current = true;

		// Usar setTimeout para retrasar la primera ejecución y evitar conflictos
		const timeoutId = setTimeout(
			() => {
				if (userId && isMountedRef.current) {
					// getCalculatorsByFilter ya maneja la lógica de cache internamente
					dispatch(
						getCalculatorsByFilter({
							userId,
							type: "Calculado",
							classType: "laboral",
						}),
					);
				}
			},
			isFirstRenderRef.current ? 100 : 0,
		); // Retrasar la primera ejecución

		isFirstRenderRef.current = false;

		return () => {
			clearTimeout(timeoutId);
			isMountedRef.current = false;
			// Limpiar selectedCalculators cuando el componente se desmonta
			dispatch(clearSelectedCalculators());
		};
	}, [userId, dispatch]); // Incluir dispatch en las dependencias

	const handleAdd = () => {
		setAdd(!add);
	};

	const handleOpenDeleteModal = (id: string) => {
		setCalculatorIdToDelete(id);
		setDeleteModalOpen(true);
	};

	const handleCloseDeleteModal = () => {
		setDeleteModalOpen(false);
		setCalculatorIdToDelete("");
	};

	const handleToggleExpanded = useCallback((rowId: string) => {
		setExpandedRowId((prev) => (prev === rowId ? null : rowId));
	}, []);

	// Handler para cambiar keepUpdated
	const handleKeepUpdatedChange = useCallback(async (calculatorId: string, keepUpdated: boolean) => {
		setKeepUpdatedLoading(calculatorId);
		try {
			const result = await dispatch(updateCalculator(calculatorId, { keepUpdated }) as any);
			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: keepUpdated
							? "Actualización automática de intereses activada"
							: "Actualización automática de intereses desactivada",
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al actualizar la configuración",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al actualizar la configuración",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setKeepUpdatedLoading(null);
		}
	}, []);

	// Funciones para el menú de acciones
	const handleOpenActionMenu = (event: MouseEvent<HTMLButtonElement>, rowData: CalculatorData) => {
		event.stopPropagation();
		setActionMenuAnchor(event.currentTarget);
		setSelectedRowData(rowData);
	};

	const handleCloseActionMenu = () => {
		setActionMenuAnchor(null);
		setSelectedRowData(null);
	};

	// Generar texto plano para copiar/email
	const generatePlainTextForRow = (data: CalculatorData) => {
		let text = "RESULTADOS DE LA LIQUIDACIÓN\n\n";
		const groupedData = groupResultsForRow(data?.variables);

		Object.entries(groupedData).forEach(([group, items]: [string, ResultItem[]]) => {
			if (items.length) {
				text += `${group.toUpperCase()}\n`;
				items.forEach((item: ResultItem) => {
					text += `${getLabelForKeyStatic(item.key)}: ${
						typeof item.value === "number" && item.key !== "Periodos" && item.key !== "Días Vacaciones"
							? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(item.value)
							: item.value
					}\n`;
				});
				text += "\n";
			}
		});

		// Incluir tramos de intereses si keepUpdated está activo
		if (data.keepUpdated && data.lastUpdate?.segments && data.lastUpdate.segments.length > 0) {
			const formatDate = (date: string | Date | undefined) => {
				if (!date) return "-";
				const d = new Date(date);
				return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
			};
			const formatCurrency = (value: number | undefined) => {
				if (value === undefined || value === null) return "-";
				return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
			};

			text += "INTERESES\n";
			data.lastUpdate.segments.forEach((segment) => {
				text += `Intereses (${formatDate(segment.startDate)} - ${formatDate(segment.endDate)}): ${formatCurrency(segment.interest)}\n`;
			});
			text += "\n";
		}

		const finalAmount = data.keepUpdated && data.lastUpdate?.amount ? data.lastUpdate.amount : data.amount;
		text += `TOTAL: ${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(finalAmount)}`;

		return text;
	};

	// Función para agrupar resultados (versión estática)
	const groupResultsForRow = (variables: Record<string, any> | undefined): GroupedResults => {
		const groups: GroupedResults = {
			reclamo: [],
			indemnizacion: [],
			liquidacion: [],
			multas: [],
			otros: [],
			intereses: [],
		};

		if (!variables) return groups;

		if (variables.calculationResult) {
			const result = variables.calculationResult;
			if (result.reclamo) groups.reclamo = result.reclamo.filter((item: ResultItem) => item.value != null && item.value !== "");
			if (result.indemnizacion)
				groups.indemnizacion = result.indemnizacion.filter((item: ResultItem) => item.value != null && item.value !== "");
			if (result.liquidacion)
				groups.liquidacion = result.liquidacion.filter((item: ResultItem) => item.value != null && item.value !== "");
			if (result.multas) groups.multas = result.multas.filter((item: ResultItem) => item.value != null && item.value !== "");
			if (result.intereses) groups.intereses = result.intereses.filter((item: ResultItem) => item.value != null && item.value !== "");
		}

		return groups;
	};

	// Función estática para obtener labels
	const getLabelForKeyStatic = (key: string): string => {
		const { formField } = despidoFormModel;
		const customLabels: Record<string, string> = {
			caratula: "Carátula",
			montoIntereses: "Monto de intereses",
			montoTotalConIntereses: "Total con intereses",
			fechaInicialIntereses: "Fecha inicial de intereses",
			fechaFinalIntereses: "Fecha final de intereses",
			tasaIntereses: "Tasa de interés",
		};
		if (customLabels[key]) return customLabels[key];
		const field = formField[key as keyof typeof formField];
		return field?.label || key;
	};

	const handleCopyToClipboard = async () => {
		if (!selectedRowData) return;
		try {
			await navigator.clipboard.writeText(generatePlainTextForRow(selectedRowData));
			dispatch(
				openSnackbar({
					open: true,
					message: "Cálculo copiado correctamente",
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
		} catch (err) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al copiar",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
		handleCloseActionMenu();
	};

	const handleEmailAction = () => {
		if (!selectedRowData) return;
		const rowId = selectedRowData._id;
		setExpandedRowId(rowId);
		handleCloseActionMenu();
		// Pequeño delay para que se renderice el componente expandido
		setTimeout(() => {
			setTriggerEmailForRow(rowId);
		}, 100);
	};

	const handlePrintAction = () => {
		if (!selectedRowData) return;
		const rowId = selectedRowData._id;
		setExpandedRowId(rowId);
		handleCloseActionMenu();
		// Pequeño delay para que se renderice el componente expandido
		setTimeout(() => {
			setTriggerPrintForRow(rowId);
		}, 100);
	};

	const handleLinkAction = () => {
		if (!selectedRowData) return;
		setSelectedCalculationId(selectedRowData._id);
		setLinkModalOpen(true);
		handleCloseActionMenu();
	};

	const columns = useMemo(
		() => [
			{
				Header: "#",
				accessor: "_id",
				className: "cell-center",
			},
			{
				Header: "folderId",
				accessor: "folderId",
				className: "cell-center",
			},
			{
				Header: "Fecha",
				accessor: "date",
				Cell: ({ row }: { row: Row<CalculatorData> }) => (
					<Typography noWrap>{row.original.date ? dayjs(row.original.date).format("DD/MM/YYYY") : "-"}</Typography>
				),
			},
			{
				Header: "Carátula",
				accessor: "folderName",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					if (!row.original.folderName) {
						return (
							<Button
								variant="contained"
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									setSelectedCalculationId(row.original._id);
									setLinkModalOpen(true);
								}}
							>
								Vincular
							</Button>
						);
					}
					return (
						<Tooltip title={row.original.folderName}>
							<Typography
								noWrap
								sx={{
									maxWidth: "200px",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
									display: "block",
								}}
							>
								{row.original.folderName}
							</Typography>
						</Tooltip>
					);
				},
			},
			{
				Header: "Tipo",
				accessor: "type",
			},
			{
				Header: "Categoría",
				accessor: "subClassType",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					const capitalizeFirst = (str: string | undefined) => {
						if (!str) return "-";
						return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
					};
					return <Typography noWrap>{capitalizeFirst(row.original.subClassType)}</Typography>;
				},
			},
			{
				Header: "Capital",
				accessor: "amount",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					// Si existe la propiedad capital, usarla
					if (row.original.capital !== undefined) {
						return (
							<Typography fontWeight="500">
								{new Intl.NumberFormat("es-AR", {
									style: "currency",
									currency: "ARS",
								}).format(row.original.capital)}
							</Typography>
						);
					}

					// Si no existe capital pero hay intereses, calcular capital = amount - interest
					const interestAmount = row.original.variables?.datosIntereses?.montoIntereses || 0;
					const capital = row.original.amount - interestAmount;

					return (
						<Typography fontWeight="500">
							{capital
								? new Intl.NumberFormat("es-AR", {
										style: "currency",
										currency: "ARS",
								  }).format(capital)
								: "-"}
						</Typography>
					);
				},
			},
			{
				Header: "Intereses",
				accessor: "interest",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					// Si keepUpdated está activo y hay lastUpdate, usar esos intereses
					if (row.original.keepUpdated && row.original.lastUpdate?.interest) {
						return (
							<Stack direction="row" alignItems="center" spacing={0.5}>
								<Typography fontWeight="500" color="success.main">
									{new Intl.NumberFormat("es-AR", {
										style: "currency",
										currency: "ARS",
									}).format(row.original.lastUpdate.interest)}
								</Typography>
								<Tooltip title="Intereses actualizados automáticamente">
									<Box component="span" sx={{ display: "flex", alignItems: "center" }}>
										<Refresh size={16} style={{ color: theme.palette.primary.main }} />
									</Box>
								</Tooltip>
							</Stack>
						);
					}

					const interestAmount = row.original.interest || row.original.variables?.datosIntereses?.montoIntereses;

					if (!interestAmount && interestAmount !== 0) {
						return (
							<Button
								variant="contained"
								size="small"
								color="success"
								onClick={(e) => {
									e.stopPropagation();
									// Navegar a la sección de intereses
									navigate("/apps/calc/intereses");
								}}
								startIcon={<Coin size={16} />}
							>
								Calcular
							</Button>
						);
					}

					return (
						<Typography fontWeight="500" color="success.main">
							{new Intl.NumberFormat("es-AR", {
								style: "currency",
								currency: "ARS",
							}).format(interestAmount)}
						</Typography>
					);
				},
			},
			{
				Header: "Total",
				accessor: "total",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					// Si keepUpdated está activo y hay lastUpdate, usar ese amount
					if (row.original.keepUpdated && row.original.lastUpdate?.amount) {
						return (
							<Stack direction="row" alignItems="center" spacing={0.5}>
								<Typography fontWeight="600">
									{new Intl.NumberFormat("es-AR", {
										style: "currency",
										currency: "ARS",
									}).format(row.original.lastUpdate.amount)}
								</Typography>
								<Tooltip title="Total actualizado automáticamente">
									<Box component="span" sx={{ display: "flex", alignItems: "center" }}>
										<Refresh size={16} style={{ color: theme.palette.primary.main }} />
									</Box>
								</Tooltip>
							</Stack>
						);
					}

					// Calcular total = capital + intereses
					const capital = row.original.capital || row.original.amount;
					const interest = row.original.interest || row.original.variables?.datosIntereses?.montoIntereses || 0;
					const total = row.original.amount || capital + interest;

					return (
						<Typography fontWeight="600">
							{new Intl.NumberFormat("es-AR", {
								style: "currency",
								currency: "ARS",
							}).format(total)}
						</Typography>
					);
				},
			},
			{
				Header: "Acciones",
				accessor: "actions",
				className: "cell-center",
				disableSortBy: true,
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					const isExpanded = expandedRowId === row.original._id;
					const collapseIcon = isExpanded ? (
						<Add style={{ color: theme.palette.error.main, transform: "rotate(45deg)" }} />
					) : (
						<Eye variant="Bulk" />
					);
					return (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
							<Tooltip
								componentsProps={{
									tooltip: {
										sx: {
											backgroundColor: mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[700],
											opacity: 0.9,
										},
									},
								}}
								title="Ver"
							>
								<IconButton
									color="success"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										if (handleToggleExpanded) {
											handleToggleExpanded(row.original._id);
										}
									}}
								>
									{collapseIcon}
								</IconButton>
							</Tooltip>
							<Tooltip
								componentsProps={{
									tooltip: {
										sx: {
											backgroundColor: mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[700],
											opacity: 0.9,
										},
									},
								}}
								title="Imprimir"
							>
								<IconButton
									color="primary"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										setSelectedRowData(row.original);
										setExpandedRowId(row.original._id);
										setTimeout(() => {
											setTriggerPrintForRow(row.original._id);
										}, 100);
									}}
								>
									<Printer variant="Bulk" />
								</IconButton>
							</Tooltip>
							<Tooltip
								componentsProps={{
									tooltip: {
										sx: {
											backgroundColor: mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[700],
											opacity: 0.9,
										},
									},
								}}
								title="Enviar por email"
							>
								<IconButton
									color="info"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										setSelectedRowData(row.original);
										setExpandedRowId(row.original._id);
										setTimeout(() => {
											setTriggerEmailForRow(row.original._id);
										}, 100);
									}}
								>
									<Sms variant="Bulk" />
								</IconButton>
							</Tooltip>
							<Tooltip
								componentsProps={{
									tooltip: {
										sx: {
											backgroundColor: mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[700],
											opacity: 0.9,
										},
									},
								}}
								title="Eliminar"
							>
								<IconButton
									color="error"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										handleOpenDeleteModal(row.original._id);
									}}
								>
									<Trash variant="Bulk" />
								</IconButton>
							</Tooltip>
							{!row.original.folderId && (
								<Tooltip
									componentsProps={{
										tooltip: {
											sx: {
												backgroundColor: mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[700],
												opacity: 0.9,
											},
										},
									}}
									title="Vincular a Carpeta"
								>
									<IconButton
										color="warning"
										onClick={(e: MouseEvent<HTMLButtonElement>) => {
											e.stopPropagation();
											setSelectedCalculationId(row.original._id);
											setLinkModalOpen(true);
										}}
									>
										<Link21 variant="Bulk" />
									</IconButton>
								</Tooltip>
							)}
							<Tooltip
								componentsProps={{
									tooltip: {
										sx: {
											backgroundColor: mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[700],
											opacity: 0.9,
										},
									},
								}}
								title="Más acciones"
							>
								<IconButton
									color="secondary"
									onClick={(e: MouseEvent<HTMLButtonElement>) => handleOpenActionMenu(e, row.original)}
								>
									<More variant="Bulk" />
								</IconButton>
							</Tooltip>
						</Stack>
					);
				},
			},
		],
		[theme, mode, expandedRowId, handleToggleExpanded, keepUpdatedLoading, handleKeepUpdatedChange],
	) as Column<CalculatorData>[];

	const renderRowSubComponent = useCallback(
		({ row }: { row: Row<CalculatorData> }) => (
			<Stack direction="row" justifyContent="flex-end" sx={{ width: "100%" }}>
				<Box sx={{ width: "100%" }}>
					<CalculationDetails
						data={row.original}
						onKeepUpdatedChange={handleKeepUpdatedChange}
						isKeepUpdatedLoading={keepUpdatedLoading === row.original._id}
						openEmailModal={triggerEmailForRow === row.original._id}
						onEmailModalClose={() => setTriggerEmailForRow(null)}
						triggerPrint={triggerPrintForRow === row.original._id}
						onPrintComplete={() => setTriggerPrintForRow(null)}
					/>
				</Box>
			</Stack>
		),
		[handleKeepUpdatedChange, keepUpdatedLoading, triggerEmailForRow, triggerPrintForRow],
	);

	return (
		<MainCard content={false} title={"Cáculos Laborales Guardados"}>
			<ScrollX>
				<ReactTable
					columns={columns}
					data={selectedCalculators}
					handleAdd={handleAdd}
					renderRowSubComponent={renderRowSubComponent}
					isLoading={isLoader}
					expandedRowId={expandedRowId}
					onToggleExpanded={handleToggleExpanded}
				/>
			</ScrollX>
			<AlertCalculatorDelete id={calculatorIdToDelete} open={deleteModalOpen} handleClose={handleCloseDeleteModal} />
			{/* add customer dialog */}
			<LinkCauseModal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} calculationId={selectedCalculationId} />
			<Dialog
				maxWidth="sm"
				TransitionComponent={PopupTransition}
				keepMounted
				fullWidth
				onClose={handleAdd}
				open={add}
				sx={{ "& .MuiDialog-paper": { p: 0 }, transition: "transform 225ms" }}
				aria-describedby="alert-dialog-slide-description"
			></Dialog>

			{/* Menú de acciones */}
			<Menu
				anchorEl={actionMenuAnchor}
				open={Boolean(actionMenuAnchor)}
				onClose={handleCloseActionMenu}
				onClick={(e) => e.stopPropagation()}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
			>
				<MenuItem onClick={handleCopyToClipboard}>
					<ListItemIcon>
						<Copy size={18} />
					</ListItemIcon>
					<ListItemText>Copiar al portapapeles</ListItemText>
				</MenuItem>
				{selectedRowData &&
				selectedRowData.type === "Calculado" &&
				((selectedRowData.interest ?? 0) > 0 ||
					(selectedRowData.variables?.interesTotal ?? 0) > 0 ||
					(selectedRowData.variables?.calculatedInterest ?? 0) > 0) && (
					<MenuItem
						onClick={() => {
							if (selectedRowData) {
								handleKeepUpdatedChange(selectedRowData._id, !selectedRowData.keepUpdated);
								handleCloseActionMenu();
							}
						}}
						disabled={keepUpdatedLoading === selectedRowData?._id}
					>
						<ListItemIcon>
							{keepUpdatedLoading === selectedRowData?._id ? (
								<CircularProgress size={18} />
							) : (
								<Refresh size={18} />
							)}
						</ListItemIcon>
						<ListItemText>
							{selectedRowData?.keepUpdated ? "Desactivar actualización automática" : "Activar actualización automática"}
						</ListItemText>
					</MenuItem>
				)}
			</Menu>
		</MainCard>
	);
};

export default SavedLabor;
