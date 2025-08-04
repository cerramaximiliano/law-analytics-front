import { DocumentTemplate, TemplateVariableDetail } from "types/documents";
import { getVariableDisplayName } from "utils/templateVariables";

export interface ValidationResult {
	isValid: boolean;
	missingData: {
		variable: string;
		label: string;
		type: "contact" | "folder" | "user" | "other";
		required: boolean;
		description?: string;
		fallback?: string;
	}[];
}

/**
 * Validates if all required data is available for a template
 */
export function validateTemplateData(
	template: DocumentTemplate,
	availableData: {
		contact?: any;
		folder?: any;
		user?: any;
		[key: string]: any;
	},
): ValidationResult {
	const missingData: ValidationResult["missingData"] = [];

	if (!template.variableDetails || template.variableDetails.length === 0) {
		// If no variable details defined, assume template is valid
		return { isValid: true, missingData: [] };
	}

	// Check each variable
	template.variableDetails.forEach((variable: TemplateVariableDetail) => {
		const pathParts = variable.path.split(".");
		let value = availableData;
		let isMissing = false;

		// Special handling for user.skill paths
		if (pathParts[0] === "user" && pathParts[1] === "skill" && pathParts.length > 2) {
			const user = availableData.user;
			if (user && user.skill) {
				// Handle both single skill object and array of skills
				const skillArray = Array.isArray(user.skill) ? user.skill : [user.skill];
				if (skillArray.length > 0 && typeof skillArray[0] === "object") {
					value = skillArray[0][pathParts[2]];
					isMissing = value === null || value === undefined || (typeof value === "string" && value === "");
				} else {
					isMissing = true;
				}
			} else {
				isMissing = true;
			}
		} else {
			// Navigate through the object path normally
			for (const part of pathParts) {
				if (value && typeof value === "object" && part in value) {
					value = value[part];
				} else {
					isMissing = true;
					break;
				}
			}
		}

		// Check if value is empty
		if (isMissing || value === null || value === undefined || (typeof value === "string" && value === "")) {
			missingData.push({
				variable: variable.path,
				label: variable.label,
				type: variable.type,
				required: variable.required,
				description: variable.description,
				fallback: variable.fallback,
			});
		}
	});

	// Template is valid if no required data is missing
	const hasRequiredMissing = missingData.some((item) => item.required);

	return {
		isValid: !hasRequiredMissing,
		missingData,
	};
}

/**
 * Replaces template variables with actual data or fallback values
 */
export function replaceTemplateVariablesWithFallback(content: string, data: any, template: DocumentTemplate): string {
	if (!data) return content;

	// Create a map of variable paths to their fallback values
	const fallbackMap: Record<string, string> = {};
	if (template.variableDetails) {
		template.variableDetails.forEach((variable) => {
			if (variable.fallback) {
				fallbackMap[variable.path] = variable.fallback;
			}
		});
	}

	// Replace variables in format {{path.to.variable}}
	return content.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
		const trimmedPath = path.trim();
		const keys = trimmedPath.split(".");
		let value = data;

		// Special handling for user.skill which can be an array
		if (keys[0] === "user" && keys[1] === "skill" && keys.length > 2) {
			const user = data.user;
			if (user && user.skill && Array.isArray(user.skill) && user.skill.length > 0) {
				const skill = user.skill[0];
				if (typeof skill === "object") {
					value = skill[keys[2]];
					if (value !== null && value !== undefined && value !== "") {
						return value.toString();
					}
				}
			}
			// Use fallback if available or friendly placeholder
			return fallbackMap[trimmedPath] || `{{${getVariableDisplayName(trimmedPath)}}}`;
		}

		// Navigate through the object path
		for (const key of keys) {
			if (value && typeof value === "object" && key in value) {
				value = value[key];
			} else {
				// Use fallback if available or friendly placeholder
				return fallbackMap[trimmedPath] || `{{${getVariableDisplayName(trimmedPath)}}}`;
			}
		}

		if (value === null || value === undefined || value === "") {
			// Use fallback if available or friendly placeholder
			return fallbackMap[trimmedPath] || `{{${getVariableDisplayName(trimmedPath)}}}`;
		}

		return value.toString();
	});
}
