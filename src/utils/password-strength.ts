// ==============================|| CUSTOM FUNCTION - PASSWORD STRENGTH ||============================== //

import { NumbColorFunc, StringBoolFunc, StringNumFunc } from "types/password";

// has number
const hasNumber: StringBoolFunc = (number) => new RegExp(/[0-9]/).test(number);

// has mix of small and capitals
const hasMixed: StringBoolFunc = (number) => new RegExp(/[a-z]/).test(number) && new RegExp(/[A-Z]/).test(number);

// has special chars
const hasSpecial: StringBoolFunc = (number) => new RegExp(/[!#@$%^&*)(+=._-]/).test(number);

// set color based on password strength
// Usamos colores neutros/positivos para evitar fricción visual
export const strengthColor: NumbColorFunc = (count) => {
	if (count < 2) return { label: "Básica", color: "grey.400" };
	if (count < 3) return { label: "Aceptable", color: "warning.light" };
	if (count < 4) return { label: "Buena", color: "success.light" };
	if (count < 5) return { label: "Muy buena", color: "success.main" };
	if (count < 6) return { label: "Excelente", color: "success.dark" };
	return { label: "Básica", color: "grey.400" };
};

// password strength indicator
export const strengthIndicator: StringNumFunc = (number) => {
	let strengths = 0;
	if (number.length > 5) strengths += 1;
	if (number.length > 7) strengths += 1;
	if (hasNumber(number)) strengths += 1;
	if (hasSpecial(number)) strengths += 1;
	if (hasMixed(number)) strengths += 1;
	return strengths;
};
