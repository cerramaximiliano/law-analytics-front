import { Extension } from "@tiptap/core";

const TabIndentExtension = Extension.create({
	name: "tabIndent",
	addKeyboardShortcuts() {
		return {
			Tab: () => this.editor.commands.insertContent("\t"),
		};
	},
});

export default TabIndentExtension;
