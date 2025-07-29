import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "store";
import { setEntityLoadStatus } from "store/reducers/search";

/**
 * Hook to monitor when entities are loaded in the store
 * and update the search state accordingly
 */
export const useSearchEntityLoader = () => {
	const dispatch = useDispatch();

	// Monitor folders
	const folders = useSelector((state) => state.folder.folders);
	const foldersLoading = useSelector((state) => state.folder.isLoader);

	// Monitor contacts
	const contacts = useSelector((state) => state.contacts.contacts);
	const contactsLoading = useSelector((state) => state.contacts.isLoader);

	// Monitor calculators
	const calculators = useSelector((state) => state.calculator.calculators);
	const calculatorsLoading = useSelector((state) => state.calculator.isLoader);

	// Monitor tasks
	const tasks = useSelector((state) => state.tasksReducer.tasks);
	const tasksLoading = useSelector((state) => state.tasksReducer.isLoader);

	// Monitor events
	const events = useSelector((state) => state.events.events);
	const eventsLoading = useSelector((state) => state.events.isLoader);

	// Track if entities have been loaded at least once
	const [entitiesLoadedOnce, setEntitiesLoadedOnce] = useState({
		folders: false,
		contacts: false,
		calculators: false,
		tasks: false,
		events: false,
	});

	// Update folders load status
	useEffect(() => {
		// Considera cargado si:
		// 1. El array existe (no es null/undefined)
		// 2. No está en proceso de carga
		// 3. No se ha marcado como cargado previamente (para evitar re-marcarlo)
		if (folders !== null && folders !== undefined && !foldersLoading && !entitiesLoadedOnce.folders) {
			dispatch(setEntityLoadStatus({ entity: "folders", isLoaded: true }));
			setEntitiesLoadedOnce((prev) => ({ ...prev, folders: true }));
		}
	}, [folders, foldersLoading, entitiesLoadedOnce.folders, dispatch]);

	// Update contacts load status
	useEffect(() => {
		if (contacts !== null && contacts !== undefined && !contactsLoading && !entitiesLoadedOnce.contacts) {
			dispatch(setEntityLoadStatus({ entity: "contacts", isLoaded: true }));
			setEntitiesLoadedOnce((prev) => ({ ...prev, contacts: true }));
		}
	}, [contacts, contactsLoading, entitiesLoadedOnce.contacts, dispatch]);

	// Update calculators load status
	useEffect(() => {
		if (calculators !== null && calculators !== undefined && !calculatorsLoading && !entitiesLoadedOnce.calculators) {
			dispatch(setEntityLoadStatus({ entity: "calculators", isLoaded: true }));
			setEntitiesLoadedOnce((prev) => ({ ...prev, calculators: true }));
		}
	}, [calculators, calculatorsLoading, entitiesLoadedOnce.calculators, dispatch]);

	// Update tasks load status
	useEffect(() => {
		if (tasks !== null && tasks !== undefined && !tasksLoading && !entitiesLoadedOnce.tasks) {
			dispatch(setEntityLoadStatus({ entity: "tasks", isLoaded: true }));
			setEntitiesLoadedOnce((prev) => ({ ...prev, tasks: true }));
		}
	}, [tasks, tasksLoading, entitiesLoadedOnce.tasks, dispatch]);

	// Update events load status
	useEffect(() => {
		if (events !== null && events !== undefined && !eventsLoading && !entitiesLoadedOnce.events) {
			dispatch(setEntityLoadStatus({ entity: "events", isLoaded: true }));
			setEntitiesLoadedOnce((prev) => ({ ...prev, events: true }));
		}
	}, [events, eventsLoading, entitiesLoadedOnce.events, dispatch]);

	// Re-run search when new entities are loaded
	const searchQuery = useSelector((state) => state.search.query);
	const searchFilters = useSelector((state) => state.search.filters);
	const entityLoadStatus = useSelector((state) => state.search.entityLoadStatus);

	useEffect(() => {
		// If there's an active search and new entities were loaded, re-run the search
		if (searchQuery) {
			const { performGlobalSearch } = require("store/reducers/search");
			dispatch(performGlobalSearch(searchQuery, searchFilters));
		}
	}, [entityLoadStatus, dispatch]); // Only re-run when load status changes
};
