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
} from "@mui/material";
import { Edit, Trash, Eye, SmsNotification, Notification1, NotificationStatus, Clock } from "iconsax-react";
import { NotificationType } from "types/notifications";
import { visuallyHidden } from "@mui/utils";
import { format, parse, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";

interface NotificationsTableProps {
	notifications: NotificationType[];
	searchQuery: string;
	onEdit: (notification: NotificationType) => void;
	onDelete: (id: string) => void;
	onView: (notification: NotificationType) => void;
}

type Order = "asc" | "desc";

interface HeadCell {
	id: keyof NotificationType | "actions";
	label: string;
	numeric: boolean;
	width?: string | number;
}

const headCells: HeadCell[] = [
	{ id: "time", label: "Fecha", numeric: false, width: "120px" },
	{ id: "title", label: "Título", numeric: false },
	{ id: "notification", label: "Tipo", numeric: false, width: "150px" },
	{ id: "user", label: "Usuario", numeric: false, width: "120px" },
	{ id: "description", label: "Descripción", numeric: false },
	{ id: "dateExpiration", label: "Vencimiento", numeric: false, width: "120px" },
	{ id: "actions", label: "Acciones", numeric: false, width: "120px" },
];

const getNotificationIcon = (notification?: string) => {
	switch (notification) {
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
};

const getNotificationColor = (
	notification?: string,
	user?: string,
): "error" | "default" | "primary" | "secondary" | "info" | "success" | "warning" => {
	if (notification === "Carta Documento" || notification === "Telegrama") {
		return user === "Actora" ? "success" : user === "Demandada" ? "error" : "default";
	}
	switch (notification) {
		case "Cédula":
			return "primary";
		case "Notarial":
			return "warning";
		default:
			return "secondary";
	}
};

const getUserChipColor = (user?: string): "success" | "error" | "default" => {
	switch (user) {
		case "Actora":
			return "success";
		case "Demandada":
			return "error";
		default:
			return "default";
	}
};

const parseDate = (dateString: string) => {
	try {
		// Try to parse as ISO date first
		if (dateString.includes("T") || dateString.includes("-")) {
			const parsedDate = parseISO(dateString);
			if (isValid(parsedDate)) {
				// Normalizar a medianoche en zona horaria local para evitar cambios de fecha
				const normalized = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
				return normalized;
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
	if (!dateString || dateString.trim() === "") {
		return "";
	}

	try {
		let parsedDate: Date;

		// Try to parse as ISO date first
		if (dateString.includes("T") || dateString.includes("-")) {
			parsedDate = parseISO(dateString);
			if (isValid(parsedDate)) {
				// Usar componentes de fecha UTC para evitar conversión de zona horaria
				const year = parsedDate.getUTCFullYear();
				const month = parsedDate.getUTCMonth();
				const day = parsedDate.getUTCDate();
				const normalized = new Date(year, month, day);
				return format(normalized, "dd/MM/yyyy", { locale: es });
			}
		}

		// Try to parse as DD/MM/YYYY format
		parsedDate = parse(dateString, "dd/MM/yyyy", new Date());
		if (isValid(parsedDate)) {
			return format(parsedDate, "dd/MM/yyyy", { locale: es });
		}

		return "";
	} catch {
		return "";
	}
};

const NotificationsTable: React.FC<NotificationsTableProps> = ({ notifications, searchQuery, onEdit, onDelete, onView }) => {
	const [order, setOrder] = useState<Order>("desc");
	const [orderBy, setOrderBy] = useState<keyof NotificationType>("time");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const handleRequestSort = (property: keyof NotificationType) => {
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

	// Filter notifications based on search query
	const filteredNotifications = useMemo(() => {
		if (!searchQuery) return notifications;

		const query = searchQuery.toLowerCase();
		return notifications.filter(
			(notification) =>
				notification.title?.toLowerCase().includes(query) ||
				notification.description?.toLowerCase().includes(query) ||
				notification.notification?.toLowerCase().includes(query) ||
				notification.user?.toLowerCase().includes(query),
		);
	}, [notifications, searchQuery]);

	// Sort notifications
	const sortedNotifications = useMemo(() => {
		return [...filteredNotifications].sort((a, b) => {
			const aValue = a[orderBy] || "";
			const bValue = b[orderBy] || "";

			if (order === "desc") {
				return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
			} else {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			}
		});
	}, [filteredNotifications, order, orderBy]);

	// Paginate notifications
	const paginatedNotifications = useMemo(() => {
		return sortedNotifications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
	}, [sortedNotifications, page, rowsPerPage]);

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
											onClick={() => handleRequestSort(headCell.id as keyof NotificationType)}
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
						{paginatedNotifications.map((notification) => {
							return (
								<TableRow hover tabIndex={-1} key={notification._id} sx={{ cursor: "pointer" }}>
									<TableCell>{formatDate(notification.time || "")}</TableCell>
									<TableCell>
										<Typography variant="subtitle2" noWrap>
											{notification.title}
										</Typography>
									</TableCell>
									<TableCell>
										<Stack direction="row" spacing={1} alignItems="center">
											<Avatar
												sx={{
													width: 24,
													height: 24,
													bgcolor: `${getNotificationColor(notification.notification, notification.user)}.lighter`,
													color: `${getNotificationColor(notification.notification, notification.user)}.main`,
												}}
											>
												{getNotificationIcon(notification.notification)}
											</Avatar>
											<Typography variant="body2">{notification.notification}</Typography>
										</Stack>
									</TableCell>
									<TableCell>
										{notification.user && (
											<Chip label={notification.user} color={getUserChipColor(notification.user)} size="small" variant="outlined" />
										)}
									</TableCell>
									<TableCell>
										<Typography variant="body2" color="textSecondary" sx={{ maxWidth: 300 }} noWrap>
											{notification.description || "-"}
										</Typography>
									</TableCell>
									<TableCell>
										{notification.dateExpiration
											? (() => {
													const expirationDate = parseDate(notification.dateExpiration);
													const today = new Date();
													today.setHours(0, 0, 0, 0);
													const isExpired = expirationDate < today;
													const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
													const isNearExpiration = daysUntilExpiration >= 0 && daysUntilExpiration <= 7;

													return (
														<Stack direction="row" spacing={0.5} alignItems="center">
															<Chip
																label={formatDate(notification.dateExpiration)}
																color={isExpired ? "error" : isNearExpiration ? "warning" : "success"}
																size="small"
																variant={isExpired ? "filled" : "outlined"}
																icon={
																	isExpired ? (
																		<Clock size={14} style={{ color: "inherit" }} />
																	) : isNearExpiration ? (
																		<Clock size={14} style={{ color: "inherit" }} />
																	) : undefined
																}
																sx={{
																	fontWeight: isExpired ? 600 : 500,
																	"& .MuiChip-icon": {
																		marginLeft: "4px",
																		marginRight: "-2px",
																	},
																}}
															/>
															{isExpired && (
																<Typography variant="caption" color="error" fontWeight={600}>
																	Vencido
																</Typography>
															)}
															{isNearExpiration && !isExpired && (
																<Typography variant="caption" color="warning.main" fontWeight={500}>
																	{daysUntilExpiration === 0 ? "Hoy" : `${daysUntilExpiration}d`}
																</Typography>
															)}
														</Stack>
													);
											  })()
											: "-"}
									</TableCell>
									<TableCell>
										<Stack direction="row" spacing={0.5}>
											<Tooltip title="Ver detalles">
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														onView(notification);
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
														onEdit(notification);
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
														onDelete(notification._id!);
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
						{paginatedNotifications.length === 0 && (
							<TableRow>
								<TableCell colSpan={headCells.length} align="center">
									<Typography variant="subtitle1" color="textSecondary" sx={{ py: 3 }}>
										No se encontraron notificaciones
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
				count={filteredNotifications.length}
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

export default NotificationsTable;
