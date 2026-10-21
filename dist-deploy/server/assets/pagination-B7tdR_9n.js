import { X as jsxRuntimeExports } from "./server-CaXyqhng.js";
function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;
  const getPageNumbers = () => {
    const pages = [];
    const siblingCount = 1;
    const totalPageNumbers = siblingCount * 2 + 5;
    if (totalPages <= totalPageNumbers) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      for (let i = 1; i <= leftItemCount; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
      return pages;
    }
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    if (shouldShowLeftDots && shouldShowRightDots) {
      pages.push(1);
      pages.push("...");
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(totalPages);
      return pages;
    }
    return pages;
  };
  const pageNumbers = getPageNumbers();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] font-bold text-slate-400 uppercase tracking-widest", children: [
      "Showing ",
      (currentPage - 1) * itemsPerPage + 1,
      " to ",
      Math.min(currentPage * itemsPerPage, totalItems),
      " of ",
      totalItems
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onPageChange(currentPage - 1),
          disabled: currentPage === 1,
          className: "px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-slate-50 transition-all",
          children: "Prev"
        }
      ),
      pageNumbers.map((page, i) => {
        if (page === "...") {
          return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-8 h-8 flex items-center justify-center text-slate-400 text-xs font-bold", children: "..." }, `dots-${i}`);
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => onPageChange(Number(page)),
            className: `w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? "bg-slate-900 text-white" : "border border-slate-200 hover:bg-slate-50"}`,
            children: page
          },
          `page-${page}`
        );
      }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onPageChange(currentPage + 1),
          disabled: currentPage === totalPages,
          className: "px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-slate-50 transition-all",
          children: "Next"
        }
      )
    ] })
  ] });
}
export {
  Pagination as P
};
