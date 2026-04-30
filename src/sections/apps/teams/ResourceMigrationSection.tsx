// sections/apps/teams/ResourceMigrationSection.tsx
import { useState } from "react";
import {
	Box,
	Stack,
	Typography,
	Button,
	Alert,
	Card,
	CardContent,
	CircularProgress,
	Divider,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	TextField,
} from "@mui/material";
import {
	FolderOpen,
	Calculator,
	People,
	Note,
	Calendar,
	Task,
	DocumentText,
	MoneyRecive,
	Clock,
	ArrowRight2,
	Trash,
	Warning2,
} from "iconsax-react";
import { useTheme } from "@mui/material/styles";

interface ResourceSummary {
	folders: number;
	calculators: number;
	contacts: number;
	notes: number;
	events: number;
	tasks: number;
	documents: number;
	movements: number;
	availabilities: number;
	totalStorage: number;
}

interface ResourceMigrationSectionProps {
	resourceSummary: ResourceSummary;
	teamName: string;
	onMigrate: () => Promise<void>;
	onDelete: () => Promise<void>;
	onCancel: () => void;
	isSubmitting: boolean;
}

export default function ResourceMigrationSection({
	resourceSummary,
	teamName,
	onMigrate,
	onDelete,
	onCancel,
	isSubmitting,
}: ResourceMigrationSectionProps) {
	const theme = useTheme();
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteConfirmText, setDeleteConfirmText] = useState("");

	// Calculate total resources
	const totalResources =
		resourceSummary.folders +
		resourceSummary.calculators +
		resourceSummary.contacts +
		resourceSummary.notes +
		resourceSummary.events +
		resourceSummary.tasks +
		resourceSummary.documents +
		resourceSummary.movements +
		resourceSummary.availabilities;

	// Format storage size
	const formatStorage = (bytes: number): string => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	// Resource items for display
	const resourceItems = [
		{ icon: FolderOpen, label: "Causas", count: resourceSummary.folders },
		{ icon: Calculator, label: "Calculadoras", count: resourceSummary.calculators },
		{ icon: People, label: "Contactos", count: resourceSummary.contacts },
		{ icon: Note, label: "Notas", count: resourceSummary.notes },
		{ icon: Calendar, label: "Eventos", count: resourceSummary.events },
		{ icon: Task, label: "Tareas", count: resourceSummary.tasks },
		{ icon: DocumentText, label: "Documentos", count: resourceSummary.documents },
		{ icon: MoneyRecive, label: "Movimientos", count: resourceSummary.movements },
		{ icon: Clock, label: "Disponibilidades", count: resourceSummary.availabilities },
	].filter((item) => item.count > 0);

	const handleDeleteConfirm = async () => {
		if (deleteConfirmText === "ELIMINAR TODO") {
			await onDelete();
			setShowDeleteConfirm(false);
		}
	};

	return (
		<Stack spacing={3}>
			{/* Warning Alert */}
			<Alert severity="warning" icon={<Warning2 size={24} />}>
				<Typography variant="subtitle2" fontWeight={600}>
					Tienes recursos existentes en tu cuenta
				</Typography>
				<Typography variant="body2">
					Antes de unirte al equipo <strong>{teamName}</strong>, debes decidir qué hacer con tus recursos actuales.
				</Typography>
			</Alert>

			{/* Resource Summary Card */}
			<Card variant="outlined">
				<CardContent>
					<Stack spacing={2}>
						<Typography variant="h6">Resumen de tus recursos</Typography>

						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								p: 2,
								bgcolor: "background.default",
								borderRadius: 1,
							}}
						>
							<Box>
								<Typography variant="h3" color="primary.main">
									{totalResources}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									recursos en total
								</Typography>
							</Box>
							<Box textAlign="right">
								<Typography variant="h5" color="secondary.main">
									{formatStorage(resourceSummary.totalStorage)}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									almacenamiento usado
								</Typography>
							</Box>
						</Box>

						<Divider />

						<List dense disablePadding>
							{resourceItems.map((item) => (
								<ListItem key={item.label} sx={{ py: 0.5 }}>
									<ListItemIcon sx={{ minWidth: 36 }}>
										<item.icon size={20} color={theme.palette.text.secondary} />
									</ListItemIcon>
									<ListItemText primary={item.label} />
									<Typography variant="body2" fontWeight={600}>
										{item.count}
									</Typography>
								</ListItem>
							))}
						</List>
					</Stack>
				</CardContent>
			</Card>

			{/* Options */}
			<Typography variant="subtitle2" color="text.secondary">
				Selecciona una opción para continuar:
			</Typography>

			{/* Option 1: Migrate */}
			<Card
				variant="outlined"
				sx={{
					cursor: isSubmitting ? "default" : "pointer",
					transition: "all 0.2s",
					"&:hover": isSubmitting
						? {}
						: {
								borderColor: "primary.main",
								bgcolor: "primary.lighter",
						  },
				}}
				onClick={() => !isSubmitting && onMigrate()}
			>
				<CardContent>
					<Stack direction="row" alignItems="flex-start" spacing={2}>
						<Box
							sx={{
								width: 48,
								height: 48,
								borderRadius: 2,
								bgcolor: "primary.lighter",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
							}}
						>
							<ArrowRight2 size={24} color={theme.palette.primary.main} />
						</Box>
						<Box sx={{ flex: 1 }}>
							<Typography variant="subtitle1" fontWeight={600}>
								Migrar recursos al equipo
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
								Tus recursos pasarán a ser propiedad del equipo <strong>{teamName}</strong>:
							</Typography>
							<Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, "& li": { mb: 0.5 } }}>
								<Typography component="li" variant="body2" color="text.secondary">
									Serán accesibles por todos los miembros según sus permisos
								</Typography>
								<Typography component="li" variant="body2" color="text.secondary">
									Incluye tus recursos archivados (permanecerán archivados)
								</Typography>
								<Typography component="li" variant="body2" color="text.secondary">
									Todo lo que crees en el futuro también pertenecerá al equipo
								</Typography>
							</Box>
							<Alert
								severity="warning"
								icon={<Warning2 size={18} />}
								sx={{
									mt: 1.5,
									py: 0.5,
									"& .MuiAlert-message": { py: 0 },
								}}
							>
								<Typography variant="caption">
									Si abandonas el equipo, estos recursos permanecerán en el equipo y no podrás recuperarlos.
								</Typography>
							</Alert>
						</Box>
						{isSubmitting && <CircularProgress size={24} />}
					</Stack>
				</CardContent>
			</Card>

			{/* Option 2: Delete */}
			<Card
				variant="outlined"
				sx={{
					cursor: isSubmitting ? "default" : "pointer",
					borderColor: "error.light",
					transition: "all 0.2s",
					"&:hover": isSubmitting
						? {}
						: {
								borderColor: "error.main",
								bgcolor: "error.lighter",
						  },
				}}
				onClick={() => !isSubmitting && setShowDeleteConfirm(true)}
			>
				<CardContent>
					<Stack direction="row" alignItems="center" spacing={2}>
						<Box
							sx={{
								width: 48,
								height: 48,
								borderRadius: 2,
								bgcolor: "error.lighter",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Trash size={24} color={theme.palette.error.main} />
						</Box>
						<Box sx={{ flex: 1 }}>
							<Typography variant="subtitle1" fontWeight={600} color="error.main">
								Eliminar mis recursos
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Todos tus recursos se eliminarán permanentemente. Esta acción no se puede deshacer.
							</Typography>
						</Box>
					</Stack>
				</CardContent>
			</Card>

			{/* Cancel Button */}
			<Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
				Cancelar y rechazar invitación
			</Button>

			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
				<DialogTitle sx={{ color: "error.main" }}>Confirmar eliminación</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Estás a punto de eliminar permanentemente <strong>{totalResources} recursos</strong> y{" "}
						<strong>{formatStorage(resourceSummary.totalStorage)}</strong> de almacenamiento.
					</DialogContentText>
					<DialogContentText sx={{ mt: 2 }}>
						Esta acción <strong>NO SE PUEDE DESHACER</strong>. Para confirmar, escribe <strong>ELIMINAR TODO</strong> a continuación:
					</DialogContentText>
					<TextField
						fullWidth
						value={deleteConfirmText}
						onChange={(e) => setDeleteConfirmText(e.target.value)}
						placeholder="ELIMINAR TODO"
						sx={{ mt: 2 }}
						error={deleteConfirmText !== "" && deleteConfirmText !== "ELIMINAR TODO"}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
					<Button
						onClick={handleDeleteConfirm}
						color="error"
						variant="contained"
						disabled={deleteConfirmText !== "ELIMINAR TODO" || isSubmitting}
					>
						{isSubmitting ? <CircularProgress size={20} /> : "Eliminar todo"}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
