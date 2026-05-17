import React from "react";
import { useCallback, useEffect, useMemo, useState, FC, Fragment, MouseEvent, useRef } from "react";
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
import ScrollX from "components/ScrollX";
import IconButton from "components/@extended/IconButton";
import { PopupTransition } from "components/@extended/Transitions";
import { HeaderSort, SortingSelect, TablePagination, TableRowSelection } from "components/third-party/ReactTable";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { CSVLink } from "react-csv";
import AlertCalculatorDelete from "./AlertCalculatorDelete";
import { renderFilterTypes, GlobalFilter } from "utils/react-table";
import { CalculationDetailsView } from "components/calculator/CalculationDetailsView";

// assets
import { Add, Eye, Trash, DocumentDownload, Refresh, Copy, Sms, Printer, Link21, More, Coin } from "iconsax-react";

// types
import { ThemeMode } from "types/config";
import { getCalculatorsByFilter, clearSelectedCalculators, updateCalculator } from "store/reducers/calculator";
import { openSnackbar } from "store/reducers/snackbar";
import LinkCauseModal from "sections/forms/wizard/calc-laboral/components/linkCauseModal";
import { useTeam } from "contexts/TeamContext";

// ==============================|| REACT TABLE ||============================== //

interface CalculatorData {
	_id: string;
	date: string;
	folderName?: string;
	folderId?: string;
	type: string;
	subClassType: string;
	amount: number;
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
	customLabel?: string;
	formatType?: string;
}

interface GroupedResults {
	detalles: ResultItem[];
	calculos: ResultItem[];
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
	// Handler para el cambio de keepUpdated
	const handleKeepUpdatedChange = (keepUpdated: boolean) => {
		if (onKeepUpdatedChange) {
			onKeepUpdatedChange(data._id, keepUpdated);
		}
	};

	// Función para obtener etiquetas personalizadas o claves directamente
	const getLabelForKey = (key: string, customLabel?: string): string => {
		if (customLabel) {
			return customLabel;
		}
		return key;
	};

	const formatValue = (key: string, value: number | string, formatType?: string): string => {
		// Formato específico según el tipo indicado
		if (formatType === "percentage") {
			const numValue = Number(value);
			if (!isNaN(numValue)) {
				return `${(numValue * 100).toFixed(2)}%`;
			}
		} else if (formatType === "plainNumber") {
			const numValue = Number(value);
			if (!isNaN(numValue)) {
				return numValue.toString();
			}
		}

		// Para valores especiales que NO deberían tener formato monetario
		if (key === "valorInicial" || key === "valorFinal") {
			const numValue = Number(value);
			if (!isNaN(numValue)) {
				return numValue.toFixed(6); // Mostrar con 6 decimales sin formato de moneda
			}
		}

		// Formatos por defecto según la clave
		if (key === "fechaInicial" || key === "fechaFinal") {
			const date = dayjs(value);
			if (date.isValid()) {
				return date.format("DD/MM/YYYY");
			}
			return String(value);
		}

		// Para valores monetarios (por defecto)
		if (typeof value === "number" || !isNaN(Number(value))) {
			const numValue = Number(value);
			if (!isNaN(numValue)) {
				return new Intl.NumberFormat("es-AR", {
					style: "currency",
					currency: "ARS",
				}).format(numValue);
			}
		}

		return String(value);
	};

