// ==============================|| DIFF UTILS — word-level diff for TipTap ||============================== //

import { Fragment } from "prosemirror-model";
import { type Editor } from "@tiptap/react";

export interface DiffSegment {
	type: "equal" | "removed" | "added";
	text: string;
}

/** Splits text into words + whitespace tokens */
export function tokenize(text: string): string[] {
	return text.match(/\S+|\s+/g) ?? [];
}

/** LCS matrix for two token arrays */
export function buildLCS(a: string[], b: string[]): number[][] {
	const m = a.length;
	const n = b.length;
	const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
		}
	}
	return dp;
}

/** Word-level diff using LCS */
export function wordDiff(original: string, result: string): DiffSegment[] {
	const a = tokenize(original);
	const b = tokenize(result);
	const dp = buildLCS(a, b);
	const segments: DiffSegment[] = [];
	let i = a.length;
	let j = b.length;

	while (i > 0 || j > 0) {
		if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
			segments.unshift({ type: "equal", text: a[i - 1] });
			i--;
			j--;
		} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
			segments.unshift({ type: "added", text: b[j - 1] });
			j--;
		} else {
			segments.unshift({ type: "removed", text: a[i - 1] });
			i--;
		}
	}

	return segments;
}

/**
 * Inserts diff content into the editor at [from, to] WITHOUT adding to undo history.
 * This way, undo skips the diff state and goes directly back to the original text.
 */
export function insertDiffWithoutHistory(editor: Editor, from: number, to: number, segments: DiffSegment[]): void {
	const schema = editor.schema;
	const nodes = segments.map((seg) => {
		if (seg.type === "equal") {
			return schema.text(seg.text);
		}
		if (seg.type === "removed") {
			return schema.text(seg.text, [schema.marks.strike.create(), schema.marks.textStyle.create({ color: "#b91c1c" })]);
		}
		// added
		return schema.text(seg.text, [
			schema.marks.highlight.create({ color: "#bbf7d0" }),
			schema.marks.textStyle.create({ color: "#15803d" }),
		]);
	});
	const fragment = Fragment.from(nodes);
	const tr = editor.state.tr.replaceWith(from, to, fragment).setMeta("addToHistory", false);
	editor.view.dispatch(tr);
}

/** Build TipTap JSON content nodes from diff segments */
export function buildDiffContent(segments: DiffSegment[]): object[] {
	return segments.map((seg) => {
		if (seg.type === "equal") {
			return { type: "text", text: seg.text };
		}
		if (seg.type === "removed") {
			return {
				type: "text",
				text: seg.text,
				marks: [{ type: "strike" }, { type: "textStyle", attrs: { color: "#b91c1c" } }],
			};
		}
		// added
		return {
			type: "text",
			text: seg.text,
			marks: [
				{ type: "highlight", attrs: { color: "#bbf7d0" } },
				{ type: "textStyle", attrs: { color: "#15803d" } },
			],
		};
	});
}
