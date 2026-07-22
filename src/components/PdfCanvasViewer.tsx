/**
 * Visor de PDF renderizado a <canvas> con pdfjs-dist.
 *
 * Existe porque los browsers mobile (Chrome Android en particular) NO renderizan
 * PDFs dentro de un <iframe>: muestran un placeholder con el nombre del archivo
 * y un botón "Abrir" que saca al usuario a otra pestaña/app. En desktop el
 * iframe nativo es mejor (toolbar, selección de texto, zoom) — usar este
 * componente SOLO donde el iframe no funciona (mobile).
 *
 * CORS: las presigned URLs de S3 se pueden fetchear cross-origin — el bucket
 * pjn-rag-documents tiene CORS con GET/HEAD para lawanalytics.app (verificado
 * 2026-07-22). Worker de pdfjs desde CDN, mismo patrón que usePdfTextDetection.
 */
import React, { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";

interface PdfCanvasViewerProps {
	url: string;
	// Identidad del documento. Las presigned URLs rotan cada pocos minutos: si la
	// URL cambia pero el docKey es el mismo, NO se recarga ni re-renderiza.
	docKey: string;
	// El PDF no se pudo cargar/renderizar — el padre decide el fallback (iframe).
	onError?: () => void;
}

const PdfCanvasViewer = ({ url, docKey, onError }: PdfCanvasViewerProps) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const [loading, setLoading] = useState(true);
	// Qué documento quedó renderizado (evita re-render en refresh de presigned URL).
	const loadedKeyRef = useRef<string | null>(null);
	// onError en ref: identidad inestable del callback no debe reiniciar la carga.
	const onErrorRef = useRef(onError);
	onErrorRef.current = onError;
	// Re-render forzado cuando el ancho del contenedor cambia de verdad (rotación).
	const [renderTick, setRenderTick] = useState(0);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el || typeof ResizeObserver === "undefined") return;
		let lastWidth = el.clientWidth;
		const ro = new ResizeObserver(() => {
			const w = el.clientWidth;
			if (lastWidth > 0 && Math.abs(w - lastWidth) / lastWidth > 0.2) {
				lastWidth = w;
				loadedKeyRef.current = null;
				setRenderTick((t) => t + 1);
			}
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	useEffect(() => {
		if (!url || !docKey || loadedKeyRef.current === docKey) return;
		let cancelled = false;
		let pdfDoc: any = null;

		(async () => {
			try {
				setLoading(true);
				// @ts-ignore — sin types instalados para el import dinámico
				const pdfjsLib = await import("pdfjs-dist");
				pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

				const pdf = await pdfjsLib.getDocument({ url }).promise;
				if (cancelled) return;
				pdfDoc = pdf;

				const container = containerRef.current;
				if (!container) return;
				container.innerHTML = "";
				const cssWidth = container.clientWidth || 320;
				// Cap del DPR: 2 alcanza para nitidez y evita canvases gigantes en
				// pantallas 3x (memoria limitada en mobile).
				const dpr = Math.min(window.devicePixelRatio || 1, 2);

				for (let i = 1; i <= pdf.numPages; i++) {
					if (cancelled) return;
					const page = await pdf.getPage(i);
					const base = page.getViewport({ scale: 1 });
					const scale = (cssWidth / base.width) * dpr;
					const viewport = page.getViewport({ scale });

					const canvas = document.createElement("canvas");
					canvas.width = viewport.width;
					canvas.height = viewport.height;
					canvas.style.width = "100%";
					canvas.style.display = "block";
					canvas.style.marginBottom = "8px";
					canvas.style.background = "#fff";
					canvas.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2)";

					const ctx = canvas.getContext("2d");
					if (!ctx) continue;
					container.appendChild(canvas);
					await page.render({ canvasContext: ctx, viewport }).promise;
				}

				if (!cancelled) {
					loadedKeyRef.current = docKey;
					setLoading(false);
				}
			} catch {
				if (!cancelled) {
					setLoading(false);
					onErrorRef.current?.();
				}
			}
		})();

		return () => {
			cancelled = true;
			try {
				pdfDoc?.destroy();
			} catch {
				// best-effort
			}
		};
	}, [url, docKey, renderTick]);

	return (
		<Box ref={scrollRef} sx={{ position: "relative", width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden", p: 1 }}>
			{loading && (
				<Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ position: "absolute", inset: 0 }}>
					<CircularProgress size={28} />
					<Typography variant="caption" color="text.secondary">
						Cargando documento...
					</Typography>
				</Stack>
			)}
			<Box ref={containerRef} sx={{ width: "100%" }} />
		</Box>
	);
};

export default PdfCanvasViewer;
