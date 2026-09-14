import { FormikHelpers } from "formik";

// project-imports
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// ==============================|| HOOK - USE FORM WITH SNACKBAR ||============================== //

interface UseFormWithSnackbarOptions<T, R = void> {
	onSubmit: (values: T) => Promise<R>;
	successMessage?: string;
	errorMessage?: string;
	onSuccess?: (result: R) => void;
	onError?: (err: unknown) => void;
}

export const useFormWithSnackbar = <T, R = void>(options: UseFormWithSnackbarOptions<T, R>) => {
	const {
		onSubmit,
		successMessage = "Cambios guardados correctamente",
		errorMessage = "Error al guardar los cambios",
		onSuccess,
		onError,
	} = options;

	return async (values: T, formikHelpers: FormikHelpers<T>) => {
		try {
			const result = await onSubmit(values);
			dispatch(
				openSnackbar({
					open: true,
					message: successMessage,
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
			onSuccess?.(result);
		} catch (err: unknown) {
			const message =
				err && typeof err === "object" && "response" in err
					? (err as any).response?.data?.message || (err as any).message || errorMessage
					: errorMessage;
			dispatch(
				openSnackbar({
					open: true,
					message,
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
			onError?.(err);
		} finally {
			formikHelpers.setSubmitting(false);
		}
	};
};
