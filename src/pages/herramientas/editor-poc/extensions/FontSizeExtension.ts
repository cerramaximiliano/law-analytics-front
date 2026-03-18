import { Extension } from "@tiptap/core";
import "@tiptap/extension-text-style";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		fontSize: {
			setFontSize: (size: string) => ReturnType;
			unsetFontSize: () => ReturnType;
		};
	}
}

const FontSizeExtension = Extension.create({
	name: "fontSize",

	addOptions() {
		return { types: ["textStyle"] };
	},

	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					fontSize: {
						default: null,
						parseHTML: (element) => element.style.fontSize?.replace("pt", "") || null,
						renderHTML: (attributes) => {
							if (!attributes.fontSize) return {};
							return { style: `font-size: ${attributes.fontSize}pt` };
						},
					},
				},
			},
		];
	},

	addCommands() {
		return {
			setFontSize:
				(size: string) =>
				({ chain }) =>
					chain().setMark("textStyle", { fontSize: size }).run(),
			unsetFontSize:
				() =>
				({ chain }) =>
					chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
		};
	},
});

export default FontSizeExtension;
