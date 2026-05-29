import { ReactNode } from "react";

// ==============================|| RESPONSIVE TABLE - TYPES ||============================== //

export interface ResponsiveColumn<T> {
	/** Unique identifier for this column */
	id: string;
	/** Column header label */
	label: string;
	/** Renders the cell content for desktop table view */
	accessor: (row: T) => ReactNode;
	/**
	 * Renders the field value in the mobile card view.
	 * Falls back to `accessor` if omitted.
	 */
	mobileAccessor?: (row: T) => ReactNode;
	/**
	 * When true, this column is not rendered in the mobile card view.
	 * The column is still rendered on desktop.
	 */
	hideOnMobile?: boolean;
	/**
	 * Marks this column as the card title in mobile view.
	 * Only the first column flagged as primaryOnMobile is used as the title.
	 * If none is flagged, the first column is used.
	 */
	primaryOnMobile?: boolean;
	/** Text alignment for both desktop cells and mobile label/value pairs */
	align?: "left" | "center" | "right";
	/** Width applied to the desktop <TableCell> (e.g. 120, "10%") */
	width?: number | string;
}

export interface ResponsiveTableProps<T> {
	columns: ResponsiveColumn<T>[];
	rows: T[];
	/** Returns a stable key for each row */
	getRowId: (row: T) => string;
	/** Called when the user clicks a desktop row or a mobile card */
	onRowClick?: (row: T) => void;
	/** Message shown when rows is empty. Defaults to "Sin datos". */
	emptyMessage?: string;
	/**
	 * Renders an action slot at the bottom of each mobile card.
	 * Useful for icon-button groups (edit, delete, etc.)
	 */
	mobileActions?: (row: T) => ReactNode;
	/**
	 * Optional extra column rendered as the last column on desktop only.
	 * It does NOT appear in the mobile card body — use `mobileActions` for that.
	 */
	actionsColumn?: ResponsiveColumn<T>;
}
