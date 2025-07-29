import React from "react";
import { Stack, FormControl, InputLabel, Select, MenuItem, Typography, Button, Divider, SelectChangeEvent } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { es } from "date-fns/locale";
import { RotateLeft } from "iconsax-react";

interface ActivityFiltersProps {
	activeTab: "movements" | "notifications" | "calendar" | "combined";
	filters: any;
	onFiltersChange: (filters: any) => void;
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({ activeTab, filters, onFiltersChange }) => {
	const handleDateChange = (field: string) => (date: Date | null) => {
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
		<>
			<FormControl size="small" fullWidth>
				<InputLabel>Tipo de Movimiento</InputLabel>
				<Select value={filters.type || ""} onChange={handleSelectChange("type")} label="Tipo de Movimiento">
					<MenuItem value="">Todos</MenuItem>
					<MenuItem value="Escrito-Actor">Escrito Actor</MenuItem>
					<MenuItem value="Escrito-Demandado">Escrito Demandado</MenuItem>
					<MenuItem value="Despacho">Despacho</MenuItem>
					<MenuItem value="Cédula">Cédula</MenuItem>
					<MenuItem value="Oficio">Oficio</MenuItem>
					<MenuItem value="Evento">Evento</MenuItem>
				</Select>
			</FormControl>

			<FormControl size="small" fullWidth>
				<InputLabel>Con Vencimiento</InputLabel>
				<Select value={filters.hasExpiration || ""} onChange={handleSelectChange("hasExpiration")} label="Con Vencimiento">
					<MenuItem value="">Todos</MenuItem>
					<MenuItem value="yes">Con vencimiento</MenuItem>
					<MenuItem value="no">Sin vencimiento</MenuItem>
				</Select>
			</FormControl>
		</>
	);

	const renderNotificationFilters = () => (
		<>
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

			<FormControl size="small" fullWidth>
				<InputLabel>Usuario</InputLabel>
				<Select value={filters.user || ""} onChange={handleSelectChange("user")} label="Usuario">
					<MenuItem value="">Todos</MenuItem>
					<MenuItem value="Actora">Actora</MenuItem>
					<MenuItem value="Demandada">Demandada</MenuItem>
				</Select>
			</FormControl>
		</>
	);

	const renderCalendarFilters = () => (
		<>
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

			<FormControl size="small" fullWidth>
				<InputLabel>Duración</InputLabel>
				<Select value={filters.allDay || ""} onChange={handleSelectChange("allDay")} label="Duración">
					<MenuItem value="">Todos</MenuItem>
					<MenuItem value="true">Todo el día</MenuItem>
					<MenuItem value="false">Hora específica</MenuItem>
				</Select>
			</FormControl>
		</>
	);

	const renderCombinedFilters = () => (
		<FormControl size="small" fullWidth>
			<InputLabel>Origen</InputLabel>
			<Select value={filters.source || ""} onChange={handleSelectChange("source")} label="Origen">
				<MenuItem value="">Todos</MenuItem>
				<MenuItem value="movement">Movimientos</MenuItem>
				<MenuItem value="notification">Notificaciones</MenuItem>
				<MenuItem value="calendar">Calendario</MenuItem>
			</Select>
		</FormControl>
	);

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
			<Stack spacing={2}>
				<Typography variant="subtitle2" fontWeight={600}>
					Filtros Avanzados
				</Typography>

				<Stack direction="row" spacing={2}>
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
				</Stack>

				<Stack direction="row" spacing={2}>
					{activeTab === "movements" && renderMovementFilters()}
					{activeTab === "notifications" && renderNotificationFilters()}
					{activeTab === "calendar" && renderCalendarFilters()}
					{activeTab === "combined" && renderCombinedFilters()}
				</Stack>

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
