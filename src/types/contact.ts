export type Contact = {
	_id?: string;
	name: string;
	lastName: string;
	role: string;
	type: string;
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
};

export type ContactState = {
	contacts: Contact[];
	error: string | null;
}

export type Action = {
	type: string;
	payload?: any;
}
