import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import axios from "utils/axios";

const PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; color: #000; }
  p { margin: 0 0 0.5em; min-height: 1em; }
  h1 { font-size: 18pt; font-weight: bold; margin: 0.8em 0 0.4em; }
  h2 { font-size: 14pt; font-weight: bold; margin: 0.8em 0 0.4em; }
  h3 { font-size: 12pt; font-weight: bold; margin: 0.8em 0 0.4em; }
  ul, ol { padding-left: 1.5em; margin: 0 0 0.5em; }
  blockquote { border-left: 3px solid #ccc; margin: 0.5em 0; padding-left: 1em; color: #555; }
  .merge-field { background: none; border: none; color: inherit; font-family: inherit; font-size: inherit; font-weight: inherit; padding: 0; }
  @page { size: A4; margin: 25mm 25mm 25mm 30mm; }
`;

const EXTENSIONS = [
	StarterKit,
	Underline,
	TextAlign.configure({ types: ["heading", "paragraph"] }),
	TextStyle,
	Color,
	Highlight.configure({ multicolor: true }),
];

const normalizeHtmlForPrint = (html: string) =>
	html
		.replace(/<p><\/p>/g, "<p><br></p>")
		.replace(/\t/g, '<span style="display:inline-block;width:2cm"></span>');

export const printRichTextDocument = async (documentId: string): Promise<void> => {
	const res = await axios.get(`/api/rich-text-documents/${documentId}`);
	const doc = res.data?.document;
	if (!doc?.content || Object.keys(doc.content).length === 0) return;

	let html: string;
	try {
		html = generateHTML(doc.content, EXTENSIONS);
	} catch {
		return;
	}

	const normalized = normalizeHtmlForPrint(html);

	// Usar iframe oculto (mismo mecanismo que el editor) para no abrir una nueva pestaña visible
	const existing = document.getElementById("__print-iframe__");
	if (existing) document.body.removeChild(existing);

	const iframe = document.createElement("iframe");
	iframe.id = "__print-iframe__";
	iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
	document.body.appendChild(iframe);

	const iframeDoc = iframe.contentWindow!.document;
	iframeDoc.open();
	iframeDoc.write(
		`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${PRINT_CSS}</style></head><body>${normalized}</body></html>`
	);
	iframeDoc.close();

	setTimeout(() => {
		iframe.contentWindow!.focus();
		iframe.contentWindow!.print();
	}, 500);
};
