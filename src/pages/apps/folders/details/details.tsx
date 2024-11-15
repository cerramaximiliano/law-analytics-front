import { useState, MouseEvent } from "react";

/* import { 
	dispatch, 
	useSelector } from "store"; */

// material-ui
import { ToggleButtonGroup, ToggleButton, Tooltip, Grid, Typography } from "@mui/material";
import MainCard from "components/MainCard";
import { Category, TableDocument } from "iconsax-react";

import { CalcAmounts } from "./components/CalcTable";
import Movements from "./components/Movements";
import FolderData from "./components/FolderData";
import Notifications from "./components/Notifications";
import { Member } from "./components/Members";
import Members from "./components/Members";
import CalcTable from "./components/CalcTable";
//import Payment from "./components/Payment";
import TaskList from "./components/TaskList";
import Calendar from "./components/Calendar";
/* 
import { Member } from "./components/Members";
import { CalcAmounts } from "./components/CalcTable";
import { TimelineEvent } from "./components/Notifications"; */

//import { fetchFolderData } from "store/reducers/folder";
//import { useParams } from "react-router";

/* const notificationsData: TimelineEvent[] = [
	{
		date: "10/12/2023",
		dateExpiration: "15/12/2023",
		title: "Eat",
		notification: "Cédula",
		user: "Organismo",
		description: "Because you need strength",
	},
	{
		date: "15/04/2024",
		dateExpiration: "15/12/2023",
		title: "Code",
		notification: "Telegrama",
		user: "Actora",
		description: "Because it&apos;s awesome!",
	},
	{
		date: "11/03/2022",
		dateExpiration: "15/12/2023",
		title: "Gift",
		notification: "Carta Documento",
		user: "Demandada",
		description: "Because you need.",
	},
	{
		date: "01/06/2023",
		dateExpiration: "15/12/2023",
		title: "Repeat",
		notification: "Carta Documento",
		user: "Demandada",
		description: "This is the life you love!",
	},
];
const membersData: Member[] = [
	{
		name: "Ian",
		lastName: "Carpenter",
		address: "1754 Ureate, RhodSA5 5BO",
		phone: "+91 1234567890",
		role: "Cliente",
		email: "iacrpt65@gmail.com",
	},
	{
		name: "Belle J.",
		lastName: "Richter",
		address: "1300 Mine RoadQuemado, NM 87829",
		phone: "305-829-7809",
		role: "Abogado",
		email: "belljrc23@gmail.com",
	},
]; */
/* const data = {
	folderName: "Ochotorena Juan C/ Aranguren, Pedro",
	description:
		"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley.",
	orderStatus: "Requerido",
	status: "Finalizada",
	materia: "Accidente in itinere",
	initialDateFolder: "10/02/2022",
	finalDateFolder: "",
	folderJuris: null,
	folderFuero: "Civil",
	situationFolder: "En letra",
	monto: 200000,
};
const tableData: CalcAmounts[] = [
	{ date: "21/02/2022", type: "Calculado", user: "Actora", amount: 926.23 },
	{ date: "14/03/2022", type: "Calculado", user: "Actora", amount: 743.23 },
	{ date: "24/05/2022", type: "Calculado", user: "Actora", amount: 642.23 },
	{ date: "24/05/2022", type: "Ofertado", user: "Demandada", amount: 642.23 },
	{ date: "24/05/2022", type: "Reclamado", user: "Actora", amount: 642.23 },
];

const paymentData = [
	{ name: "Honorarios", date: "10/05/2024", amount: "200.300,00", type: "Ingreso", image: "recive", changeColor: "success.main" },
	{ name: "Gastos", date: "10/05/2023", amount: "2000", type: "Egreso", image: "send", changeColor: "error.dark" },
	{ name: "Honorarios", date: "10/07/2022", amount: "2000", type: "Ingreso", image: "recive", changeColor: "error.dark" },
	{ name: "Honorarios", date: "10/07/2022", amount: "2000", type: "Ingreso", image: "recive", changeColor: "error.dark" },
	{ name: "Honorarios", date: "10/07/2022", amount: "2000", type: "Ingreso", image: "recive", changeColor: "error.dark" },
	{ name: "Honorarios", date: "10/07/2022", amount: "2000", type: "Ingreso", image: "recive", changeColor: "error.dark" },
	{ name: "Honorarios", date: "10/07/2022", amount: "2000", type: "Ingreso", image: "recive", changeColor: "error.dark" },
];
const taskData = [
	{
		name: "Tarea 1",
		checked: false,
		progress: 58,
		done: 4,
		color: "info",
		_id: "65184",
		date: "20/05/2024",
	},
	{
		name: "Tarea 2",
		checked: true,
		progress: 72,
		done: 6,
		color: "primary",
		_id: "86930",
		date: "19/05/2024",
	},
	{
		name: "Tarea 3",
		checked: false,
		progress: 35,
		done: 3,
		color: "warning",
		_id: "74411",
		date: "18/05/2024",
	},
	{
		name: "Tarea 4",
		checked: true,
		progress: 47,
		done: 4,
		color: "error",
		_id: "43042",
		date: "17/05/2024",
	},
	{
		name: "Tarea 5",
		checked: false,
		progress: 19,
		done: 1,
		color: "warning",
		_id: "55515",
		date: "16/04/2024",
	},
	{
		name: "Tarea 6",
		checked: true,
		progress: 84,
		done: 9,
		color: "info",
		_id: "22886",
		date: "15/04/2024",
	},
	{
		name: "Tarea 7",
		checked: false,
		progress: 63,
		done: 5,
		color: "info",
		_id: "11248",
		date: "14/03/2024",
	},
	{
		name: "Tarea 8",
		checked: false,
		progress: 51,
		done: 4,
		color: "success",
		_id: "94190",
		date: "13/05/2024",
	},
	{
		name: "Tarea 9",
		checked: true,
		progress: 29,
		done: 2,
		color: "warning",
		_id: "72521",
		date: "12/05/2024",
	},
	{
		name: "Tarea 10",
		checked: false,
		progress: 42,
		done: 4,
		color: "info",
		_id: "59982",
		date: "11/05/2024",
	},
	{
		name: "Tarea 11",
		checked: true,
		progress: 77,
		done: 7,
		color: "error",
		_id: "38343",
		date: "10/05/2024",
	},
	{
		name: "Tarea 12",
		checked: true,
		progress: 90,
		done: 8,
		color: "warning",
		_id: "26604",
		date: "09/05/2024",
	},
	{
		name: "Tarea 13",
		checked: false,
		progress: 56,
		done: 4,
		color: "primary",
		_id: "13965",
		date: "08/05/2024",
	},
	{
		name: "Tarea 14",
		checked: true,
		progress: 65,
		done: 6,
		color: "success",
		_id: "91326",
		date: "07/05/2024",
	},
	{
		name: "Tarea 15",
		checked: false,
		progress: 38,
		done: 3,
		color: "warning",
		_id: "78787",
		date: "06/05/2024",
	},
	{
		name: "Tarea 16",
		checked: true,
		progress: 45,
		done: 4,
		color: "info",
		_id: "56148",
		date: "05/05/2024",
	},
	{
		name: "Tarea 17",
		checked: false,
		progress: 22,
		done: 2,
		color: "error",
		_id: "33609",
		date: "04/05/2024",
	},
	{
		name: "Tarea 18",
		checked: true,
		progress: 80,
		done: 8,
		color: "primary",
		_id: "20970",
		date: "03/05/2024",
	},
	{
		name: "Tarea 19",
		checked: true,
		progress: 70,
		done: 6,
		color: "success",
		_id: "98331",
		date: "02/05/2024",
	},
	{
		name: "Tarea 20",
		checked: false,
		progress: 34,
		done: 3,
		color: "warning",
		_id: "85792",
		date: "01/05/2024",
	},
	{
		name: "Tarea 21",
		checked: true,
		progress: 68,
		done: 7,
		color: "info",
		_id: "73253",
		date: "30/04/2024",
	},
	{
		name: "Tarea 22",
		checked: false,
		progress: 50,
		done: 4,
		color: "error",
		_id: "60714",
		date: "29/04/2024",
	},
	{
		name: "Tarea 23",
		checked: true,
		progress: 75,
		done: 7,
		color: "primary",
		_id: "38175",
		date: "28/04/2024",
	},
	{
		name: "Tarea 24",
		checked: false,
		progress: 31,
		done: 3,
		color: "info",
		_id: "25636",
		date: "27/04/2024",
	},
	{
		name: "Tarea 25",
		checked: true,
		progress: 83,
		done: 9,
		color: "success",
		_id: "13097",
		date: "26/04/2024",
	},
];
 */

