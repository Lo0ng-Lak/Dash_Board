import Papa from "papaparse";
import { DEFAULT_SHEET_LINKS, INFO_WEB_SHEET_ID, REG_KPI_SHEETS, VE_BO_SHEET_ID, WEB_SHIELD_SHEETS } from "./sheetConfig";

const LINK_REBUILD = import.meta.env.VITE_LINK_TAB_REBUILD ?? DEFAULT_SHEET_LINKS.REBUILD;
const LINK_SHOPIFY = import.meta.env.VITE_LINK_TAB_SHOPIFY ?? DEFAULT_SHEET_LINKS.SHOPIFY;
/** Tab KPI TỔNG REG (gid 1734827021) — tránh env local ghi đè nhầm gid khác */
const KPI_TONG_REG_GID = "1734827021";
const resolveGmcRegLink = (): string => {
    const env = import.meta.env.VITE_LINK_TAB_GMC_REG as string | undefined;
    if (env?.includes(`gid=${KPI_TONG_REG_GID}`)) return env;
    if (env && !env.includes(`gid=${KPI_TONG_REG_GID}`)) {
        console.warn("[GMC REG] VITE_LINK_TAB_GMC_REG sai tab — dùng KPI TỔNG REG mặc định");
    }
    return DEFAULT_SHEET_LINKS.GMC_REG;
};
const LINK_GMC_REG = resolveGmcRegLink();
const LINK_INVOICES_GMC = import.meta.env.VITE_LINK_INVOICES_GMC ?? DEFAULT_SHEET_LINKS.INVOICES;
const LINK_INFO_BO = import.meta.env.VITE_LINK_TAB_INFO_BO ?? DEFAULT_SHEET_LINKS.INFO_BO;

let cachedDataNew: DomainSheetData | null = null;
let cachedData: any[] | null = null;
let cachedAllData: any[] | null = null;
let cachedWebShieldData: WebShieldRecord[] | null = null;
let cachedGmcRegData: any = null;
let cachedInfoBoData: InfoBoSheetData | null = null;

export const clearInfoBoCache = () => {
    cachedInfoBoData = null;
};


export interface WebRecord {
    domain: string;
    dev: string;
    completedDate: string | null; // "YYYY-MM-DD" | null
    month: string | null;         // "YYYY-MM" | null
    status: string;
}

export interface WebShieldRecord {
    sheetId: string;
    sheetName: string;
    owner: string;
    web: string;
    rawWeb: string;
    checkInfor: string;
    email: string;
    address: string;
    cong: string;
    tinhTrang: string;
    dev: string;
    webStatus: string;
    ngay: string;
    completedDate: string | null;
    month: string | null;
}

const webShieldRowVal = (row: Record<string, string>, ...keys: string[]) => {
    for (const key of keys) {
        const exact = row[key];
        if (exact != null && String(exact).trim()) return String(exact).trim();
    }
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
    for (const [k, v] of Object.entries(row)) {
        if (keys.some((key) => norm(k) === norm(key)) && v != null && String(v).trim()) {
            return String(v).trim();
        }
    }
    return "";
};

const cleanWebShieldDomain = (raw: string): string => {
    const line = raw.split(/\r?\n/)[0]?.trim() ?? "";
    const stripped = line.replace(/^https?:\/\//i, "");
    const match = stripped.match(/^([a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,})/);
    return (match ? match[1] : stripped.split(/\s+/)[0]).toLowerCase();
};

const parseWebShieldDate = (raw: string): string | null => {
    const dmy = (raw ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!dmy) return null;
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
};

const normalizeWebShieldDev = (raw: string): string => {
    const d = raw.trim();
    if (!d) return "";
    if (/\d{1,2}\/\d{1,2}/.test(d)) return "";
    if (/^\d+\.\d+\.\d+\.\d+$/.test(d)) return "";
    if (/thêm mail|kiểm|gấp/i.test(d) && !/^qa$/i.test(d)) return "";
    if (d.length > 20) return "";

    const alias: Record<string, string> = {
        long: "Long",
        duy: "Duy",
        "qúy anh": "Quý Anh",
        "quý anh": "Quý Anh",
        "quy anh": "Quý Anh",
    };
    const key = d.toLowerCase().replace(/\s+/g, " ").trim();
    if (alias[key]) return alias[key];
    if (d.toUpperCase() === "LONG") return "Long";
    if (d.toUpperCase() === "DUY") return "Duy";
    return d;
};

const parseWebShieldRows = (
    rows: Record<string, string>[],
    sheetId: string,
    sheetName: string,
): WebShieldRecord[] => {
    const ownerKey = Object.keys(rows[0] ?? {}).find((k) => k.trim() === "") ?? " ";
    const records: WebShieldRecord[] = [];

    for (const row of rows) {
        const rawWeb = webShieldRowVal(row, "Web Shield", "Web");
        if (!rawWeb) continue;

        const web = cleanWebShieldDomain(rawWeb);
        if (!web) continue;

        const tinhTrang = webShieldRowVal(row, "tình trạng", "tinh trang");
        const ngay = webShieldRowVal(row, "Ngày", "ngày");
        const completedDate = parseWebShieldDate(ngay) ?? parseWebShieldDate(tinhTrang);
        const dev = normalizeWebShieldDev(webShieldRowVal(row, "Dev", "dev"));

        records.push({
            sheetId,
            sheetName,
            owner: (row[ownerKey] ?? "").trim(),
            web,
            rawWeb,
            checkInfor: webShieldRowVal(row, "Check Infor"),
            email: webShieldRowVal(row, "Email"),
            address: webShieldRowVal(row, "Địa CHỉ", "Địa CHỈ", "Dia CHI"),
            cong: webShieldRowVal(row, "Cổng", "Công"),
            tinhTrang,
            dev,
            webStatus: webShieldRowVal(row, "Trạng thái web", "Trang thai web"),
            ngay,
            completedDate,
            month: completedDate ? completedDate.slice(0, 7) : null,
        });
    }

    return records;
};

export const getWebShieldData = async (forceRefresh = false): Promise<WebShieldRecord[]> => {
    if (cachedWebShieldData && !forceRefresh) {
        return cachedWebShieldData;
    }

    try {
        const timestamp = new Date().getTime();
        const batches = await Promise.all(
            WEB_SHIELD_SHEETS.map(async (sheet) => {
                const baseUrl = `https://docs.google.com/spreadsheets/d/e/${INFO_WEB_SHEET_ID}/pub?output=csv&gid=${sheet.gid}`;
                const separator = baseUrl.includes("?") ? "&" : "?";
                const csv = await fetch(`${baseUrl}${separator}t=${timestamp}`, { cache: "no-store" }).then((r) => r.text());
                const rows = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true }).data;
                return parseWebShieldRows(rows, sheet.id, sheet.name);
            }),
        );

        cachedWebShieldData = batches.flat();
        return cachedWebShieldData;
    } catch (error) {
        console.error("Web Shield fetch error:", error);
        return [];
    }
};

