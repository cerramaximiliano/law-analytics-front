/**
 * Regresión del 11/11/2026 (reporte de Silvia): al cambiar un filtro del listado («Última semana»,
 * «Último mes»…) el orden elegido volvía a carátula. react-table reinicia `sortBy` con cada array
 * nuevo de `data` salvo que se pase `autoResetSortBy: false`, que es lo que usa folders.tsx.
 */
import { renderHook, act } from "@testing-library/react";
import { useSortBy, useTable } from "react-table";

const columns = [
	{ Header: "Carátula", accessor: "folderName" },
	{ Header: "Último movimiento", accessor: "lastMovementDate" },
] as any;
const causas = [
	{ folderName: "B", lastMovementDate: "2026-11-01" },
	{ folderName: "A", lastMovementDate: "2026-10-01" },
	{ folderName: "C", lastMovementDate: "2026-11-09" },
];
const initialState = { sortBy: [{ id: "folderName", desc: false }] };
const ultimaSemana = causas.filter((f) => f.lastMovementDate >= "2026-11-05");

const useListado = (data: any[], opciones: Record<string, unknown>) =>
	useTable({ columns, data, initialState, ...opciones } as any, useSortBy) as any;

describe("orden del listado de causas al cambiar filtros", () => {
	it("sin autoResetSortBy:false react-table vuelve a carátula (el bug)", () => {
		const { result, rerender } = renderHook(({ data }: any) => useListado(data, {}), { initialProps: { data: causas } });
		act(() => result.current.setSortBy([{ id: "lastMovementDate", desc: true }]));
		rerender({ data: ultimaSemana });
		expect(result.current.state.sortBy[0].id).toBe("folderName");
	});

	it("con autoResetSortBy:false (config de folders.tsx) se mantiene «Último movimiento»", () => {
		const { result, rerender } = renderHook(({ data }: any) => useListado(data, { autoResetSortBy: false }), {
			initialProps: { data: causas },
		});
		act(() => result.current.setSortBy([{ id: "lastMovementDate", desc: true }]));
		rerender({ data: ultimaSemana });
		expect(result.current.state.sortBy).toEqual([{ id: "lastMovementDate", desc: true }]);
		expect(result.current.rows.map((r: any) => r.original.folderName)).toEqual(["C"]);
	});
});