//console.log(notificationsData, membersData, tableData, viewOptions, paymentData, taskData, eventsData);
const tableData: CalcAmounts[] = [
	{ date: "21/02/2022", type: "Calculado", user: "Actora", amount: 926.23 },
	{ date: "14/03/2022", type: "Calculado", user: "Actora", amount: 743.23 },
	{ date: "24/05/2022", type: "Calculado", user: "Actora", amount: 642.23 },
	{ date: "24/05/2022", type: "Ofertado", user: "Demandada", amount: 642.23 },
	{ date: "24/05/2022", type: "Reclamado", user: "Actora", amount: 642.23 },
];
const data = {
	folderName: "Ochotorena Juan C/ Aranguren, Pedro",
	description:
		"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley.",
	orderStatus: "Requerido",
	status: "Finalizada",
	materia: "Accidente in itinere",
	initialDateFolder: "10/02/2022",
	finalDateFolder: "",
	folderJuris: null,
	folderFuero: "Civil",
	situationFolder: "En letra",
	monto: 200000,
};
const membersData: Member[] = [
	{
		name: "Ian",
		lastName: "Carpenter",
		address: "1754 Ureate, RhodSA5 5BO",
		phone: "+91 1234567890",
		role: "Cliente",
		email: "iacrpt65@gmail.com",
	},
	{
		name: "Belle J.",
		lastName: "Richter",
		address: "1300 Mine RoadQuemado, NM 87829",
		phone: "305-829-7809",
		role: "Abogado",
		email: "belljrc23@gmail.com",
	},
];
const viewOptions = [
	{
		label: "Expandir",
		value: "one",
		icon: Category,
	},
	{
		label: "Colapsar",
		value: "two",
		icon: TableDocument,
	},
];
const taskData = [
	{
		name: "Tarea 1",
		checked: false,
		progress: 58,
		done: 4,
		color: "info",
		_id: "65184",
		date: "20/05/2024",
	},
	{
		name: "Tarea 2",
		checked: true,
		progress: 72,
		done: 6,
		color: "primary",
		_id: "86930",
		date: "19/05/2024",
	},
	{
		name: "Tarea 3",
		checked: false,
		progress: 35,
		done: 3,
		color: "warning",
		_id: "74411",
		date: "18/05/2024",
	},
	{
		name: "Tarea 4",
		checked: true,
		progress: 47,
		done: 4,
		color: "error",
		_id: "43042",
		date: "17/05/2024",
	},
	{
		name: "Tarea 5",
		checked: false,
		progress: 19,
		done: 1,
		color: "warning",
		_id: "55515",
		date: "16/04/2024",
	},
	{
		name: "Tarea 6",
		checked: true,
		progress: 84,
		done: 9,
		color: "info",
		_id: "22886",
		date: "15/04/2024",
	},
	{
		name: "Tarea 7",
		checked: false,
		progress: 63,
		done: 5,
		color: "info",
		_id: "11248",
		date: "14/03/2024",
	},
	{
		name: "Tarea 8",
		checked: false,
		progress: 51,
		done: 4,
		color: "success",
		_id: "94190",
		date: "13/05/2024",
	},
	{
		name: "Tarea 9",
		checked: true,
		progress: 29,
		done: 2,
		color: "warning",
		_id: "72521",
		date: "12/05/2024",
	},
	{
		name: "Tarea 10",
		checked: false,
		progress: 42,
		done: 4,
		color: "info",
		_id: "59982",
		date: "11/05/2024",
	},
	{
		name: "Tarea 11",
		checked: true,
		progress: 77,
		done: 7,
		color: "error",
		_id: "38343",
		date: "10/05/2024",
	},
	{
		name: "Tarea 12",
		checked: true,
		progress: 90,
		done: 8,
		color: "warning",
		_id: "26604",
		date: "09/05/2024",
	},
	{
		name: "Tarea 13",
		checked: false,
		progress: 56,
		done: 4,
		color: "primary",
		_id: "13965",
		date: "08/05/2024",
	},
	{
		name: "Tarea 14",
		checked: true,
		progress: 65,
		done: 6,
		color: "success",
		_id: "91326",
		date: "07/05/2024",
	},
	{
		name: "Tarea 15",
		checked: false,
		progress: 38,
		done: 3,
		color: "warning",
		_id: "78787",
		date: "06/05/2024",
	},
	{
		name: "Tarea 16",
		checked: true,
		progress: 45,
		done: 4,
		color: "info",
		_id: "56148",
		date: "05/05/2024",
	},
	{
		name: "Tarea 17",
		checked: false,
		progress: 22,
		done: 2,
		color: "error",
		_id: "33609",
		date: "04/05/2024",
	},
	{
		name: "Tarea 18",
		checked: true,
		progress: 80,
		done: 8,
		color: "primary",
		_id: "20970",
		date: "03/05/2024",
	},
	{
		name: "Tarea 19",
		checked: true,
		progress: 70,
		done: 6,
		color: "success",
		_id: "98331",
		date: "02/05/2024",
	},
	{
		name: "Tarea 20",
		checked: false,
		progress: 34,
		done: 3,
		color: "warning",
		_id: "85792",
		date: "01/05/2024",
	},
	{
		name: "Tarea 21",
		checked: true,
		progress: 68,
		done: 7,
		color: "info",
		_id: "73253",
		date: "30/04/2024",
	},
	{
		name: "Tarea 22",
		checked: false,
		progress: 50,
		done: 4,
		color: "error",
		_id: "60714",
		date: "29/04/2024",
	},
	{
		name: "Tarea 23",
		checked: true,
		progress: 75,
		done: 7,
		color: "primary",
		_id: "38175",
		date: "28/04/2024",
	},
	{
		name: "Tarea 24",
		checked: false,
		progress: 31,
		done: 3,
		color: "info",
		_id: "25636",
		date: "27/04/2024",
	},
	{
		name: "Tarea 25",
		checked: true,
		progress: 83,
		done: 9,
		color: "success",
		_id: "13097",
		date: "26/04/2024",
	},
];
/* const eventsData = [
	{
		id: "5e8882f1f0c9216397e05a9b",
		allDay: false,
		color: "#f5222d",
		description: "SCRUM Planning",
		start: "2024-05-15T07:18:27.241Z",
		end: "2024-05-15T09:33:27.241Z",
		title: "Repeating Event",
	},
	{
		id: "5e8882fcd525e076b3c1542c",
		allDay: true,
		color: "#faad14",
		description: "Sorry, John!",
		start: "2024-05-19T12:18:27.241Z",
		end: "2024-05-19T12:33:27.241Z",
		title: "Conference",
	},
	{
		id: "5e8882e440f6322fa399eeb8",
		allDay: true,
		color: "#52c41a",
		description: "Inform about new contract",
		start: "2024-05-24T13:03:27.241Z",
		end: "2024-05-23T13:03:27.241Z",
		title: "All Day Event",
	},
	{
		id: "5e8882fcd525e076b3c1542d",
		allDay: false,
		color: "#f6ffed",
		textColor: "#52c41a",
		description: "Sorry, Stebin Ben!",
		start: "2024-05-25T08:03:27.241Z",
		end: "2024-05-25T11:33:27.241Z",
		title: "Opening Ceremony",
	},
	{
		id: "5e8882eb5f8ec686220ff138",
		allDay: true,
		color: "#8c8c8c",
		description: "Discuss about new partnership",
		start: "2024-05-23T13:03:27.241Z",
		end: "2024-05-25T12:03:27.241Z",
		title: "Long Event",
	},
	{
		id: "5e88830672d089c53c46ece3",
		allDay: false,
		description: "Get a new quote for the payment processor",
		start: "2024-05-27T06:30:27.241Z",
		end: "2024-05-27T08:30:27.241Z",
		title: "Breakfast",
	},
	{
		id: "5e888302e62149e4b49aa609",
		allDay: false,
		color: "#fffbe6",
		textColor: "#faad14",
		description: "Discuss about the new project",
		start: "2024-05-27T09:45:27.242Z",
		end: "2024-05-27T15:30:27.242Z",
		title: "Meeting",
	},
	{
		id: "5e888302e62149e4b49aa709",
		allDay: false,
		color: "#f5222d",
		description: "Let's Go",
		start: "2024-05-27T09:00:27.242Z",
		end: "2024-05-27T11:30:27.242Z",
		title: "Anniversary Celebration",
	},
	{
		id: "5e888302e69651e4b49aa609",
		allDay: false,
		description: "Discuss about the new project",
		start: "2024-05-28T18:28:27.242Z",
		end: "2024-05-28T18:58:27.242Z",
		title: "Send Gift",
	},
	{
		id: "5e8883062k8149e4b49aa709",
		allDay: false,
		color: "#faad14",
		description: "Let's Go",
		start: "2024-05-28T16:48:27.242Z",
		end: "2024-05-28T18:18:27.242Z",
		title: "Birthday Party",
	},
	{
		id: "5e8882f1f0c9216396e05a9b",
		allDay: false,
		color: "#8c8c8c",
		description: "SCRUM Planning",
		start: "2024-05-28T16:33:27.242Z",
		end: "2024-05-28T17:33:27.242Z",
		title: "Repeating Event",
	},
	{
		id: "5e888302e62149e4b49aa610",
		allDay: false,
		color: "#f5222d",
		description: "Let's Go",
		start: "2024-05-28T16:48:27.242Z",
		end: "2024-05-28T17:53:27.242Z",
		title: "Dinner",
	},
	{
		id: "5e8882eb5f8ec686220ff131",
		allDay: true,
		description: "Discuss about new partnership",
		start: "2024-06-01T13:03:27.242Z",
		end: "2024-06-04T14:03:27.242Z",
		title: "Long Event",
	},
	{
		id: "5e888302e62349e4b49aa609",
		allDay: false,
		color: "#1890ff",
		textColor: "#e6f7ff",
		description: "Discuss about the project launch",
		start: "2024-06-02T13:18:27.242Z",
		end: "2024-06-02T13:23:27.242Z",
		title: "Meeting",
	},
	{
		id: "5e888302e62149e4b49ab609",
		allDay: false,
		color: "#52c41a",
		description: "Discuss about the tour",
		start: "2024-06-08T16:48:27.242Z",
		end: "2024-06-08T17:53:27.242Z",
		title: "Happy Hour",
	},
]; */
const Details = () => {
	//const folderData = useSelector((state: any) => state.folder);
	//const { id } = useParams();

	//const [isLoading, setIsLoading] = useState(true);
	//console.log(isLoading, folderData);
	const [alignment, setAlignment] = useState<string | null>("two");
	const [isColumn, setIsColumn] = useState<boolean>(false);

	/* 	useEffect(() => {
		if (id) {
			const fetchData = async () => {
				setIsLoading(true);
				await dispatch(fetchFolderData(id));
				setIsLoading(false);
			};
			fetchData();
		}
	}, [id, dispatch]); */

	const handleAlignment = (event: MouseEvent<HTMLElement>, newAlignment: string | null) => {
		if (newAlignment === "one") {
			setIsColumn(true);
		} else {
			setIsColumn(false);
		}
		setAlignment(newAlignment);
	};

	return (
		<MainCard
			title="Detalles de la Causa"
			secondary={
				<ToggleButtonGroup value={alignment} exclusive onChange={handleAlignment} size={"small"} aria-label="text alignment">
					{viewOptions.map((viewOption) => {
						const Icon = viewOption.icon;
						return (
							<ToggleButton value={viewOption.value} key={viewOption.value} aria-label="first">
								<Tooltip title={viewOption.label}>
									<Icon variant={"Bold"} />
								</Tooltip>
							</ToggleButton>
						);
					})}
				</ToggleButtonGroup>
			}
		>
			<Typography variant="body1"></Typography>
			<Grid container spacing={3}>
				{/* Row 1 */}
				<Grid
					item
					xs={12}
					md={isColumn ? 12 : 6}
					lg={isColumn ? 12 : 6}
					sx={{
						transition: "all 0.5s ease-in-out",
					}}
				>
					<FolderData type="general" />
				</Grid>
				<Grid
					item
					xs={12}
					md={isColumn ? 12 : 6}
					lg={isColumn ? 12 : 3}
					sx={{
						transition: "all 0.7s ease-in-out",
					}}
				>
					<Movements title={"Movimientos"} />
				</Grid>
				<Grid
					item
					xs={12}
					md={isColumn ? 12 : 6}
					lg={isColumn ? 12 : 3}
					sx={{
						transition: "all 0.7s ease-in-out",
					}}
				>
					<Notifications title={"Notificaciones"} />
				</Grid>
				{/* Row 2 */}
				<Grid
					item
					xs={12}
					md={isColumn ? 12 : 6}
					lg={isColumn ? 12 : 4}
					sx={{
						transition: "all 0.7s ease-in-out",
					}}
				>
					<FolderData folderData={data} type="mediacion" />
				</Grid>
				<Grid
					item
					xs={12}
					md={isColumn ? 12 : 6}
					lg={isColumn ? 12 : 4}
					sx={{
						transition: "all 0.7s ease-in-out",
					}}
				>
					{/* <FolderData folderData={data} type="judicial" /> */}
				</Grid>
				<Grid
					item
					xs={12}
					md={12}
					lg={isColumn ? 12 : 4}
					sx={{
						transition: "all 0.7s ease-in-out",
					}}
				>
					<CalcTable title="Montos, Cálculos y Ofrecimientos" folderData={data} tableData={tableData} />
				</Grid>
				{/* Row 3 */}
				<Grid
					item
					xs={12}
					md={isColumn ? 12 : 6}
					lg={isColumn ? 12 : 3}
					sx={{
						transition: "all 0.7s ease-in-out",
					}}
				>
					<Members title={"Intervinientes"} membersData={membersData} />
				</Grid>
				<Grid
					item
					xs={12}
					md={isColumn ? 12 : 6}
					lg={isColumn ? 12 : 3}
					sx={{
						transition: "all 0.7s ease-in-out",
					}}
				>
					<TaskList title={"Tareas"} tasks={taskData} />
				</Grid>
				<Grid
					item
					xs={12}
					md={isColumn ? 12 : 6}
					lg={isColumn ? 12 : 6}
					sx={{
						transition: "all 0.7s ease-in-out",
					}}
				>
					<Calendar title={"Calendario"} />
				</Grid>
				<Grid
					item
					xs={12}
					md={isColumn ? 12 : 6}
					lg={isColumn ? 12 : 3}
					sx={{
						transition: "all 0.7s ease-in-out",
					}}
				>
					{/* <Payment title={"Facturación"} payments={paymentData} /> */}
				</Grid>
			</Grid>
		</MainCard>
	);
};

export default Details;
