import { fmtMonthShort } from "@/lib/kpiWeek";

export interface MonthTabItem {
    month: string;
    count: number;
}

interface MonthFilterTabsProps {
    items: MonthTabItem[];
    totalWithDate: number;
    selected: string;
    onSelect: (month: string) => void;
    allLabel: string;
}

export function MonthFilterTabs({ items, totalWithDate, selected, onSelect, allLabel }: MonthFilterTabsProps) {
    return (
        <div className="flex flex-wrap gap-2">
            <button
                type="button"
                onClick={() => onSelect("all")}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${selected === "all"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-slate-500 border border-slate-200"
                    }`}
            >
                {allLabel} ({totalWithDate})
            </button>
            {items.map((item) => {
                const active = selected === item.month;
                return (
                    <button
                        key={item.month}
                        type="button"
                        onClick={() => onSelect(item.month)}
                        className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${active
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                            : "bg-white text-indigo-600 border-indigo-200 hover:border-indigo-300"
                            }`}
                    >
                        {fmtMonthShort(item.month)} ({item.count})
                    </button>
                );
            })}
        </div>
    );
}
