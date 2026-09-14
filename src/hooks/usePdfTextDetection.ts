import { useState, useEffect } from "react";

interface UsePdfTextDetectionOptions {
	blobUrl: string;
	movementId: string;
	enabled: boolean;
}

interface UsePdfTextDetectionReturn {
	hasText: boolean | null;
	isChecking: boolean;
}

// Module-level cache to avoid re-checking the same documents
const textDetectionCache = new Map<string, boolean>();

const usePdfTextDetection = ({ blobUrl, movementId, enabled }: UsePdfTextDetectionOptions): UsePdfTextDetectionReturn => {
	const [hasText, setHasText] = useState<boolean | null>(null);
	const [isChecking, setIsChecking] = useState(false);

	useEffect(() => {
		if (!enabled || !blobUrl || !movementId) {
			setHasText(null);
			setIsChecking(false);
			return;
		}

		// Check cache first
		if (textDetectionCache.has(movementId)) {
			setHasText(textDetectionCache.get(movementId)!);
			setIsChecking(false);
			return;
		}

		let cancelled = false;

		const checkText = async () => {
			setIsChecking(true);
			try {
				// @ts-ignore
				const pdfjsLib = await import("pdfjs-dist");

				// Configure worker using CDN that matches the installed version
				const version = pdfjsLib.version;
				pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

				const loadingTask = pdfjsLib.getDocument(blobUrl);
				const pdf = await loadingTask.promise;
				const page = await pdf.getPage(1);
				const textContent = await page.getTextContent();

				const extractedText = textContent.items
					.map((item: any) => item.str)
					.join("")
					.trim();

				const result = extractedText.length > 0;

				if (!cancelled) {
					textDetectionCache.set(movementId, result);
					setHasText(result);
					setIsChecking(false);
				}

				pdf.destroy();
			} catch (err) {
				console.warn("PDF text detection failed:", err);
				if (!cancelled) {
					setHasText(null);
					setIsChecking(false);
				}
			}
		};

		checkText();

		return () => {
			cancelled = true;
		};
	}, [blobUrl, movementId, enabled]);

	return { hasText, isChecking };
};

export default usePdfTextDetection;
