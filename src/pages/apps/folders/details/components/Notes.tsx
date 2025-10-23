import React from "react";
import {
	Stack,
	Button,
	Typography,
	Box,
	useTheme,
	alpha,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Avatar,
} from "@mui/material";
import MainCard from "components/MainCard";
import { DocumentText, Add } from "iconsax-react";
import { motion } from "framer-motion";

interface NotesProps {
	title: string;
	folderId: string;
}

const Notes: React.FC<NotesProps> = ({ title, folderId }) => {
	const theme = useTheme();

	// Empty state component
	const EmptyState = () => (
		<Box sx={{ textAlign: "center", py: 4 }}>
			<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
				<Avatar
					color="error"
					variant="rounded"
					sx={{
						width: 64,
						height: 64,
						bgcolor: alpha(theme.palette.error.main, 0.1),
						color: "error.main",
						mx: "auto",
						mb: 2,
					}}
				>
					<DocumentText variant="Bold" size={32} />
				</Avatar>
			</motion.div>
			<Typography variant="subtitle1" color="textSecondary" gutterBottom>
				No hay notas registradas
			</Typography>
			<Typography variant="body2" color="textSecondary" sx={{ maxWidth: 320, mx: "auto" }}>
				Agrega notas importantes relacionadas con este expediente
			</Typography>
		</Box>
	);

	return (
		<MainCard
			shadow={3}
			title={
				title ? (
					<List disablePadding>
						<ListItem sx={{ p: 0 }}>
							<ListItemAvatar>
								<Avatar color="info" variant="rounded">
									<DocumentText variant="Bold" />
								</Avatar>
							</ListItemAvatar>
							<ListItemText
								sx={{ my: 0 }}
								primary="Notas"
								secondary={<Typography variant="subtitle1">Anotaciones y recordatorios del expediente</Typography>}
							/>
						</ListItem>
					</List>
				) : null
			}
			content={false}
			sx={{
				"& .MuiCardContent-root": {
					p: 2.5,
				},
			}}
		>
			<Box sx={{ p: 2.5 }}>
				<>
					<EmptyState />
					<Stack direction="row" spacing={2} sx={{ mt: 3 }}>
						<Button variant="contained" fullWidth color="primary" startIcon={<Add size={18} />} disabled>
							Nueva Nota
						</Button>
					</Stack>
				</>
			</Box>
		</MainCard>
	);
};

export default Notes;
