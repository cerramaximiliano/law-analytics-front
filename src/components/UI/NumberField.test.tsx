import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Formik } from "formik";
import NumberField from "./NumberField";

const renderField = (initial: number | string, extra: Record<string, unknown> = {}) => {
	let values: any = {};
	render(
		<Formik initialValues={{ importe: initial }} onSubmit={() => {}}>
			{(f) => {
				values = f.values;
				return <NumberField name="importe" thousandSeparator="," decimalScale={2} fixedDecimalScale placeholder="0,00" {...extra} />;
			}}
		</Formik>,
	);
	return { input: screen.getByPlaceholderText("0,00") as HTMLInputElement, values: () => values };
};

describe("NumberField con importes (formato argentino)", () => {
	it("un valor guardado con un decimal se muestra con dos: 2558.5 → 2.558,50", () => {
		const { input } = renderField(2558.5);
		expect(input.value).toBe("2.558,50");
	});
	it("un entero guardado se muestra con ,00", () => {
		const { input } = renderField(26218187.57);
		expect(input.value).toBe("26.218.187,57");
	});
	it("tipear con coma decimal guarda el número correcto", () => {
		const { input, values } = renderField("");
		fireEvent.change(input, { target: { value: "6175,61" } });
		expect(values().importe).toBe(6175.61);
	});
});
