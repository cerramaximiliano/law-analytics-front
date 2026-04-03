import { useState, useEffect } from "react";
import ragAxios from "utils/ragAxios";

// ==============================|| HOOK — useEditorActions ||============================== //

export interface EditorActionDef {
	_id: string;
	label: string;
	hint: string;
	prompt: string;
	systemPromptOverride: string | null;
	useStyleCorpus: boolean;
	context: {
		includeDocument: boolean;
		requiresSelection: boolean;
	};
	scope: "bubble" | "panel" | "both";
	order: number;
	visibility: "global" | "user" | "plan";
}

/** Replaces {{text}} in a prompt template with the provided selected text. */
export function buildPrompt(template: string, selectedText?: string): string {
	if (!selectedText) return template;
	return template.replace(/\{\{text\}\}/g, selectedText);
}

interface UseEditorActionsOptions {
	scope?: "bubble" | "panel" | "both";
}

interface UseEditorActionsResult {
	actions: EditorActionDef[];
	loading: boolean;
}

// Module-level cache to avoid re-fetching across component remounts
const cache: { data: EditorActionDef[] | null; fetchedAt: number } = { data: null, fetchedAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function useEditorActions({ scope }: UseEditorActionsOptions = {}): UseEditorActionsResult {
	const [actions, setActions] = useState<EditorActionDef[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const fetchActions = async () => {
			// Use module-level cache if fresh
			if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
				if (!cancelled) {
					setActions(filterByScope(cache.data, scope));
					setLoading(false);
				}
				return;
			}

			try {
				const res = await ragAxios.get<{ success: boolean; data: EditorActionDef[] }>("/rag/editor/actions");
				if (res.data.success) {
					cache.data = res.data.data;
					cache.fetchedAt = Date.now();
					if (!cancelled) {
						setActions(filterByScope(res.data.data, scope));
						setLoading(false);
					}
				}
			} catch {
				// Silently fall back to empty — callers should provide hardcoded defaults
				if (!cancelled) setLoading(false);
			}
		};

		fetchActions();
		return () => { cancelled = true; };
	}, [scope]);

	return { actions, loading };
}

function filterByScope(actions: EditorActionDef[], scope?: string): EditorActionDef[] {
	if (!scope) return actions;
	return actions.filter((a) => a.scope === scope || a.scope === "both");
}
