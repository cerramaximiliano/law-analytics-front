import React, { useState } from "react";
import {
	Grid,
	InputLabel,
	Typography,
	Divider,
	Box,
	alpha,
	useTheme,
	FormControl,
	Select,
	MenuItem,
	FormHelperText,
	TextField,
	InputAdornment,
} from "@mui/material";
import "dayjs/locale/es";
import { esES } from "@mui/x-date-pickers/locales";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DocumentText } from "iconsax-react";
import { useFormikContext } from "formik";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import NumberField from "components/UI/NumberField";
import DateInputField from "components/UI/DateInputField";
import InputField from "components/UI/InputField";
import LinkCauseSelector from "./components/LinkCauseSelector";

dayjs.extend(customParseFormat);

const esLocale = esES.components.MuiLocalizationProvider.defaultProps.localeText;

const PRESTACIONES = [
	{ value: "jubilacion_ordinaria", label: "Jubilación Ordinaria" },
	{ value: "pension_derivada", label: "Pensión derivada" },
];

const OBRAS_SOCIALES = [{ value: "inssjyp_pami", label: "INSSJyP (PAMI)" }];

const MONEDAS = [{ value: "ARS", label: "Pesos (ARS)" }];

const formatExpediente = (raw: string): string => {
	const digits = raw.replace(/\D/g, "").slice(0, 24);
	let result = digits.slice(0, 3);
	if (digits.length > 3) result += "-" + digits.slice(3, 5);
	if (digits.length > 5) result += "-" + digits.slice(5, 14);
	if (digits.length > 14) result += "-" + digits.slice(14, 17);
	if (digits.length > 17) result += "-" + digits.slice(17, 24);
	return result;
};

interface FirstFormProps {
	formField: any;
	folder?: any;
	onFolderChange?: (folderId: string | null) => void;
}

