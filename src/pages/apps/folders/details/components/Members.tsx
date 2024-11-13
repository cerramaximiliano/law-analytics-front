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
} from "@mui/material";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { Add, UserSquare, Trash } from "iconsax-react"; // Importa el icono Trash
import { PopupTransition } from "components/@extended/Transitions";
import { useState } from "react";
import AddCustomer from "sections/apps/customer/AddCustomer";
import ModalMembers from "../modals/ModalMembers";
import { useAutoAnimate } from "@formkit/auto-animate/react";

// Tipo para los miembros
export interface Member {
	name: string;
	lastName: string;
	email: string;
	role: "Cliente" | "Abogado" | "Contrario" | "Mediador/Conciliador" | "Causante" | "Perito" | "Entidad";
	type?: "Humana" | "Jurídica";
	time?: string;
	address?: string;
	state?: string;
	zipCode?: string;
	avatar?: string;
	phone?: string;
	nacionality?: string;
	document?: string;
	cuit?: string;
	status?: string;
	activity?: string;
	company?: string;
	fiscal?: string;
}

interface MembersProps {
	title: string;
	membersData: Member[];
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

const Members: React.FC<MembersProps> = ({ title, membersData }) => {
	const [members, setMembers] = useState<Member[]>(membersData);
	const [add, setAdd] = useState<boolean>(false);
	const [openModal, setOpenModal] = useState<boolean>(false);
	const [parent] = useAutoAnimate({ duration: 200 });
	const [isLoading, setIsLoading] = useState(true);
	console.log(isLoading, setIsLoading);
	const handleAdd = () => {
		if (isLoading === true) {
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

	const handleDelete = (email: string) => {
		setMembers((prevMembers) => prevMembers.filter((member) => member.email !== email));
	};

	return (
		<MainCard
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
			<ModalMembers open={openModal} setOpen={setOpenModal} handlerAddress={handlerAddress} />
			<CardContent>
				{isLoading ? (
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
				) : (
					<>
						<List disablePadding sx={{ "& .MuiListItem-root": { px: 3, py: 1.5 } }} ref={parent}>
							{members.length > 0 ? (
								members.map((member, index) => (
									<ListItem key={index} divider={index < members.length - 1}>
										<ListItemAvatar sx={{ mr: 1 }}>
											<Avatar alt={member.name} src={member.avatar} variant="rounded" size="lg" color={getColorByRole(member.role)} />
										</ListItemAvatar>
										<ListItemText
											primary={<Typography variant="subtitle1">{`${member.name || ""} ${member.lastName || ""}`}</Typography>}
											secondary={<Typography sx={{ mt: 0.25 }}>{member.role}</Typography>}
										/>
										<IconButton edge="end" aria-label="delete" onClick={() => handleDelete(member.email)} color="error">
											<Trash />
										</IconButton>
									</ListItem>
								))
							) : (
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
							)}
						</List>
					</>
				)}

				<Grid marginTop={2}>
					<Button variant="outlined" fullWidth color="secondary" onClick={handleOpen} disabled={isLoading}>
						Vincular
					</Button>
				</Grid>
			</CardContent>
		</MainCard>
	);
};

export default Members;
