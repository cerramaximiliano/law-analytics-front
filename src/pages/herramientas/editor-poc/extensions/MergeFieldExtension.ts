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
			key: { default: null },
			label: { default: null },
		};
	},

	parseHTML() {
		return [{ tag: "span[data-merge-field]" }];
	},

	renderHTML({ node, HTMLAttributes }) {
		const { bg, color, border } = getGroupColorByKey(node.attrs.key ?? "");
		return [
			"span",
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				"data-merge-field": node.attrs.key,
				class: "merge-field",
				contenteditable: "false",
				style: `background:${bg};color:${color};border-color:${border}`,
			}),
			`{{${node.attrs.label ?? node.attrs.key}}}`,
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
