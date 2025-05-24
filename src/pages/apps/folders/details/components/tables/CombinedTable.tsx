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
	Avatar,
	Box,
	Checkbox,
	Typography,
	ToggleButton,
	ToggleButtonGroup,
} from "@mui/material";
import {
	Edit,
	Trash,
	Eye,
	TableDocument,
	NotificationStatus,
	Calendar,
	DocumentText,
	Judge,
	SmsNotification,
	Notification1,
	Clock,
	Filter,
} from "iconsax-react";
import { visuallyHidden } from "@mui/utils";
import { format, parseISO, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Movement } from "types/movements";
import { NotificationType } from "types/notifications";

// Unified activity type
export interface UnifiedActivity {
	id: string;
	title: string;
	date: Date;
	dateString: string;
	description?: string;
	type: "movement" | "notification" | "calendar";
	subType: string;
	expirationDate?: string;
	status?: string;
	link?: string;
	user?: string;
	originalData: Movement | NotificationType | any;
}

interface CombinedTableProps {
	movements: Movement[];
	notifications: NotificationType[];
	events: any[];
	searchQuery: string;
	onEdit: (activity: UnifiedActivity) => void;
	onDelete: (activity: UnifiedActivity) => void;
	onView: (activity: UnifiedActivity) => void;
}

type Order = "asc" | "desc";

interface HeadCell {
	id: keyof UnifiedActivity | "actions";
	label: string;
	numeric: boolean;
	width?: string | number;
}

const headCells: HeadCell[] = [
	{ id: "dateString", label: "Fecha", numeric: false, width: "120px" },
	{ id: "title", label: "Título", numeric: false },
	{ id: "type", label: "Origen", numeric: false, width: "120px" },
	{ id: "subType", label: "Tipo", numeric: false, width: "150px" },
	{ id: "description", label: "Descripción", numeric: false },
	{ id: "expirationDate", label: "Vencimiento", numeric: false, width: "120px" },
	{ id: "actions", label: "Acciones", numeric: false, width: "120px" },
];

const getActivityIcon = (activity: UnifiedActivity) => {
	switch (activity.type) {
		case "movement":
			switch (activity.subType) {
				case "Escrito-Actor":
				case "Escrito-Demandado":
					return <DocumentText size={16} />;
				case "Despacho":
					return <Judge size={16} />;
				case "Cédula":
				case "Oficio":
					return <NotificationStatus size={16} />;
				default:
					return <TableDocument size={16} />;
			}
		case "notification":
			switch (activity.subType) {
				case "Carta Documento":
				case "Telegrama":
					return <SmsNotification size={16} />;
				case "Cédula":
					return <Notification1 size={16} />;
				case "Notarial":
					return <NotificationStatus size={16} />;
				default:
					return <Notification1 size={16} />;
			}
		case "calendar":
			return activity.originalData.allDay ? <Calendar size={16} /> : <Clock size={16} />;
		default:
			return <TableDocument size={16} />;
	}
};

const getActivityColor = (activity: UnifiedActivity): "success" | "error" | "primary" | "secondary" | "warning" | "info" => {
	switch (activity.type) {
		case "movement":
			switch (activity.subType) {
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
					return "info";
			}
		case "notification":
			if (activity.subType === "Carta Documento" || activity.subType === "Telegrama") {
				return activity.user === "Actora" ? "success" : activity.user === "Demandada" ? "error" : "info";
			}
			switch (activity.subType) {
				case "Cédula":
					return "primary";
				case "Notarial":
					return "warning";
				default:
					return "secondary";
			}
		case "calendar":
			switch (activity.subType?.toLowerCase()) {
				case "audiencia":
					return "error";
				case "reunion":
					return "primary";
				case "vencimiento":
					return "warning";
				default:
					return "success";
			}
		default:
			return "info";
	}
};

const getTypeLabel = (type: string): string => {
	switch (type) {
		case "movement":
			return "Movimiento";
		case "notification":
			return "Notificación";
		case "calendar":
			return "Calendario";
		default:
			return type;
	}
};

const parseDate = (dateString: string): Date => {
	try {
		// Try DD/MM/YYYY format first
		const parsedDate = parse(dateString, "dd/MM/yyyy", new Date());
		if (isValid(parsedDate)) return parsedDate;

		// Try ISO format
		const isoDate = parseISO(dateString);
		if (isValid(isoDate)) return isoDate;

		return new Date(0);
	} catch {
		return new Date(0);
	}
};

