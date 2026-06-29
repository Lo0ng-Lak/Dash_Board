/**
 * Link publish CSV mặc định (local dev).
 * Trên Lovable/web: biến VITE_LINK_* trong Environment Variables sẽ ghi đè.
 *
 * Về Bờ: https://docs.google.com/spreadsheets/d/e/2PACX-1vS6ciSNDvoFqVVBaU_Yvu_RDUV43SeQ2276pxa-ASrQty1DZSp4FnET_lDMJOZ9uPm6g2X1_9mevCCK/pubhtml
 * New Infor Web: https://docs.google.com/spreadsheets/d/e/2PACX-1vRZX8sJDgllzfV8ZVHeQ8LV6AWmq_y97dy_nBmrlTcoNw2c87NZJM14_cvCXMoBGiuY4_fM8NB45CJ2/pubhtml
 * Infor Web (Web Shield): https://docs.google.com/spreadsheets/d/e/2PACX-1vSfZ64B_235xJjnYZwUnZYVZyDLbOcNkjuNwlaDp88lKt9mRFFVZE2BIJIzokRf5WqG4cFewXvBfIcG/pubhtml
 */
const PUB_CSV = (id: string, gid?: string) =>
    gid
        ? `https://docs.google.com/spreadsheets/d/e/${id}/pub?output=csv&gid=${gid}`
        : `https://docs.google.com/spreadsheets/d/e/${id}/pub?output=csv`;

const VE_BO = "2PACX-1vS6ciSNDvoFqVVBaU_Yvu_RDUV43SeQ2276pxa-ASrQty1DZSp4FnET_lDMJOZ9uPm6g2X1_9mevCCK";
const VE_WEB = "2PACX-1vRZX8sJDgllzfV8ZVHeQ8LV6AWmq_y97dy_nBmrlTcoNw2c87NZJM14_cvCXMoBGiuY4_fM8NB45CJ2";
const INFO_WEB = "2PACX-1vSfZ64B_235xJjnYZwUnZYVZyDLbOcNkjuNwlaDp88lKt9mRFFVZE2BIJIzokRf5WqG4cFewXvBfIcG";

export const DEFAULT_SHEET_LINKS = {
    /** New Infor Web — tab rebuild / domain */
    REBUILD: PUB_CSV(VE_WEB, "724861620"),
    /** New Infor Web — tab Shopify */
    SHOPIFY: PUB_CSV(VE_WEB, "173143003"),
    /** Infor Web — tab Shield (legacy default) */
    INFO_WEB: PUB_CSV(INFO_WEB, "0"),
    /** Về Bờ — KPI TỔNG REG */
    GMC_REG: PUB_CSV(VE_BO, "1734827021"),
    /** Về Bờ — hóa đơn / domain + chi phí */
    INVOICES: PUB_CSV(VE_BO, "1924031293"),
    /** Về Bờ — Info A Quốc Anh */
    INFO_BO: PUB_CSV(VE_BO, "145659602"),
} as const;

/** Về Bờ — tab KPI REG theo người */
export const REG_KPI_SHEETS = [
    { id: "long", name: "Long", gid: "2106520219" },
    { id: "thinh", name: "Thịnh", gid: "239407255" },
    { id: "quoc-an", name: "Quốc An", gid: "351449929" },
    { id: "chuong", name: "Chương", gid: "1247164612" },
    { id: "bao-han", name: "Bảo Hân", gid: "741248656" },
] as const;

export const VE_BO_SHEET_ID = VE_BO;
export const INFO_WEB_SHEET_ID = INFO_WEB;

/** Infor Web — 3 tab KPI Web Shield */
export const WEB_SHIELD_SHEETS = [
    { id: "shield", name: "Shield", gid: "0" },
    { id: "webshield-moi", name: "Webshield mới", gid: "1444001639" },
    { id: "web-quoc-anh", name: "Web Quốc Anh", gid: "1857507308" },
] as const;
