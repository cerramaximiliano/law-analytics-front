type AvatarTypeProps = "filled" | "outlined" | "combined" | undefined;
type TypographyVariant =
	| "h6"
	| "button"
	| "caption"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "inherit"
	| "subtitle1"
	| "subtitle2"
	| "body1"
	| "body2"
	| "overline"
	| undefined;

export type Alert = {
	avatarType?: AvatarTypeProps;
	avatarIcon?: "Gift" | "MessageText1" | "Setting2" | "TableDocument" | "CalendarRemove" | "TaskSquare";
	avatarSize?: number;
	avatarInitial?: string;
	primaryText: string;
	primaryVariant: TypographyVariant;
	secondaryText: string;
	actionText: string;
	_id: string;
	userId: string;
	folderId: string;
	expirationDate: string;
	read: string;
};

export interface AlertsState {
	alerts: Alert[];
	isLoader: boolean;
	error?: string;
}
