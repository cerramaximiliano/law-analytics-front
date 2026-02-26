import { useState, useEffect, useRef } from "react";
import axios from "axios";

interface UsePdfBlobLoaderOptions {
	url: string;
	enabled: boolean;
}

interface UsePdfBlobLoaderReturn {
	blobUrl: string;
	loading: boolean;
	error: boolean;
	loadProgress: number;
	showProgress: boolean;
	handleIframeLoad: () => void;
	handleIframeError: () => void;
	cleanup: () => void;
}

const usePdfBlobLoader = ({ url, enabled }: UsePdfBlobLoaderOptions): UsePdfBlobLoaderReturn => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [loadProgress, setLoadProgress] = useState(0);
	const [showProgress, setShowProgress] = useState(false);
	const [blobUrl, setBlobUrl] = useState<string>("");
	const prevUrlRef = useRef<string>("");

	const handleIframeLoad = () => {
		setLoading(false);
		setError(false);
		setShowProgress(false);
		setLoadProgress(100);
	};

	const handleIframeError = () => {
		setLoading(false);
		setError(true);
		setShowProgress(false);
		setLoadProgress(0);
	};

	const cleanup = () => {
		if (blobUrl && blobUrl.startsWith("blob:")) {
			URL.revokeObjectURL(blobUrl);
			setBlobUrl("");
		}
	};

	useEffect(() => {
		if (!enabled || !url || url === prevUrlRef.current) {
			return;
		}

		prevUrlRef.current = url;
		setLoading(true);
		setError(false);
		setLoadProgress(0);
		setShowProgress(true);

		let currentBlobUrl: string | null = null;

		const fetchDocument = async () => {
			try {
				const isRelativeUrl = url.startsWith("/api/") || url.startsWith("api/");

				if (isRelativeUrl) {
					const baseURL = import.meta.env.VITE_BASE_URL || "";
					const fullUrl = url.startsWith("/") ? `${baseURL}${url}` : `${baseURL}/${url}`;

					const response = await axios.get(fullUrl, {
						responseType: "blob",
						withCredentials: true,
						headers: {
							Accept: "application/pdf",
						},
						onDownloadProgress: (progressEvent) => {
							if (progressEvent.total) {
								const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
								setLoadProgress(Math.min(progress, 90));
							}
						},
					});

					const blob = new Blob([response.data], { type: "application/pdf" });
					const objectUrl = URL.createObjectURL(blob);
					currentBlobUrl = objectUrl;
					setBlobUrl(objectUrl);
					setLoadProgress(100);
					setLoading(false);
					setShowProgress(false);
				} else {
					try {
						const headResponse = await fetch(url, { method: "HEAD" });

						if (!headResponse.ok) {
							console.error("Document URL returned error status:", headResponse.status);
							setError(true);
							setLoading(false);
							setShowProgress(false);
							setLoadProgress(0);
							return;
						}

						const contentType = headResponse.headers.get("content-type") || "";
						const isPdf = contentType.includes("application/pdf") || contentType.includes("application/octet-stream");

						if (!isPdf) {
							console.error("URL does not contain a PDF. Content-Type:", contentType);
							setError(true);
							setLoading(false);
							setShowProgress(false);
							setLoadProgress(0);
							return;
						}

						setBlobUrl(url);
						setLoadProgress(90);
					} catch (headErr) {
						console.warn("HEAD request failed (possibly CORS), trying to load directly:", headErr);
						setBlobUrl(url);
						setLoadProgress(90);
					}
				}
			} catch (err) {
				console.error("Error fetching document:", err);
				setError(true);
				setLoading(false);
				setShowProgress(false);
				setLoadProgress(0);
			}
		};

		fetchDocument();

		return () => {
			if (currentBlobUrl && currentBlobUrl.startsWith("blob:")) {
				URL.revokeObjectURL(currentBlobUrl);
			}
		};
	}, [enabled, url]);

	// Cleanup when disabled
	useEffect(() => {
		if (!enabled && blobUrl && blobUrl.startsWith("blob:")) {
			URL.revokeObjectURL(blobUrl);
			setBlobUrl("");
		}
	}, [enabled]);

	return { blobUrl, loading, error, loadProgress, showProgress, handleIframeLoad, handleIframeError, cleanup };
};

export default usePdfBlobLoader;
