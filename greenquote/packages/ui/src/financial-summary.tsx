import type { ReactNode } from "react";

export interface FinancialRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

export function FinancialSummary({
  title,
  rows,
  footer,
}: {
  title: string;
  rows: FinancialRow[];
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-slate-100">
              <td className="px-4 py-2 text-slate-600">{row.label}</td>
              <td
                className={`px-4 py-2 text-right ${row.emphasis ? "font-semibold text-slate-900" : "text-slate-800"}`}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {footer ? <div className="border-t border-slate-100 px-4 py-2">{footer}</div> : null}
    </div>
  );
}
