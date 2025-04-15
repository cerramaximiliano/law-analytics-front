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
	nationality: string;
	document: string;
	cuit: string;
	status: string;
	activity: string;
	company: string;
	fiscal: string;
	userId: string;
	groupId?: string;
	folderIds?: string[] | null;
};

export type ContactState = {
	contacts: Contact[];
	archivedContacts: Contact[];
	selectedContacts: Contact[];
	isLoader: boolean;
	error: string | null;
};

export type Action = {
	type: string;
	payload?: any;
};
