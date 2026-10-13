import { X as jsxRuntimeExports } from "./server-CHteKQQO.js";
function GmailMailboxPicker({
  mailboxes,
  selected,
  onSelect,
  addHref,
  addLabel,
  allLabel
}) {
  if (!mailboxes.length) return null;
  const activeId = mailboxes.length === 1 ? mailboxes[0] : selected;
  const chipClass = (active) => `px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${active ? "bg-slate-900 text-white border-slate-900" : "bg-card text-foreground border-border hover:bg-accent"}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
    mailboxes.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onSelect("all"), className: chipClass(activeId === "all"), children: allLabel }),
    mailboxes.map((mail) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => onSelect(mailboxes.length === 1 ? "all" : mail),
        className: chipClass(activeId === mail),
        children: mail
      },
      mail
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: addHref, className: "px-3 py-2 text-xs font-semibold rounded-xl border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10", children: addLabel })
  ] });
}
export {
  GmailMailboxPicker as G
};
