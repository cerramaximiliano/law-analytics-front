export type Contact = {
	_id: string;
	avatar?: string;
	name: string;
	lastName: string;
	role: "Cliente" | "Abogado" | "Contrario" | "Mediador/Conciliador" | "Causante" | "Perito" | "Entidad";
	type?: "Humana" | "Jurídica";
	address: string;
	state: string;
	city: string;
	zipCode: string;
	email: string;
	phone: string;
	nacionality: string;
	document: string;
	cuit: string;
	status: string;
	activity: string;
	company: string;
	fiscal: string;
	userId: string;
	groupId?: string;
	folderId?: string | null;
};

export type ContactState = {
	contacts: Contact[];
	selectedContacts: Contact[];
	isLoader: boolean;
	error: string | null;
};

export type Action = {
	type: string;
	payload?: any;
};
