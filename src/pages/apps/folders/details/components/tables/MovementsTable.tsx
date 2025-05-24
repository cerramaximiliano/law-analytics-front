import React, { useMemo, useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
	TablePagination,
	Chip,
	Stack,
	IconButton,
	Tooltip,
	Link,
	Box,
	Checkbox,
	Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Edit, Trash, Eye, Link2, DocumentText, Judge, NotificationStatus, Status, Clock } from "iconsax-react";
import { Movement } from "types/movements";
import { format, parse, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { visuallyHidden } from "@mui/utils";

interface MovementsTableProps {
	movements: Movement[];
	searchQuery: string;
	onEdit: (movement: Movement) => void;
	onDelete: (id: string) => void;
	onView: (movement: Movement) => void;
	filters?: any;
}

type Order = "asc" | "desc";

interface HeadCell {
	id: keyof Movement | "actions";
	label: string;
	numeric: boolean;
	width?: string | number;
}

const headCells: HeadCell[] = [
	{ id: "time", label: "Fecha", numeric: false, width: "120px" },
	{ id: "title", label: "Título", numeric: false },
	{ id: "movement", label: "Tipo", numeric: false, width: "150px" },
	{ id: "description", label: "Descripción", numeric: false },
	{ id: "dateExpiration", label: "Vencimiento", numeric: false, width: "120px" },
	{ id: "link", label: "Documento", numeric: false, width: "100px" },
	{ id: "actions", label: "Acciones", numeric: false, width: "120px" },
];

const getMovementIcon = (movement?: string) => {
	switch (movement) {
		case "Escrito-Actor":
		case "Escrito-Demandado":
			return <DocumentText size={16} />;
		case "Despacho":
			return <Judge size={16} />;
		case "Cédula":
		case "Oficio":
			return <NotificationStatus size={16} />;
		case "Evento":
			return <Status size={16} />;
		default:
			return <DocumentText size={16} />;
	}
};

const getMovementColor = (movement?: string): "success" | "error" | "secondary" | "primary" | "warning" | "default" => {
	switch (movement) {
		case "Escrito-Actor":
			return "success";
		case "Escrito-Demandado":
			return "error";
		case "Despacho":
			return "secondary";
		case "Cédula":
		case "Oficio":
			return "primary";
		case "Evento":
			return "warning";
		default:
			return "default";
	}
};

const parseDate = (dateString: string) => {
	try {
		// Try to parse as ISO date first
		if (dateString.includes('T') || dateString.includes('-')) {
			const parsedDate = parseISO(dateString);
			if (isValid(parsedDate)) {
				return parsedDate;
			}
		}
		
		// Try to parse as DD/MM/YYYY format
		const parsedDate = parse(dateString, "dd/MM/yyyy", new Date());
		if (isValid(parsedDate)) {
			return parsedDate;
		}
		
		return new Date(0);
	} catch {
		return new Date(0);
	}
};

const formatDate = (dateString: string) => {
	try {
		let parsedDate: Date;
		
		// Try to parse as ISO date first
		if (dateString.includes('T') || dateString.includes('-')) {
			parsedDate = parseISO(dateString);
			if (isValid(parsedDate)) {
				return format(parsedDate, "dd/MM/yyyy", { locale: es });
			}
		}
		
		// Try to parse as DD/MM/YYYY format
		parsedDate = parse(dateString, "dd/MM/yyyy", new Date());
		if (isValid(parsedDate)) {
			return format(parsedDate, "dd/MM/yyyy", { locale: es });
		}
		
		return dateString;
	} catch {
		return dateString;
	}
};

const MovementsTable: React.FC<MovementsTableProps> = ({ movements, searchQuery, onEdit, onDelete, onView, filters = {} }) => {
	const [order, setOrder] = useState<Order>("desc");
	const [orderBy, setOrderBy] = useState<keyof Movement>("time");
	const [selected, setSelected] = useState<string[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const handleRequestSort = (property: keyof Movement) => {
		const isAsc = orderBy === property && order === "asc";
		setOrder(isAsc ? "desc" : "asc");
		setOrderBy(property);
	};

	const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			const newSelected = filteredMovements.map((n) => n._id!);
			setSelected(newSelected);
			return;
		}
		setSelected([]);
	};

	const handleClick = (id: string) => {
		const selectedIndex = selected.indexOf(id);
		let newSelected: string[] = [];

		if (selectedIndex === -1) {
			newSelected = newSelected.concat(selected, id);
		} else if (selectedIndex === 0) {
			newSelected = newSelected.concat(selected.slice(1));
		} else if (selectedIndex === selected.length - 1) {
			newSelected = newSelected.concat(selected.slice(0, -1));
		} else if (selectedIndex > 0) {
			newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
		}

		setSelected(newSelected);
	};

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const isSelected = (id: string) => selected.indexOf(id) !== -1;

	// Filter movements based on search query and filters
	const filteredMovements = useMemo(() => {
		let filtered = [...movements];

		// Apply search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(movement) =>
					movement.title?.toLowerCase().includes(query) ||
					movement.description?.toLowerCase().includes(query) ||
					movement.movement?.toLowerCase().includes(query),
			);
		}

		// Apply type filter
		if (filters.type) {
			filtered = filtered.filter((movement) => movement.movement === filters.type);
		}

		// Apply expiration filter
		if (filters.hasExpiration) {
			filtered = filtered.filter((movement) => {
				const hasExpiration = !!movement.dateExpiration;
				return filters.hasExpiration === "yes" ? hasExpiration : !hasExpiration;
			});
		}

		// Apply date range filter
		if (filters.startDate || filters.endDate) {
			filtered = filtered.filter((movement) => {
				const movementDate = parseDate(movement.time);
				if (filters.startDate && movementDate < filters.startDate) return false;
				if (filters.endDate && movementDate > filters.endDate) return false;
				return true;
			});
		}

		return filtered;
	}, [movements, searchQuery, filters]);

	// Sort movements
	const sortedMovements = useMemo(() => {
		return [...filteredMovements].sort((a, b) => {
			let aValue: any = a[orderBy];
			let bValue: any = b[orderBy];

			// Special handling for dates
			if (orderBy === "time" || orderBy === "dateExpiration") {
				aValue = aValue ? parseDate(aValue) : new Date(0);
				bValue = bValue ? parseDate(bValue) : new Date(0);
			}

			if (order === "desc") {
				return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
			} else {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			}
		});
	}, [filteredMovements, order, orderBy]);

	// Paginate movements
	const paginatedMovements = useMemo(() => {
		return sortedMovements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
	}, [sortedMovements, page, rowsPerPage]);

	return (
		<Box>
			<TableContainer>
				<Table sx={{ minWidth: 750 }} size="medium">
					<TableHead>
						<TableRow>
							<TableCell padding="checkbox">
								<Checkbox
									color="primary"
									indeterminate={selected.length > 0 && selected.length < filteredMovements.length}
									checked={filteredMovements.length > 0 && selected.length === filteredMovements.length}
									onChange={handleSelectAllClick}
								/>
							</TableCell>
							{headCells.map((headCell) => (
								<TableCell
									key={headCell.id}
									align={headCell.numeric ? "right" : "left"}
									sortDirection={orderBy === headCell.id ? order : false}
									sx={{ width: headCell.width }}
								>
									{headCell.id !== "actions" ? (
										<TableSortLabel
											active={orderBy === headCell.id}
											direction={orderBy === headCell.id ? order : "asc"}
											onClick={() => handleRequestSort(headCell.id as keyof Movement)}
										>
											{headCell.label}
											{orderBy === headCell.id ? (
												<Box component="span" sx={visuallyHidden}>
													{order === "desc" ? "sorted descending" : "sorted ascending"}
												</Box>
											) : null}
										</TableSortLabel>
									) : (
										headCell.label
									)}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{paginatedMovements.map((movement, index) => {
							const isItemSelected = isSelected(movement._id!);
							const labelId = `movement-table-checkbox-${index}`;

							return (
								<TableRow
									hover
									onClick={() => handleClick(movement._id!)}
									role="checkbox"
									aria-checked={isItemSelected}
									tabIndex={-1}
									key={movement._id}
									selected={isItemSelected}
									sx={{ cursor: "pointer" }}
								>
									<TableCell padding="checkbox">
										<Checkbox color="primary" checked={isItemSelected} inputProps={{ "aria-labelledby": labelId }} />
									</TableCell>
									<TableCell>{formatDate(movement.time)}</TableCell>
									<TableCell>
										<Typography variant="subtitle2" noWrap>
											{movement.title}
										</Typography>
									</TableCell>
									<TableCell>
										<Chip
											icon={getMovementIcon(movement.movement)}
											label={movement.movement}
											color={getMovementColor(movement.movement)}
											size="small"
											variant="outlined"
										/>
									</TableCell>
									<TableCell>
										<Typography variant="body2" color="textSecondary" sx={{ maxWidth: 300 }} noWrap>
											{movement.description || "-"}
										</Typography>
									</TableCell>
									<TableCell>
										{movement.dateExpiration ? (() => {
											const expirationDate = parseDate(movement.dateExpiration);
											const today = new Date();
											today.setHours(0, 0, 0, 0);
											const isExpired = expirationDate < today;
											const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
											const isNearExpiration = daysUntilExpiration >= 0 && daysUntilExpiration <= 7;
											
											return (
												<Stack direction="row" spacing={0.5} alignItems="center">
													<Chip 
														label={formatDate(movement.dateExpiration)} 
														color={isExpired ? "error" : isNearExpiration ? "warning" : "success"}
														size="small" 
														variant={isExpired ? "filled" : "outlined"}
														icon={
															isExpired ? 
															<Clock size={14} style={{ color: 'inherit' }} /> : 
															isNearExpiration ? 
															<Clock size={14} style={{ color: 'inherit' }} /> : 
															undefined
														}
														sx={{
															fontWeight: isExpired ? 600 : 500,
															'& .MuiChip-icon': {
																marginLeft: '4px',
																marginRight: '-2px'
															}
														}}
													/>
													{isExpired && (
														<Typography variant="caption" color="error" fontWeight={600}>
															Vencido
														</Typography>
													)}
													{isNearExpiration && !isExpired && (
														<Typography variant="caption" color="warning.main" fontWeight={500}>
															{daysUntilExpiration === 0 ? 'Hoy' : `${daysUntilExpiration}d`}
														</Typography>
													)}
												</Stack>
											);
										})() : (
											"-"
										)}
									</TableCell>
									<TableCell>
										{movement.link ? (
											<Link component={RouterLink} to={movement.link} underline="none" onClick={(e) => e.stopPropagation()}>
												<IconButton size="small" color="primary">
													<Link2 size={18} />
												</IconButton>
											</Link>
										) : (
											"-"
										)}
									</TableCell>
									<TableCell>
										<Stack direction="row" spacing={0.5}>
											<Tooltip title="Ver detalles">
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														onView(movement);
													}}
												>
													<Eye size={18} />
												</IconButton>
											</Tooltip>
											<Tooltip title="Editar">
												<IconButton
													size="small"
													color="primary"
													onClick={(e) => {
														e.stopPropagation();
														onEdit(movement);
													}}
												>
													<Edit size={18} />
												</IconButton>
											</Tooltip>
											<Tooltip title="Eliminar">
												<IconButton
													size="small"
													color="error"
													onClick={(e) => {
														e.stopPropagation();
														onDelete(movement._id!);
													}}
												>
													<Trash size={18} />
												</IconButton>
											</Tooltip>
										</Stack>
									</TableCell>
								</TableRow>
							);
						})}
						{paginatedMovements.length === 0 && (
							<TableRow>
								<TableCell colSpan={headCells.length + 1} align="center">
									<Typography variant="subtitle1" color="textSecondary" sx={{ py: 3 }}>
										No se encontraron movimientos
									</Typography>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
			<TablePagination
				rowsPerPageOptions={[5, 10, 25, 50]}
				component="div"
				count={filteredMovements.length}
				rowsPerPage={rowsPerPage}
				page={page}
				onPageChange={handleChangePage}
				onRowsPerPageChange={handleChangeRowsPerPage}
				labelRowsPerPage="Filas por página:"
				labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
			/>
		</Box>
	);
};

export default MovementsTable;
