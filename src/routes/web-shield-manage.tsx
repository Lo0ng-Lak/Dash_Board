import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getWebShieldManageData, type WebShieldManageRecord } from "@/lib/dataService";
import { WEB_SHIELD_MANAGE_SHEETS } from "@/lib/sheetConfig";
import { ExportExcelButton } from "@/components/export-excel-button";
import { downloadExcel } from "@/lib/downloadExcel";

const fold = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();

const needsSetup = (status: string) => fold(status).includes("chua set");

export const Route = createFileRoute("/web-shield-manage")({
  component: WebShieldManagePage,
});

function WebShieldManagePage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sheetId, setSheetId] = useState<string>(WEB_SHIELD_MANAGE_SHEETS[0].id);
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["webShieldManage"],
    queryFn: () => getWebShieldManageData(true),
    refetchInterval: 30000,
  });

  const q = search.trim().toLowerCase();
  const boards = useMemo(
    () =>
      WEB_SHIELD_MANAGE_SHEETS.map((sheet) => {
        const list = rows.filter((row) => {
          if (row.sheetId !== sheet.id) return false;
          if (!q) return true;
          return [row.web, row.dev, row.cong, row.webStatus, row.tinhTrang].join(" ").toLowerCase().includes(q);
        });
        return {
          ...sheet,
          rows: list,
          setup: list.filter((row) => needsSetup(row.tinhTrang)).length,
        };
      }),
    [rows, q],
  );
  const activeId = boards.some((item) => item.id === sheetId) ? sheetId : boards[0]?.id;
  const activeBoard = boards.find((board) => board.id === activeId);

  const setup = async (row: WebShieldManageRecord) => {
    const key = `${row.sheetId}:${row.web}`;
    setPending(key);
    setNote((prev) => ({ ...prev, [key]: "" }));
    try {
      const res = await fetch("/api/web-shield/setup", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: row.web, sheetId: row.sheetId }),
      });
      const json = (await res.json()) as { message?: string; error?: string };
      setNote((prev) => ({ ...prev, [key]: json.message || json.error || t("webShieldManageSetupPending") }));
    } catch {
      setNote((prev) => ({ ...prev, [key]: t("webShieldManageSetupFail") }));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="min-h-full p-8 text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight">{t("webShieldManageTitle")}</h1>
            <p className="text-sm font-medium text-slate-500">{t("webShieldManageDesc")}</p>
          </div>
          {!isLoading && (
            <ExportExcelButton
              disabled={!activeBoard || activeBoard.rows.length === 0}
              onClick={() => {
                if (!activeBoard) return;
                downloadExcel(`web-shield-${activeBoard.id}.xlsx`, [{
                  name: activeBoard.name,
                  rows: activeBoard.rows.map((row, i) => ({
                    STT: i + 1,
                    [t("webShieldManageColWeb")]: row.web,
                    DEV: row.dev,
                    [t("webShieldManageColPort")]: row.cong,
                    [t("webShieldManageColWebStatus")]: row.webStatus,
                    [t("webShieldManageColStatus")]: row.tinhTrang,
                  })),
                }]);
              }}
            />
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-400 animate-pulse">{t("loadingSystemData")}</p>
        ) : (
          <>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("webShieldManageSearch")}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              {boards.map((board, index) => {
                const active = board.id === activeId;
                const color = index === 0 ? "#3b82f6" : "#8b5cf6";
                return (
                  <button
                    key={board.id}
                    type="button"
                    onClick={() => setSheetId(board.id)}
                    className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-full transition-all border ${active ? "text-white shadow-md" : "bg-white"}`}
                    style={active
                      ? { background: color, borderColor: color }
                      : { color, borderColor: color, background: `${color}15` }}
                  >
                    {board.name} ({board.rows.length})
                  </button>
                );
              })}
            </div>
            {activeBoard && (
              <section className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-black">{activeBoard.name}</h2>
                  <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">{activeBoard.rows.length}</span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                      {t("webShieldManageNeedSetup")} {activeBoard.setup}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[860px]">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="text-left p-3">#</th>
                        <th className="text-left p-3">{t("webShieldManageColWeb")}</th>
                        <th className="text-left p-3">DEV</th>
                        <th className="text-left p-3">{t("webShieldManageColPort")}</th>
                        <th className="text-left p-3">{t("webShieldManageColWebStatus")}</th>
                        <th className="text-left p-3">{t("webShieldManageColStatus")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeBoard.rows.map((row, index) => {
                        const key = `${row.sheetId}:${row.web}`;
                        const open = needsSetup(row.tinhTrang);
                        return (
                          <tr key={`${key}-${index}`} className="hover:bg-slate-50/70">
                            <td className="p-3 text-slate-400">{index + 1}</td>
                            <td className="p-3 font-bold text-slate-800 lowercase">{row.web}</td>
                            <td className="p-3 whitespace-nowrap">{row.dev || "—"}</td>
                            <td className="p-3 whitespace-nowrap">{row.cong || "—"}</td>
                            <td className="p-3 whitespace-nowrap">{row.webStatus || "—"}</td>
                            <td className="p-3">
                              {open ? (
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => setup(row)}
                                    disabled={pending === key}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wide disabled:opacity-60"
                                  >
                                    {pending === key ? "…" : t("webShieldManageSetup")}
                                  </button>
                                  {note[key] && <p className="text-[11px] font-semibold text-amber-700">{note[key]}</p>}
                                </div>
                              ) : (
                                <span className="inline-flex text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200">
                                  {row.tinhTrang || "—"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {activeBoard.rows.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">{t("webShieldManageEmpty")}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
