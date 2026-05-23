import Papa from "papaparse";

const LINK_REBUILD = import.meta.env.VITE_LINK_TAB_REBUILD;
const LINK_SHOPIFY = import.meta.env.VITE_LINK_TAB_SHOPIFY;
const LINK_GMC_VE = import.meta.env.VITE_LINK_TAB_GMC_VE;
let cachedData: any[] | null = null;
let cachedAllData: any[] | null = null;
let cachedGmcVeData: any[] | null = null;

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

        // Parse thủ công — tách dòng rồi tách cột theo TAB
        // Không dùng PapaParse vì nó nuốt dòng khi gặp dấu " trong Address
        const lines = resRebuild.split('\n');

        const headerLine = lines[0];
        const headers = headerLine.split('\t').map(h =>
            h.replace(/[\u00A0\uFEFF\u200B\r]/g, '').trim()
        );

        const domainIndex = headers.indexOf('Tên Domain');
        console.log("=== INDEX CỘT DOMAIN ===", domainIndex, "| headers:", headers);

        const allDomains: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].replace(/\r$/, ''); // bỏ \r của Windows
            if (line.trim().length === 0) continue;   // bỏ dòng hoàn toàn trống

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

        console.log("=== KẾT QUẢ ===");
        console.log("Tổng dòng raw (trừ header):", lines.length - 1);
        console.log("Domain lấy được:", allDomains.length);
        console.log("Chênh lệch:", (lines.length - 1) - allDomains.length);
        console.log("Danh sách:", allDomains);

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

        // --- 1. LỌC REBUILD: Lấy dòng cuối cùng ---
        const rebuildMap = new Map();
        rebuildRows.forEach((row: any) => {
            const domainName = row["Tên Domain"]?.trim();
            if (domainName) {
                rebuildMap.set(domainName.toLowerCase(), row); // Thằng sau đè thằng trước -> Lấy thằng cuối
            }
        });
        const latestRebuildData = Array.from(rebuildMap.values());

        // --- 2. LỌC SHOPIFY: Lấy dòng cuối cùng (QUAN TRỌNG) ---
        const shopifyMap = new Map();
        shopifyRows.forEach((row: any) => {
            const domainName = row["Web Shopify"]?.trim();
            if (domainName) {
                shopifyMap.set(domainName.toLowerCase(), row); // Thằng sau đè thằng trước -> Lấy thằng cuối
            }
        });

        // --- 3. KẾT HỢP DỮ LIỆU ---
        const combined = latestRebuildData.map((r: any) => {
            const domainName = r["Tên Domain"].trim().toLowerCase();

            // Thay vì dùng .find() (lấy thằng đầu), ta lấy trực tiếp từ shopifyMap (đã là thằng cuối)
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

        // Parse dữ liệu từ tab GMC mới
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