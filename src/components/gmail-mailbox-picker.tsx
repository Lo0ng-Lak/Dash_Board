export function GmailMailboxPicker({
    mailboxes,
    selected,
    onSelect,
    addHref,
    addLabel,
    allLabel,
}: {
    mailboxes: string[];
    selected: string;
    onSelect: (mailbox: string) => void;
    addHref: string;
    addLabel: string;
    allLabel: string;
}) {
    if (!mailboxes.length) return null;
    const activeId = mailboxes.length === 1 ? mailboxes[0] : selected;
    const chipClass = (active: boolean) =>
        `px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${active
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-card text-foreground border-border hover:bg-accent"
        }`;
    return (
        <div className="flex flex-wrap items-center gap-2">
            {mailboxes.length > 1 && (
                <button type="button" onClick={() => onSelect("all")} className={chipClass(activeId === "all")}>
                    {allLabel}
                </button>
            )}
            {mailboxes.map((mail) => (
                <button
                    key={mail}
                    type="button"
                    onClick={() => onSelect(mailboxes.length === 1 ? "all" : mail)}
                    className={chipClass(activeId === mail)}
                >
                    {mail}
                </button>
            ))}
            <a href={addHref} className="px-3 py-2 text-xs font-semibold rounded-xl border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10">
                {addLabel}
            </a>
        </div>
    );
}
