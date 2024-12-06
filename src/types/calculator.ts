export type CalculatorType = {
	userId?: string;
	groupId?: string;
	_id: string;
	date: string;
	folderId?: string | null;
	folderName?: string | null;
	type: "Calculado" | "Ofertado" | "Reclamado";
	classType?: "laboral" | "civil" | "intereses";
	subClassType?: "despido" | "liquidación final" | "intereses";
	amount: number;
	user?: string;
	interest?: number;
	variables?: object;
	isLoader?: boolean;
	error?: string | null;
};

export interface CalculatorState {
	calculators: CalculatorType[];
	isLoader: boolean;
	error: string | null;
}

export interface FilterParams {
	userId?: string;
	groupId?: string;
	folderId?: string;
	type?: string;
	classType?: string;
}
