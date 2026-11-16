import { Extension } from "@tiptap/core";

// Sangría de párrafo: «indent» mueve todo el párrafo (margin-left) y «firstLineIndent» solo el
// primer renglón (text-indent). Se guardan en centímetros. Al pegar desde Word u otro editor se
// leen del estilo del párrafo, así el modelo copiado conserva su sangría.

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		indent: {
			increaseIndent: () => ReturnType;
			decreaseIndent: () => ReturnType;
			toggleFirstLineIndent: () => ReturnType;
		};
	}
}

export const INDENT_STEP_CM = 1.25;
export const INDENT_MAX_CM = 10;
export const FIRST_LINE_INDENT_CM = 1.25;

const CM_PER_UNIT: Record<string, number> = { cm: 1, mm: 0.1, in: 2.54, pt: 2.54 / 72, px: 2.54 / 96, pc: 2.54 / 6 };

/** «35.4pt», «1.25cm», «0.5in»… → centímetros (2 decimales), o null si no es una medida positiva. */
export const cssLengthToCm = (value?: string | null): number | null => {
	if (!value) return null;
	const m = /^\s*(-?\d*\.?\d+)\s*(cm|mm|in|pt|px|pc)\s*$/i.exec(value);
	if (!m) return null;
	const cm = parseFloat(m[1]) * CM_PER_UNIT[m[2].toLowerCase()];
	if (!Number.isFinite(cm) || cm <= 0.05) return null;
	return Math.min(INDENT_MAX_CM, Math.round(cm * 100) / 100);
};

const IndentExtension = Extension.create({
	name: "indent",

	addOptions() {
		return { types: ["paragraph", "heading"] };
	},

	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					indent: {
						default: null,
						parseHTML: (element) => cssLengthToCm(element.style.marginLeft),
						renderHTML: (attributes) => (attributes.indent ? { style: `margin-left: ${attributes.indent}cm` } : {}),
					},
					firstLineIndent: {
						default: null,
						parseHTML: (element) => cssLengthToCm(element.style.textIndent),
						renderHTML: (attributes) => (attributes.firstLineIndent ? { style: `text-indent: ${attributes.firstLineIndent}cm` } : {}),
					},
				},
			},
		];
	},

	addCommands() {
		const types: string[] = this.options.types;
		const update =
			(change: (attrs: Record<string, any>) => Record<string, any>) =>
			({ state, tr, dispatch }: any) => {
				const { from, to } = state.selection;
				let changed = false;
				state.doc.nodesBetween(from, to, (node: any, pos: number) => {
					if (!types.includes(node.type.name)) return;
					const next = { ...node.attrs, ...change(node.attrs) };
					if (next.indent === node.attrs.indent && next.firstLineIndent === node.attrs.firstLineIndent) return;
					if (dispatch) tr.setNodeMarkup(pos, undefined, next);
					changed = true;
				});
				return changed;
			};
		const step = (attrs: Record<string, any>, dir: 1 | -1) => {
			const next = Math.round(((attrs.indent || 0) + dir * INDENT_STEP_CM) * 100) / 100;
			return { indent: next <= 0.05 ? null : Math.min(INDENT_MAX_CM, next) };
		};
		return {
			increaseIndent: () => update((attrs) => step(attrs, 1)),
			decreaseIndent: () => update((attrs) => step(attrs, -1)),
			toggleFirstLineIndent: () => update((attrs) => ({ firstLineIndent: attrs.firstLineIndent ? null : FIRST_LINE_INDENT_CM })),
		};
	},
});

export default IndentExtension;