export const getAllDataWeb = async (forceRefresh = false): Promise<WebRecord[]> => {
    if (cachedAllData && !forceRefresh) {
        return cachedAllData;
    }

    try {
        const timestamp = new Date().getTime();
        const separatorRebuild = LINK_REBUILD.includes('?') ? '&' : '?';

        const resRebuild = await fetch(`${LINK_REBUILD}${separatorRebuild}t=${timestamp}`, {
            cache: "no-store"
        }).then(r => r.text());

        const rows = Papa.parse<Record<string, string>>(resRebuild, {
            header: true,
            skipEmptyLines: true,
        }).data;

        const records: WebRecord[] = [];

        for (const row of rows) {
            const domain = (row["Tên Domain"] ?? "").trim();
            if (!domain) continue;

            const dev = (row["Tên Dev"] ?? "").trim();
            const status = (row["Đã hoàn thành"] ?? "").trim();
            const rawDate = (row["Ngày hoàn thành"] ?? "").trim();

            const parseDate = (raw: string): string | null => {
                const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
                if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
                return null;
            };

            const completedDate = parseDate(rawDate);
            const month = completedDate ? completedDate.slice(0, 7) : null;

            records.push({ domain, dev, completedDate, month, status });
        }

        cachedAllData = records;
        return records;

    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
};


export const getLatestWebData = async (forceRefresh = false) => {
    if (cachedData && !forceRefresh) return cachedData;

    try {
        const timestamp = new Date().getTime();
        const separatorRebuild = LINK_REBUILD.includes('?') ? '&' : '?';
        const separatorShopify = LINK_SHOPIFY.includes('?') ? '&' : '?';

        const [resRebuild, resShopify] = await Promise.all([
            fetch(`${LINK_REBUILD}${separatorRebuild}t=${timestamp}`).then(r => r.text()),
            fetch(`${LINK_SHOPIFY}${separatorShopify}t=${timestamp}`).then(r => r.text())
        ]);

        const rebuildRows = Papa.parse(resRebuild, { header: true, skipEmptyLines: true }).data;
        const shopifyRows = Papa.parse(resShopify, { header: true, skipEmptyLines: true }).data;

        // --- 1. FILTER REBUILD: Get last row ---
        const rebuildMap = new Map();
        rebuildRows.forEach((row: any) => {
            const domainName = row["Tên Domain"]?.trim();
            if (domainName) {
                rebuildMap.set(domainName.toLowerCase(), row); // Later overwrites earlier -> Get last one
            }
        });
        const latestRebuildData = Array.from(rebuildMap.values());

        // --- 2. FILTER SHOPIFY: Get last row (IMPORTANT) ---
        const shopifyMap = new Map();
        shopifyRows.forEach((row: any) => {
            const domainName = row["Web Shopify"]?.trim();
            if (domainName) {
                shopifyMap.set(domainName.toLowerCase(), row); // Later overwrites earlier -> Get last one
            }
        });

        // --- 3. KẾT HỢP DỮ LIỆU ---
        const combined = latestRebuildData.map((r: any) => {
            const domainName = r["Tên Domain"].trim().toLowerCase();

            // Instead of using .find() (get first), we get directly from shopifyMap (already last one)
            const s = shopifyMap.get(domainName);

            const daysLeft = parseInt(r["DaysLeft"]) || 0;

            return {
                domain: r["Tên Domain"].trim(),
                regBy: r["Tên Reg"] || "—",
                expiryDateSheet: r["Hạn Domain"] || "—",
                daysLeft: daysLeft,
                dev: r["Tên Dev"] || "—",
                customer: r["LLC"] || "—",
                type: r["Loại web"] || "—",
                isFinished: r["Đã hoàn thành"] === "Đã hoàn thành" || r["Đã hoàn thành"] === "TRUE",
                startDate: s ? s["Ngày Đăng kí"] : "—",
                expiryDateShopify: s ? s["Ngày hết hạn 1$"] : "—",
                isCanceled: s ? (s["Đã hủy plan"] === "Đã hủy" || s["Đã hủy plan"] === "TRUE") : false,
                webhookStatus: s ? (s["Thay webhooks"] || "").trim() : "",
                isHuyRegMoi: s ? (s["WEB Hủy reg mới"] === "Hủy" || s["WEB Hủy reg mới"] === "Đang xài") : false,
                rebuildCount: r["Số lần làm lại web"] || "0",
            };
        });
        cachedData = combined;
        return combined;
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
};


const gmcRegRowVal = (row: Record<string, unknown>, ...keys: string[]) => {
    for (const key of keys) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
            return cleanCell(String(val));
        }
    }
    const normalizedKeys = keys.map((k) => k.toLowerCase().replace(/\s+/g, " ").trim());
    for (const [rawKey, val] of Object.entries(row)) {
        const nk = rawKey.toLowerCase().replace(/\s+/g, " ").trim();
        if (normalizedKeys.some((k) => nk === k || nk.includes(k))) {
            const s = cleanCell(String(val ?? ""));
            if (s) return s;
        }
    }
    return "";
};

