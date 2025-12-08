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

// Tipo para segmentos de interés (soporta múltiples tramos)
export type InterestSegment = {
	id?: string;
	startDate?: string | Date;
	endDate?: string | Date;
	rate?: string;
	rateName?: string;
	capital?: number;
	interest?: number;
	coefficient?: number;
	isExtension?: boolean;
	isCalculated?: boolean;
};

// Datos originales del cálculo (guardados al activar keepUpdated)
export type OriginalData = {
	amount?: number;
	capital?: number;
	interest?: number;
	endDate?: string | Date;
	createdAt?: string | Date;
	segments?: InterestSegment[];
	capitalizeInterest?: boolean;
};

// Datos de última actualización automática
export type LastUpdate = {
	amount?: number;
	interest?: number;
	updatedAt?: string | Date;
	updatedToDate?: string | Date;
	segments?: InterestSegment[];
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
	capital?: number;
	user?: string;
	interest?: number;
	variables?: object;
	description?: string;
	isLoader?: boolean;
	error?: string | null;
	// Campos para keepUpdated
	keepUpdated?: boolean;
	originalData?: OriginalData;
	lastUpdate?: LastUpdate;
};

export interface CalculatorState {
	calculators: CalculatorType[];
	selectedCalculators: CalculatorType[];
	archivedCalculators: CalculatorType[];
	isLoader: boolean;
	error: string | null;
	isInitialized: boolean;
	lastFetchedUserId?: string;
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
