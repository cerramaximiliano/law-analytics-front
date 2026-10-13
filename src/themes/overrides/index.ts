// material-ui
import { Theme } from "@mui/material/styles";

// third-party
// deepmerge de MUI en vez de lodash/merge: lodash/merge arrastraba ~40 módulos
// CommonJS de lodash al paquete de arranque solo para el tema (2026-10-13).
import { deepmerge } from "@mui/utils";

// project-imports
import Accordion from "./Accordion";
import AccordionDetails from "./AccordionDetails";
import AccordionSummary from "./AccordionSummary";
import Alert from "./Alert";
import AlertTitle from "./AlertTitle";
import Autocomplete from "./Autocomplete";
import Badge from "./Badge";
import Backdrop from "./Backdrop";
import Body from "./Body";
import Button from "./Button";
import ButtonBase from "./ButtonBase";
import ButtonGroup from "./ButtonGroup";
import CardContent from "./CardContent";
import Checkbox from "./Checkbox";
import Chip from "./Chip";
import Dialog from "./Dialog";
import DialogContentText from "./DialogContentText";
import DialogTitle from "./DialogTitle";
import Drawer from "./Drawer";
import Fab from "./Fab";
import FormHelperText from "./FormHelperText";
import IconButton from "./IconButton";
import InputBase from "./InputBase";
import InputLabel from "./InputLabel";
import LinearProgress from "./LinearProgress";
import Link from "./Link";
import ListItemButton from "./ListItemButton";
import ListItemIcon from "./ListItemIcon";
import LoadingButton from "./LoadingButton";
import OutlinedInput from "./OutlinedInput";
import Pagination from "./Pagination";
import PaginationItem from "./PaginationItem";
import Popover from "./Popover";
import Radio from "./Radio";
import Select from "./Select";
import Slider from "./Slider";
import Switch from "./Switch";
import Tab from "./Tab";
import TableBody from "./TableBody";
import TableCell from "./TableCell";
import TableFooter from "./TableFooter";
import TableHead from "./TableHead";
import TablePagination from "./TablePagination";
import TableRow from "./TableRow";
import Tabs from "./Tabs";
import ToggleButton from "./ToggleButton";
import Tooltip from "./Tooltip";
import TreeItem from "./TreeItem";
import Typography from "./Typography";

const merge = (...partes: object[]) => partes.reduce((acc, parte) => deepmerge(acc, parte), {});

// ==============================|| OVERRIDES - MAIN ||============================== //

export default function ComponentsOverrides(theme: Theme) {
	return merge(
		Accordion(theme),
		AccordionDetails(theme),
		AccordionSummary(theme),
		Alert(theme),
		AlertTitle(),
		Autocomplete(),
		Badge(theme),
		Backdrop(),
		Body(),
		Button(theme),
		ButtonBase(),
		ButtonGroup(),
		CardContent(),
		Checkbox(theme),
		Chip(theme),
		Dialog(),
		DialogContentText(theme),
		DialogTitle(),
		Drawer(),
		Fab(theme),
		FormHelperText(),
		IconButton(theme),
		InputBase(),
		InputLabel(theme),
		LinearProgress(),
		Link(),
		ListItemButton(theme),
		ListItemIcon(theme),
		LoadingButton(),
		OutlinedInput(theme),
		Pagination(),
		PaginationItem(theme),
		Popover(theme),
		Radio(theme),
		Select(),
		Slider(theme),
		Switch(theme),
		Tab(theme),
		TableBody(theme),
		TableCell(theme),
		TableFooter(theme),
		TableHead(theme),
		TablePagination(),
		TableRow(),
		Tabs(),
		ToggleButton(theme),
		Tooltip(theme),
		TreeItem(),
		Typography(),
	);
}
