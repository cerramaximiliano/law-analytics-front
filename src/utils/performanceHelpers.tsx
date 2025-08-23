import React, { memo, useMemo, useCallback } from "react";

// HOC para memoización profunda
export const deepMemo = <P extends object>(
	Component: React.ComponentType<P>,
	propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => {
	const MemoizedComponent = memo(Component, propsAreEqual || deepEqual);
	MemoizedComponent.displayName = `DeepMemo(${Component.displayName || Component.name})`;
	return MemoizedComponent;
};

// Comparación profunda para React.memo
export const deepEqual = (obj1: any, obj2: any): boolean => {
	if (obj1 === obj2) return true;
	
	if (typeof obj1 !== "object" || typeof obj2 !== "object") {
		return obj1 === obj2;
	}
	
	if (obj1 === null || obj2 === null) return false;
	
	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);
	
	if (keys1.length !== keys2.length) return false;
	
	for (const key of keys1) {
		if (!keys2.includes(key)) return false;
		if (!deepEqual(obj1[key], obj2[key])) return false;
	}
	
	return true;
};

// Hook para callbacks estables
export const useStableCallback = <T extends (...args: any[]) => any>(
	callback: T
): T => {
	const callbackRef = React.useRef(callback);
	
	React.useEffect(() => {
		callbackRef.current = callback;
	});
	
	return React.useCallback(
		((...args) => callbackRef.current(...args)) as T,
		[]
	);
};

// Componente optimizado para listas
export const OptimizedListItem = memo(
	({ item, onClick }: { item: any; onClick: (item: any) => void }) => {
		const handleClick = useCallback(() => {
			onClick(item);
		}, [item.id]); // Solo re-renderizar si cambia el ID
		
		return (
			<div onClick={handleClick}>
				{item.name}
			</div>
		);
	},
	(prevProps, nextProps) => {
		// Solo re-renderizar si cambian datos importantes
		return (
			prevProps.item.id === nextProps.item.id &&
			prevProps.item.name === nextProps.item.name &&
			prevProps.item.status === nextProps.item.status
		);
	}
);

// Context splitter para evitar re-renders innecesarios
export const createSelectiveContext = <T extends object>() => {
	const Context = React.createContext<T | undefined>(undefined);
	
	const Provider: React.FC<{ value: T; children: React.ReactNode }> = ({
		value,
		children,
	}) => {
		const memoizedValue = useMemo(() => value, [JSON.stringify(value)]);
		
		return (
			<Context.Provider value={memoizedValue}>
				{children}
			</Context.Provider>
		);
	};
	
	const useSelectContext = <K extends keyof T>(key: K): T[K] => {
		const context = React.useContext(Context);
		if (!context) {
			throw new Error("useSelectContext must be used within Provider");
		}
		
		return useMemo(() => context[key], [context[key]]);
	};
	
	return { Provider, useSelectContext };
};