/** Chỉ lấy đúng cột WEB — không fuzzy (tránh nhầm "Loại web" → shopify) */
const gmcWebVal = (row: Record<string, unknown>): string => {
    for (const key of ["WEB", "Web"]) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
            return cleanCell(String(val)).toLowerCase();
        }
    }
    return "";
};

const WEB_TYPE_WORDS = new Set(["shopify", "wordpress", "woocommerce", "unknown", "web"]);

export const isValidGmcWebDomain = (domain: string): boolean => {
    const d = domain.toLowerCase().trim();
    if (!d || WEB_TYPE_WORDS.has(d)) return false;
    return d.includes(".");
};

export const clearGmcRegCache = () => {
    cachedGmcRegData = null;
};

export const getGMCRegData = async (forceRefresh = false) => {
    if (cachedGmcRegData && !forceRefresh) return cachedGmcRegData;

    try {
        const timestamp = new Date().getTime();
        const separator = LINK_GMC_REG.includes("?") ? "&" : "?";
        const res = await fetch(`${LINK_GMC_REG}${separator}t=${timestamp}`, { cache: "no-store" }).then((r) => r.text());
        const rows = Papa.parse<Record<string, unknown>>(res, { header: true, skipEmptyLines: true }).data;

        const formattedData = rows.map((r) => ({
            proxy: gmcRegRowVal(r, "Proxy"),
            proxyExpiry: gmcRegRowVal(r, "Hạn Proxy", "Hạn Proxy Phú") || "—",
            twoFA: gmcRegRowVal(r, "2FA") || "—",
            domain: gmcWebVal(r),
            dateGMC: gmcRegRowVal(r, "Ngày về GMC", "Ngày Reg GMC") || "—",
            reportDateGMC: gmcRegRowVal(r, "Báo cáo ngày về") || "—",
            webType: gmcRegRowVal(r, "Loại web") || "—",
            status: gmcRegRowVal(r, "Tình Trạng Sus", "Tình trạng Sus") || "Xanh",
            dev: gmcRegRowVal(r, "DEV", "Người Reg", "Dev"),
            adsDate: gmcRegRowVal(r, "Ngày chạy Ads") || "—",
            linkAdsEgead: gmcRegRowVal(r, "Link ads vs egead", "Báo cáo ngày link ads vs egead") || "—",
            dateSus: gmcRegRowVal(r, "Ngày Sus") || "—",
            reportDateSus: gmcRegRowVal(r, "Báo cáo ngày sus", "Báo cáo ngày Sus") || "—",
            cost: gmcRegRowVal(r, "Chi Phí", "Chi phí") || "0",
            daysGreen: gmcRegRowVal(r, "Số ngày GMC XANH", "Số ngày GMC xanh") || "—",
            thayCong: gmcRegRowVal(r, "Thay Cổng", "Thay cổng") || "—",
            note: gmcRegRowVal(r, "Note") || "",
        }));

        const validData = formattedData.filter((item) => isValidGmcWebDomain(item.domain));

        cachedGmcRegData = validData;
        return validData;
    } catch (error) {
        console.error("GMC REG (KPI TỔNG REG) fetch error:", error);
        return [];
    }
};


// ─── Types ────────────────────────────────────────────────────────────────────

export interface DomainRecord {
    stt: number;
    tenReg: string;
    domain: string;
    ngayMua: string;        // raw "DD/MM/YYYY"
    expiryRaw: string;      // raw "Feb 28, 2027"
    expiryDate: Date | null;
    daysLeft: number | null; // computed: expiryDate - today
    gia: number;
    trangThai: string;      // "Active" | ...
}

export interface ExpenseRecord {
    tenReg: string;
    loaiChiPhi: string;    // "Mua domain" | "Chi phí ADS" | "Đăng ký GMC" | "Mua mail"
    ngayThanhToan: string; // raw "DD/MM/YYYY"
    tenWeb: string;
    tenTheAds: string;
    chiPhiUSD: number;     // 0 if VND-only row
    chiPhiVND: number;     // 0 if USD row; parsed from "50k" → 50000, "100k" → 100000
    chiPhiUSDT: number;    // 0 if non-USDT row; parsed from "10 usdt" → 10
    chiPhiRaw: string;     // original cell value (for display)
    billChiPhi: string;    // URL ảnh
    // derived
    month: string | null;  // "YYYY-MM"
}

export interface DomainSheetData {
    domains: DomainRecord[];
    expenses: ExpenseRecord[];
}

let cachedChiPhiExpenses: ExpenseRecord[] | null = null;
let cachedShopifyData: ShopifyRecord[] | null = null;
let cachedRegKpiData: RegKpiRecord[] | null = null;

