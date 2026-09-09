/**
 * Reproduce el bug del login: MUI InputBase llama `onBlur()` sin evento cuando un input
 * queda `disabled` estando enfocado (Enter → isSubmitting → disabled), y el handleBlur de
 * Formik explota con "Cannot read properties of undefined (reading 'persist')".
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { OutlinedInput } from "@mui/material";
import { Formik } from "formik";
import { safeFormikBlur } from "../utils/formikSafeBlur";

const Harness = ({ safe }: { safe: boolean }) => (
	<Formik initialValues={{ password: "" }} onSubmit={() => new Promise(() => {})}>
		{({ handleBlur, handleChange, handleSubmit, isSubmitting, values }) => (
			<form onSubmit={handleSubmit}>
				<OutlinedInput
					inputProps={{ "data-testid": "pwd" }}
					name="password"
					value={values.password}
					onChange={handleChange}
					onBlur={safe ? safeFormikBlur(handleBlur) : handleBlur}
					disabled={isSubmitting}
				/>
				<button type="submit">go</button>
			</form>
		)}
	</Formik>
);

const focusTypeAndSubmit = async () => {
	const input = screen.getByTestId("pwd") as HTMLInputElement;
	input.focus();
	fireEvent.focus(input);
	fireEvent.change(input, { target: { value: "secret" } });
	await act(async () => {
		fireEvent.submit(input.closest("form")!);
	});
	return input;
};

describe("safeFormikBlur", () => {
	it("sin el helper: deshabilitar el input enfocado tras el submit explota en handleBlur", async () => {
		// El error sale de un useEffect de MUI; un error boundary lo captura (React no lo re-lanza en window).
		let caught: Error | null = null;
		class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
			state = { failed: false };
			static getDerivedStateFromError() {
				return { failed: true };
			}
			componentDidCatch(err: Error) {
				caught = err;
			}
			render() {
				return this.state.failed ? null : this.props.children;
			}
		}
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		try {
			render(
				<Boundary>
					<Harness safe={false} />
				</Boundary>,
			);
			await focusTypeAndSubmit();
		} finally {
			spy.mockRestore();
		}
		expect(caught).not.toBeNull();
		expect(String(caught)).toMatch(/persist/);
	});

	it("con el helper: el submit deshabilita el input sin lanzar", async () => {
		render(<Harness safe={true} />);
		const input = await focusTypeAndSubmit();
		expect(input.disabled).toBe(true);
	});
});
