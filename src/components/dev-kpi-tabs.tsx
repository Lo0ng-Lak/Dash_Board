const TAB_COLORS = [
    "#3b82f6",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#22c55e",
    "#14b8a6",
    "#f97316",
    "#64748b",
];

export interface DevTabItem {
    name: string;
    count: number;
}

interface DevKpiTabsProps {
    items: DevTabItem[];
    totalCount: number;
    selected: string;
    onSelect: (dev: string) => void;
    allLabel: string;
}

export function DevKpiTabs({ items, totalCount, selected, onSelect, allLabel }: DevKpiTabsProps) {
    return (
        <div className="flex flex-wrap gap-2">
            <button
                type="button"
                onClick={() => onSelect("all")}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${selected === "all"
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white text-slate-500 border border-slate-200"
                    }`}
            >
                {allLabel} ({totalCount})
            </button>
            {items.map((item, i) => {
                const color = TAB_COLORS[i % TAB_COLORS.length];
                const active = selected === item.name;
                return (
                    <button
                        key={item.name}
                        type="button"
                        onClick={() => onSelect(item.name)}
                        className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${active ? "text-white shadow-md" : "bg-white"}`}
                        style={active
                            ? { background: color, borderColor: color }
                            : { color, borderColor: color, background: `${color}15` }}
                    >
                        {item.name} ({item.count})
                    </button>
                );
            })}
        </div>
    );
}
