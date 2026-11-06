import type { ReactNode } from "react";

type CellProps = {
  align?: "left" | "center" | "right" | null;
  children?: ReactNode;
};

// TinaMarkdown builds the <thead> and <tbody> itself and renders each cell
// through the `th` and `td` components, so these only need to style the output.
export const Table = (props) => (
  <div className="my-6 overflow-x-auto rounded-lg shadow-md">
    <table className="w-full table-auto">{props.children}</table>
  </div>
);

export const TableRow = ({ children }: { children?: ReactNode }) => (
  <tr className="bg-neutral-background-secondary/50 border-b border-neutral-border last:border-b-0">
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
