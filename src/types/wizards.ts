export interface WizardProps {
	folder?: {
		_id: string;
		folderName: string;
		// ... otras propiedades del folder
	} | null;
	onFolderChange?: (folderId: string | null) => void;
}
