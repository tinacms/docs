import type { ReactNode } from "react";

type CellProps = {
  align?: "left" | "center" | "right" | null;
  children?: ReactNode;
};

// TinaMarkdown builds the <thead> and <tbody> itself and renders each cell
// through the `th` and `td` components. Cell content skips the rest of the
// component mapping, so inline links and code are styled on the table instead.
export const Table = (props) => (
  <div className="my-6 overflow-x-auto rounded-lg shadow-md">
    <table className="w-full table-auto [&>tbody>tr:last-child]:border-b-0 [&_a]:underline [&_a]:opacity-80 [&_a]:transition-all [&_a]:duration-200 [&_a]:ease-out [&_a:hover]:text-brand-primary [&_code]:rounded [&_code]:border [&_code]:border-neutral-border [&_code]:bg-neutral-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-brand-primary [&_code]:shadow-sm">
      {props.children}
    </table>
  </div>
);

export const TableRow = ({ children }: { children?: ReactNode }) => (
  <tr className="bg-neutral-background-secondary/50 border-b border-neutral-border">
    {children}
  </tr>
);

export const TableHeaderCell = ({ align, children }: CellProps) => (
  <th
    className="px-4 py-2 text-left font-tuner bg-neutral-background-secondary"
    style={align ? { textAlign: align } : undefined}
  >
    {children}
  </th>
);

export const TableCell = ({ align, children }: CellProps) => (
  <td
    className="px-4 py-2 first:max-w-xs first:break-words"
    style={align ? { textAlign: align } : undefined}
  >
    {children}
  </td>
);

export default Table;
