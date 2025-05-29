/**
 * Formats a folder name according to proper capitalization rules
 * @param name - The folder name to format
 * @param maxLength - Maximum length before truncation (optional)
 * @returns The formatted folder name
 */
export const formatFolderName = (name: string, maxLength?: number): string => {
	if (!name) return "";

	// Conjunctions and articles that should remain lowercase
	const lowercaseWords = ["y", "e", "o", "u", "de", "del", "la", "las", "el", "los", "en", "con", "sin", "por", "para", "a"];

	// Process the name
	let formatted = name
		.toLowerCase()
		.split(" ")
		.map((word, index) => {
			// Always capitalize the first word
			if (index === 0) {
				// Check if it's an acronym with dots
				if (word.includes(".")) {
					return word.toUpperCase();
				}
				return word.charAt(0).toUpperCase() + word.slice(1);
			}

			// Check if it's an acronym with dots (e.g., s.a. -> S.A.)
			if (word.includes(".")) {
				return word.toUpperCase();
			}

			// Keep conjunctions and articles lowercase unless they're the first word
			if (lowercaseWords.includes(word)) {
				return word;
			}

			// Capitalize other words
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(" ");

	// Truncate if too long and maxLength is provided
	if (maxLength && formatted.length > maxLength) {
		formatted = formatted.substring(0, maxLength - 3) + "...";
	}

	return formatted;
};
