import { Node, mergeAttributes } from "@tiptap/core";
import { getGroupColorByKey } from "../mergeFieldsDefs";

export interface MergeFieldOptions {
	HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		mergeField: {
			insertMergeField: (key: string, label: string) => ReturnType;
		};
	}
}

const MergeFieldExtension = Node.create<MergeFieldOptions>({
	name: "mergeField",

	group: "inline",
	inline: true,
	atom: true,
	selectable: true,
	draggable: false,

	addOptions() {
		return { HTMLAttributes: {} };
	},

	addAttributes() {
		return {
			key: {
				default: null,
				parseHTML: (el) => el.getAttribute("data-merge-field"),
				renderHTML: (attrs) => ({ "data-merge-field": attrs.key }),
			},
			label: {
				default: null,
				parseHTML: (el) => el.getAttribute("data-label") ?? el.getAttribute("data-merge-field"),
				renderHTML: (attrs) => ({ "data-label": attrs.label }),
			},
		};
	},

	parseHTML() {
		return [{ tag: "span[data-merge-field]" }];
	},

	renderHTML({ node, HTMLAttributes }) {
		const key = node.attrs.key ?? "";
		const label = node.attrs.label ?? key;
		const { bg, color, border } = getGroupColorByKey(key);
		const isBloque = key.startsWith("bloque.");
		return [
			"span",
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				class: isBloque ? "merge-field merge-field--bloque" : "merge-field",
				contenteditable: "false",
				style: `background:${bg};color:${color};border-color:${border}`,
			}),
			`[${label}]`,
		];
	},

	addCommands() {
		return {
			insertMergeField:
				(key: string, label: string) =>
				({ chain }) => {
					return chain()
						.focus()
						.insertContent({
							type: this.name,
							attrs: { key, label },
						})
						.run();
				},
		};
	},
});

export default MergeFieldExtension;
