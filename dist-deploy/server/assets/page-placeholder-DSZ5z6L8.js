import { X as jsxRuntimeExports } from "./server-CHteKQQO.js";
import { L as Link } from "./router-BxCuPKFv.js";
function PagePlaceholder({
  title,
  desc,
  icon
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-semibold text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: icon }),
        " ",
        title
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: desc })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-12 text-center shadow-[0_10px_30px_oklch(0.55_0.08_355_/_0.06)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-5xl mb-3", children: icon }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold text-foreground", children: "Under Development" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mt-2 max-w-md mx-auto", children: [
        "Page ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: title }),
        " will soon have detailed data. Go back to",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "text-primary hover:underline", children: "Dashboard" }),
        " to view the dashboard."
      ] })
    ] })
  ] });
}
export {
  PagePlaceholder as P
};
