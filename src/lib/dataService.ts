import Papa from "papaparse";

const LINK_REBUILD = import.meta.env.VITE_LINK_TAB_REBUILD;
const LINK_SHOPIFY = import.meta.env.VITE_LINK_TAB_SHOPIFY;

let cachedData: any[] | null = null;

export const getAllData = async (forceRefresh = false) => {
    if (cachedData && !forceRefresh) return cachedData;

    try {
        const [resRebuild, resShopify] = await Promise.all([
            fetch(LINK_REBUILD).then(r => r.text()),
            fetch(LINK_SHOPIFY).then(r => r.text())
        ]);

        const rebuildRows = Papa.parse(resRebuild, { header: true, skipEmptyLines: true }).data;
        const shopifyRows = Papa.parse(resShopify, { header: true, delimiter: "\t", skipEmptyLines: true }).data;

        // --- BƯỚC QUAN TRỌNG: Lọc trùng lặp, giữ lại dòng cuối cùng ---
        // Đảo ngược mảng rebuildRows để dòng ở dưới cùng lên đầu
        const latestRebuildData = [...rebuildRows].reverse().reduce((acc: any[], current: any) => {
            const domainName = current["Tên Domain"]?.trim();
            if (!domainName) return acc;

            // Nếu domain này chưa có trong accumulator (tức là đây là bản ghi mới nhất)
            if (!acc.find(item => item["Tên Domain"]?.trim() === domainName)) {
                acc.push(current);
            }
            return acc;
        }, []);

        const combined = latestRebuildData.map((r: any) => {
            const domainName = r["Tên Domain"].trim();

            const s: any = shopifyRows.find((item: any) =>
                item["Web Shopify"]?.trim() === domainName
            );

            const daysLeft = parseInt(r["DaysLeft"]) || 0;

            return {
                domain: domainName,
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