const cleanCell = (val: string | undefined) =>
    (val ?? "").normalize("NFC").replace(/[\u00A0\uFEFF\u200B"'\r]/g, "").trim();



/** Parse USD value: "$1,234.56" or "71,98" → 71.98 */
/** 3. PARSE USD: Nhận diện số thuần "17,7" hoặc có dấu "$" / chữ "usd" */
const parseUSD = (val: string): number => {
    if (!val) return 0;
    let normalized = val.trim().toLowerCase();

    // CHẶN: Nếu chứa chữ vnd, k, usdt thì đây không phải là tiền USD
    if (
        normalized.includes("vnd") ||
        normalized.includes("₫") ||
        normalized.includes("đ") ||
        normalized.includes("usdt") ||
        normalized.endsWith("k")
    ) {
        return 0;
    }

    // Xóa ký tự $ hoặc chữ usd nếu có gõ kèm
    normalized = normalized.replace(/\$/g, "").replace(/usd/g, "").trim();

    // ĐẶC BIỆT XỬ LÝ CHO HÌNH CỦA BẠN: "71,98" hoặc "29,5" -> đổi thành "71.98" và "29.5" để JS hiểu
    if (normalized.includes(",") && !normalized.includes(".")) {
        normalized = normalized.replace(/,/g, ".");
    }

    const numberValue = parseFloat(normalized);
    return isNaN(numberValue) ? 0 : numberValue;
};
/** Parse VND value: "50k" → 50000 | "100k" → 100000 | "1.5k" → 1500 | "1.000.000" → 1000000 */
// const parseVND = (val: string): number => {
//     if (!val) return 0;
//     const trimmed = val.trim();
//     const kMatch = trimmed.match(/^([\d.,]+)vnd$/i);
//     if (!kMatch) return 0;
//     const n = parseFloat(kMatch[1].replace(/,/g, "."));
//     return isNaN(n) ? 0 : n * 1000;
// };

const parseVND = (val: string): number => {
    if (!val) return 0;
    const trimmed = val.trim().toLowerCase();

    // Loại trừ nghiêm ngặt nếu dòng đó thuộc về USD hoặc USDT
    if (trimmed.includes("usdt") || trimmed.includes("usd") || trimmed.includes("$")) return 0;

    // Xử lý các dòng đuôi "k" (nếu có: 50k, 1.5k)
    const kMatch = trimmed.match(/^([\d.,]+)k$/);
    if (kMatch) {
        const n = parseFloat(kMatch[1].replace(/,/g, "."));
        return isNaN(n) ? 0 : n * 1000;
    }

    // Xử lý đúng các dòng trong hình: "50 VND", "100 VND"
    const vndMatch = trimmed.match(/^([\d.,]+)\s*(vnd|₫|đ)$/);
    if (vndMatch) {
        // Đổi dấu phẩy thành dấu chấm đề phòng bạn gõ "1,5 VND" -> 1.5
        const n = parseFloat(vndMatch[1].replace(/,/g, "."));
        // Nhân với 1000 theo ý bạn: 50 VND -> 50.000₫
        return isNaN(n) ? 0 : n * 1000;
    }

    return 0;
};

/** 2. PARSE USDT (Mới): Nhận diện chữ "usdt" */
const parseUSDT = (val: string): number => {
    if (!val) return 0;
    const trimmed = val.trim().toLowerCase();

    // Tìm xem chuỗi có kết thúc bằng chữ "usdt" không
    const usdtMatch = trimmed.match(/^([\d.,]+)\s*usdt$/);
    if (usdtMatch) {
        let numStr = usdtMatch[1];
        // Đổi dấu phẩy thành dấu chấm nếu gõ số thập phân (Ví dụ: 10,5 USDT)
        if (numStr.includes(",") && !numStr.includes(".")) {
            numStr = numStr.replace(/,/g, ".");
        }
        const n = parseFloat(numStr);
        return isNaN(n) ? 0 : n;
    }

    return 0;
};

const parseNum = (val: string): number => {
    if (!val) return 0;

    let normalized = val.trim().replace(/\s+/g, "");

    // Nếu chuỗi có dấu phẩy đóng vai trò là dấu cách thập phân (Ví dụ: 1,18)
    // Chúng ta đổi nó thành dấu chấm để định dạng chuẩn JS hiểu được
    if (normalized.includes(",") && !normalized.includes(".")) {
        normalized = normalized.replace(/,/g, ".");
    } else {
        // Trường hợp định dạng kiểu Mỹ (1,000.18) thì xóa dấu phẩy phân tách hàng nghìn đi
        normalized = normalized.replace(/,/g, "");
    }

    const n = parseFloat(normalized);
    return isNaN(n) ? 0 : n;
};

/**
 * Parse expiry date from Google Sheets format "Feb 28, 2027"
 * Also handles "DD/MM/YYYY" just in case
 */
const parseExpiryDate = (raw: string): Date | null => {
    if (!raw) return null;

    // "Feb 28, 2027" — standard JS Date parse works for this format
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;

    // Fallback: "DD/MM/YYYY"
    const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) return new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));

    return null;
};

