import {
	Stack,
	Skeleton,
	Grid,
	CardContent,
	IconButton,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Typography,
	Button,
	Dialog,
	Tooltip,
} from "@mui/material";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { Add, UserSquare, Trash, Link1 } from "iconsax-react"; // Importa el icono Trash
import { PopupTransition } from "components/@extended/Transitions";
import { useState } from "react";
import AddCustomer from "sections/apps/customer/AddCustomer";
import ModalMembers from "../modals/ModalMembers";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import { Contact } from "types/contact";
import { deleteContact, unlinkFolderFromContact } from "store/reducers/contacts";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// Tipo para los miembros

interface MembersProps {
	title: string;
	membersData: Contact[];
	isLoader: boolean;
	folderId: string;
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

const Members: React.FC<MembersProps> = ({ title, membersData, isLoader, folderId }) => {
	const [members, setMembers] = useState<Contact[]>(membersData);
	console.log(membersData);
	const [add, setAdd] = useState<boolean>(false);
	const [openModal, setOpenModal] = useState<boolean>(false);
	const [parent] = useAutoAnimate({ duration: 200 });

	const handleAdd = () => {
		if (isLoader === true) {
			return;
		} else {
			setAdd(!add);
		}
	};

	const handleOpen = () => {
		setOpenModal(!openModal);
	};

	const handlerAddress = (newMember: any) => {
		const foundMember = members.find((member) => member.email === newMember.email);
		if (!foundMember) {
			setMembers((prevMembers) => [...prevMembers, newMember]);
		}
	};

	const handleDelete = (contactId: string) => {
		dispatch(deleteContact(contactId))
			.then((response) => {
				if (response.success) {
					dispatch(
						openSnackbar({
							open: true,
							message: "Contacto eliminado correctamente.",
							variant: "alert",
							alert: {
								color: "success",
							},
							close: true,
						}),
					);
					setMembers((prevMembers) => prevMembers.filter((member) => member._id !== contactId));
				} else {
					// Manejo de errores más seguro
					const errorMessage =
						typeof response.error === "string" ? response.error : response.error?.message || "Error al eliminar el contacto.";
					dispatch(
						openSnackbar({
							open: true,
							message: errorMessage,
							variant: "alert",
							alert: {
								color: "error",
							},
							close: true,
						}),
					);
				}
			})
			.catch((error) => {
				dispatch(
					openSnackbar({
						open: true,
						message: "Error inesperado al eliminar el contacto.",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: true,
					}),
				);
			});
	};

	const handleUnlink = async (contactId: string) => {
		try {
			const result = await dispatch(unlinkFolderFromContact(contactId, folderId));

			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Contacto desvinculado correctamente",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: true,
					}),
				);

				setMembers((prevMembers) => prevMembers.filter((member) => member._id !== contactId));
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al desvincular el contacto",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: true,
					}),
				);
			}
		} catch (error) {
			console.error("Error en handleUnlink:", error);
			dispatch(
				openSnackbar({
					open: true,
					message: "Error inesperado al desvincular el contacto",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: true,
				}),
			);
		}
	};

	return (
		<MainCard
			shadow={3}
			title={title}
			content={false}
			secondary={
				<IconButton color="secondary" sx={{ color: "secondary.darker" }} onClick={handleAdd}>
					<Add />
				</IconButton>
			}
		>
			<Dialog
				maxWidth="sm"
				TransitionComponent={PopupTransition}
				keepMounted
				fullWidth
				onClose={handleAdd}
				open={add}
				sx={{ "& .MuiDialog-paper": { p: 0 }, transition: "transform 225ms" }}
				aria-describedby="alert-dialog-slide-description"
			>
				<AddCustomer open={add} onCancel={handleAdd} onAddMember={handlerAddress} mode="add" />
			</Dialog>
			<ModalMembers open={openModal} setOpen={setOpenModal} handlerAddress={handlerAddress} folderId={folderId} membersData={membersData} />
			<CardContent>
				{isLoader ? (
					<>
						<Stack direction={"row"} style={{ marginLeft: 24, marginRight: 24, marginTop: 12, marginBottom: 12 }}>
							<Grid>
								<Skeleton variant="rectangular" width={52} height={52} />
							</Grid>
							<Grid style={{ marginLeft: 20 }}>
								<SkeletonList />
							</Grid>
						</Stack>
						<Stack direction={"row"} style={{ marginLeft: 24, marginRight: 24, marginTop: 12, marginBottom: 12 }}>
							<Grid>
								<Skeleton variant="rectangular" width={52} height={52} />
							</Grid>
							<Grid style={{ marginLeft: 20 }}>
								<Skeleton width={100} />
								<Skeleton width={100} />
								<Skeleton width={100} />
							</Grid>
						</Stack>
					</>
				) : (
					<>
						<List disablePadding sx={{ "& .MuiListItem-root": { px: 3, py: 1.5 } }} ref={parent}>
							{membersData.length > 0 ? (
								membersData.map((member, index) => (
									<ListItem key={index} divider={index < membersData.length - 1}>
										<ListItemAvatar sx={{ mr: 1 }}>
											<Avatar alt={member.name} src={member.avatar} variant="rounded" size="lg" color={getColorByRole(member.role)} />
										</ListItemAvatar>
										<ListItemText
											primary={<Typography variant="subtitle1">{`${member.name || ""} ${member.lastName || ""}`}</Typography>}
											secondary={<Typography sx={{ mt: 0.25 }}>{member.role}</Typography>}
										/>
										<Tooltip title="Desvincular">
											<IconButton edge="end" color="primary" aria-label="unlink" onClick={() => handleUnlink(member._id)}>
												<Link1 variant="Broken" />
											</IconButton>
										</Tooltip>
										<Tooltip title="Eliminar">
											<IconButton edge="end" aria-label="delete" onClick={() => handleDelete(member._id)} color="error">
												<Trash variant="Bulk" />
											</IconButton>
										</Tooltip>
									</ListItem>
								))
							) : (
								<>
									<NoMembersPlaceholder />
								</>
							)}
						</List>
					</>
				)}

				<Grid marginTop={2}>
					<Button variant="outlined" fullWidth color="secondary" onClick={handleOpen} disabled={isLoader}>
						Vincular
					</Button>
				</Grid>
			</CardContent>
		</MainCard>
	);
};

export default Members;

const SkeletonList = () => (
	<>
		<Stack direction={"row"} style={{ marginLeft: 24, marginRight: 24, marginTop: 12, marginBottom: 12 }}>
			<Grid>
				<Skeleton variant="rectangular" width={52} height={52} />
			</Grid>
			<Grid style={{ marginLeft: 20 }}>
				<Skeleton width={100} />
				<Skeleton width={100} />
				<Skeleton width={100} />
			</Grid>
		</Stack>
		<Stack direction={"row"} style={{ marginLeft: 24, marginRight: 24, marginTop: 12, marginBottom: 12 }}>
			<Grid>
				<Skeleton variant="rectangular" width={52} height={52} />
			</Grid>
			<Grid style={{ marginLeft: 20 }}>
				<Skeleton width={100} />
				<Skeleton width={100} />
				<Skeleton width={100} />
			</Grid>
		</Stack>
	</>
);

const NoMembersPlaceholder = () => (
	<>
		<Grid container justifyContent="center">
			<Avatar color="error" variant="rounded">
				<UserSquare variant="Bold" />
			</Avatar>
		</Grid>
		<Typography variant="body1" color="text.secondary" align="center">
			No hay intervinientes
		</Typography>
	</>
);
