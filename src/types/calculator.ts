import { Dispatch, SetStateAction } from "react";

export interface LoadingContentProps {
	isLoader: boolean;
	content: React.ReactNode;
	skeleton: React.ReactNode;
}

export type CalcAmounts = {
	date: string;
	type: "Calculado" | "Reclamado" | "Ofertado";
	amount: number;
	user: "Actora" | "Demandada";
	link?: string;
	description?: string;
};

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
	selectedCalculators: CalculatorType[];
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

export type ModalCalcType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	handlerAddress?: (movement: CalcAmounts) => void;
	folderId: any;
	folderName: string;
};

export type CalcModalType = {
	open: boolean;
	setOpen: (open: boolean) => void;
	folderId: string | undefined;
	folderName?: string; // hacerlo opcional
};

export type Calculator = {
	_id: string;
	folderId?: string;
	reclamante: string;
	reclamado: string;
	amount: number;
	date: string;
	type: string;
	category: string;
	subcategory: string;
};

export type CalcFormProps = {
	handlerAddress: (calc: Calculator) => void;
	searchTerm: string;
	selectedCalculators: Calculator[];
};
