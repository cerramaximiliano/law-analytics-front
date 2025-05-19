import React, { useRef, useState, useEffect } from "react";
import {
	Stack,
	Box,
	Typography,
	Paper,
	IconButton,
	Chip,
	useTheme,
	Button,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Checkbox,
	Divider,
	InputAdornment,
	Autocomplete,
	GlobalStyles,
} from "@mui/material";
import {
	Copy,
	Sms,
	Printer,
	Link21,
	Calculator,
	Information,
	DocumentText,
	StatusUp,
	Warning2,
	SearchNormal1,
	UserAdd,
} from "iconsax-react";
import { useReactToPrint } from "react-to-print";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { getContactsByUserId } from "store/reducers/contacts";
import axios from "axios";
import LinkCauseModal from "sections/forms/wizard/calc-laboral/components/linkCauseModal";

interface ResultItem {
	key: string;
	value: number | string;
	customLabel?: string;
	formatType?: string;
}

interface CalculationDetailsViewProps {
	data: {
		_id: string;
		folderId?: string;
		amount: number;
		variables?: Record<string, any>;
		subClassType?: string;
		type?: string;
	};
	getLabelForKey: (key: string, customLabel?: string) => string;
	formatValue: (key: string, value: number | string, formatType?: string) => string;
	groupResults: (variables: Record<string, any> | undefined) => Record<string, ResultItem[]>;
	generatePlainText: () => string;
	generateHtmlContent: () => string;
	customTitle?: string;
	hideInterestButton?: boolean;
}

// Iconos para cada sección
const SectionIcons: Record<string, React.ElementType> = {
	detalles: Information,
	calculos: Calculator,
	intereses: StatusUp,
	reclamo: DocumentText,
	indemnizacion: Warning2,
	liquidacion: DocumentText,
	multas: Warning2,
};

