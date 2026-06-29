/**
 * Link publish CSV mặc định (local dev).
 * Trên Lovable/web: biến VITE_LINK_* trong Environment Variables sẽ ghi đè.
 *
 * Về Bờ: https://docs.google.com/spreadsheets/d/e/2PACX-1vS6ciSNDvoFqVVBaU_Yvu_RDUV43SeQ2276pxa-ASrQty1DZSp4FnET_lDMJOZ9uPm6g2X1_9mevCCK/pubhtml
 * New Infor Web: https://docs.google.com/spreadsheets/d/e/2PACX-1vRZX8sJDgllzfV8ZVHeQ8LV6AWmq_y97dy_nBmrlTcoNw2c87NZJM14_cvCXMoBGiuY4_fM8NB45CJ2/pubhtml
 */
const PUB_CSV = (id: string, gid: string) =>
    `https://docs.google.com/spreadsheets/d/e/${id}/pub?output=csv&gid=${gid}`;

const VE_BO = "2PACX-1vS6ciSNDvoFqVVBaU_Yvu_RDUV43SeQ2276pxa-ASrQty1DZSp4FnET_lDMJOZ9uPm6g2X1_9mevCCK";
const VE_WEB = "2PACX-1vRZX8sJDgllzfV8ZVHeQ8LV6AWmq_y97dy_nBmrlTcoNw2c87NZJM14_cvCXMoBGiuY4_fM8NB45CJ2";

export const DEFAULT_SHEET_LINKS = {
    /** New Infor Web — tab rebuild / domain */
    REBUILD: PUB_CSV(VE_WEB, "724861620"),
    /** New Infor Web — tab Shopify */
    SHOPIFY: PUB_CSV(VE_WEB, "173143003"),
    /** Về Bờ — Dev GMC (Ngày về GMC) */
    GMC_VE: PUB_CSV(VE_BO, "1734827021"),
    /** Về Bờ — REG GMC */
    GMC_REG: PUB_CSV(VE_BO, "0"),
    /** Về Bờ — hóa đơn / domain + chi phí */
    INVOICES: PUB_CSV(VE_BO, "1924031293"),
    /** Về Bờ — Info A Quốc Anh */
    INFO_BO: PUB_CSV(VE_BO, "145659602"),
} as const;
