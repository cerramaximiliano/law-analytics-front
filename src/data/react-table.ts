import mockData, { range } from "utils/mock-data";
import data from "data/folder.json";

const newPerson = (index: number) => {
	const tempData = mockData(index);
	const statusCode = tempData.number.status(0, 2);
	const materia = tempData.number.status(0, 600);
	const materiaSelect = data.materia[materia];
	let status: string;
	switch (statusCode) {
		case 2:
			status = "Finalizada";
			break;
		case 1:
			status = "Nueva";
			break;
		case 0:
		default:
			status = "En proceso";
			break;
	}

	const orderStatusCode = tempData.number.status(0, 7);
	let orderStatus: string;
	switch (orderStatusCode) {
		case 7:
			orderStatus = "Actor";
			break;
		case 6:
			orderStatus = "Demandado";
			break;
		case 5:
			orderStatus = "Requirente";
			break;
		case 4:
			orderStatus = "Requerido";
			break;
		case 3:
			orderStatus = "Acreedor";
			break;
		case 2:
			orderStatus = "Deudor";
			break;
		case 1:
			orderStatus = "Denunciante";
			break;
		case 0:
		default:
			orderStatus = "Denunciado";
			break;
	}

	return {
		id: index,
		folderName: tempData.folderName,
		visits: tempData.number.amount,
		progress: tempData.number.percentage,
		status,
		orderStatus,
		materiaSelect,
		contact: tempData.contact,
		country: tempData.address.country,
		address: tempData.address.full,
		description: tempData.description.sentence,
		avatar: tempData.number.status(1, 10),
		skills: tempData.skill,
		time: tempData.time,
	};
};

// ===========================|| TABLE - USERS ||=========================== //

export default function makeData(...lens: any[]) {
	const makeDataLevel: any = (depth: number = 0) => {
		const len = lens[depth];
		return range(len).map((d, index) => ({
			...newPerson(index + 1),
			subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
		}));
	};
	return makeDataLevel();
}
