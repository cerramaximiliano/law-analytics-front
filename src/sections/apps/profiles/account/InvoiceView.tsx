import React from "react";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	Divider,
	Grid,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
	useTheme,
} from "@mui/material";
import { Payment, PaymentItem } from "store/reducers/ApiService";
import LogoSection from "components/logo";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, DocumentDownload } from "iconsax-react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

// Propiedades para el componente de factura
interface InvoiceProps {
	open: boolean;
	onClose: () => void;
	payment: Payment | null;
	userEmail?: string;
}

// Componente para mostrar la factura
const InvoiceView = ({ open, onClose, payment, userEmail }: InvoiceProps) => {
	const theme = useTheme();
	const invoiceRef = useRef(null);

	// Formatear fechas
	const formatDate = (dateString: string | Date | null) => {
		if (!dateString) return "N/A";

		const date = typeof dateString === "string" ? new Date(dateString) : dateString;
		return new Intl.DateTimeFormat("es-ES", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		}).format(date);
	};

	// Formatear cantidades monetarias
	const formatAmount = (amount: number, currency: string) => {
		const formatter = new Intl.NumberFormat("es-ES", {
			style: "currency",
			currency: currency || "EUR",
			minimumFractionDigits: 2,
		});
		return formatter.format(amount);
	};

	// Para imprimir la factura
	const handlePrint = useReactToPrint({
		content: () => invoiceRef.current,
		documentTitle: payment ? `Factura_${payment.receiptNumber}` : "Factura",
	});

	// Para descargar la factura como PDF (usará la funcionalidad de impresión del navegador)
	const handleDownload = () => {
		handlePrint();
	};

	if (!payment) return null;

	// Color de fondo más sutil para la sección de factura
	const subtleBackgroundColor =
		theme.palette.mode === "dark"
			? theme.palette.primary.dark + "20" // 20% de opacidad para modo oscuro
			: theme.palette.primary.light + "20"; // 20% de opacidad para modo claro

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 2,
					boxShadow: theme.shadows[5],
				},
			}}
		>
			<DialogContent sx={{ p: 0 }}>
				<SimpleBar style={{ maxHeight: "70vh" }}>
					<Box ref={invoiceRef} sx={{ p: 3 }}>
						{/* Cabecera de la factura */}
						<Grid container spacing={3} sx={{ mb: 3 }}>
							<Grid item xs={12} sm={6}>
								<Stack direction="row" alignItems="center" spacing={1}>
									<LogoSection />
								</Stack>
								<Typography variant="subtitle1" sx={{ mt: 2 }}>
									Rumba LLC
								</Typography>
								<Typography variant="body2" sx={{ mt: 1 }}>
									<br />
									soporte@lawanalytics.app
								</Typography>
							</Grid>
							<Grid item xs={12} sm={6}>
								<Box sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
									<Paper
										elevation={1}
										sx={{
											p: 2.5,
											width: { xs: "100%", sm: "auto" },
											bgcolor: subtleBackgroundColor,
											color: theme.palette.primary.main,
											borderRadius: 2,
											border: `1px solid ${theme.palette.primary.main + "20"}`,
										}}
									>
										<Typography variant="h4" sx={{ mb: 1 }}>
											FACTURA
										</Typography>
										<Grid container spacing={1}>
											<Grid item xs={6}>
												<Typography variant="subtitle2">Número:</Typography>
											</Grid>
											<Grid item xs={6}>
												<Typography variant="body2" align="right">
													{payment.receiptNumber}
												</Typography>
											</Grid>
											<Grid item xs={6}>
												<Typography variant="subtitle2">Fecha:</Typography>
											</Grid>
											<Grid item xs={6}>
												<Typography variant="body2" align="right">
													{formatDate(payment.createdAt)}
												</Typography>
											</Grid>
											<Grid item xs={6}>
												<Typography variant="subtitle2">Estado:</Typography>
											</Grid>
											<Grid item xs={6}>
												<Typography
													variant="body2"
													align="right"
													sx={{
														color:
															payment.status === "paid" || payment.status === "succeeded"
																? "success.main"
																: payment.status === "open" || payment.status === "pending"
																? "warning.main"
																: "error.main",
													}}
												>
													{payment.status === "paid"
														? "Pagada"
														: payment.status === "succeeded"
														? "Completado"
														: payment.status === "open" || payment.status === "pending"
														? "Pendiente"
														: payment.status === "refunded"
														? "Reembolsado"
														: payment.status === "failed"
														? "Fallido"
														: "Cancelada"}
												</Typography>
											</Grid>
										</Grid>
									</Paper>
								</Box>
							</Grid>
						</Grid>

						{/* Información del cliente */}
						<Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
							<Typography variant="h5" sx={{ mb: 2 }}>
								Cliente
							</Typography>
							<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
									<Typography variant="subtitle2">Email:</Typography>
									<Typography variant="body2">{payment.receiptEmail || userEmail || "No disponible"}</Typography>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Typography variant="subtitle2">ID de Cliente:</Typography>
									<Typography variant="body2">{payment.subscription?.id || "No disponible"}</Typography>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Typography variant="subtitle2">Período de facturación:</Typography>
									<Typography variant="body2">
										{formatDate(payment.period?.start)} - {formatDate(payment.period?.end)}
									</Typography>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Typography variant="subtitle2">Método de pago:</Typography>
									<Typography variant="body2">Tarjeta de crédito/débito</Typography>
								</Grid>
							</Grid>
						</Paper>

						{/* Detalle de Items */}
						<Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
							<Typography variant="h5" sx={{ mb: 2 }}>
								Detalle de la factura
							</Typography>
							<Table sx={{ mb: 3 }}>
								<TableHead>
									<TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
										<TableCell>Descripción</TableCell>
										<TableCell align="right">Período</TableCell>
										<TableCell align="right">Importe</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{payment.items &&
										payment.items.map((item: PaymentItem, index: number) => (
											<TableRow key={index}>
												<TableCell>{item.description}</TableCell>
												<TableCell align="right">
													{formatDate(item.period?.start)} - {formatDate(item.period?.end)}
												</TableCell>
												<TableCell align="right">{formatAmount(item.amount, item.currency)}</TableCell>
											</TableRow>
										))}
									{!payment.items || payment.items.length === 0 ? (
										<TableRow>
											<TableCell>{payment.description || `Suscripción plan ${payment.subscription?.plan || "estándar"}`}</TableCell>
											<TableCell align="right">
												{formatDate(payment.period?.start)} - {formatDate(payment.period?.end)}
											</TableCell>
											<TableCell align="right">{formatAmount(payment.amount, payment.currency)}</TableCell>
										</TableRow>
									) : null}
								</TableBody>
							</Table>

							{/* Totales */}
							<Divider />
							<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
								<Grid container justifyContent="flex-end" spacing={2} sx={{ maxWidth: 300 }}>
									<Grid item xs={6}>
										<Typography variant="subtitle1">Subtotal:</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="subtitle1" align="right">
											{formatAmount(payment.amount, payment.currency)}
										</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="h6">Total:</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="h6" align="right">
											{formatAmount(payment.amount, payment.currency)}
										</Typography>
									</Grid>
								</Grid>
							</Box>
						</Paper>

						{/* Notas y términos */}
						<Box sx={{ mb: 3 }}>
							<Typography variant="subtitle2" sx={{ mb: 1 }}>
								Notas:
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Este documento es una factura por los servicios de Law||Analytics prestados durante el período indicado. Para cualquier
								consulta relacionada con esta factura, por favor contacte con nuestro servicio de atención al cliente.
							</Typography>
						</Box>

						<Divider sx={{ mb: 2 }} />

						{/* Pie de página */}
						<Typography variant="body2" color="text.secondary" align="center">
							© {new Date().getFullYear()} Law||Analytics - Rumba LLC - Todos los derechos reservados
						</Typography>
					</Box>
				</SimpleBar>
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose} variant="outlined">
					Cerrar
				</Button>
				<Button startIcon={<Printer />} onClick={handlePrint} variant="outlined" color="primary" sx={{ ml: 1 }}>
					Imprimir
				</Button>
				<Button startIcon={<DocumentDownload />} onClick={handleDownload} variant="contained" color="primary" sx={{ ml: 1 }}>
					Descargar PDF
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default InvoiceView;
