import React, { useEffect, useState, useCallback } from "react";
import {
	Box,
	Typography,
	Button,
	LinearProgress,
	Chip,
	Stack,
	useTheme,
	alpha,
	CircularProgress,
	Alert,
} from "@mui/material";
import { DocumentUpload, TickCircle, CloseCircle, Refresh2, Danger, Lock1 } from "iconsax-react";
import dayjs from "utils/dayjs-config";
import { useSelector } from "react-redux";
import { dispatch } from "store";
import { fetchIndexStatus, triggerIndexation } from "store/reducers/rag";
import { RagIndexStatus as RagIndexStatusType } from "types/rag";
import useAuth from "hooks/useAuth";

// ==============================|| RAG INDEX STATUS ||============================== //

interface RagIndexStatusProps {
	causaId: string;
	causaType: string;
	folderId: string;
	onIndexed?: () => void;
}

const RagIndexStatus: React.FC<RagIndexStatusProps> = ({ causaId, causaType, folderId, onIndexed }) => {
	const theme = useTheme();
	const { subscription } = useAuth();
	const userPlan = subscription?.plan || "free";
	const isFreePlan = userPlan === "free";
	const indexStatus = useSelector((state: any) => state.rag?.indexStatus as RagIndexStatusType | null);
	const isIndexing = useSelector((state: any) => state.rag?.isIndexing as boolean);
	const isLoadingIndex = useSelector((state: any) => state.rag?.isLoadingIndex as boolean);
	const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

	// Fetch status on mount and when causaId changes
	useEffect(() => {
		if (causaId) {
			dispatch(fetchIndexStatus(causaId));
		}
	}, [causaId]);

	// Poll while indexing
	useEffect(() => {
		if (indexStatus?.status === "indexing" || indexStatus?.status === "pending") {
			const interval = setInterval(() => {
				dispatch(fetchIndexStatus(causaId));
			}, 5000);
			setPollingInterval(interval);

			return () => clearInterval(interval);
		} else {
			if (pollingInterval) {
				clearInterval(pollingInterval);
				setPollingInterval(null);
			}
			// Notify parent when indexation completes
			if (indexStatus?.status === "indexed" && onIndexed) {
				onIndexed();
			}
		}
	}, [indexStatus?.status, causaId]);

	const handleStartIndexation = useCallback(async () => {
		await dispatch(triggerIndexation(causaId, { causaType, folderId }));
	}, [causaId, causaType, folderId]);

	// Not indexed yet
	if (isLoadingIndex) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
				<CircularProgress size={24} />
			</Box>
		);
	}

	if (!indexStatus) {
		return (
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: 2,
					py: 4,
					px: 3,
					textAlign: "center",
					flex: 1,
				}}
			>
				<Box
					sx={{
						width: 64,
						height: 64,
						borderRadius: "50%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(isFreePlan ? theme.palette.warning.main : theme.palette.primary.main, 0.08),
					}}
				>
					{isFreePlan ? (
						<Lock1 size={32} color={theme.palette.warning.main} />
					) : (
						<DocumentUpload size={32} color={theme.palette.primary.main} />
					)}
				</Box>
				<Typography variant="h6">
					{isFreePlan ? "Funcionalidad Premium" : "Indexar expediente"}
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
					{isFreePlan
						? "El chat con IA no está disponible en el plan gratuito. Actualizá tu plan para indexar expedientes y realizar consultas inteligentes."
						: "Para poder usar el chat con IA, primero es necesario indexar los documentos del expediente. Este proceso analiza los PDFs, extrae el texto y lo prepara para consultas inteligentes."}
				</Typography>
				{isFreePlan ? (
					<Button
						variant="outlined"
						color="warning"
						href="/pricing"
						sx={{ mt: 1 }}
					>
						Ver planes
					</Button>
				) : (
				<Button
					variant="contained"
					startIcon={isIndexing ? <CircularProgress size={16} color="inherit" /> : <DocumentUpload size={18} />}
					onClick={handleStartIndexation}
					disabled={isIndexing}
					sx={{ mt: 1 }}
				>
					{isIndexing ? "Iniciando..." : "Indexar expediente"}
				</Button>
				)}
			</Box>
		);
	}

	// Indexing in progress
	if (indexStatus.status === "indexing" || indexStatus.status === "pending") {
		const progress =
			indexStatus.documentsTotal > 0 ? Math.round((indexStatus.documentsProcessed / indexStatus.documentsTotal) * 100) : 0;

		return (
			<Box sx={{ py: 3, px: 3 }}>
				<Stack spacing={2} alignItems="center">
					<CircularProgress size={40} />
					<Typography variant="subtitle1">Indexando expediente...</Typography>
					<Box sx={{ width: "100%", maxWidth: 400 }}>
						<LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
						<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", textAlign: "center" }}>
							{indexStatus.documentsProcessed} / {indexStatus.documentsTotal} documentos procesados ({progress}%)
						</Typography>
					</Box>
					{indexStatus.chunksTotal > 0 && (
						<Typography variant="caption" color="text.secondary">
							{indexStatus.chunksTotal} fragmentos generados
						</Typography>
					)}
				</Stack>
			</Box>
		);
	}

	// Error state
	if (indexStatus.status === "error") {
		return (
			<Box sx={{ py: 3, px: 3 }}>
				<Alert
					severity="error"
					action={
						<Button color="inherit" size="small" startIcon={<Refresh2 size={14} />} onClick={handleStartIndexation}>
							Reintentar
						</Button>
					}
				>
					Error durante la indexacion: {indexStatus.error?.message || "Error desconocido"}
				</Alert>
			</Box>
		);
	}

	// Indexed successfully - show summary
	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				gap: 1.5,
				px: 2,
				py: 1,
				bgcolor: alpha(theme.palette.success.main, 0.06),
				border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
				borderRadius: 1,
			}}
		>
			<TickCircle size={18} color={theme.palette.success.main} variant="Bold" />
			<Typography variant="caption" color="text.secondary">
				Indexado: {indexStatus.documentsProcessed} docs, {indexStatus.chunksTotal} fragmentos
				{indexStatus.lastIndexedAt && ` - ${dayjs(indexStatus.lastIndexedAt).format("DD/MM/YYYY HH:mm")}`}
			</Typography>
			{indexStatus.documentsWithError > 0 && (
				<Chip
					size="small"
					icon={<Danger size={12} />}
					label={`${indexStatus.documentsWithError} errores`}
					sx={{ height: 22, fontSize: "0.65rem" }}
					color="warning"
					variant="outlined"
				/>
			)}
		</Box>
	);
};

export default RagIndexStatus;
