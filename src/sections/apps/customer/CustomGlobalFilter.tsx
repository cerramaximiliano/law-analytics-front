import { useState } from "react";
import { Row, useAsyncDebounce } from "react-table";
import { OutlinedInput } from "@mui/material";
import { SearchNormal1 } from "iconsax-react";

// Interfaz genérica para el componente GlobalFilter
interface CustomGlobalFilterProps<T extends object> {
	preGlobalFilteredRows: Row<T>[];
	globalFilter: any;
	setGlobalFilter: (filterValue: string) => void;
}

// Componente genérico GlobalFilter
const CustomGlobalFilter = <T extends object>({ preGlobalFilteredRows, globalFilter, setGlobalFilter }: CustomGlobalFilterProps<T>) => {
	const count = preGlobalFilteredRows.length;
	const [value, setValue] = useState(globalFilter);
	const onChange = useAsyncDebounce((value) => {
		setGlobalFilter(value || undefined);
	}, 200);

	return (
		<OutlinedInput
			value={value || ""}
			onChange={(e) => {
				setValue(e.target.value);
				onChange(e.target.value);
			}}
			placeholder={`Buscar en ${count} registros...`}
			id="start-adornment-email"
			startAdornment={<SearchNormal1 size={18} />}
			style={{ maxHeight: "30.75px" }}
		/>
	);
};

export default CustomGlobalFilter;
