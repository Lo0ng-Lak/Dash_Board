interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    // Function to calculate page numbers and "..." to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const siblingCount = 1; // Number of pages displayed next to current page
        const totalPageNumbers = siblingCount * 2 + 5; // Max number of buttons to display fixed

        // 1. If total pages less than limit -> Show all, no need to hide "..."
        if (totalPages <= totalPageNumbers) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

        // 2. Only "..." on right (On first pages)
        if (!shouldShowLeftDots && shouldShowRightDots) {
            const leftItemCount = 3 + 2 * siblingCount;
            for (let i = 1; i <= leftItemCount; i++) pages.push(i);
            pages.push("...");
            pages.push(totalPages);
            return pages;
        }

        // 3. Only "..." on left (On last pages)
        if (shouldShowLeftDots && !shouldShowRightDots) {
            const rightItemCount = 3 + 2 * siblingCount;
            pages.push(1);
            pages.push("...");
            for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        }

        // 4. "..." on both sides (On middle pages)
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

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
            </div>
            <div className="flex gap-1 items-center">
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-slate-50 transition-all"
                >
                    Prev
                </button>

                {/* Render danh sách các trang đã được tính toán */}
                {pageNumbers.map((page, i) => {
                    // Nếu là dấu ba chấm thì render text tĩnh, không bấm được
                    if (page === "...") {
                        return (
                            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs font-bold">
                                ...
                            </span>
                        );
                    }

                    // Render các nút số trang bình thường
                    return (
                        <button
                            key={`page-${page}`}
                            onClick={() => onPageChange(Number(page))}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            {page}
                        </button>
                    );
                })}

                {/* Nút Next */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-slate-50 transition-all"
                >
                    Next
                </button>
            </div>
        </div>
    );
}