const CombinedTable: React.FC<CombinedTableProps> = ({ movements, notifications, events, searchQuery, onEdit, onDelete, onView }) => {
	const [order, setOrder] = useState<Order>("desc");
	const [orderBy, setOrderBy] = useState<keyof UnifiedActivity>("date");
	const [selected, setSelected] = useState<string[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [filterType, setFilterType] = useState<string[]>(["movement", "notification", "calendar"]);

	const handleFilterChange = (_event: React.MouseEvent<HTMLElement>, newFilters: string[]) => {
		if (newFilters.length > 0) {
			setFilterType(newFilters);
		}
	};

	// Convert all data to unified format
	const unifiedData = useMemo(() => {
		const unified: UnifiedActivity[] = [];

		// Convert movements
		movements.forEach((movement) => {
			const date = parseDate(movement.time);
			unified.push({
				id: movement._id || "",
				title: movement.title || "",
				date,
				dateString: movement.time,
				description: movement.description,
				type: "movement",
				subType: movement.movement || "",
				expirationDate: movement.dateExpiration,
				link: movement.link,
				originalData: movement,
			});
		});

		// Convert notifications
		notifications.forEach((notification) => {
			const date = parseDate(notification.time || "");
			unified.push({
				id: notification._id || "",
				title: notification.title || "",
				date,
				dateString: notification.time || "",
				description: notification.description,
				type: "notification",
				subType: notification.notification || "",
				expirationDate: notification.dateExpiration,
				user: notification.user,
				originalData: notification,
			});
		});

		// Convert calendar events
		events.forEach((event) => {
			const date = typeof event.start === "string" ? parseISO(event.start) : event.start;
			unified.push({
				id: event._id || "",
				title: event.title || "",
				date,
				dateString: format(date, "dd/MM/yyyy", { locale: es }),
				description: event.description,
				type: "calendar",
				subType: event.type || "General",
				originalData: event,
			});
		});

		return unified;
	}, [movements, notifications, events]);

	const handleRequestSort = (property: keyof UnifiedActivity) => {
		const isAsc = orderBy === property && order === "asc";
		setOrder(isAsc ? "desc" : "asc");
		setOrderBy(property);
	};

	const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			const newSelected = filteredAndSortedData.map((n) => n.id);
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

	// Filter and sort data
	const filteredAndSortedData = useMemo(() => {
		let filtered = unifiedData.filter((activity) => filterType.includes(activity.type));

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(activity) =>
					activity.title.toLowerCase().includes(query) ||
					activity.description?.toLowerCase().includes(query) ||
					activity.subType.toLowerCase().includes(query),
			);
		}

		return filtered.sort((a, b) => {
			let aValue: any = a[orderBy];
			let bValue: any = b[orderBy];

			if (orderBy === "date") {
				aValue = a.date;
				bValue = b.date;
			}

			if (order === "desc") {
				return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
			} else {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			}
		});
	}, [unifiedData, filterType, searchQuery, order, orderBy]);

	// Paginate data
	const paginatedData = useMemo(() => {
		return filteredAndSortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
	}, [filteredAndSortedData, page, rowsPerPage]);

	return (
		<Box>
			{/* Filter buttons */}
			<Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
				<ToggleButtonGroup value={filterType} onChange={handleFilterChange} aria-label="filter type" size="small">
					<ToggleButton value="movement" aria-label="movements">
						<Stack direction="row" spacing={0.5} alignItems="center">
							<TableDocument size={18} />
							<Typography variant="body2">Movimientos ({movements.length})</Typography>
						</Stack>
					</ToggleButton>
					<ToggleButton value="notification" aria-label="notifications">
						<Stack direction="row" spacing={0.5} alignItems="center">
							<NotificationStatus size={18} />
							<Typography variant="body2">Notificaciones ({notifications.length})</Typography>
						</Stack>
					</ToggleButton>
					<ToggleButton value="calendar" aria-label="calendar">
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Calendar size={18} />
							<Typography variant="body2">Calendario ({events.length})</Typography>
						</Stack>
					</ToggleButton>
				</ToggleButtonGroup>
			</Box>

			<TableContainer>
				<Table sx={{ minWidth: 750 }} size="medium">
					<TableHead>
						<TableRow>
							<TableCell padding="checkbox">
								<Checkbox
									color="primary"
									indeterminate={selected.length > 0 && selected.length < filteredAndSortedData.length}
									checked={filteredAndSortedData.length > 0 && selected.length === filteredAndSortedData.length}
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
											onClick={() => handleRequestSort(headCell.id as keyof UnifiedActivity)}
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
						{paginatedData.map((activity, index) => {
							const isItemSelected = isSelected(activity.id);
							const labelId = `combined-table-checkbox-${index}`;

							return (
								<TableRow
									hover
									onClick={() => handleClick(activity.id)}
									role="checkbox"
									aria-checked={isItemSelected}
									tabIndex={-1}
									key={activity.id}
									selected={isItemSelected}
									sx={{ cursor: "pointer" }}
								>
									<TableCell padding="checkbox">
										<Checkbox color="primary" checked={isItemSelected} inputProps={{ "aria-labelledby": labelId }} />
									</TableCell>
									<TableCell>{activity.dateString}</TableCell>
									<TableCell>
										<Typography variant="subtitle2" noWrap>
											{activity.title}
										</Typography>
									</TableCell>
									<TableCell>
										<Chip
											icon={<Filter size={14} />}
											label={getTypeLabel(activity.type)}
											color={activity.type === "movement" ? "primary" : activity.type === "notification" ? "secondary" : "success"}
											size="small"
											variant="outlined"
										/>
									</TableCell>
									<TableCell>
										<Stack direction="row" spacing={1} alignItems="center">
											<Avatar
												sx={{
													width: 24,
													height: 24,
													bgcolor: `${getActivityColor(activity)}.lighter`,
													color: `${getActivityColor(activity)}.main`,
												}}
											>
												{getActivityIcon(activity)}
											</Avatar>
											<Typography variant="body2">{activity.subType}</Typography>
										</Stack>
									</TableCell>
									<TableCell>
										<Typography variant="body2" color="textSecondary" sx={{ maxWidth: 300 }} noWrap>
											{activity.description || "-"}
										</Typography>
									</TableCell>
									<TableCell>
										{activity.expirationDate ? (
											<Chip label={activity.expirationDate} color="warning" size="small" variant="outlined" />
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
														onView(activity);
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
														onEdit(activity);
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
														onDelete(activity);
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
						{paginatedData.length === 0 && (
							<TableRow>
								<TableCell colSpan={headCells.length + 1} align="center">
									<Typography variant="subtitle1" color="textSecondary" sx={{ py: 3 }}>
										No se encontraron actividades
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
				count={filteredAndSortedData.length}
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

export default CombinedTable;