export default function FirstForm({ formField, folder, onFolderChange }: FirstFormProps) {
	const { reclamante, folderId, expedienteAdmin, prestacion, obraSocial, fechaAdquisicion, fechaAlta, haberPagadoAnses, haberPagadoAl, monedaHaberPagado } =
		formField;

	const [inputMethod, setInputMethod] = useState<"manual" | "causa">(folder ? "causa" : "manual");
	const [selectedFolder, setSelectedFolder] = useState<any>(folder || null);

	const theme = useTheme();
	const { values, setFieldValue, errors, touched } = useFormikContext<any>();

	const handleMethodChange = (method: "manual" | "causa", folderData: any, folderMeta?: { folderId: string; folderName: string }) => {
		setInputMethod(method);
		setSelectedFolder(folderData);

		if (method === "causa" && folderData) {
			setFieldValue(reclamante.name, `__CAUSA_VINCULADA__${folderData._id}`);
			if (folderMeta) {
				setFieldValue("folderId", folderMeta.folderId);
				setFieldValue("folderName", folderMeta.folderName);
			}
			if (onFolderChange && folderMeta?.folderId) {
				onFolderChange(folderMeta.folderId);
			}
		} else {
			setFieldValue(reclamante.name, "");
			setFieldValue("folderId", "");
			setFieldValue("folderName", "");
			if (onFolderChange) onFolderChange(null);
		}
	};

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Datos del expediente
			</Typography>

			<LinkCauseSelector requiereField={reclamante.name} requeridoField={folderId.name} onMethodChange={handleMethodChange} />

			<Divider sx={{ my: 2.5 }} />

			<Grid container spacing={2.5}>
				{/* Titular / Reclamante */}
				{inputMethod === "causa" && selectedFolder ? (
					<Grid item xs={12}>
						<Box
							sx={{
								p: 2,
								bgcolor: alpha(theme.palette.primary.main, 0.08),
								borderRadius: 1,
								border: `1px solid ${theme.palette.primary.main}`,
								display: "flex",
								alignItems: "center",
								gap: 1.5,
							}}
						>
							<DocumentText size={18} variant="Bold" color={theme.palette.primary.main} />
							<Typography variant="body1" fontWeight={500}>
								{selectedFolder.folderName}
							</Typography>
							{selectedFolder.materia && (
								<Typography variant="body2" color="text.secondary">
									({selectedFolder.materia})
								</Typography>
							)}
						</Box>
					</Grid>
				) : (
					<Grid item xs={12} md={6}>
						<InputLabel>Titular / Reclamante *</InputLabel>
						<InputField fullWidth placeholder="Apellido y Nombre o nombre del caso" name={reclamante.name} />
					</Grid>
				)}

				{/* Expediente administrativo */}
				<Grid item xs={12} md={6}>
					<InputLabel>{expedienteAdmin.label}</InputLabel>
					<TextField
						fullWidth
						placeholder="XXX-XX-XXXXXXXXX-XXX-XXXXXXX"
						value={values[expedienteAdmin.name]}
						onChange={(e) => setFieldValue(expedienteAdmin.name, formatExpediente(e.target.value))}
						inputProps={{ maxLength: 29 }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}>
										ANSES
									</Typography>
								</InputAdornment>
							),
						}}
					/>
				</Grid>

				{/* Prestación */}
				<Grid item xs={12} md={6}>
					<InputLabel>{prestacion.label} *</InputLabel>
					<FormControl fullWidth error={!!(touched[prestacion.name] && errors[prestacion.name])}>
						<Select
							value={values[prestacion.name]}
							onChange={(e) => setFieldValue(prestacion.name, e.target.value)}
							displayEmpty
						>
							<MenuItem value="" disabled>
								<Typography color="text.secondary">Seleccione una prestación</Typography>
							</MenuItem>
							{PRESTACIONES.map((p) => (
								<MenuItem key={p.value} value={p.value}>
									{p.label}
								</MenuItem>
							))}
						</Select>
						{touched[prestacion.name] && errors[prestacion.name] && (
							<FormHelperText>{errors[prestacion.name] as string}</FormHelperText>
						)}
					</FormControl>
				</Grid>

				{/* Descuento Obra Social */}
				<Grid item xs={12} md={6}>
					<InputLabel>{obraSocial.label}</InputLabel>
					<FormControl fullWidth>
						<Select
							value={values[obraSocial.name]}
							onChange={(e) => setFieldValue(obraSocial.name, e.target.value)}
							displayEmpty
						>
							<MenuItem value="">
								<Typography color="text.secondary">Sin descuento</Typography>
							</MenuItem>
							{OBRAS_SOCIALES.map((os) => (
								<MenuItem key={os.value} value={os.value}>
									{os.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>

				{/* Fecha de adquisición del derecho */}
				<Grid item xs={12} md={6}>
					<InputLabel>{fechaAdquisicion.label} *</InputLabel>
					<DateInputField name={fechaAdquisicion.name} />
				</Grid>

				{/* Fecha de alta (mes/año) */}
				<Grid item xs={12} md={6}>
					<InputLabel>{fechaAlta.label}</InputLabel>
					<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es" localeText={esLocale}>
						<FormControl fullWidth error={!!(touched[fechaAlta.name] && errors[fechaAlta.name])}>
							<DatePicker
								views={["month", "year"]}
								openTo="month"
								value={values[fechaAlta.name] ? dayjs(values[fechaAlta.name], "MM/YYYY") : null}
								onChange={(newValue) => {
									if (newValue && dayjs(newValue).isValid()) {
										setFieldValue(fechaAlta.name, dayjs(newValue).format("MM/YYYY"));
									} else {
										setFieldValue(fechaAlta.name, "");
									}
								}}
								format="MM/YYYY"
								slotProps={{
									textField: {
										fullWidth: true,
										error: !!(touched[fechaAlta.name] && errors[fechaAlta.name]),
									},
								}}
							/>
							{touched[fechaAlta.name] && errors[fechaAlta.name] && (
								<FormHelperText>{errors[fechaAlta.name] as string}</FormHelperText>
							)}
						</FormControl>
					</LocalizationProvider>
				</Grid>
			</Grid>

			<Divider sx={{ my: 3 }} />

			<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
				Haber Pagado ANSES
			</Typography>

			<Grid container spacing={2.5}>
				<Grid item xs={12} md={6}>
					<InputLabel>{haberPagadoAnses.label} *</InputLabel>
					<NumberField
						thousandSeparator=","
						allowNegative={false}
						decimalScale={2}
						fullWidth
						placeholder="0,00"
						name={haberPagadoAnses.name}
						InputProps={{ startAdornment: "$" }}
					/>
				</Grid>
				<Grid item xs={12} md={6}>
					<InputLabel>{haberPagadoAl.label} *</InputLabel>
					<DateInputField name={haberPagadoAl.name} />
				</Grid>

				<Grid item xs={12} md={6}>
					<InputLabel>{monedaHaberPagado.label}</InputLabel>
					<FormControl fullWidth>
						<Select
							value={values[monedaHaberPagado.name]}
							onChange={(e) => setFieldValue(monedaHaberPagado.name, e.target.value)}
						>
							{MONEDAS.map((m) => (
								<MenuItem key={m.value} value={m.value}>
									{m.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
			</Grid>
		</>
	);
}