	// Función para generar texto plano
	const generatePlainText = () => {
		let text = "Liquidación de Intereses\n\n";

		const groupedData = data?.variables?.calculationResult || groupResults(data?.variables);

		// Usar una aserción de tipo para ayudar a TypeScript a entender la estructura
		Object.entries(groupedData as Record<string, ResultItem[]>).forEach(([group, items]) => {
			if (items && items.length) {
				text += `${getGroupTitle(group).toUpperCase()}\n`;
				items.forEach((item: ResultItem) => {
					text += `${getLabelForKey(item.key, item.customLabel)}: ${formatValue(item.key, item.value, item.formatType)}\n`;
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
			</style>
		`;

		const renderCard = (title: string, items: ResultItem[], showSubtotal = false) => {
			if (!items.length) return "";

			const formatCurrency = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);

			const rows = items
				.map(
					(item) => `
				<tr>
					<td class="label">${getLabelForKey(item.key, item.customLabel)}:</td>
					<td class="value">${formatValue(item.key, item.value, item.formatType)}</td>
				</tr>`,
				)
				.join("");

			// Calcular subtotal si es necesario
			let subtotalHtml = "";
			if (showSubtotal) {
				const subtotal = items.reduce((sum, item) => {
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

		const groupedData = data?.variables?.calculationResult || groupResults(data?.variables);

		// Generar secciones de tarjetas para cada grupo
		let cardsHtml = "";
		Object.entries(groupedData as Record<string, ResultItem[]>).forEach(([group, items]) => {
			if (items && items.length) {
				const title = getGroupTitle(group);
				cardsHtml += renderCard(title.toUpperCase(), items);
			}
		});

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
				<div class="card-header">INTERESES</div>
				<div class="card-content">
					<table class="data-table">
						${segmentsHtml}
						<tr style="background: #f5f5f5;">
							<td class="label" style="font-weight: bold; border-top: 2px solid #ddd; padding-top: 12px;">Subtotal:</td>
							<td class="value" style="font-weight: bold; color: #1976d2; border-top: 2px solid #ddd; padding-top: 12px;">${formatCurrency(
								totalInterest,
							)}</td>
						</tr>
					</table>
				</div>
			</div>`;
		}

		// Usar el monto actualizado si está disponible
		const finalAmount = data.keepUpdated && data.lastUpdate?.amount ? data.lastUpdate.amount : data.amount;
		const totalFormatted = new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
		}).format(finalAmount);

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
							<h1>Liquidación de Intereses</h1>
						</div>
						${cardsHtml}
						${keepUpdatedHtml}
						<div class="total-card">
							<table class="total-table">
								<tr>
									<td class="total-label">CAPITAL ACTUALIZADO</td>
									<td class="total-value">${totalFormatted}</td>
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

	// Función para obtener el título del grupo
	const getGroupTitle = (groupKey: string): string => {
		const titles: Record<string, string> = {
			detalles: "Detalles del Cálculo",
			calculos: "Metodología de Cálculo",
			intereses: "Resultados",
		};
		return titles[groupKey] || groupKey;
	};

	const groupResults = (variables: Record<string, any> | undefined): GroupedResults => {
		const groups: GroupedResults = {
			detalles: [],
			calculos: [],
			intereses: [],
		};

		if (!variables) return groups;

		// Si ya tenemos un resultado precalculado
		if (variables.calculationResult) {
			const result = { ...variables.calculationResult } as GroupedResults;

			// Mover folderName, reclamante y reclamado de intereses a detalles si están en el grupo incorrecto
			if (result.intereses && result.intereses.length > 0) {
				const keysToMove = ["folderName", "reclamante", "reclamado"];
				const itemsToMove: ResultItem[] = [];
				result.intereses = result.intereses.filter((item) => {
					if (keysToMove.includes(item.key)) {
						itemsToMove.push(item);
						return false;
					}
					return true;
				});

				if (itemsToMove.length > 0) {
					if (!result.detalles) {
						result.detalles = [];
					}
					// Agregar al inicio de detalles
					result.detalles = [...itemsToMove, ...result.detalles];
				}
			}

			return result;
		}

		// De lo contrario, intentamos agrupar los datos
		// Agregamos datos básicos
		if (variables.tasa) {
			groups.detalles.push({
				key: "tasa",
				value: variables.tasa,
				customLabel: "Tipo de Tasa",
			});
		}
		if (variables.fechaInicial) {
			groups.detalles.push({
				key: "fechaInicial",
				value: variables.fechaInicial,
				customLabel: "Fecha Inicial",
			});
		}
		if (variables.fechaFinal) {
			groups.detalles.push({
				key: "fechaFinal",
				value: variables.fechaFinal,
				customLabel: "Fecha Final",
			});
		}
		if (variables.capital) {
			groups.detalles.push({
				key: "capital",
				value: variables.capital,
				customLabel: "Capital",
			});
		}

		// Agregamos datos de interés
		if (variables.tasasResult) {
			if (variables.tasasResult.resultado !== undefined) {
				groups.calculos.push({
					key: "coeficiente",
					value: variables.tasasResult.resultado,
					customLabel: "Coeficiente de Tasa",
					formatType: "percentage",
				});

				// Calcular intereses
				const capitalBase = typeof variables.capital === "number" ? variables.capital : parseFloat(variables.capital || "0");
				const coeficiente = variables.tasasResult.resultado || 0;
				const interesesCalculados = capitalBase * coeficiente;

				// Agregar resultados
				groups.intereses.push({
					key: "capitalBase",
					value: capitalBase,
					customLabel: "Capital",
				});
				groups.intereses.push({
					key: "interesCalculado",
					value: interesesCalculados,
					customLabel: "Intereses",
				});
				groups.intereses.push({
					key: "capitalActualizado",
					value: capitalBase + interesesCalculados,
					customLabel: "Capital Actualizado",
				});
			}
		}

		return groups;
	};

	return (
		<CalculationDetailsView
			data={data}
			getLabelForKey={getLabelForKey}
			formatValue={formatValue}
			groupResults={groupResults}
			generateHtmlContent={generateHtmlContent}
			generatePlainText={generatePlainText}
			customTitle="Liquidación de Intereses - Law||Analytics"
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

	const isDark = theme.palette.mode === "dark";
	const [overflowAnchor, setOverflowAnchor] = useState<null | HTMLElement>(null);
	const csvLinkRef = useRef<any>(null);
	const totalColumns = (headerGroups[0]?.headers?.length || 0) + 1;

	const tableSx = {
		"& .MuiTableHead-root .MuiTableCell-head": {
			fontSize: "0.7rem",
			fontWeight: 600,
			letterSpacing: "0.1em",
			textTransform: "uppercase",
			color: "text.secondary",
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
			py: 1.5,
			"&:not(:last-of-type):after": {
				backgroundColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.1),
			},
		},
		"& .MuiTableBody-root .MuiTableCell-root": {
			py: 1.5,
			fontVariantNumeric: "tabular-nums",
			letterSpacing: "-0.005em",
		},
	} as const;

	const brandedInputSx = {
		"& .MuiOutlinedInput-notchedOutline": {
			borderColor: alpha(BRAND_BLUE, isDark ? 0.26 : 0.16),
			transition: "border-color 0.15s ease",
		},
		"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
			borderColor: alpha(BRAND_BLUE, isDark ? 0.46 : 0.32),
		},
		"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
			borderColor: alpha(BRAND_BLUE, 0.55),
			borderWidth: 1,
		},
		"& .MuiIconButton-root": {
			borderColor: alpha(BRAND_BLUE, isDark ? 0.26 : 0.16),
			color: BRAND_BLUE,
			"&:hover": {
				borderColor: alpha(BRAND_BLUE, isDark ? 0.46 : 0.32),
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.06),
			},
		},
	} as const;

