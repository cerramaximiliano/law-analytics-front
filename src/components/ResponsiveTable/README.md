# ResponsiveTable

A generic, reusable table component that switches between a standard MUI `<Table>`
on desktop and a list of `<Card>` items on mobile.

- **Desktop** (`>= sm`): `TableContainer > Table > TableHead + TableBody`
- **Mobile** (`< sm`): `Stack` of `Card variant="outlined"` — one per row

---

## Quick example

```tsx
import ResponsiveTable, { ActionTooltip } from "components/ResponsiveTable";
import type { ResponsiveColumn } from "components/ResponsiveTable";
import IconButton from "components/@extended/IconButton";
import { Edit, Trash } from "iconsax-react";

interface Causa {
  id: string;
  caratula: string;
  expediente: string;
  juzgado: string;
}

const columns: ResponsiveColumn<Causa>[] = [
  {
    id: "caratula",
    label: "Carátula",
    primaryOnMobile: true,
    accessor: (row) => row.caratula,
  },
  {
    id: "expediente",
    label: "Expediente",
    accessor: (row) => row.expediente,
  },
  {
    id: "juzgado",
    label: "Juzgado",
    hideOnMobile: true,               // shown on desktop only
    accessor: (row) => row.juzgado,
  },
];

function CausasTable({ causas }: { causas: Causa[] }) {
  return (
    <ResponsiveTable<Causa>
      columns={columns}
      rows={causas}
      getRowId={(row) => row.id}
      emptyMessage="No se encontraron causas"
      onRowClick={(row) => console.log("clicked", row.id)}
      mobileActions={(row) => (
        <>
          <ActionTooltip title="Editar">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* ... */ }}>
              <Edit size={16} />
            </IconButton>
          </ActionTooltip>
          <ActionTooltip title="Eliminar">
            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); /* ... */ }}>
              <Trash size={16} />
            </IconButton>
          </ActionTooltip>
        </>
      )}
      actionsColumn={{
        id: "__actions",
        label: "",
        align: "right",
        width: 80,
        accessor: (row) => (
          <ActionTooltip title="Editar">
            <IconButton size="small" onClick={() => console.log("edit", row.id)}>
              <Edit size={16} />
            </IconButton>
          </ActionTooltip>
        ),
      }}
    />
  );
}
```

---

## API

### `ResponsiveColumn<T>`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | yes | Unique column key |
| `label` | `string` | yes | Header / mobile label text |
| `accessor` | `(row: T) => ReactNode` | yes | Desktop cell renderer |
| `mobileAccessor` | `(row: T) => ReactNode` | no | Mobile override — falls back to `accessor` |
| `hideOnMobile` | `boolean` | no | Hides column in mobile card body |
| `primaryOnMobile` | `boolean` | no | Marks column as the card title on mobile |
| `align` | `"left" \| "center" \| "right"` | no | Cell alignment (default `"left"`) |
| `width` | `number \| string` | no | Column width for desktop `<TableCell>` |

### `ResponsiveTableProps<T>`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `columns` | `ResponsiveColumn<T>[]` | yes | Column definitions |
| `rows` | `T[]` | yes | Data rows |
| `getRowId` | `(row: T) => string` | yes | Stable key per row |
| `onRowClick` | `(row: T) => void` | no | Row/card click handler |
| `emptyMessage` | `string` | no | Empty state text (default `"Sin datos"`) |
| `mobileActions` | `(row: T) => ReactNode` | no | Action slot at mobile card footer |
| `actionsColumn` | `ResponsiveColumn<T>` | no | Extra desktop-only actions column |

### `ActionTooltip`

```tsx
<ActionTooltip title="Eliminar">
  <IconButton>...</IconButton>
</ActionTooltip>
```

Wraps any `ReactElement` with a MUI `Tooltip` and automatically sets `aria-label`
on the child — no need to duplicate the label.

---

## What this component does NOT cover (future batches)

- **Sorting**: no `useSortBy` integration. Add a `sortable?: boolean` flag per
  column and lift sort state to the parent (or integrate `HeaderSort` from
  `components/third-party/ReactTable`).
- **Pagination**: not included. Wrap `<ResponsiveTable>` with `<TablePagination>`
  from `components/third-party/ReactTable` and slice `rows` before passing in.
- **Row selection**: no `IndeterminateCheckbox`. Add a `selectable` prop and an
  `onSelectionChange` callback in a future batch.
- **Column filtering / global search**: not included — compose with `GlobalFilter`
  from `utils/react-table`.
- **Sticky columns**: not included (`react-table-sticky` is in the project for that).
- **Loading skeleton**: no built-in skeleton state. Wrap conditionally or add a
  `loading?: boolean` prop that renders `<SkeletonLoaders>`.
