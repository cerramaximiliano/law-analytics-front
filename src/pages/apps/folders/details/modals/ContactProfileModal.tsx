import React from "react";
import {
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Box,
	Stack,
	Avatar,
	Chip,
	Divider,
	useTheme,
	alpha,
	Grid,
	Paper,
} from "@mui/material";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import { Call, Sms, Location, Building, Briefcase, User, DocumentText, Profile } from "iconsax-react";
import { Contact } from "types/contact";

interface ContactProfileModalProps {
	open: boolean;
	onClose: () => void;
	contact: Contact | null;
}

const getColorByRole = (role: string) => {
	switch (role) {
		case "Abogado":
			return "primary";
		case "Cliente":
			return "secondary";
		case "Causante":
			return "error";
		case "Mediador/Conciliador":
			return "warning";
		case "Perito":
			return "success";
		case "Contrario":
			return "info";
		case "Entidad":
			return "default";
		default:
			return "default";
	}
};

const getRoleIcon = (role: string) => {
	switch (role) {
		case "Abogado":
			return "⚖️";
		case "Cliente":
			return "👤";
		case "Causante":
			return "📋";
		case "Mediador/Conciliador":
			return "🤝";
		case "Perito":
			return "🔍";
		case "Contrario":
			return "⚔️";
		case "Entidad":
			return "🏢";
		default:
			return "👥";
	}
};

const ContactProfileModal: React.FC<ContactProfileModalProps> = ({ open, onClose, contact }) => {
	const theme = useTheme();

	if (!contact) return null;

	const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) => {
		if (!value) return null;
		return (
			<Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
				<Box sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>{icon}</Box>
				<Box sx={{ flex: 1 }}>
					<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
						{label}
					</Typography>
					<Typography variant="body2">{value}</Typography>
				</Box>
			</Box>
		);
	};

	return (
		<ResponsiveDialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			PaperProps={{
				sx: {
					p: 0,
					borderRadius: 2,
					boxShadow: `0 2px 10px -2px ${theme.palette.divider}`,
				},
			}}
			sx={{
				"& .MuiDialog-paper": { p: 0 },
				"& .MuiBackdrop-root": { opacity: "0.5 !important" },
			}}
		>
			<DialogTitle
				sx={{
					bgcolor: theme.palette.primary.lighter,
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Stack direction="row" alignItems="center" spacing={1}>
						<Profile size={24} color={theme.palette.primary.main} />
						<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
							Perfil del Contacto
						</Typography>
					</Stack>
					<Chip
						label={contact?.role || ""}
						color={getColorByRole(contact?.role || "")}
						size="small"
						sx={{
							fontWeight: 600,
							...(getColorByRole(contact?.role || "") === "warning" && {
								color: "black",
								"& .MuiChip-label": {
									color: "black",
								},
							}),
						}}
					/>
				</Stack>
			</DialogTitle>
			<Divider />

			<DialogContent sx={{ p: 3 }}>
				{/* Header with Avatar and Basic Info */}
				<Box sx={{ mb: 3, textAlign: "center" }}>
					<Avatar
						src={contact.avatar}
						variant="rounded"
						sx={{
							width: 100,
							height: 100,
							bgcolor: alpha(theme.palette.primary.main, 0.1),
							color: theme.palette.primary.main,
							fontSize: "2.5rem",
							border: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							mx: "auto",
							mb: 2,
						}}
					>
						{!contact.avatar && getRoleIcon(contact.role)}
					</Avatar>
					<Typography variant="h4" fontWeight={600} gutterBottom>
						{`${contact.name || ""} ${contact.lastName || ""}`}
					</Typography>
					{contact.status && (
						<Chip
							label={contact.status === "active" ? "Activo" : "Inactivo"}
							color={contact.status === "active" ? "success" : "default"}
							size="small"
							sx={{ mt: 1 }}
						/>
					)}
				</Box>

				<Divider sx={{ mb: 3 }} />

				{/* Contact Information */}
				<Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
					<Grid item xs={12} md={6}>
						<Stack spacing={2.5}>
							<InfoItem icon={<User size={18} />} label="Documento" value={contact.document} />
							<InfoItem icon={<User size={18} />} label="CUIT" value={contact.cuit} />
							<InfoItem icon={<Call size={18} />} label="Teléfono" value={contact.phone} />
							<InfoItem icon={<Sms size={18} />} label="Email" value={contact.email} />
						</Stack>
					</Grid>
					<Grid item xs={12} md={6}>
						<Stack spacing={2.5}>
							<InfoItem icon={<Location size={18} />} label="Dirección" value={contact.address} />
							<InfoItem icon={<Building size={18} />} label="Ciudad" value={contact.city} />
							<InfoItem icon={<Briefcase size={18} />} label="Provincia" value={contact.state} />
						</Stack>
					</Grid>
				</Grid>

				{/* Additional Information */}
				{(contact.activity || contact.company) && (
					<>
						<Divider sx={{ my: 3 }} />
						<Box>
							<Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
								<DocumentText size={18} color={theme.palette.text.secondary} />
								<Typography variant="subtitle2" fontWeight={600}>
									Información adicional
								</Typography>
							</Stack>
							<Paper
								elevation={0}
								sx={{
									p: 2,
									bgcolor: theme.palette.grey[50],
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: 1,
								}}
							>
								<Stack spacing={1}>
									{contact.activity && (
										<Typography variant="body2">
											<strong>Actividad:</strong> {contact.activity}
										</Typography>
									)}
									{contact.company && (
										<Typography variant="body2">
											<strong>Empresa:</strong> {contact.company}
										</Typography>
									)}
									{contact.nationality && (
										<Typography variant="body2">
											<strong>Nacionalidad:</strong> {contact.nationality}
										</Typography>
									)}
								</Stack>
							</Paper>
						</Box>
					</>
				)}
			</DialogContent>

			<Divider />

			<DialogActions
				sx={{
					p: 2.5,
					bgcolor: theme.palette.background.default,
					borderTop: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Button color="error" onClick={onClose}>
					Cancelar
				</Button>
			</DialogActions>
		</ResponsiveDialog>
	);
};

export default ContactProfileModal;