	return (
		<>
			<TableRowSelection selected={Object.keys(selectedRowIds).length} />
			<Stack spacing={2}>
				<Stack
					direction={matchDownSM ? "column" : "row"}
					spacing={1.5}
					justifyContent="space-between"
					alignItems={matchDownSM ? "stretch" : "center"}
					flexWrap="wrap"
					useFlexGap
				>
					<Box sx={{ width: { xs: "100%", sm: 240 }, ...brandedInputSx }}>
						<CustomGlobalFilter
							preGlobalFilteredRows={preGlobalFilteredRows}
							globalFilter={globalFilter}
							setGlobalFilter={setGlobalFilter}
						/>
					</Box>
					<Box sx={{ width: { xs: "100%", sm: 220 }, ...brandedInputSx }}>
						<CustomSortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
					</Box>
					<Box sx={{ flex: 1 }} />

					<Tooltip title="Más opciones" arrow placement="top">
						<IconButton
							size="small"
							onClick={(e) => setOverflowAnchor(e.currentTarget)}
							sx={{
								color: "text.secondary",
								transition: "background-color 0.15s ease, color 0.15s ease",
								"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08), color: BRAND_BLUE },
							}}
						>
							<More variant="Bulk" size={20} />
						</IconButton>
					</Tooltip>

					<CSVLink
						ref={csvLinkRef}
						data={selectedFlatRows.length > 0 ? selectedFlatRows.map((d: Row<CalculatorData>) => d.original) : data}
						filename={"calculos-intereses.csv"}
						style={{ display: "none" }}
					/>
					<Menu
						anchorEl={overflowAnchor}
						open={Boolean(overflowAnchor)}
						onClose={() => setOverflowAnchor(null)}
						anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
						transformOrigin={{ vertical: "top", horizontal: "right" }}
						slotProps={{ paper: { sx: { minWidth: 200 } } }}
					>
						<MenuItem
							onClick={() => {
								setOverflowAnchor(null);
								csvLinkRef.current?.link?.click();
							}}
						>
							<ListItemIcon>
								<DocumentDownload variant="Bulk" size={18} />
							</ListItemIcon>
							<ListItemText>Exportar CSV</ListItemText>
						</MenuItem>
					</Menu>
				</Stack>

				<Table {...getTableProps()} sx={tableSx}>
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
								{Array.from({ length: 8 }).map((_, rowIndex) => (
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
															transition: "background-color 0.15s ease",
															bgcolor: row.isSelected || isRowExpanded ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) : "inherit",
															"&:hover": {
																bgcolor:
																	row.isSelected || isRowExpanded
																		? alpha(BRAND_BLUE, isDark ? 0.18 : 0.11)
																		: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
															},
														}}
													>
														{row.cells.map((cell: Cell<CalculatorData>) => (
															<TableCell {...cell.getCellProps([{ className: cell.column.className }])}>{cell.render("Cell")}</TableCell>
														))}
													</TableRow>
													<TableRow sx={{ "&:hover": { bgcolor: "inherit !important" } }}>
														<TableCell colSpan={totalColumns} sx={{ p: 0, border: 0 }}>
															<Collapse in={isRowExpanded} timeout="auto" unmountOnExit>
																<Box
																	sx={{
																		mx: 2,
																		my: 1.5,
																		borderRadius: 1.5,
																		bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
																		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
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
											<TableCell sx={{ p: 2, py: 3, border: 0 }} colSpan={totalColumns}>
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
									<TableRow>
										<TableCell colSpan={totalColumns} sx={{ p: 0, border: 0 }}>
											<Box
												sx={{
													position: "relative",
													overflow: "hidden",
													width: "100%",
													py: { xs: 3.5, sm: 4.5 },
													px: 2,
												}}
											>
												<Box
													aria-hidden
													sx={{
														position: "absolute",
														inset: 0,
														background: `radial-gradient(circle at 50% 40%, ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.07)} 0%, transparent 60%)`,
														pointerEvents: "none",
														zIndex: 0,
													}}
												/>
												<Stack
													spacing={2}
													alignItems="center"
													sx={{ position: "relative", zIndex: 1, maxWidth: 440, mx: "auto", textAlign: "center" }}
												>
													<Box
														sx={{
															display: "inline-flex",
															alignItems: "center",
															px: 1.25,
															py: 0.4,
															borderRadius: 1,
															bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
															border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
														}}
													>
														<Typography
															sx={{
																fontSize: "0.68rem",
																fontWeight: 600,
																letterSpacing: "0.14em",
																textTransform: "uppercase",
																color: BRAND_BLUE,
															}}
														>
															Sin cálculos
														</Typography>
													</Box>
													<Box
														sx={{
															width: 80,
															height: 80,
															borderRadius: "50%",
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
															color: BRAND_BLUE,
														}}
													>
														<Coin size={40} variant="Bulk" />
													</Box>
													<Stack spacing={0.75} alignItems="center">
														<Typography
															sx={{
																fontSize: "1.05rem",
																fontWeight: 600,
																letterSpacing: "-0.015em",
																color: "text.primary",
															}}
														>
															Todavía no hay cálculos de intereses
														</Typography>
														<Typography
															sx={{
																fontSize: "0.85rem",
																color: "text.secondary",
																lineHeight: 1.55,
																maxWidth: 360,
																textWrap: "pretty",
															}}
														>
															Hacé un cálculo en la tab Cálculo de intereses y guardalo desde la pantalla de resultados.
														</Typography>
													</Stack>
												</Stack>
											</Box>
										</TableCell>
									</TableRow>
								)}
							</>
						)}
					</TableBody>
				</Table>
			</Stack>
		</>
	);
}