const calcDaysLeft = (expiry: Date | null): number | null => {
    if (!expiry) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const parseMonth = (raw: string): string | null => {
    const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}`;
    if (/^\d{4}-\d{2}/.test(raw)) return raw.slice(0, 7);
    return null;
};

// ─── Main fetch ───────────────────────────────────────────────────────────────

export const getDomainSheetData = async (forceRefresh = false): Promise<DomainSheetData> => {
    if (cachedDataNew && !forceRefresh) return cachedDataNew;

    try {
        const ts = new Date().getTime();
        const sep = LINK_INVOICES_GMC.includes("?") ? "&" : "?";
        const text = await fetch(`${LINK_INVOICES_GMC}${sep}t=${ts}`, { cache: "no-store" })
            .then(r => r.text());

        const lines = text.split("\n");

        // Row 0 = header
        const headers = lines[0].split("\t").map(h => cleanCell(h));
        const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/\s+/g, " ").trim());
        const findHeader = (keys: string[]) => {
            for (const key of keys) {
                const idx = normalizedHeaders.indexOf(key.toLowerCase().trim());
                if (idx >= 0) return idx;
            }
            return headers.findIndex((h) => keys.some((key) => new RegExp(key, "i").test(h)));
        };

        // Left-side column indexes
        const iSTT = findHeader(["stt"]);
        const iTenReg = findHeader(["tên reg", "registrant", "registrant name"]);
        const iDomain = findHeader(["domain"]);
        const iNgayMua = findHeader(["ngày mua", "purchase date", "date mua"]);
        const iDaysLeft = findHeader(["daysleft", "hạn domain", "expiry", "expiry date"]);
        const iGia = findHeader(["giá", "gia", "amount", "cost", "số tiền"]);
        const iTrangThai = findHeader(["trạng thái (tool chạy)", "trạng thái", "status"]);

        // Right-side column indexes
        const iTenRegRRaw = headers.map(h => h.toLowerCase().trim()).lastIndexOf("tên reg");
        const iTenRegR = iTenRegRRaw >= 0 ? iTenRegRRaw : iTenReg;
        const iLoai = findHeader(["tên chi phí", "chi phí", "type", "expense type"]);
        const iNgayTT = findHeader(["ngày thanh toán", "payment date", "ngày thanh toán"]);
        const iTenWeb = findHeader(["tên web", "web", "website", "url"]);
        const iTenThe = findHeader(["tên thẻ ads", "thẻ ads", "ads card"]);
        const iChiPhi = findHeader(["chi phí (usd)", "chi phí usd", "chi phi (usd)", "chi phí", "amount", "số tiền", "total"]);
        const iBill = findHeader(["bill chi phí", "bill", "hóa đơn", "invoice"]);

        console.log("Domain sheet indexes:", {
            iSTT, iTenReg, iDomain, iNgayMua, iDaysLeft, iGia, iTrangThai,
            iTenRegR, iLoai, iNgayTT, iTenWeb, iTenThe, iChiPhi, iBill,
        });

        const domains: DomainRecord[] = [];
        const expenses: ExpenseRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].replace(/\r$/, "");
            if (line.trim().length === 0) continue;

            const cols = line.split("\t");
            const c = (idx: number) => cleanCell(cols[idx]);

            // ── Left side: domain record ──
            const domainVal = c(iDomain);
            if (domainVal) {
                const expiryRaw = c(iDaysLeft); // column header says "DaysLeft" but contains expiry date
                const expiryDate = parseExpiryDate(expiryRaw);
                domains.push({
                    stt: parseInt(c(iSTT)) || i,
                    tenReg: c(iTenReg),
                    domain: domainVal,
                    ngayMua: c(iNgayMua),
                    expiryRaw,
                    expiryDate,
                    daysLeft: calcDaysLeft(expiryDate),
                    gia: parseNum(c(iGia)),
                    trangThai: c(iTrangThai),
                });
            }

            // ── Right side: expense record ──
            const loaiChiPhi = c(iLoai);
            const registrant = c(iTenRegR);
            const rawAmount = c(iChiPhi);
            const hasRegistrant = registrant !== "" && registrant !== "—";
            const hasAmount = rawAmount !== "" && rawAmount !== "—";

            if (loaiChiPhi && hasRegistrant && hasAmount) {
                const ngayTT = c(iNgayTT);
                expenses.push({
                    tenReg: registrant,
                    loaiChiPhi,
                    ngayThanhToan: ngayTT,
                    tenWeb: c(iTenWeb),
                    tenTheAds: c(iTenThe),
                    // 3 hàm parse độc lập xử lý tách biệt từng loại tiền tệ
                    chiPhiUSD: parseUSD(rawAmount),
                    chiPhiVND: parseVND(rawAmount),
                    chiPhiUSDT: parseUSDT(rawAmount),
                    chiPhiRaw: rawAmount,
                    billChiPhi: c(iBill),
                    month: parseMonth(ngayTT),
                });
            }
        }

        cachedDataNew = { domains, expenses };
        return cachedDataNew;

    } catch (err) {
        console.error("getDomainSheetData error:", err);
        return { domains: [], expenses: [] };
    }
};

/** Chỉ lấy bảng chi phí bên phải (cột I–O) tab Chi Phí GMC */
export const getChiPhiExpenses = async (forceRefresh = false): Promise<ExpenseRecord[]> => {
    if (cachedChiPhiExpenses && !forceRefresh) return cachedChiPhiExpenses;

    try {
        const ts = Date.now();
        const sep = LINK_INVOICES_GMC.includes("?") ? "&" : "?";
        const text = await fetch(`${LINK_INVOICES_GMC}${sep}t=${ts}`, { cache: "no-store" }).then((r) => r.text());
        const rows = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data;

        const expenses: ExpenseRecord[] = [];
        for (const row of rows) {
            const loaiChiPhi = cleanCell(row["Tên chi phí"]);
            const registrant = cleanCell(row["Tên Reg"]);
            const rawAmount = cleanCell(row["Chi phí (USD)"]);
            const ngayTT = cleanCell(row["Ngày thanh toán"]);

            if (!loaiChiPhi || !registrant || !rawAmount) continue;

            expenses.push({
                tenReg: registrant,
                loaiChiPhi,
                ngayThanhToan: ngayTT,
                tenWeb: cleanCell(row["Tên web"]),
                tenTheAds: cleanCell(row["Tên thẻ ads"]),
                chiPhiUSD: parseUSD(rawAmount),
                chiPhiVND: parseVND(rawAmount),
                chiPhiUSDT: parseUSDT(rawAmount),
                chiPhiRaw: rawAmount,
                billChiPhi: cleanCell(row["Bill chi phí"]),
                month: parseMonth(ngayTT),
            });
        }

        cachedChiPhiExpenses = expenses;
        return expenses;
    } catch (err) {
        console.error("getChiPhiExpenses error:", err);
        return [];
    }
};

// ─── Shopify (tab Shopify — New Infor Web) ───────────────────────────────────

export interface ShopifyRecord {
    nguoiReg: string;
    web: string;
    ngayDangKy: string;
    ngayHetHan: string;
    webHuy: string;
    thayWebhooks: string;
    the: string;
    tkTrendsi: string;
    regDate: string | null;
    expiryDate: string | null;
    regMonth: string | null;
    daysLeft: number | null;
    isCanceled: boolean;
}

const shopifyRowVal = (row: Record<string, string>, ...keys: string[]) => {
    for (const key of keys) {
        const exact = row[key];
        if (exact != null && String(exact).trim()) return cleanCell(String(exact));
    }
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ");
    for (const [k, v] of Object.entries(row)) {
        if (keys.some((key) => norm(k) === norm(key)) && v != null && String(v).trim()) {
            return cleanCell(String(v));
        }
    }
    return "";
};

const parseShopifyDateDMY = (raw: string): string | null => {
    const dmy = (raw ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!dmy) return null;
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
};

const shopifyDaysLeft = (isoDate: string | null): number | null => {
    if (!isoDate) return null;
    const target = new Date(`${isoDate}T00:00:00`);
    if (isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const getShopifyData = async (forceRefresh = false): Promise<ShopifyRecord[]> => {
    if (cachedShopifyData && !forceRefresh) return cachedShopifyData;

    try {
        const ts = Date.now();
        const sep = LINK_SHOPIFY.includes("?") ? "&" : "?";
        const text = await fetch(`${LINK_SHOPIFY}${sep}t=${ts}`, { cache: "no-store" }).then((r) => r.text());
        const rows = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data;

        const map = new Map<string, Record<string, string>>();
        for (const row of rows) {
            const web = shopifyRowVal(row, "Web Shopify");
            if (!web) continue;
            map.set(web.toLowerCase(), row);
        }

        const records: ShopifyRecord[] = [...map.values()].map((row) => {
            const ngayDangKy = shopifyRowVal(row, "Ngày Đăng kí", "Ngày đăng kí");
            const ngayHetHan = shopifyRowVal(row, "Ngày hết hạn 1$", "Ngày hết hạn");
            const webHuy = shopifyRowVal(row, "WEB Hủy reg mới");
            const regDate = parseShopifyDateDMY(ngayDangKy);
            const expiryDate = parseShopifyDateDMY(ngayHetHan);

            return {
                nguoiReg: shopifyRowVal(row, "Người Reg"),
                web: shopifyRowVal(row, "Web Shopify"),
                ngayDangKy,
                ngayHetHan,
                webHuy,
                thayWebhooks: shopifyRowVal(row, "Thay webhooks"),
                the: shopifyRowVal(row, "Thẻ"),
                tkTrendsi: shopifyRowVal(row, "TK Trendsi"),
                regDate,
                expiryDate,
                regMonth: regDate ? regDate.slice(0, 7) : null,
                daysLeft: shopifyDaysLeft(expiryDate),
                isCanceled: Boolean(webHuy),
            };
        });

        cachedShopifyData = records;
        return records;
    } catch (err) {
        console.error("getShopifyData error:", err);
        return [];
    }
};

// ─── KPI REG (tab Long, Thịnh, Quốc An, Chương, Bảo Hân) ───────────────────

export interface RegKpiRecord {
    ownerId: string;
    ownerName: string;
    webType: string;
    domain: string;
    dateRegGmc: string;
    addCard: string;
    verifyAds: string;
    verifyAds2: string;
    susStatus: string;
    khang1Date: string;
    ketQua1: string;
    khang2Date: string;
    ketQua2: string;
    khang3Date: string;
    ketQua3: string;
    note: string;
}

const regKpiRowVal = (row: Record<string, unknown>, ...keys: string[]) => {
    for (const key of keys) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
            return cleanCell(String(val));
        }
    }
    const normalizedKeys = keys.map((k) => k.toLowerCase().replace(/\s+/g, " ").trim());
    for (const [rawKey, val] of Object.entries(row)) {
        const nk = rawKey.toLowerCase().replace(/\s+/g, " ").trim();
        if (normalizedKeys.some((k) => nk === k || nk.includes(k))) {
            const s = cleanCell(String(val ?? ""));
            if (s) return s;
        }
    }
    return "";
};

const parseRegKpiRow = (row: Record<string, unknown>, ownerId: string, ownerName: string): RegKpiRecord | null => {
    const domain = regKpiRowVal(row, "WEB", "Web").toLowerCase().trim();
    if (!domain) return null;

    return {
        ownerId,
        ownerName,
        webType: regKpiRowVal(row, "Loại web"),
        domain,
        dateRegGmc: regKpiRowVal(row, "Ngày Reg GMC", "Ngày về GMC"),
        addCard: regKpiRowVal(row, "Đã Add Thẻ"),
        verifyAds: regKpiRowVal(row, "Verify Ads"),
        verifyAds2: regKpiRowVal(row, "Verify Ads 2"),
        susStatus: regKpiRowVal(row, "Tình Trạng Sus", "Tình trạng Sus") || "—",
        khang1Date: regKpiRowVal(row, "Kháng lần 1"),
        ketQua1: regKpiRowVal(row, "Kết quả 1", "Kết quả"),
        khang2Date: regKpiRowVal(row, "Kháng lần 2"),
        ketQua2: regKpiRowVal(row, "Kết quả 2", "Kết quả lần 2"),
        khang3Date: regKpiRowVal(row, "Kháng lần 3"),
        ketQua3: regKpiRowVal(row, "Kết quả 3", "Kết quả lần 3"),
        note: regKpiRowVal(row, "Note", "Note_1"),
    };
};

export const getRegKpiData = async (forceRefresh = false): Promise<RegKpiRecord[]> => {
    if (cachedRegKpiData && !forceRefresh) return cachedRegKpiData;

    try {
        const ts = Date.now();
        const all: RegKpiRecord[] = [];

        await Promise.all(
            REG_KPI_SHEETS.map(async (sheet) => {
                const url = `https://docs.google.com/spreadsheets/d/e/${VE_BO_SHEET_ID}/pub?output=csv&gid=${sheet.gid}&t=${ts}`;
                const text = await fetch(url, { cache: "no-store" }).then((r) => r.text());
                const rows = Papa.parse<Record<string, unknown>>(text, {
                    header: true,
                    skipEmptyLines: true,
                }).data;

                for (const row of rows) {
                    const record = parseRegKpiRow(row, sheet.id, sheet.name);
                    if (record) all.push(record);
                }
            }),
        );

        cachedRegKpiData = all;
        return all;
    } catch (err) {
        console.error("getRegKpiData error:", err);
        return [];
    }
};

