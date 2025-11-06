import React from "react";
import {
	Stack,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Typography,
	Button,
	Divider,
	SelectChangeEvent,
	Grid,
	ListSubheader,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { RotateLeft } from "iconsax-react";
import dayjs from "utils/dayjs-config";

interface ActivityFiltersProps {
	activeTab: "movements" | "notifications" | "calendar" | "combined";
	filters: any;
	onFiltersChange: (filters: any) => void;
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({ activeTab, filters, onFiltersChange }) => {
	const handleDateChange = (field: string) => (date: dayjs.Dayjs | null) => {
		onFiltersChange({
			...filters,
			[field]: date,
		});
	};

	const handleSelectChange = (field: string) => (event: SelectChangeEvent) => {
		onFiltersChange({
			...filters,
			[field]: event.target.value,
		});
	};

	const handleReset = () => {
		onFiltersChange({
			startDate: null,
			endDate: null,
			type: "",
			status: "",
			user: "",
		});
	};

	const renderMovementFilters = () => (
		<Grid container spacing={1.5}>
			<Grid item xs={12} sm={6} md={4}>
				<FormControl size="small" fullWidth>
					<InputLabel>Tipo de Movimiento</InputLabel>
					<Select
						value={filters.type || ""}
						onChange={handleSelectChange("type")}
						label="Tipo de Movimiento"
						MenuProps={{
							PaperProps: {
								sx: {
									maxHeight: 400,
								},
							},
						}}
					>
						<MenuItem value="">Todos</MenuItem>

						<ListSubheader
							sx={{
								fontWeight: 700,
								fontSize: "0.875rem",
								color: "primary.main",
								bgcolor: "primary.lighter",
								lineHeight: "40px",
								position: "sticky",
								top: 0,
								zIndex: 1,
								borderBottom: 2,
								borderColor: "primary.main",
								px: 2,
								letterSpacing: 0.5,
							}}
						>
							TIPOS GENERALES
						</ListSubheader>
						<MenuItem value="Escrito-Actor">Escrito Actor</MenuItem>
						<MenuItem value="Escrito-Demandado">Escrito Demandado</MenuItem>
						<MenuItem value="Despacho">Despacho</MenuItem>
						<MenuItem value="Cédula">Cédula</MenuItem>
						<MenuItem value="Oficio">Oficio</MenuItem>
						<MenuItem value="Evento">Evento</MenuItem>

						<ListSubheader
							sx={{
								fontWeight: 700,
								fontSize: "0.875rem",
								color: "primary.main",
								bgcolor: "primary.lighter",
								lineHeight: "40px",
								position: "sticky",
								top: 0,
								zIndex: 1,
								borderBottom: 2,
								borderColor: "primary.main",
								px: 2,
								letterSpacing: 0.5,
								mt: 1,
							}}
						>
							TIPOS PJN
						</ListSubheader>
						<MenuItem value="CAMBIO DE ESTADO DE EXPEDIENTE">Cambio de Estado de Expediente</MenuItem>
						<MenuItem value="CEDULA ELECTRONICA PARTE">Cédula Electrónica Parte</MenuItem>
						<MenuItem value="CEDULA ELECTRONICA TRIBUNAL">Cédula Electrónica Tribunal</MenuItem>
						<MenuItem value="CEDULA INCORPORADA">Cédula Incorporada</MenuItem>
						<MenuItem value="CEDULA">Cédula</MenuItem>
						<MenuItem value="DEO">DEO</MenuItem>
						<MenuItem value="DOCUMENTO DIGITAL">Documento Digital</MenuItem>
						<MenuItem value="ESCRITO AGREGADO">Escrito Agregado</MenuItem>
						<MenuItem value="ESCRITO INCORPORADO">Escrito Incorporado</MenuItem>
						<MenuItem value="EVENTO">Evento</MenuItem>
						<MenuItem value="FIRMA DESPACHO">Firma Despacho</MenuItem>
						<MenuItem value="INFORMACION">Información</MenuItem>
						<MenuItem value="MOVIMIENTO">Movimiento</MenuItem>
						<MenuItem value="PAGO BONO LETRADO">Pago Bono Letrado</MenuItem>
						<MenuItem value="PAGO TASA DE JUSTICIA">Pago Tasa de Justicia</MenuItem>
						<MenuItem value="PASE">Pase</MenuItem>
						<MenuItem value="PUBLICACION SENTENCIA">Publicación Sentencia</MenuItem>
						<MenuItem value="RECEPCION PASE">Recepción Pase</MenuItem>
						<MenuItem value="RETORNO CEDULA">Retorno Cédula</MenuItem>
						<MenuItem value="TIPO DE PROCESO">Tipo de Proceso</MenuItem>
					</Select>
				</FormControl>
			</Grid>

			<Grid item xs={12} sm={6} md={4}>
				<FormControl size="small" fullWidth>
					<InputLabel>Con Vencimiento</InputLabel>
					<Select value={filters.hasExpiration || ""} onChange={handleSelectChange("hasExpiration")} label="Con Vencimiento">
						<MenuItem value="">Todos</MenuItem>
						<MenuItem value="yes">Con vencimiento</MenuItem>
						<MenuItem value="no">Sin vencimiento</MenuItem>
					</Select>
				</FormControl>
			</Grid>
		</Grid>
	);

	const renderNotificationFilters = () => (
		<>
			<Grid item xs={12} sm={6} md={4}>
				<FormControl size="small" fullWidth>
					<InputLabel>Tipo de Notificación</InputLabel>
					<Select value={filters.type || ""} onChange={handleSelectChange("type")} label="Tipo de Notificación">
						<MenuItem value="">Todos</MenuItem>
						<MenuItem value="Carta Documento">Carta Documento</MenuItem>
						<MenuItem value="Telegrama">Telegrama</MenuItem>
						<MenuItem value="Cédula">Cédula</MenuItem>
						<MenuItem value="Notarial">Notarial</MenuItem>
					</Select>
				</FormControl>
			</Grid>

			<Grid item xs={12} sm={6} md={4}>
				<FormControl size="small" fullWidth>
					<InputLabel>Usuario</InputLabel>
					<Select value={filters.user || ""} onChange={handleSelectChange("user")} label="Usuario">
						<MenuItem value="">Todos</MenuItem>
						<MenuItem value="Actora">Actora</MenuItem>
						<MenuItem value="Demandada">Demandada</MenuItem>
					</Select>
				</FormControl>
			</Grid>
		</>
	);

	const renderCalendarFilters = () => (
		<>
			<Grid item xs={12} sm={6} md={4}>
				<FormControl size="small" fullWidth>
					<InputLabel>Tipo de Evento</InputLabel>
					<Select value={filters.type || ""} onChange={handleSelectChange("type")} label="Tipo de Evento">
						<MenuItem value="">Todos</MenuItem>
						<MenuItem value="Audiencia">Audiencia</MenuItem>
						<MenuItem value="Reunion">Reunión</MenuItem>
						<MenuItem value="Vencimiento">Vencimiento</MenuItem>
						<MenuItem value="Recordatorio">Recordatorio</MenuItem>
						<MenuItem value="Mediacion">Mediación</MenuItem>
					</Select>
				</FormControl>
			</Grid>

			<Grid item xs={12} sm={6} md={4}>
				<FormControl size="small" fullWidth>
					<InputLabel>Duración</InputLabel>
					<Select value={filters.allDay || ""} onChange={handleSelectChange("allDay")} label="Duración">
						<MenuItem value="">Todos</MenuItem>
						<MenuItem value="true">Todo el día</MenuItem>
						<MenuItem value="false">Hora específica</MenuItem>
					</Select>
				</FormControl>
			</Grid>
		</>
	);

	const renderCombinedFilters = () => (
		<Grid container spacing={1.5}>
			<Grid item xs={12} sm={6} md={4}>
				<FormControl size="small" fullWidth>
					<InputLabel>Origen</InputLabel>
					<Select value={filters.source || ""} onChange={handleSelectChange("source")} label="Origen">
						<MenuItem value="">Todos</MenuItem>
						<MenuItem value="movement">Movimientos</MenuItem>
						<MenuItem value="notification">Notificaciones</MenuItem>
						<MenuItem value="calendar">Calendario</MenuItem>
					</Select>
				</FormControl>
			</Grid>
		</Grid>
	);

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
			<Stack spacing={1.5}>
				<Typography variant="subtitle2" fontWeight={600}>
					Filtros Avanzados
				</Typography>

				<Grid container spacing={1.5}>
					<Grid item xs={12} sm={6} md={4}>
						<DatePicker
							label="Fecha desde"
							value={filters.startDate || null}
							onChange={handleDateChange("startDate")}
							slotProps={{
								textField: {
									size: "small",
									fullWidth: true,
								},
							}}
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={4}>
						<DatePicker
							label="Fecha hasta"
							value={filters.endDate || null}
							onChange={handleDateChange("endDate")}
							slotProps={{
								textField: {
									size: "small",
									fullWidth: true,
								},
							}}
						/>
					</Grid>
				</Grid>

				{activeTab === "movements" && renderMovementFilters()}
				{activeTab === "notifications" && (
					<Grid container spacing={1.5}>
						{renderNotificationFilters()}
					</Grid>
				)}
				{activeTab === "calendar" && (
					<Grid container spacing={1.5}>
						{renderCalendarFilters()}
					</Grid>
				)}
				{activeTab === "combined" && renderCombinedFilters()}

				<Divider />

				<Stack direction="row" spacing={2} justifyContent="flex-end">
					<Button size="small" variant="outlined" color="secondary" startIcon={<RotateLeft />} onClick={handleReset}>
						Limpiar Filtros
					</Button>
				</Stack>
			</Stack>
		</LocalizationProvider>
	);
};

export default ActivityFilters;