const SavedIntereses = () => {
	const theme = useTheme();
	const mode = theme.palette.mode;
	const { selectedCalculators, isLoader } = useSelector((state: any) => state.calculator);
	const auth = useSelector((state: any) => state.auth);
	const userId = auth.user?._id;
	const { activeTeam, isTeamMode, isInitialized: isTeamInitialized, canDelete } = useTeam();

	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [selectedCalculationId, setSelectedCalculationId] = useState("");

	const [open, setOpen] = useState<boolean>(false);
	const [customer, setCustomer] = useState<any>(null);
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

		// Esperar a que el TeamContext esté inicializado
		if (!isTeamInitialized) {
			return;
		}

		// Si está en modo equipo pero aún no hay equipo activo, esperar
		if (isTeamMode && !activeTeam?._id) {
			return;
		}

		// Usar setTimeout para retrasar la primera ejecución y evitar conflictos
		const timeoutId = setTimeout(
			() => {
				if (isMountedRef.current) {
					// getCalculatorsByFilter ya maneja la lógica de cache internamente
					if (isTeamMode && activeTeam?._id) {
						dispatch(
							getCalculatorsByFilter({
								groupId: activeTeam._id,
								type: "Calculado",
								classType: "intereses",
							}),
						);
					} else if (userId) {
						dispatch(
							getCalculatorsByFilter({
								userId,
								type: "Calculado",
								classType: "intereses",
							}),
						);
					}
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
	}, [userId, isTeamMode, activeTeam?._id, isTeamInitialized]); // Incluir dependencias de equipo

	const handleDeleteDialogClose = () => {
		setOpen(false);
		setCalculatorIdToDelete("");
	};

	const handleAdd = () => {
		setAdd(!add);
		if (customer && !add) setCustomer(null);
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
						message: keepUpdated ? "Actualización automática de intereses activada" : "Actualización automática de intereses desactivada",
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

	// Generar texto plano para copiar
	const generatePlainTextForRow = (data: CalculatorData) => {
		let text = "LIQUIDACIÓN DE INTERESES\n\n";
		const groupedData = data?.variables?.calculationResult || groupResultsForRow(data?.variables);

		Object.entries(groupedData as Record<string, ResultItem[]>).forEach(([group, items]) => {
			if (items && items.length) {
				text += `${getGroupTitleStatic(group).toUpperCase()}\n`;
				items.forEach((item: ResultItem) => {
					text += `${item.customLabel || item.key}: ${formatValueStatic(item.key, item.value, item.formatType)}\n`;
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
		text += `CAPITAL ACTUALIZADO: ${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(finalAmount)}`;

		return text;
	};

	// Función para agrupar resultados (versión estática)
	const groupResultsForRow = (variables: Record<string, any> | undefined): GroupedResults => {
		const groups: GroupedResults = {
			detalles: [],
			calculos: [],
			intereses: [],
		};

		if (!variables) return groups;

		if (variables.tasa) groups.detalles.push({ key: "tasa", value: variables.tasa, customLabel: "Tipo de Tasa" });
		if (variables.fechaInicial) groups.detalles.push({ key: "fechaInicial", value: variables.fechaInicial, customLabel: "Fecha Inicial" });
		if (variables.fechaFinal) groups.detalles.push({ key: "fechaFinal", value: variables.fechaFinal, customLabel: "Fecha Final" });
		if (variables.capital) groups.detalles.push({ key: "capital", value: variables.capital, customLabel: "Capital" });

		return groups;
	};

	const getGroupTitleStatic = (groupKey: string): string => {
		const titles: Record<string, string> = {
			detalles: "Detalles del Cálculo",
			calculos: "Metodología de Cálculo",
			intereses: "Resultados",
		};
		return titles[groupKey] || groupKey;
	};

	const formatValueStatic = (key: string, value: number | string, formatType?: string): string => {
		if (formatType === "percentage") {
			const numValue = Number(value);
			if (!isNaN(numValue)) return `${(numValue * 100).toFixed(2)}%`;
		}
		if (key === "fechaInicial" || key === "fechaFinal") {
			const date = dayjs(value);
			if (date.isValid()) return date.format("DD/MM/YYYY");
		}
		if (typeof value === "number" || !isNaN(Number(value))) {
			const numValue = Number(value);
			if (!isNaN(numValue)) {
				return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(numValue);
			}
		}
		return String(value);
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
				Header: "Tipo de Tasa",
				accessor: "subClassType",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					// Mapeo de identificadores de tasa a nombres legibles
					const tasasMapping: Record<string, string> = {
						tasaPasivaBNA: "Tasa Pasiva BNA",
						tasaPasivaBCRA: "Tasa Pasiva BCRA",
						tasaActivaBNA: "Tasa Activa BNA",
						tasaActivaTnaBNA: "Tasa Activa TNA BNA",
						cer: "CER",
						icl: "ICL BCRA",
						tasaActivaCNAT2601: "Tasa Activa BNA - Acta 2601",
						tasaActivaCNAT2658: "Tasa Activa BNA - Acta 2658",
						tasaActivaCNAT2764: "Tasa Activa BNA - Acta 2764",
					};

					// Función para obtener un nombre legible de la tasa (soporta múltiples tasas separadas por coma)
					const getTasaLabel = (tasaValue: string): string => {
						if (!tasaValue) return "";
						// Si contiene coma, son múltiples tasas
						if (tasaValue.includes(",")) {
							const tasas = tasaValue.split(",").map((t) => t.trim());
							const labels = tasas.map((t) => tasasMapping[t] || t);
							return labels.join(" / ");
						}
						return tasasMapping[tasaValue] || tasaValue;
					};

					const label = getTasaLabel(row.original.subClassType);
					const isMultiple = row.original.subClassType?.includes(",");

					return (
						<Tooltip title={label} arrow>
							<Typography noWrap sx={{ maxWidth: isMultiple ? 180 : "auto" }}>
								{label}
							</Typography>
						</Tooltip>
					);
				},
			},
			{
				Header: "Capital",
				accessor: "amount",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					// Considerando que el monto total incluye capital + intereses, obtener el capital original
					let capital = row.original.amount;
					if (row.original.interest) {
						capital = row.original.amount - row.original.interest;
					} else if (row.original.variables?.capital) {
						capital =
							typeof row.original.variables.capital === "number"
								? row.original.variables.capital
								: parseFloat(row.original.variables.capital);
					}

					return (
						<Typography>
							{new Intl.NumberFormat("es-AR", {
								style: "currency",
								currency: "ARS",
							}).format(capital)}
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

					if (!row.original.interest) {
						// Si no hay interés registrado, buscamos en variables
						let interes = 0;
						if (row.original.variables?.tasasResult?.resultado && row.original.variables?.capital) {
							const capital =
								typeof row.original.variables.capital === "number"
									? row.original.variables.capital
									: parseFloat(row.original.variables.capital);
							const coef = row.original.variables.tasasResult.resultado;
							interes = capital * coef;
						}

						if (interes > 0) {
							return (
								<Typography fontWeight="500" color="success.main">
									{new Intl.NumberFormat("es-AR", {
										style: "currency",
										currency: "ARS",
									}).format(interes)}
								</Typography>
							);
						}

						return (
							<Button
								variant="contained"
								size="small"
								onClick={(e) => {
									e.stopPropagation();
								}}
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
							}).format(row.original.interest)}
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

					return (
						<Typography fontWeight="600">
							{new Intl.NumberFormat("es-AR", {
								style: "currency",
								currency: "ARS",
							}).format(row.original.amount)}
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
					const isDarkMode = theme.palette.mode === "dark";
					const collapseIcon = isExpanded ? <Add size={18} style={{ transform: "rotate(45deg)" }} /> : <Eye variant="Bulk" size={18} />;

					const actionIconSx = {
						color: "text.secondary",
						transition: "background-color 0.15s ease, color 0.15s ease",
						"&:hover:not(.Mui-disabled)": {
							bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.16 : 0.08),
							color: BRAND_BLUE,
						},
					} as const;
					const destructiveIconSx = {
						color: "text.secondary",
						transition: "background-color 0.15s ease, color 0.15s ease",
						"&:hover:not(.Mui-disabled)": {
							bgcolor: alpha(theme.palette.error.main, isDarkMode ? 0.18 : 0.1),
							color: theme.palette.error.main,
						},
					} as const;

					return (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0.25}>
							<Tooltip title="Ver detalles" arrow placement="top">
								<IconButton
									size="small"
									sx={actionIconSx}
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
							<Tooltip title="Imprimir" arrow placement="top">
								<IconButton
									size="small"
									sx={actionIconSx}
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										setSelectedRowData(row.original);
										setExpandedRowId(row.original._id);
										setTimeout(() => {
											setTriggerPrintForRow(row.original._id);
										}, 100);
									}}
								>
									<Printer variant="Bulk" size={18} />
								</IconButton>
							</Tooltip>
							<Tooltip title="Enviar por email" arrow placement="top">
								<IconButton
									size="small"
									sx={actionIconSx}
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										setSelectedRowData(row.original);
										setExpandedRowId(row.original._id);
										setTimeout(() => {
											setTriggerEmailForRow(row.original._id);
										}, 100);
									}}
								>
									<Sms variant="Bulk" size={18} />
								</IconButton>
							</Tooltip>
							{canDelete && (
								<Tooltip title="Eliminar" arrow placement="top">
									<IconButton
										size="small"
										sx={destructiveIconSx}
										onClick={(e: MouseEvent<HTMLButtonElement>) => {
											e.stopPropagation();
											setCalculatorIdToDelete(row.original._id);
											setOpen(true);
										}}
									>
										<Trash variant="Bulk" size={18} />
									</IconButton>
								</Tooltip>
							)}
							{!row.original.folderId && (
								<Tooltip title="Vincular a carpeta" arrow placement="top">
									<IconButton
										size="small"
										sx={actionIconSx}
										onClick={(e: MouseEvent<HTMLButtonElement>) => {
											e.stopPropagation();
											setSelectedCalculationId(row.original._id);
											setLinkModalOpen(true);
										}}
									>
										<Link21 variant="Bulk" size={18} />
									</IconButton>
								</Tooltip>
							)}
							<Tooltip title="Más acciones" arrow placement="top">
								<IconButton
									size="small"
									sx={actionIconSx}
									onClick={(e: MouseEvent<HTMLButtonElement>) => handleOpenActionMenu(e, row.original)}
								>
									<More variant="Bulk" size={18} />
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

	const isDark = theme.palette.mode === "dark";

	return (
		<Stack spacing={2}>
			{/* Header de sección brand-aware para esta tab */}
			<Stack spacing={0.625}>
				<Box
					sx={{
						display: "inline-flex",
						alignSelf: "flex-start",
						alignItems: "center",
						px: 1,
						py: 0.3,
						borderRadius: 0.75,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
					}}
				>
					<Typography
						sx={{
							fontSize: "0.62rem",
							fontWeight: 600,
							letterSpacing: "0.14em",
							textTransform: "uppercase",
							color: BRAND_BLUE,
							lineHeight: 1,
						}}
					>
						Cálculos guardados
					</Typography>
				</Box>
				<Typography
					sx={{
						fontSize: { xs: "1.1rem", sm: "1.25rem" },
						fontWeight: 600,
						letterSpacing: "-0.02em",
						lineHeight: 1.2,
						color: "text.primary",
					}}
				>
					Cálculos de intereses guardados
				</Typography>
				<Typography sx={{ fontSize: "0.875rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>
					Revisá, vinculá a carpetas, imprimí o eliminá los cálculos de intereses que hayas guardado.
				</Typography>
			</Stack>
			<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1) }} />

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

			<AlertCalculatorDelete id={calculatorIdToDelete} title={`Cálculo de Intereses`} open={open} handleClose={handleDeleteDialogClose} />
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

			<Menu
				anchorEl={actionMenuAnchor}
				open={Boolean(actionMenuAnchor)}
				onClose={handleCloseActionMenu}
				onClick={(e) => e.stopPropagation()}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				slotProps={{ paper: { sx: { minWidth: 240 } } }}
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
								{keepUpdatedLoading === selectedRowData?._id ? <CircularProgress size={18} /> : <Refresh size={18} />}
							</ListItemIcon>
							<ListItemText>
								{selectedRowData?.keepUpdated ? "Desactivar actualización automática" : "Activar actualización automática"}
							</ListItemText>
						</MenuItem>
					)}
			</Menu>
		</Stack>
	);
};

export default SavedIntereses;
