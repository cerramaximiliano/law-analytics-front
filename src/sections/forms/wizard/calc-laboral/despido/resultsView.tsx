import React, { useState, useMemo, useRef } from "react";
import {
	Button,
	CardContent,
	Typography,
	Stack,
	IconButton,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
} from "@mui/material";
import MainCard from "components/MainCard";
import { Copy, Sms, Printer, Link21, Calculator, Save2 } from "iconsax-react";
import despidoFormModel from "./formModel/despidoFormModel";
import styled from "@emotion/styled";
import { useReactToPrint } from "react-to-print";
import { openSnackbar } from "store/reducers/snackbar";
import { dispatch, useSelector } from "store";

//third party
import moment from "moment";
import axios from "axios";
import { addCalculator } from "store/reducers/calculator";
import LinkCauseModal from "../components/linkCauseModal";

// Tipos
interface ResultItem {
	key: string;
	value: number | string;
}

interface GroupedResults {
	reclamo: ResultItem[];
	indemnizacion: ResultItem[];
	liquidacion: ResultItem[];
	multas: ResultItem[];
	otros: ResultItem[];
}

interface ResultsViewProps {
	values: Record<string, any>;
	onReset: () => void;
}

const PrintContainer = styled("div")`
	@media print {
		@page {
			size: auto;
			margin: 20mm;
		}

		& .no-print {
			display: none !important;
		}

		& .MuiCard-root {
			break-inside: avoid;
			page-break-inside: avoid;
			margin-bottom: 16px;
			border: 1px solid #ddd;
		}

		& .total-card {
			break-inside: avoid;
			page-break-inside: avoid;
			background-color: #f5f5f5 !important;
			color: #000 !important;
		}

		& .MuiTypography-root {
			color: #000 !important;
		}
	}
`;