// ─── Info Bờ sheet ────────────────────────────────────────────────────────────

export interface InfoBoRecord {
    stt: number;
    batchId: string;
    tenReg: string;
    web: string;
    hanDomain: string;
    infoCaNhan: string;
    dev: string;
    loaiDoc: string;
    docCaNhan: string;
    docDoanhNghiep: string;
    trangThai: string;
    note: string;
    hasEin: boolean;
    khangStatus: "khang_ve" | "fail" | "chua_khang" | "none";
    isKhangVe: boolean;
    isKhangFail: boolean;
    isChuaKhang: boolean;
    isInUse: boolean;
    isChuaXinInfo: boolean;
    isEinEligible: boolean;
    isCaNhan: boolean;
    countsInStats: boolean;
}

export interface InfoBoStats {
    totalDeclared: number;
    totalInSheet: number;
    totalCountable: number;
    einSubmitted: number;
    einEligible: number;
    einInfoTotal: number;
    einRate: number;
    khangVe: number;
    khangFail: number;
    chuaKhang: number;
    khangVeRate: number;
    khangFailRate: number;
    infoInUse: number;
    infoUsableRate: number;
    chuaXinInfo: number;
    caNhan: number;
    chuaGanWeb: number;
    byLoaiDoc: { name: string; value: number }[];
}

