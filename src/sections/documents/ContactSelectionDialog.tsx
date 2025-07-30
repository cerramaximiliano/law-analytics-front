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
} from "@mui/material";
import { User } from "iconsax-react";
import { Contact } from "types/contact";

interface ContactSelectionDialogProps {
	open: boolean;
	contacts: Contact[];
	onSelect: (contact: Contact) => void;
	onCancel: () => void;
}

function ContactSelectionDialog({ open, contacts, onSelect, onCancel }: ContactSelectionDialogProps) {
	const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

	const handleSelect = () => {
		if (selectedContact) {
			onSelect(selectedContact);
		}
	};

	// Filter contacts to show only relevant ones (Cliente, Contrario, etc.)
	const relevantContacts = contacts.filter((contact) =>
		["Cliente", "Abogado", "Contrario", "Mediador/Conciliador", "Causante", "Perito", "Entidad"].includes(contact.role)
	);

	return (
		<Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
			<DialogTitle>
				<Typography variant="h5">Seleccionar Contacto para el Documento</Typography>
				<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
					Seleccione el contacto que se utilizará para completar los datos del documento
				</Typography>
			</DialogTitle>
			<DialogContent dividers>
				<List>
					{relevantContacts.length === 0 ? (
						<Box sx={{ textAlign: "center", py: 4 }}>
							<Typography color="textSecondary">No hay contactos disponibles para esta carpeta</Typography>
						</Box>
					) : (
						relevantContacts.map((contact) => (
							<ListItem key={contact._id} disablePadding>
								<ListItemButton
									onClick={() => setSelectedContact(contact)}
									selected={selectedContact?._id === contact._id}
								>
									<Radio
										edge="start"
										checked={selectedContact?._id === contact._id}
										tabIndex={-1}
										disableRipple
									/>
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
			<DialogActions>
				<Button onClick={onCancel} color="secondary">
					Cancelar
				</Button>
				<Button
					onClick={handleSelect}
					variant="contained"
					disabled={!selectedContact}
				>
					Seleccionar
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default ContactSelectionDialog;