const ResultsView: React.FC<ResultsViewProps> = ({ values, onReset }) => {
	const [emailModalOpen, setEmailModalOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [causeNumber, setCauseNumber] = useState("");
	const [updateModalOpen, setUpdateModalOpen] = useState(false);
	const [interestRate, setInterestRate] = useState("");

	const [savedCalculationId, setSavedCalculationId] = useState<string | null>(null);

	const userId = useSelector((state) => state.auth.user?._id);

	const printRef = useRef<HTMLDivElement>(null);
	const { formField } = despidoFormModel;

	const getLabelForKey = (key: string): string => {
		const field = formField[key as keyof typeof formField];
		return field?.label || key;
	};

	const formatValue = (key: string, value: number | string): string => {
		if (key === "fechaIngreso" || key === "fechaEgreso") {
			const date = moment(value);
			if (date.isValid()) {
				return date.format("DD/MM/YYYY");
			}
			return String(value);
		}

		// Para Períodos y otros valores numéricos
		if (key === "Periodos" || key === "Días Vacaciones") {
			const numValue = Number(value);
			return !isNaN(numValue) ? numValue.toFixed(2) : "0.00";
		}

		// Para valores monetarios
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

	const shouldShowValue = (value: number | string): boolean => {
		if (typeof value === "number") {
			return value !== 0;
		}
		return value !== "";
	};

	const groupResults = (inputValues: Record<string, any>): GroupedResults => {
		const groups: GroupedResults = {
			reclamo: [],
			indemnizacion: [],
			liquidacion: [],
			multas: [],
			otros: [],
		};

		Object.entries(inputValues).forEach(([key, value]) => {
			if (value == null || value === "" || value === false) return;
			if (typeof value === "object" || typeof value === "boolean") return;
			if (!shouldShowValue(value)) return;

			const item: ResultItem = { key, value };

			if (["reclamante", "reclamado", "fechaIngreso", "fechaEgreso", "remuneracion"].includes(key)) {
				groups.reclamo.push(item);
			} else if (key === "Indemnizacion" || key === "Periodos") {
				groups.indemnizacion.push(item);
			} else if (
				key.includes("Preaviso") ||
				key.includes("SAC") ||
				key.includes("Integracion") ||
				key.includes("Vacaciones") ||
				key.includes("Días Trabajados")
			) {
				groups.liquidacion.push(item);
			} else if (key.includes("Multa")) {
				groups.multas.push(item);
			} else if (!["isLiquidacion", "isMultas", "isTopes"].includes(key)) {
				groups.otros.push(item);
			}
		});

		return groups;
	};

	const groupedResults = useMemo(() => groupResults(values), [values]);

	const total = useMemo(() => {
		const sumableGroups = ["indemnizacion", "liquidacion", "multas", "otros"];
		return Object.entries(groupedResults)
			.filter(([group]) => sumableGroups.includes(group))
			.flatMap(([_, items]) => items)
			.reduce((sum, { key, value }) => {
				// No sumar si la key es Periodos o Días Vacaciones
				if (key === "Periodos" || key === "Días Vacaciones") {
					return sum;
				}
				// Solo sumar si es un número
				return sum + (typeof value === "number" ? value : 0);
			}, 0);
	}, [groupedResults]);

	const generatePlainText = () => {
		let text = "RESULTADOS DE LA LIQUIDACIÓN\n\n";
		Object.entries(groupedResults).forEach(([group, items]: [string, ResultItem[]]) => {
			if (items.length) {
				text += `${group.toUpperCase()}\n`;
				items.forEach((item: ResultItem) => {
					text += `${getLabelForKey(item.key)}: ${formatValue(item.key, item.value)}\n`;
				});
				text += "\n";
			}
		});
		text += `TOTAL: ${formatValue("total", total)}`;
		return text;
	};

	const generateHtmlContent = () => {
		const styles = `
		  <style>
			.container { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
			.header { text-align: center; margin-bottom: 24px; }
			.header h2 { color: #333; margin: 0; }
			.card { 
			  border: 1px solid #ddd; 
			  border-radius: 8px; 
			  margin-bottom: 16px; 
			  break-inside: avoid;
			  page-break-inside: avoid;
			  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
			.row { 
			  display: flex; 
			  justify-content: space-between; 
			  padding: 8px 0;
			  border-bottom: 1px solid #eee;
			}
			.row:last-child { border-bottom: none; }
			.label { color: #666; }
			.value { font-weight: 500; color: #333; }
			.total-card {
			  background-color: #1976d2;
			  color: white;
			  margin-top: 24px;
			}
			.total-content {
			  display: flex;
			  justify-content: space-between;
			  padding: 16px;
			  font-size: 1.2em;
			  font-weight: bold;
			}
		  </style>
		`;

		const renderCard = (title: string, items: ResultItem[]) => {
			if (!items.length) return "";

			const rows = items
				.map(
					({ key, value }) => `
			<div class="row">
			  <span class="label">${getLabelForKey(key)}:</span>
			  <span class="value">${formatValue(key, value)}</span>
			</div>
		  `,
				)
				.join("");

			return `
			<div class="card">
			  <div class="card-header">${title}</div>
			  <div class="card-content">
				${rows}
			  </div>
			</div>
		  `;
		};

		const groupSections = [
			{ title: "Datos del Reclamo", data: groupedResults.reclamo },
			{ title: "Indemnización", data: groupedResults.indemnizacion },
			{ title: "Liquidación Final", data: groupedResults.liquidacion },
			{ title: "Multas", data: groupedResults.multas },
			{ title: "Otros Conceptos", data: groupedResults.otros },
		];

		const cardsHtml = groupSections
			.map((section) => renderCard(section.title, section.data))
			.filter((card) => card !== "")
			.join("");

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
				  <h2>Resultados de la Liquidación</h2>
				</div>
				
				${cardsHtml}
				
				<div class="card total-card">
				  <div class="total-content">
					<span>TOTAL</span>
					<span>${formatValue("total", total)}</span>
				  </div>
				</div>
			  </div>
			</body>
		  </html>
		`;
	};

	const handleCopyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(generatePlainText());
			dispatch(
				openSnackbar({
					open: true,
					message: `Liquidación copiada correctamente.`,
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

	const handleEmailSend = async () => {
		try {
			const htmlBody = generateHtmlContent();
			const textBody = generatePlainText();
			const subject = "Liquidación por Despido - Law||Analytics";

			await axios.post(`${process.env.REACT_APP_BASE_URL}/api/email/send-email`, {
				to: email,
				subject,
				htmlBody,
				textBody,
			});
			dispatch(
				openSnackbar({
					open: true,
					message: `Liquidación enviada correctamente.`,
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
			setEmailModalOpen(false);
			setEmail("");
		} catch (error: any) {
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

	const handleLinkToCause = () => {
		console.log("Vinculando a causa:", causeNumber);
		setLinkModalOpen(true);
		setCauseNumber("");
	};

	const handleUpdateWithInterest = () => {
		console.log("Actualizando con tasa:", interestRate);
		setUpdateModalOpen(false);
		setInterestRate("");
	};

	const handleSaveCalculation = async () => {
		console.log("Guardando cálculo");
		try {
			const calculatorData = {
				date: moment().format("YYYY-MM-DD"),
				type: "Calculado" as const,
				classType: "laboral" as const,
				subClassType: "despido" as const,
				amount: total, // El total ya calculado
				userId: userId,
				variables: {
					...values,
					groupedResults,
					total,
				},
			};
			const result = await dispatch(addCalculator(calculatorData));

			if (result.success) {
				setSavedCalculationId(result.calculator._id);
				dispatch(
					openSnackbar({
						open: true,
						message: "Cálculo guardado correctamente",
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al guardar el cálculo",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		} catch (error) {}
	};

	const renderActionButtons = () => (
		<Stack direction="row" spacing={1} sx={{ mb: 2 }} justifyContent="center" className="no-print">
			<Tooltip title="Copiar al portapapeles">
				<IconButton onClick={handleCopyToClipboard} color="primary">
					<Copy size={24} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Enviar por email">
				<IconButton onClick={() => setEmailModalOpen(true)} color="primary">
					<Sms size={24} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Imprimir">
				<IconButton onClick={handlePrint} color="primary">
					<Printer size={24} />
				</IconButton>
			</Tooltip>
			<Tooltip title={savedCalculationId ? "Vincular a causa" : "Guarde el cálculo primero"}>
				<span>
					<IconButton onClick={handleLinkToCause} color="primary" disabled={!savedCalculationId}>
						<Link21 size={24} />
					</IconButton>
				</span>
			</Tooltip>
			<Tooltip title="Actualizar con intereses">
				<IconButton onClick={() => setUpdateModalOpen(true)} color="primary">
					<Calculator size={24} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Guardar cálculo">
				<IconButton onClick={handleSaveCalculation} color="primary">
					<Save2 size={24} />
				</IconButton>
			</Tooltip>
		</Stack>
	);

	const renderGroup = (title: string, items: ResultItem[]): React.ReactNode => {
		if (!items.length) return null;

		return (
			<MainCard title={title} shadow={3} sx={{ mb: 2 }}>
				<CardContent>
					{items.map(({ key, value }) => (
						<Stack key={key} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
							<Typography variant="body1" color="text.secondary">
								{getLabelForKey(key)}:
							</Typography>
							<Typography variant="body1" fontWeight="medium">
								{formatValue(key, value)}
							</Typography>
						</Stack>
					))}
				</CardContent>
			</MainCard>
		);
	};

	const PrintableContent = React.forwardRef<HTMLDivElement>((_, ref) => (
		<div ref={ref}>
			<Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: "center" }}>
				Resultados de la Liquidación
			</Typography>

			{renderGroup("Datos del Reclamo", groupedResults.reclamo)}
			{renderGroup("Indemnización", groupedResults.indemnizacion)}
			{renderGroup("Liquidación Final", groupedResults.liquidacion)}
			{renderGroup("Multas", groupedResults.multas)}
			{renderGroup("Otros Conceptos", groupedResults.otros)}

			<MainCard
				shadow={3}
				className="total-card"
				sx={{
					mt: 3,
					bgcolor: "primary.main",
					color: "primary.contrastText",
				}}
				content={false}
			>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
					<Typography variant="h5" color="inherit">
						TOTAL
					</Typography>
					<Typography variant="h5" color="inherit">
						{formatValue("total", total)}
					</Typography>
				</Stack>
			</MainCard>
		</div>
	));

	return (
		<PrintContainer>
			{renderActionButtons()}

			<PrintableContent ref={printRef} />

			<Stack direction="row" justifyContent="flex-end" className="no-print">
				<Button variant="contained" color="error" onClick={onReset} sx={{ mt: 3 }}>
					Nueva Liquidación
				</Button>
			</Stack>

			<div className="no-print">
				<Dialog open={emailModalOpen} onClose={() => setEmailModalOpen(false)}>
					<DialogTitle>Enviar por Email</DialogTitle>
					<DialogContent>
						<TextField
							autoFocus
							margin="dense"
							label="Dirección de Email"
							type="email"
							fullWidth
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setEmailModalOpen(false)}>Cancelar</Button>
						<Button onClick={handleEmailSend} variant="contained">
							Enviar
						</Button>
					</DialogActions>
				</Dialog>

				<LinkCauseModal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} calculationId={savedCalculationId || ""} />

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
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setUpdateModalOpen(false)}>Cancelar</Button>
						<Button onClick={handleUpdateWithInterest} variant="contained">
							Actualizar
						</Button>
					</DialogActions>
				</Dialog>
			</div>
		</PrintContainer>
	);
};

export default ResultsView;