export interface InfoBoOwnerStats {
    name: string;
    batchId: string;
    batchLabel: string;
    totalInfo: number;
    khangVe: number;
    khangFail: number;
    chuaKhang: number;
}

export interface InfoBoBatch {
    id: string;
    name: string;
    label: string;
    totalDeclared: number;
    stats: InfoBoStats;
    byOwner: InfoBoOwnerStats[];
}

export interface InfoBoSheetData {
    batches: InfoBoBatch[];
    batchName: string;
    records: InfoBoRecord[];
    stats: InfoBoStats;
    byOwner: InfoBoOwnerStats[];
}

const getRowVal = (row: Record<string, unknown>, ...keys: string[]) => {
    for (const key of keys) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
            return cleanCell(String(val));
        }
    }
    return "";
};

const isDoanhNghiep = (loaiDoc: string) => {
    const l = loaiDoc.toLowerCase().trim();
    return l.includes("doanh nghi") && !l.includes("chưa xin");
};

const isCaNhan = (loaiDoc: string) => {
    const l = loaiDoc.toLowerCase().trim();
    return l.includes("cá nhân") || l.includes("ca nhan");
};

const isChuaXinInfo = (loaiDoc: string) =>
    loaiDoc.toLowerCase().includes("chưa xin");

/** Chưa xin doc hoặc loại trống → không tính vào báo cáo */
const isChuaXinDoc = (loaiDoc: string) => {
    const l = loaiDoc.trim();
    if (!l) return true;
    return isChuaXinInfo(l);
};

const countsInStats = (loaiDoc: string) =>
    isDoanhNghiep(loaiDoc) || isCaNhan(loaiDoc);

const hasEinDoc = (doc: string) => doc.trim().length > 0;

export type KhangStatus = "khang_ve" | "fail" | "chua_khang" | "none";

export const parseKhangStatus = (status: string): KhangStatus => {
    const s = status.toLowerCase().trim();
    if (!s) return "none";
    if (s.includes("chưa kháng") || s.includes("chua khang")) return "chua_khang";
    if (s === "fail" || s.includes("fail")) return "fail";
    if (s.includes("kháng về") || s.includes("khang ve")) return "khang_ve";
    return "none";
};

const isBatchSeparator = (tenReg: string) => {
    const t = tenReg.toUpperCase();
    return t.includes("INFO") && (t.includes("ĐỢT") || t.includes("DOT"));
};

