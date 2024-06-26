export type CalculatorType = {
	userId: string;
	_id: string;
	folderId?: string;
	type: string;
	amount: number;
	interest?: number;
	variables?: object;
	isLoader?: boolean;
	error?: string | null;
};
