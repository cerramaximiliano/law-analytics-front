// Image loader utility for Vite - replaces require.context()

interface ImageModule {
	default: string;
}

// Pre-load all images using Vite's import.meta.glob
const userImages = import.meta.glob<ImageModule>("/src/assets/images/users/*", { eager: true });
const profileImages = import.meta.glob<ImageModule>("/src/assets/images/profile/*", { eager: true });
const widgetImages = import.meta.glob<ImageModule>("/src/assets/images/widget/*", { eager: true });

// Helper function to get image path from filename
const getImagePath = (imageMap: Record<string, ImageModule>, filename: string): string => {
	// Find the key that ends with the filename
	const key = Object.keys(imageMap).find((path) => path.endsWith(filename) || path.includes(filename));
	if (key && imageMap[key]) {
		return imageMap[key].default;
	}
	// Return default fallback or empty string if image not found
	console.warn(`Image not found: ${filename}`);
	return "";
};

// Image loader functions that mimic require.context behavior
export const avatarImage = (filename: string): string => {
	// Handle both with and without file extensions
	if (!filename.includes(".")) {
		// Try common extensions
		const extensions = [".png", ".jpg", ".jpeg", ".svg"];
		for (const ext of extensions) {
			const result = getImagePath(userImages, filename + ext);
			if (result) return result;
		}
	}
	return getImagePath(userImages, filename);
};

export const backImage = (filename: string): string => {
	if (!filename.includes(".")) {
		const extensions = [".png", ".jpg", ".jpeg", ".svg"];
		for (const ext of extensions) {
			const result = getImagePath(profileImages, filename + ext);
			if (result) return result;
		}
	}
	return getImagePath(profileImages, filename);
};

export const productImage = (filename: string): string => {
	if (!filename.includes(".")) {
		const extensions = [".png", ".jpg", ".jpeg", ".svg"];
		for (const ext of extensions) {
			const result = getImagePath(widgetImages, filename + ext);
			if (result) return result;
		}
	}
	return getImagePath(widgetImages, filename);
};

// For backward compatibility, create objects that mimic require.context behavior
export const createImageContext = (type: "users" | "profile" | "widget") => {
	const loaderMap = {
		users: avatarImage,
		profile: backImage,
		widget: productImage,
	};

	const loader = loaderMap[type];

	// Return a function that mimics require.context behavior
	return (filename: string) => loader(filename);
};

// Export default loaders
export default {
	avatarImage,
	backImage,
	productImage,
	createImageContext,
};
