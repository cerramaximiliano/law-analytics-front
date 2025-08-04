import { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	List,
	ListItem,
	ListItemButton,
	ListItemAvatar,
	ListItemText,
	Avatar,
	Radio,
	Typography,
	Box,
	Chip,
	Stack,
	useTheme,
} from "@mui/material";
import { User, Add, Profile2User } from "iconsax-react";
import { Contact } from "types/contact";

// components
import AddCustomer from "sections/apps/customer/AddCustomer";

interface ContactSelectionDialogProps {
	open: boolean;
	contacts: Contact[];
	folderId?: string;
	onSelect: (contact: Contact) => void;
	onCancel: () => void;
	onContactCreated?: (contact: Contact) => void;
}

function ContactSelectionDialog({ open, contacts, folderId, onSelect, onCancel, onContactCreated }: ContactSelectionDialogProps) {
	const theme = useTheme();
	const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
	const [showAddContact, setShowAddContact] = useState(false);

	const handleSelect = () => {
		if (selectedContact) {
			onSelect(selectedContact);
		}
	};

	const handleContactCreated = (contact: any) => {
		// Close add contact dialog
		setShowAddContact(false);

		// If a callback is provided, call it
		if (onContactCreated) {
			onContactCreated(contact);
		}

		// Select the newly created contact
		onSelect(contact);
	};

	// Filter contacts to show only relevant ones (Cliente, Contrario, etc.)
	const relevantContacts = contacts.filter((contact) =>
		["Cliente", "Abogado", "Contrario", "Mediador/Conciliador", "Causante", "Perito", "Entidad"].includes(contact.role),
	);

	return (
		<>
			<Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth disableRestoreFocus>
				<DialogTitle
					sx={{
						bgcolor: theme.palette.primary.lighter,
						p: 3,
						borderBottom: `1px solid ${theme.palette.divider}`,
					}}
				>
					<Stack spacing={1}>
						<Stack direction="row" alignItems="center" spacing={1}>
							<Profile2User size={24} color={theme.palette.primary.main} />
							<Typography
								variant="h5"
								color="primary"
								sx={{
									color: theme.palette.primary.main,
									fontWeight: 600,
								}}
							>
								Seleccionar Contacto para el Documento
							</Typography>
						</Stack>
						<Typography variant="body2" color="textSecondary">
							Seleccione el contacto que se utilizará para completar los datos del documento
						</Typography>
					</Stack>
				</DialogTitle>
				<DialogContent dividers>
					<List>
						{relevantContacts.length === 0 ? (
							<Box sx={{ textAlign: "center", py: 4 }}>
								<Typography color="textSecondary" gutterBottom>
									No hay contactos disponibles para esta carpeta
								</Typography>
								<Button variant="contained" startIcon={<Add />} onClick={() => setShowAddContact(true)} sx={{ mt: 2 }}>
									Crear Nuevo Contacto
								</Button>
							</Box>
						) : (
							relevantContacts.map((contact) => (
								<ListItem key={contact._id} disablePadding>
									<ListItemButton onClick={() => setSelectedContact(contact)} selected={selectedContact?._id === contact._id}>
										<Radio edge="start" checked={selectedContact?._id === contact._id} tabIndex={-1} disableRipple />
										<ListItemAvatar>
											<Avatar>
												<User size={20} />
											</Avatar>
										</ListItemAvatar>
										<ListItemText
											primary={`${contact.name} ${contact.lastName}`}
											secondary={
												<Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
													<Chip label={contact.role} size="small" color="primary" />
													<Typography variant="caption" color="textSecondary">
														DNI: {contact.document}
													</Typography>
												</Box>
											}
										/>
									</ListItemButton>
								</ListItem>
							))
						)}
					</List>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "space-between" }}>
					<Button startIcon={<Add />} onClick={() => setShowAddContact(true)} color="primary">
						Crear Contacto
					</Button>
					<Box>
						<Button onClick={onCancel} color="secondary">
							Cancelar
						</Button>
						<Button onClick={handleSelect} variant="contained" disabled={!selectedContact} sx={{ ml: 1 }}>
							Seleccionar
						</Button>
					</Box>
				</DialogActions>
			</Dialog>

			{/* Add Contact Dialog */}
			{showAddContact && (
				<Dialog open={showAddContact} onClose={() => setShowAddContact(false)} maxWidth="md" fullWidth disableRestoreFocus>
					<AddCustomer open={showAddContact} mode="add" onCancel={() => setShowAddContact(false)} onAddMember={handleContactCreated} />
				</Dialog>
			)}
		</>
	);
}

export default ContactSelectionDialog;
