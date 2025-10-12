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
	Typography,
	useTheme,
} from "@mui/material";
import { Edit, Trash, Eye, Clock, CalendarTick, Calendar1 } from "iconsax-react";
import { visuallyHidden } from "@mui/utils";
import dayjs from "utils/dayjs-config";

interface CalendarEvent {
	_id: string;
	title: string;
	description?: string;
	start: string | Date;
	end?: string | Date;
	type?: string;
	allDay?: boolean;
	extendedProps?: any;
}

interface CalendarTableProps {
	events: CalendarEvent[];
	searchQuery: string;
	onEdit: (event: CalendarEvent) => void;
	onDelete: (id: string) => void;
	onView: (event: CalendarEvent) => void;
}

type Order = "asc" | "desc";

interface HeadCell {
	id: keyof CalendarEvent | "duration" | "actions";
	label: string;
	numeric: boolean;
	width?: string | number;
}

const headCells: HeadCell[] = [
	{ id: "start", label: "Fecha", numeric: false, width: "150px" },
	{ id: "title", label: "Título", numeric: false },
	{ id: "type", label: "Tipo", numeric: false, width: "120px" },
	{ id: "description", label: "Descripción", numeric: false },
	{ id: "duration", label: "Duración", numeric: false, width: "120px" },
	{ id: "actions", label: "Acciones", numeric: false, width: "120px" },
];

const getEventTypeColor = (type?: string): "primary" | "secondary" | "success" | "warning" | "error" | "info" => {
	switch (type?.toLowerCase()) {
		case "audiencia":
			return "error";
		case "reunion":
			return "primary";
		case "vencimiento":
			return "warning";
		case "recordatorio":
			return "info";
		case "mediacion":
			return "secondary";
		default:
			return "success";
	}
};

const formatDateOnly = (date: string | Date | undefined | null): string => {
	if (!date) return "-";

	try {
		const parsed = dayjs(date);
		if (!parsed.isValid()) return "-";

		return parsed.format("DD/MM/YYYY");
	} catch {
		return "-";
	}
};

const calculateDuration = (start: string | Date, end?: string | Date): string => {
	if (!end) return "Todo el día";

	try {
		const startDate = dayjs(start).toDate();
		const endDate = dayjs(end).toDate();

		if (!dayjs(startDate).isValid() || !dayjs(endDate).isValid()) return "-";

		const diffMs = endDate.getTime() - startDate.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

		if (diffHours > 24) {
			const diffDays = Math.floor(diffHours / 24);
			return `${diffDays} día${diffDays > 1 ? "s" : ""}`;
		} else if (diffHours > 0) {
			return `${diffHours}h ${diffMinutes > 0 ? `${diffMinutes}min` : ""}`;
		} else {
			return `${diffMinutes}min`;
		}
	} catch {
		return "-";
	}
};

const CalendarTable: React.FC<CalendarTableProps> = ({ events, searchQuery, onEdit, onDelete, onView }) => {
	const theme = useTheme();
	const [order, setOrder] = useState<Order>("asc");
	const [orderBy, setOrderBy] = useState<string>("start");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const handleRequestSort = (property: string) => {
		const isAsc = orderBy === property && order === "asc";
		setOrder(isAsc ? "desc" : "asc");
		setOrderBy(property);
	};

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	// Filter events based on search query
	const filteredEvents = useMemo(() => {
		if (!searchQuery) return events;

		const query = searchQuery.toLowerCase();
		return events.filter(
			(event) =>
				event.title?.toLowerCase().includes(query) ||
				event.description?.toLowerCase().includes(query) ||
				event.type?.toLowerCase().includes(query),
		);
	}, [events, searchQuery]);

	// Sort events
	const sortedEvents = useMemo(() => {
		return [...filteredEvents].sort((a, b) => {
			let aValue: any;
			let bValue: any;

			if (orderBy === "duration") {
				aValue = a.end ? calculateDuration(a.start, a.end) : "24h";
				bValue = b.end ? calculateDuration(b.start, b.end) : "24h";
			} else {
				aValue = a[orderBy as keyof CalendarEvent];
				bValue = b[orderBy as keyof CalendarEvent];
			}

			// Special handling for dates
			if (orderBy === "start" || orderBy === "end") {
				aValue = aValue ? dayjs(aValue).toDate() : new Date(0);
				bValue = bValue ? dayjs(bValue).toDate() : new Date(0);
			}

			if (order === "desc") {
				return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
			} else {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			}
		});
	}, [filteredEvents, order, orderBy]);

	// Paginate events
	const paginatedEvents = useMemo(() => {
		return sortedEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
	}, [sortedEvents, page, rowsPerPage]);

	return (
		<Box>
			<TableContainer>
				<Table sx={{ minWidth: 750 }} size="medium">
					<TableHead>
						<TableRow>
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
											onClick={() => handleRequestSort(headCell.id)}
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
						{paginatedEvents.map((event) => {
							return (
								<TableRow hover tabIndex={-1} key={event._id} sx={{ cursor: "pointer" }}>
									<TableCell>
										<Stack direction="row" spacing={1} alignItems="center">
											<Avatar
												sx={{
													width: 32,
													height: 32,
													bgcolor: `${getEventTypeColor(event.type)}.lighter`,
													color: `${getEventTypeColor(event.type)}.main`,
												}}
											>
												{event.allDay ? <CalendarTick size={16} /> : <Clock size={16} />}
											</Avatar>
											<Box>
												<Typography variant="body2" fontWeight={500}>
													{formatDateOnly(event.start)}
												</Typography>
												{!event.allDay && (
													<Typography variant="caption" color="textSecondary">
														{dayjs(event.start).format("HH:mm")}
													</Typography>
												)}
											</Box>
										</Stack>
									</TableCell>
									<TableCell>
										<Typography variant="subtitle2" noWrap sx={{ maxWidth: 250 }}>
											{event.title}
										</Typography>
									</TableCell>
									<TableCell>
										{event.type && (
											<Chip
												icon={<Calendar1 size={14} />}
												label={event.type}
												color={getEventTypeColor(event.type)}
												size="small"
												variant="outlined"
											/>
										)}
									</TableCell>
									<TableCell>
										<Typography variant="body2" color="textSecondary" sx={{ maxWidth: 300 }} noWrap>
											{event.description || "-"}
										</Typography>
									</TableCell>
									<TableCell>
										<Stack direction="row" spacing={0.5} alignItems="center">
											<Clock size={14} color={theme.palette.text.secondary} />
											<Typography variant="body2" color="textSecondary">
												{calculateDuration(event.start, event.end)}
											</Typography>
										</Stack>
									</TableCell>
									<TableCell>
										<Stack direction="row" spacing={0.5}>
											<Tooltip title="Ver detalles">
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														onView(event);
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
														onEdit(event);
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
														onDelete(event._id);
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
						{paginatedEvents.length === 0 && (
							<TableRow>
								<TableCell colSpan={headCells.length} align="center">
									<Typography variant="subtitle1" color="textSecondary" sx={{ py: 3 }}>
										No se encontraron eventos
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
				count={filteredEvents.length}
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

export default CalendarTable;
