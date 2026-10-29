import { useTranslation } from "react-i18next";

export function ExportExcelButton({
    onClick,
    disabled,
}: {
    onClick: () => void;
    disabled?: boolean;
}) {
    const { t } = useTranslation();
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
            {t("exportExcel")}
        </button>
    );
}
