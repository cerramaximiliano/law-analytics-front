import type { FocusEvent } from "react";

/**
 * MUI `InputBase` llama `onBlur()` SIN evento cuando un input queda `disabled` estando enfocado
 * (caso típico: Enter para submitear y el form deshabilita los campos mientras `isSubmitting`).
 * El `handleBlur` de Formik hace `e.persist()` y explota con `undefined` ("Cannot read properties
 * of undefined (reading 'persist')"). Este wrapper ignora esa llamada vacía y delega el resto.
 */
export const safeFormikBlur = (handleBlur: (e: FocusEvent<any>) => void) => (e?: FocusEvent<any>) => {
	if (e && e.target) handleBlur(e);
};