export const CalculationDetailsView: React.FC<CalculationDetailsViewProps> = ({
	data,
	getLabelForKey,
	formatValue,
	groupResults,
	generatePlainText,
	generateHtmlContent,
	customTitle,
	hideInterestButton = false,
}) => {
	const theme = useTheme();
	const [emailModalOpen, setEmailModalOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [emailList, setEmailList] = useState<string[]>([]);
	const [copyToMe, setCopyToMe] = useState(false);
	const [customMessage, setCustomMessage] = useState("");
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [updateModalOpen, setUpdateModalOpen] = useState(false);
	const [interestRate, setInterestRate] = useState("");
	const [contactsLoaded, setContactsLoaded] = useState(false);
	const { contacts, isLoader: contactsLoading } = useSelector((state: any) => state.contacts);
	const { user } = useSelector((state: any) => state.auth);
	const printRef = useRef<HTMLDivElement>(null);

	// Cargar contactos cuando se abre el modal de email
	useEffect(() => {
		if (emailModalOpen && !contactsLoaded && user?._id) {
			dispatch(getContactsByUserId(user._id));
			setContactsLoaded(true);
		}
	}, [emailModalOpen, contactsLoaded, user?._id]);

	const handleAddEmail = () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (email && emailRegex.test(email) && !emailList.includes(email)) {
			setEmailList([...emailList, email]);
			setEmail("");
		} else if (email && !emailRegex.test(email)) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Por favor ingrese un email válido",
					variant: "alert",
					alert: { color: "warning" },
					close: true,
				}),
			);
		} else if (email && emailList.includes(email)) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Este email ya fue agregado a la lista",
					variant: "alert",
					alert: { color: "info" },
					close: true,
				}),
			);
			setEmail("");
		}
	};

	const handleRemoveEmail = (emailToRemove: string) => {
		setEmailList(emailList.filter((e) => e !== emailToRemove));
	};

	const handleEmailSend = async () => {
		try {
			const textBody = generatePlainText();
			const htmlBody = generateHtmlContent();
			const subject = customTitle || "Cálculo - Law||Analytics";
			const allEmails = [...emailList];

			if (allEmails.length === 0) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Debe agregar al menos un email a la lista de destinatarios",
						variant: "alert",
						alert: { color: "warning" },
						close: true,
					}),
				);
				return;
			}

			await axios.post(`${process.env.REACT_APP_BASE_URL}/api/email/send-email`, {
				to: allEmails,
				subject,
				textBody,
				htmlBody,
				copyToMe: copyToMe,
			});

			dispatch(
				openSnackbar({
					open: true,
					message: `Cálculo enviado correctamente.`,
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
			setEmailModalOpen(false);
			setEmail("");
			setEmailList([]);
			setCopyToMe(false);
			setCustomMessage("");
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Ha ocurrido un error. Intente más tarde.",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	};

	const handleCopyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(generatePlainText());
			dispatch(
				openSnackbar({
					open: true,
					message: `Cálculo copiado correctamente.`,
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
		} catch (err) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Ha ocurrido un error al copiar. Intente más tarde.",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	};

	const handlePrint = useReactToPrint({
		content: () => printRef.current,
	});

	const handleUpdateWithInterest = async () => {
		try {
			// Aquí iría la lógica para actualizar con intereses
			console.log("Actualizando con tasa:", interestRate);
			dispatch(
				openSnackbar({
					open: true,
					message: "Intereses actualizados correctamente",
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
			setUpdateModalOpen(false);
			setInterestRate("");
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al actualizar los intereses",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	};

	const getSectionTitle = (groupKey: string): string => {
		const titles: Record<string, string> = {
			detalles: "Detalles del Cálculo",
			calculos: "Metodología de Cálculo",
			intereses: "Resultados",
			reclamo: "Datos del Reclamo",
			indemnizacion: "Indemnización",
			liquidacion: "Liquidación Final",
			multas: "Multas",
		};
		return titles[groupKey] || groupKey;
	};

	const renderActionButtons = () => (
		<Stack direction="row" spacing={1} sx={{ mb: 2 }} justifyContent="center" className="no-print">
			<Tooltip title="Copiar al portapapeles">
				<IconButton
					onClick={handleCopyToClipboard}
					size="small"
					sx={{
						border: "1px solid",
						borderColor: "divider",
						bgcolor: "background.paper",
						"&:hover": {
							bgcolor: "action.hover",
							borderColor: "primary.main",
						},
					}}
				>
					<Copy size={18} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Enviar por email">
				<IconButton
					onClick={() => setEmailModalOpen(true)}
					size="small"
					sx={{
						border: "1px solid",
						borderColor: "divider",
						bgcolor: "background.paper",
						"&:hover": {
							bgcolor: "action.hover",
							borderColor: "primary.main",
						},
					}}
				>
					<Sms size={18} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Imprimir">
				<IconButton
					onClick={handlePrint}
					size="small"
					sx={{
						border: "1px solid",
						borderColor: "divider",
						bgcolor: "background.paper",
						"&:hover": {
							bgcolor: "action.hover",
							borderColor: "primary.main",
						},
					}}
				>
					<Printer size={18} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Vincular a causa">
				<IconButton
					onClick={() => setLinkModalOpen(true)}
					size="small"
					sx={{
						border: "1px solid",
						borderColor: "divider",
						bgcolor: "background.paper",
						"&:hover": {
							bgcolor: "action.hover",
							borderColor: "primary.main",
						},
					}}
				>
					<Link21 size={18} />
				</IconButton>
			</Tooltip>
			{!hideInterestButton && (
				<Tooltip title="Actualizar con intereses">
					<IconButton
						onClick={() => setUpdateModalOpen(true)}
						size="small"
						sx={{
							border: "1px solid",
							borderColor: "divider",
							bgcolor: "background.paper",
							"&:hover": {
								bgcolor: "action.hover",
								borderColor: "primary.main",
							},
						}}
					>
						<Calculator size={18} />
					</IconButton>
				</Tooltip>
			)}
		</Stack>
	);

	const renderSection = (title: string, items: ResultItem[], sectionKey: string, index: number) => {
		if (!items || !items.length) return null;

		const Icon = SectionIcons[sectionKey] || Information;

		return (
			<Paper
				elevation={0}
				sx={{
					mb: 1.5,
					overflow: "hidden",
					borderRadius: 2,
					border: `1px solid ${theme.palette.divider}`,
					bgcolor: "background.paper",
					boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						px: 2,
						py: 1.5,
						borderBottom: `1px solid ${theme.palette.divider}`,
						bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
					}}
				>
					<Icon
						size={18}
						style={{
							marginRight: theme.spacing(1),
							color: theme.palette.primary.main,
						}}
					/>
					<Typography variant="body1" fontWeight={600}>
						{getSectionTitle(sectionKey)}
					</Typography>
				</Box>
				<Box sx={{ px: 2, py: 1.5 }}>
					{items.map(({ key, value, customLabel, formatType }, itemIndex) => (
						<Box
							key={key}
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								py: 0.75,
								"&:not(:last-child)": {
									borderBottom: `1px solid ${theme.palette.divider}`,
								},
							}}
						>
							<Typography variant="body2" color="text.secondary">
								{getLabelForKey(key, customLabel)}:
							</Typography>
							<Typography variant="body2" fontWeight={500} sx={{ ml: 2 }}>
								{formatValue(key, value, formatType)}
							</Typography>
						</Box>
					))}
				</Box>
			</Paper>
		);
	};

	const groupedData = groupResults(data?.variables);

	return (
		<>
			<GlobalStyles
				styles={{
					"@media print": {
						"@page": {
							margin: "2cm",
							size: "A4",
						},
						body: {
							margin: "0",
							padding: "0",
							backgroundColor: "white",
						},
						".no-print": {
							display: "none !important",
						},
						".MuiPaper-root": {
							boxShadow: "none !important",
							border: "1px solid #ddd !important",
							pageBreakInside: "avoid",
							marginBottom: "10px !important",
						},
						".MuiBox-root": {
							pageBreakInside: "avoid",
						},
						".MuiTypography-root": {
							fontSize: "12px !important",
							pageBreakInside: "avoid",
						},
						".MuiTypography-h6": {
							fontSize: "14px !important",
							fontWeight: "bold !important",
						},
						".MuiTypography-body1": {
							fontSize: "12px !important",
						},
						".MuiTypography-body2": {
							fontSize: "11px !important",
						},
						".MuiStack-root": {
							spacing: "8px !important",
						},
						"td, th": {
							padding: "4px 8px !important",
						},
					},
				}}
			/>
			<Box sx={{ p: 2, maxWidth: 800, mx: "auto" }}>
				{/* Botones de acción */}
				{renderActionButtons()}

				<Box
					sx={{
						bgcolor: theme.palette.mode === "dark" ? "grey.900" : "#f8f8f8",
						borderRadius: 2,
						p: 2,
						border: `1px solid ${theme.palette.divider}`,
						boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
						"&:hover": {
							bgcolor: theme.palette.mode === "dark" ? "grey.900" : "#f8f8f8",
						},
						"@media print": {
							bgcolor: "white !important",
							border: "none !important",
							boxShadow: "none !important",
							p: 0,
						},
					}}
				>
					<div ref={printRef}>
						{/* Contenido principal */}
						<Stack spacing={1}>
							{/* Renderizar las secciones disponibles */}
							{Object.entries(groupedData).map(([key, items], index) => renderSection(key, items as ResultItem[], key, index))}

							{/* Card del total con diseño minimalista */}
							<Paper
								elevation={0}
								sx={{
									mt: 1.5,
									overflow: "hidden",
									borderRadius: 2,
									border: `1px solid ${theme.palette.divider}`,
									bgcolor: "background.paper",
									boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										px: 2,
										py: 1.5,
										borderBottom: `1px solid ${theme.palette.divider}`,
										bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
									}}
								>
									<Typography variant="body1" fontWeight={600}>
										{data.subClassType === "laboral" ? "Total" : "Capital Actualizado"}
									</Typography>
								</Box>
								<Box sx={{ px: 2, py: 1.5 }}>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											py: 0.75,
										}}
									>
										<Typography variant="body2" color="text.secondary">
											{data.subClassType === "laboral" ? "Total a pagar:" : "Capital actualizado:"}
										</Typography>
										<Typography variant="body2" fontWeight={700} sx={{ ml: 2, color: "primary.main" }}>
											{new Intl.NumberFormat("es-AR", {
												style: "currency",
												currency: "ARS",
											}).format(data.amount)}
										</Typography>
									</Box>
								</Box>
							</Paper>
						</Stack>
					</div>
				</Box>
			</Box>

			{/* Modales */}
			<Dialog open={emailModalOpen} onClose={() => setEmailModalOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>Enviar por Email</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<Stack direction="row" spacing={1}>
							<TextField
								autoFocus
								margin="dense"
								label="Dirección de Email"
								type="email"
								fullWidth
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddEmail();
									}
								}}
								placeholder="Escribe un email y haz clic en Agregar"
								size="small"
							/>
							<Button variant="contained" onClick={handleAddEmail} color="primary" disabled={!email.trim()} size="small">
								Agregar
							</Button>
						</Stack>
						<Typography variant="caption" color="textSecondary">
							* Debes agregar cada email a la lista de destinatarios antes de enviar.
						</Typography>

						{emailList.length > 0 && (
							<Box sx={{ mt: 2 }}>
								<Typography variant="subtitle2" gutterBottom>
									Destinatarios:
								</Typography>
								<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
									{emailList.map((emailItem) => (
										<Chip key={emailItem} label={emailItem} onDelete={() => handleRemoveEmail(emailItem)} size="small" sx={{ m: 0.5 }} />
									))}
								</Box>
							</Box>
						)}

						<Divider sx={{ my: 2 }}>
							<Typography variant="caption" color="textSecondary">
								o seleccionar de mis contactos
							</Typography>
						</Divider>

						{contactsLoading ? (
							<Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
								<Typography>Cargando contactos...</Typography>
							</Box>
						) : contacts && contacts.length > 0 ? (
							<Autocomplete
								size="small"
								options={contacts.filter((contact: any) => contact.email)}
								getOptionLabel={(option: any) => `${option.name} ${option.lastName} (${option.email})`}
								renderInput={(params) => (
									<TextField
										{...params}
										label="Buscar contacto"
										variant="outlined"
										size="small"
										InputProps={{
											...params.InputProps,
											startAdornment: (
												<InputAdornment position="start">
													<SearchNormal1 size={16} />
												</InputAdornment>
											),
										}}
									/>
								)}
								renderOption={(props, option: any) => (
									<li {...props}>
										<Stack direction="row" spacing={1} alignItems="center" width="100%">
											<UserAdd size={16} />
											<Stack direction="column" sx={{ overflow: "hidden" }}>
												<Typography variant="body2" noWrap>
													{option.name} {option.lastName}
												</Typography>
												<Typography variant="caption" color="textSecondary" noWrap>
													{option.email}
												</Typography>
											</Stack>
										</Stack>
									</li>
								)}
								onChange={(_, newValue) => {
									if (newValue && newValue.email && !emailList.includes(newValue.email)) {
										setEmailList([...emailList, newValue.email]);
									}
								}}
								sx={{ mt: 1 }}
							/>
						) : null}

						<Box sx={{ mt: 2 }}>
							<Typography variant="subtitle2" gutterBottom>
								Mensaje (opcional):
							</Typography>
							<TextField
								multiline
								fullWidth
								rows={4}
								placeholder="Escriba un mensaje personalizado que se incluirá en el correo (opcional)"
								value={customMessage}
								onChange={(e) => setCustomMessage(e.target.value)}
								variant="outlined"
								size="small"
							/>
						</Box>

						<Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
							<Checkbox size="small" checked={copyToMe} onChange={(e) => setCopyToMe(e.target.checked)} id="copy-to-me" />
							<Typography component="label" htmlFor="copy-to-me" variant="body2" sx={{ cursor: "pointer" }}>
								Enviarme una copia
							</Typography>
						</Box>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button
						color="error"
						onClick={() => {
							setEmailModalOpen(false);
							setEmail("");
							setEmailList([]);
							setCopyToMe(false);
							setCustomMessage("");
						}}
					>
						Cancelar
					</Button>
					<Button onClick={handleEmailSend} variant="contained">
						Enviar
					</Button>
				</DialogActions>
			</Dialog>

			{/* Link Modal */}
			<LinkCauseModal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} calculationId={data._id} folderId={data.folderId} />

			{/* Interest Modal */}
			{!hideInterestButton && (
				<Dialog open={updateModalOpen} onClose={() => setUpdateModalOpen(false)}>
					<DialogTitle>Actualizar con Intereses</DialogTitle>
					<DialogContent>
						<TextField
							autoFocus
							margin="dense"
							label="Tasa de Interés (%)"
							type="number"
							fullWidth
							value={interestRate}
							onChange={(e) => setInterestRate(e.target.value)}
							size="small"
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setUpdateModalOpen(false)}>Cancelar</Button>
						<Button onClick={handleUpdateWithInterest} variant="contained">
							Actualizar
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</>
	);
};