const parseBatchMeta = (tenReg: string, web: string) => {
    const totalMatch = web.match(/(\d+)/);
    const totalDeclared = totalMatch ? parseInt(totalMatch[1], 10) : 0;
    const dateMatch = tenReg.match(/ĐỢT\s*(.+)/i) ?? tenReg.match(/DOT\s*(.+)/i);
    const label = (dateMatch?.[1] ?? tenReg).trim();
    const id = label.replace(/\//g, "-").replace(/\s+/g, "_").toLowerCase() || "batch";
    return { name: tenReg, label, totalDeclared, id };
};

export const computeInfoBoStats = (
    records: InfoBoRecord[],
    totalDeclared: number,
): InfoBoStats => {
    const totalInSheet = records.length;
    const countable = records.filter((r) => r.countsInStats);
    const totalCountable = countable.length;

    const einEligible = records.filter((r) => r.isEinEligible).length;
    const einSubmitted = records.filter((r) => r.isEinEligible && r.hasEin).length;
    const chuaXinInfo = records.filter((r) => isChuaXinInfo(r.loaiDoc)).length;
    const caNhan = records.filter((r) => r.isCaNhan).length;
    const einInfoTotal = einEligible + caNhan;
    const khangVe = records.filter((r) => r.khangStatus === "khang_ve").length;
    const khangFail = records.filter((r) => r.khangStatus === "fail").length;
    const chuaKhang = records.filter((r) => r.khangStatus === "chua_khang").length;
    const khangResolved = khangVe + khangFail;
    const infoInUse = countable.filter((r) => r.isInUse).length;
    const chuaGanWeb = countable.filter((r) => !r.web).length;

    const loaiMap = new Map<string, number>();
    for (const r of records) {
        let key = r.loaiDoc.trim();
        if (!key) key = "Chưa xin doc";
        else if (r.isChuaXinInfo) key = "Chưa xin Info";
        loaiMap.set(key, (loaiMap.get(key) ?? 0) + 1);
    }

    const total = totalDeclared > 0 ? totalDeclared : totalCountable;

    return {
        totalDeclared: total,
        totalInSheet,
        totalCountable,
        einSubmitted,
        einEligible,
        einInfoTotal,
        einRate: einInfoTotal > 0 ? Math.round((einEligible / einInfoTotal) * 1000) / 10 : 0,
        khangVe,
        khangFail,
        chuaKhang,
        khangVeRate: khangResolved > 0 ? Math.round((khangVe / khangResolved) * 1000) / 10 : 0,
        khangFailRate: khangResolved > 0 ? Math.round((khangFail / khangResolved) * 1000) / 10 : 0,
        infoInUse,
        infoUsableRate: total > 0 ? Math.round((infoInUse / total) * 1000) / 10 : 0,
        chuaXinInfo,
        caNhan,
        chuaGanWeb,
        byLoaiDoc: Array.from(loaiMap.entries()).map(([name, value]) => ({ name, value })),
    };
};

export const computeByOwner = (
    records: InfoBoRecord[],
    batchId: string,
    batchLabel: string,
): InfoBoOwnerStats[] => {
    const map = new Map<string, InfoBoOwnerStats>();

    for (const r of records) {
        const name = r.tenReg.trim() || "Chưa gán";
        if (!map.has(name)) {
            map.set(name, {
                name,
                batchId,
                batchLabel,
                totalInfo: 0,
                khangVe: 0,
                khangFail: 0,
                chuaKhang: 0,
            });
        }
        const o = map.get(name)!;
        o.totalInfo++;
        if (r.isKhangVe) o.khangVe++;
        else if (r.isKhangFail) o.khangFail++;
        else if (r.isChuaKhang) o.chuaKhang++;
    }

    return Array.from(map.values()).sort((a, b) => b.totalInfo - a.totalInfo);
};

export const getInfoBoData = async (forceRefresh = false): Promise<InfoBoSheetData> => {
    if (forceRefresh) cachedInfoBoData = null;
    if (cachedInfoBoData && !forceRefresh) return cachedInfoBoData;

    const empty: InfoBoSheetData = {
        batches: [],
        batchName: "",
        records: [],
        stats: computeInfoBoStats([], 0),
        byOwner: [],
    };

    try {
        const ts = new Date().getTime();
        const sep = LINK_INFO_BO.includes("?") ? "&" : "?";
        const text = await fetch(`${LINK_INFO_BO}${sep}t=${ts}`, { cache: "no-store" }).then((r) => r.text());
        const rows = Papa.parse<Record<string, unknown>>(text, {
            header: true,
            skipEmptyLines: true,
        }).data;

        const records: InfoBoRecord[] = [];
        const batchRecords = new Map<string, InfoBoRecord[]>();
        const batchMeta = new Map<string, ReturnType<typeof parseBatchMeta>>();

        let currentBatchId = "";
        let batchIndex = 0;

        for (const row of rows) {
            const tenReg = getRowVal(row, "Tên ", "Tên");
            const web = getRowVal(row, "Web");
            const infoCaNhan = getRowVal(row, "Info cá nhân");

            if (isBatchSeparator(tenReg)) {
                const meta = parseBatchMeta(tenReg, web);
                currentBatchId = meta.id || `batch-${++batchIndex}`;
                batchMeta.set(currentBatchId, { ...meta, id: currentBatchId });
                if (!batchRecords.has(currentBatchId)) batchRecords.set(currentBatchId, []);
                continue;
            }

            if (!infoCaNhan && !web && !tenReg) continue;

            if (!currentBatchId) {
                currentBatchId = "unassigned";
                batchMeta.set(currentBatchId, {
                    id: currentBatchId,
                    name: "Chưa phân đợt",
                    label: "Chưa phân đợt",
                    totalDeclared: 0,
                });
                batchRecords.set(currentBatchId, []);
            }

            const loaiDoc = getRowVal(row, "Loại Doc");
            const docDoanhNghiep = getRowVal(row, "Doc doanh nghiệp");
            const trangThai = getRowVal(row, "Trạng thái");
            const sttRaw = getRowVal(row, "");
            const stt = parseInt(sttRaw, 10) || (batchRecords.get(currentBatchId)?.length ?? 0) + 1;

            const einEligible = isDoanhNghiep(loaiDoc);
            const caNhan = isCaNhan(loaiDoc);
            const inStats = countsInStats(loaiDoc);
            const khangStatus = parseKhangStatus(trangThai);

            const record: InfoBoRecord = {
                stt,
                batchId: currentBatchId,
                tenReg,
                web,
                hanDomain: getRowVal(row, "Hạn Domain"),
                infoCaNhan,
                dev: getRowVal(row, "DEV"),
                loaiDoc,
                docCaNhan: getRowVal(row, "Doc cá nhân"),
                docDoanhNghiep,
                trangThai,
                note: getRowVal(row, "Note"),
                isEinEligible: einEligible,
                isCaNhan: caNhan,
                countsInStats: inStats,
                hasEin: einEligible && hasEinDoc(docDoanhNghiep),
                khangStatus,
                isKhangVe: khangStatus === "khang_ve",
                isKhangFail: khangStatus === "fail",
                isChuaKhang: khangStatus === "chua_khang",
                isChuaXinInfo: isChuaXinDoc(loaiDoc),
                isInUse: inStats && Boolean(web),
            };

            records.push(record);
            batchRecords.get(currentBatchId)!.push(record);
        }

        const batches: InfoBoBatch[] = Array.from(batchMeta.entries()).map(([id, meta]) => {
            const batchRows = batchRecords.get(id) ?? [];
            return {
                id,
                name: meta.name,
                label: meta.label,
                totalDeclared: meta.totalDeclared,
                stats: computeInfoBoStats(batchRows, meta.totalDeclared),
                byOwner: computeByOwner(batchRows, id, meta.label),
            };
        });

        const batchesWithRows = batches.filter((b) => b.stats.totalInSheet > 0);
        const totalDeclaredAll = batchesWithRows.length > 0
            ? batchesWithRows.reduce((sum, b) => sum + b.totalDeclared, 0)
            : batches.reduce((sum, b) => sum + b.totalDeclared, 0);

        const result: InfoBoSheetData = {
            batches,
            batchName: batches.map((b) => b.label).join(" · "),
            records,
            stats: computeInfoBoStats(records, totalDeclaredAll),
            byOwner: batches.flatMap((b) => b.byOwner),
        };

        cachedInfoBoData = result;
        return result;
    } catch (err) {
        console.error("getInfoBoData error:", err);
        return empty;
    }
};