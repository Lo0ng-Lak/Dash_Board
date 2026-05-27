import Papa from "papaparse";

const LINK_REBUILD = import.meta.env.VITE_LINK_TAB_REBUILD;
const LINK_SHOPIFY = import.meta.env.VITE_LINK_TAB_SHOPIFY;
const LINK_GMC_VE = import.meta.env.VITE_LINK_TAB_GMC_VE;
const LINK_GMC_REG = import.meta.env.VITE_LINK_GMC_REG;
let cachedData: any[] | null = null;
let cachedAllData: any[] | null = null;
let cachedGmcVeData: any[] | null = null;
let cachedGmcRegData: any = null;

export const getAllDataWeb = async (forceRefresh = false) => {
    if (cachedAllData && !forceRefresh) {
        return cachedAllData;
    }

    try {
        const timestamp = new Date().getTime();
        const separatorRebuild = LINK_REBUILD.includes('?') ? '&' : '?';

        const resRebuild = await fetch(`${LINK_REBUILD}${separatorRebuild}t=${timestamp}`, {
            cache: "no-store"
        }).then(r => r.text());

        // Manual parse — split line then split columns by TAB
        // Don't use PapaParse because it swallows line when encountering " in Address
        const lines = resRebuild.split('\n');

        const headerLine = lines[0];
        const headers = headerLine.split('\t').map(h =>
            h.replace(/[\u00A0\uFEFF\u200B\r]/g, '').trim()
        );

        const domainIndex = headers.indexOf('Tên Domain');
        console.log("=== DOMAIN COLUMN INDEX ===", domainIndex, "| headers:", headers);

        const allDomains: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].replace(/\r$/, ''); // remove \r from Windows
            if (line.trim().length === 0) continue;   // remove completely empty lines

            const cols = line.split('\t');
            const raw = cols[domainIndex];
            if (!raw) continue;

            const domain = raw
                .normalize('NFC')
                .replace(/[\u00A0\uFEFF\u200B"']/g, '')
                .trim();

            if (domain.length > 0) {
                allDomains.push(domain);
            }
        }


        cachedAllData = allDomains;
        return allDomains;
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
        const shopifyRows = Papa.parse(resShopify, { header: true, delimiter: "\t", skipEmptyLines: true }).data;

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


export const getGMCVeData = async (forceRefresh = false) => {
    if (cachedGmcVeData && !forceRefresh) return cachedGmcVeData;

    try {
        const timestamp = new Date().getTime();
        const separator = LINK_GMC_VE.includes('?') ? '&' : '?';

        const res = await fetch(`${LINK_GMC_VE}${separator}t=${timestamp}`).then(r => r.text());

        // Parse data from new GMC tab
        const rows = Papa.parse(res, { header: true, skipEmptyLines: true }).data;


        const formattedData = rows.map((r: any) => ({
            proxy: (r["Proxy"] || "").trim(),
            proxyExpiry: r["Hạn Proxy Phú"] || "—",
            twoFA: r["2FA"] || "—",
            domain: (r["WEB"] || "").trim(),
            dateGMC: r["Ngày về GMC"] || "—",
            regType: r["Loại đăng kí"] || "—",
            webType: r["Loại web"] || "—",
            status: r["Tình Trạng Sus"] || "Chưa Sus",
            dev: r["DEV"] || "—",
            adsDate: r["Ngày chạy Ads"] || "—",
            cost: r["Chi Phí"] || "0",
            note: r["Note"] || ""
        }));

        cachedGmcVeData = formattedData;
        return formattedData;
    } catch (error) {
        console.error("GMC VE Fetch error:", error);
        return [];
    }
};

export const getGMCRegData = async (forceRefresh = false) => {
    if (cachedGmcRegData && !forceRefresh) return cachedGmcRegData;

    try {
        const timestamp = new Date().getTime();
        const separator = LINK_GMC_REG.includes('?') ? '&' : '?';
        const res = await fetch(`${LINK_GMC_REG}${separator}t=${timestamp}`).then(r => r.text());
        const rows = Papa.parse(res, { header: true, skipEmptyLines: true }).data;

        // 1. CHUẨN HÓA DỮ LIỆU TỪ CSV
        const formattedData = rows.map((r: any) => ({
            proxy: (r["Proxy"] || "").trim(),
            proxyExpiry: r["Hạn Proxy"] || "—",
            twoFA: r["2FA"] || "—",
            domain: (r["WEB"] || "").trim(),
            dateGMC: r["Ngày về GMC"] || "—",
            webType: r["Loại web"] || "—",
            status: r["Tình Trạng Sus"] || "Xanh",
            dev: (r["DEV"] || "").trim(), // Để mặc định là chuỗi rỗng nếu không có tên người reg                
            adsDate: r["Ngày chạy Ads"] || "—",
            cost: r["Chi Phí"] || "0",
            note: r["Note"] || ""
        }));

        // 2. CRITICAL FILTER: Only get rows with both Domain AND assigned Dev
        // (Completely remove trash rows like in the image you sent)
        const validData = formattedData.filter((item: any) => {
            const hasDomain = item.domain !== "";
            const hasDev = item.dev !== "" && item.dev.toLowerCase() !== "unknown";

            return hasDomain && hasDev;
        });

        cachedGmcRegData = validData;
        return validData;
    } catch (error) {
        console.error("GMC REG Fetch error:", error);
        return [];
    }
};