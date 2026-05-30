// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
    en: {
        translation: {
            // --- Hệ thống chung & Cũ ---
            dashboard: "Dashboard",
            domains: "Domains",
            assignedStaff: "Assigned Staff",
            status: "Status",
            daysAlive: "Days Alive",
            running: "Running",
            beforeSuspended: "Before suspended",
            logout: "Logout",

            // --- Các mục Menu điều hướng (navItems) ---
            regGmc: "REG GMC",
            devGmc: "Dev GMC",
            webKpi: "Web KPI",
            invoices: "Invoices",
            profile: "Profile",
            reports: "Reports",
            shopify: "Shopify",
            wordpress: "WordPress",
            settings: "Settings",

            // --- Màn hình Dashboard ---
            webManagement: "Website Management",
            operationalStatus: "Operational Status",
            webOperationalStatus: "Website operational status",
            loadingData: "Loading data...",
            liveSyncing: "Live Syncing",
            totalRawWebsites: "Total Raw Websites",
            allDomains: "All domains",
            totalFilteredWebsites: "Total Filtered Websites",
            cleanedData: "Cleaned data",
            ecommerce: "E-commerce",
            other: "Other",
            uncategorized: "Uncategorized",
            inactive: "Inactive",
            notActive: "Not active",
            active: "Active",
            archived: "Archived",
            platformDistribution: "Platform Distribution",
            shopifyExpiringSoon: "Shopify Expiring Soon",
            domainExpiringSoon: "Domain Expiring Soon",
            shopifyRenewals: "Shopify Renewals",
            domainRenewals: "Domain Renewals",
            allGood: "All good",
            daysLeft: "days left",
            renew: "Renew",

            // --- Trang Danh sách Tên miền mới (Domains List) ---
            domainManagement: "Domain Management",
            domainSystemDesc: "Domain management system and related information.",
            searchPlaceholder: "Search domain, dev, or customer...",
            loadingDomainData: "Loading Domain Data...",
            newestFirst: "Newest First",
            oldestFirst: "Oldest First",
            allStatus: "All status",
            canceled: "Canceled",
            no: "No.",
            domain: "Domain",
            staff: "Staff",
            operations: "Operations",
            shopifyExpiry: "Shopify Expiry",
            domainExpiry: "Domain Expiry",
            platform: "Platform",
            registeredBy: "Registered by",
            webhookDone: "WEBHOOK (DONE)",
            notWebhookChanged: "NOT WEBHOOK CHANGED",
            notDetermined: "NOT DETERMINED",
            registeredDate: "Registered",
            shopifyCanceled: "Shopify (canceled)",
            showing: "Showing",
            of: "of",

            // --- Trang Quản lý Đăng ký GMC (GMC REG List) ---
            gmcRegManagement: "GMC REG Management",
            devRegManagement: "GMC Resistance Dashboard",
            gmcSystemDesc: "Track and manage the status of GMC account initialization.",
            loadingSystemData: "Loading system data...",

            // Thẻ thống kê (Stats Cards)
            totalFilteredRows: "Total Domain",
            actualFilteredDomains: "Actual Filtered Domains",
            totalLiveDomains: "Total Live Domains",
            totalSuspendedDomains: "Total Suspended Domains",
            searchAdsCost: "Search Ads Cost",
            totalAdsCost: "Total Ads Cost",
            matchingSearchResult: "Matching search result",
            allFilteredRecords: "All DOMAIN",
            cleanedDomains: "Cleaned domains",
            searchTotal: "SEARCH TOTAL",
            usdTotal: "USD TOTAL",

            // Biểu đồ (Charts)
            systemRatioOverview: "System Ratio Overview",
            accountProductivityByDev: "Account Productivity by Dev",

            // Thanh bộ lọc (Filters Bar)
            searchDomainPlaceholder: "Search for domain...",
            allMonths: "ALL MONTHS",
            monthLabel: "MONTH",
            filterByDevAll: "👤 FILTER BY DEV (ALL)",
            webTypeAll: "🌐 WEB TYPE (ALL)",

            // Bảng (Table Headers & Labels)
            webAndPlatform: "Website & Platform",
            gmcDate: "GMC Date",
            ageDays: "Age (Days)",
            proxyExpiryLeft: "Proxy Expiry Left",
            adsCost: "Ads Cost",
            day: "day",
            days: "days",
            expired: "Expired",
            noAccountData: "No account data found matching the filter.",


            "more": "more",
            "collapse": "Collapse",
            "failedToLoadData": "Failed to load data.",

            "webKpiDashboard": "Web KPI Dashboard",
            "autoSyncing": "Auto syncing...",
            "dashboardSubTitle": "Track website completion status by dev & month.",
            "totalWebsites": "Total Websites",
            "currentFilter": "Current filter",
            "statusUnclassified": "Unclassified",
            "statusCompleted": "Completed",
            "statusInProgress": "In Progress",
            "statusNeedCheck": "Need Check",
            "doneUpper": "DONE",
            "pendingUpper": "PENDING",
            "awaitingQA": "Awaiting QA",
            "topDev": "Top Dev",
            "activeDevs": "Active Devs",
            "monthLabelFormat": "Month {{month}}/{{year}}",
            "monthShortFormat": "M{{month}}/{{year}}",
            "sitesCompletedCount": "{{count}} sites completed",
            "devsInFilterCount": "{{count}} devs in filter",
            "statusBreakdown": "Status Breakdown",
            "sitesCompletedByDev": "Sites Completed by Dev",
            "sitesCompletedTooltip": "Sites completed",
            "searchPlaceholderTableOnly": "Search dev or domain... (table only)",

            "allDevsFilter": "ALL DEVS",
            "clearFilters": "Clear filters",
            "tableHeaderDev": "Dev",
            "tableHeaderMonth": "Month",
            "tableHeaderSites": "Sites",
            "tableHeaderProgress": "Progress",
            "tableHeaderDomains": "Domains",
            "noMatchingRecords": "No matching records found.",




            "domainManager": "Domain Manager",
            "domainManagerDesc": "Track domain expiry & all expense records.",

            "expenses": "Expenses",
            "totalDomains": "Total Domains",
            "inCurrentFilter": "In current filter",

            "ofTotal": "of total",
            "expiringLessThan30d": "Expiring ≤ 30d",
            "renewImmediately": "Renew immediately",
            "expiring31To90d": "Expiring 31–90d",
            "planRenewalSoon": "Plan renewal soon",
            "totalDomainCost": "Total Domain Cost",
            "filteredTotal": "Filtered total",
            "expiryDistribution": "Expiry Distribution",

            "domainsByRegistrant": "Domains by Registrant",

            "allRegistrants": "ALL REGISTRANTS",

            "allExpiry": "ALL EXPIRY",
            "clear": "Clear",
            "thRegistrant": "Registrant",
            "thDomain": "Domain",
            "thPurchaseDate": "Purchase Date",
            "thExpiryDate": "Expiry Date",
            "thDaysLeft": "Days Left",
            "thPrice": "Price",
            "thToolStatus": "Tool Status",
            "statusUrgent": "URGENT",
            "statusSoon": "SOON",
            "statusOk": "OK",
            "noDomainsFound": "No domains found.",
            "totalRecords": "Total Records",
            "totalSpend": "Total Spend",
            "allExpenseTypes": "All expense types",
            "adsSpend": "ADS Spend",
            "advertisingCost": "Advertising cost",
            "domainSpend": "Domain Spend",
            "domainPurchases": "Domain purchases",
            "topSpender": "Top Spender",
            "gmcAndMail": "GMC + Mail",
            "otherCosts": "Other costs",
            "spendByCategory": "Spend by Category",
            "monthlySpend": "Monthly Spend",
            "searchExpensePlaceholder": "Search web, registrant, card...",

            "allTypes": "ALL TYPES",
            "thType": "Type",
            "thDate": "Date",
            "thWebsite": "Website",
            "thAdsCard": "Ads Card",
            "thAmount": "Amount",
            "thBill": "Bill",
            "viewBill": "View bill",
            "noExpenseRecordsFound": "No expense records found.",
            "allTime": "All time"
        }
    },
    vi: {
        translation: {
            // --- Hệ thống chung & Cũ ---
            dashboard: "Bảng điều khiển",
            domains: "Tên miền",
            assignedStaff: "Nhân viên phụ trách",
            status: "Trạng thái",
            daysAlive: "Số ngày sống",
            running: "Đang hoạt động",
            beforeSuspended: "Trước khi sập",
            logout: "Đăng xuất",

            // --- Các mục Menu điều hướng (navItems) ---
            regGmc: "REG GMC", // Hoặc giữ nguyên "REG GMC" nếu là thuật ngữ kỹ thuật
            devGmc: "DEV GMC", // Hoặc giữ nguyên "Dev GMC" tùy nhu cầu dự án của bạn
            webKpi: "Chỉ số KPI Web",
            invoices: "Hóa đơn",
            profile: "Trang cá nhân",
            reports: "Báo cáo",
            shopify: "Shopify",
            wordpress: "WordPress",
            settings: "Cài đặt",

            // --- Màn hình Dashboard ---
            webManagement: "Quản lý Website",
            operationalStatus: "Trạng thái vận hành",
            webOperationalStatus: "Tình trạng hoạt động của hệ thống website",
            loadingData: "Đang tải dữ liệu...",
            liveSyncing: "Đồng bộ trực tiếp",
            totalRawWebsites: "Tổng số tên miền ",
            allDomains: "Tất cả tên miền",
            totalFilteredWebsites: "Tổng số web đã lọc",
            cleanedData: "Dữ liệu sạch",
            ecommerce: "Thương mại điện tử",
            other: "Nền tảng khác",
            uncategorized: "Chưa phân loại",
            inactive: "Ngừng hoạt động",
            notActive: "Không hoạt động",
            active: "Hoạt động",
            archived: "Đã lưu trữ",
            platformDistribution: "Tỷ lệ phân phối nền tảng",
            shopifyExpiringSoon: "Hạn Shopify sắp hết",
            domainExpiringSoon: "Tên miền sắp hết hạn",
            shopifyRenewals: "Gia hạn Shopify",
            domainRenewals: "Gia hạn tên miền",
            allGood: "Mọi thứ đều ổn định",
            daysLeft: "ngày còn lại",
            renew: "Gia hạn",

            // --- Trang Danh sách Tên miền mới (Domains List) ---

            domainManagement: "Quản lý Tên miền",
            domainSystemDesc: "Hệ thống quản lý vòng đời tên miền và các thông tin vận hành liên quan.",
            searchPlaceholder: "Tìm kiếm tên miền, nhân viên dev, hoặc khách hàng...",
            loadingDomainData: "Đang tải dữ liệu tên miền...",
            newestFirst: "Mới nhất trước",
            oldestFirst: "Cũ nhất trước",
            allStatus: "Tất cả trạng thái",
            canceled: "Đã hủy",
            no: "STT",
            domain: "Tên miền",
            staff: "Nhân sự",
            operations: "Vận hành",
            shopifyExpiry: "Hết hạn Shopify",
            domainExpiry: "Hết hạn Tên miền",
            platform: "Nền tảng",
            registeredBy: "Người đăng ký",
            webhookDone: "WEBHOOK (ĐÃ THAY)",
            notWebhookChanged: "CHƯA THAY WEBHOOK",
            notDetermined: "CHƯA XÁC ĐỊNH",
            registeredDate: "Ngày đăng ký",
            shopifyCanceled: "Shopify (đã hủy)",
            showing: "Hiển thị",
            of: "trên tổng số",


            // --- Trang Quản lý Đăng ký GMC (GMC REG List) ---
            gmcRegManagement: "Quản lý REG GMC",
            devRegManagement: "Quản lý DEV GMC",
            gmcSystemDesc: "Theo dõi và quản lý trạng thái khởi tạo tài khoản GMC.",
            loadingSystemData: "Đang tải dữ liệu hệ thống...",

            // Thẻ thống kê (Stats Cards)
            totalFilteredRows: "Tổng tên miền",
            actualFilteredDomains: "Số tên miền đã lọc",
            totalLiveDomains: "Tổng tên miền hoạt động",
            totalSuspendedDomains: "Tổng tên miền bị sập",
            searchAdsCost: "Chi phí Ads tìm kiếm",
            totalAdsCost: "Tổng chi phí Ads",
            matchingSearchResult: "Kết quả tìm kiếm phù hợp",
            allFilteredRecords: "Tất cả tên miền",
            cleanedDomains: "Tên miền đã lọc",
            searchTotal: "TỔNG TÌM KIẾM",
            usdTotal: "TỔNG USD",

            // Biểu đồ (Charts)
            systemRatioOverview: "Tổng quan tỷ lệ hệ thống",
            accountProductivityByDev: "Hiệu suất tài khoản theo Dev",

            // Thanh bộ lọc (Filters Bar)
            searchDomainPlaceholder: "Tìm kiếm tên miền...",
            allMonths: "TẤT CẢ CÁC THÁNG",
            monthLabel: "THÁNG",
            filterByDevAll: "LỌC THEO DEV (TẤT CẢ)",
            webTypeAll: "🌐 NỀN TẢNG WEB (TẤT CẢ)",

            // Bảng (Table Headers & Labels)
            webAndPlatform: "Website & Nền tảng",
            gmcDate: "Ngày GMC",
            ageDays: "Số ngày sống",
            proxyExpiryLeft: "Hạn Proxy còn lại",
            adsCost: "Chi phí Ads",
            day: "ngày",
            days: "ngày",
            expired: "Hết hạn",
            noAccountData: "Không tìm thấy dữ liệu tài khoản nào khớp với bộ lọc.",


            "more": "thêm",
            "collapse": "Thu gọn",
            "failedToLoadData": "Không thể tải dữ liệu.",

            "webKpiDashboard": "Bảng Điều Khiển KPI Website",
            "autoSyncing": "Đang tự động đồng bộ...",
            "dashboardSubTitle": "Theo dõi trạng thái hoàn thành website theo dev & tháng.",
            "totalWebsites": "Tổng số Website",
            "currentFilter": "Bộ lọc hiện tại",
            "statusUnclassified": "Chưa phân loại",
            "statusCompleted": "Đã hoàn thành",
            "statusInProgress": "Đang tiến hành",
            "statusNeedCheck": "Cần kiểm tra",
            "doneUpper": "HOÀN THÀNH",
            "pendingUpper": "CHƯA XỬ LÝ",
            "awaitingQA": "Chờ Đánh Giá",
            "topDev": "Dev Xuất Sắc",
            "activeDevs": "Dev Đang Hoạt Động",
            "monthLabelFormat": "Tháng {{month}}/{{year}}",
            "monthShortFormat": "T{{month}}/{{year}}",
            "sitesCompletedCount": "Đã xong {{count}} trang",
            "devsInFilterCount": "{{count}} dev trong bộ lọc",
            "statusBreakdown": "Phân Tích Trạng Thái",
            "sitesCompletedByDev": "Số Trang Hoàn Thành Theo Dev",
            "sitesCompletedTooltip": "Số trang đã xong",
            "searchPlaceholderTableOnly": "Tìm dev hoặc domain... (chỉ áp dụng cho bảng)",

            "allDevsFilter": "TẤT CẢ DEVS",
            "clearFilters": "Xóa bộ lọc",
            "tableHeaderDev": "Nhà phát triển",
            "tableHeaderMonth": "Tháng",
            "tableHeaderSites": "Số trang",
            "tableHeaderProgress": "Tiến độ",
            "tableHeaderDomains": "Tên miền",
            "noMatchingRecords": "Không tìm thấy dữ liệu phù hợp.",



            "domainManager": "Quản lý Tên miền",
            "domainManagerDesc": "Theo dõi ngày hết hạn tên miền & tất cả hồ sơ chi phí.",

            "expenses": "Chi phí",
            "totalDomains": "Tổng Tên miền",
            "inCurrentFilter": "Trong bộ lọc hiện tại",

            "ofTotal": "trên tổng số",
            "expiringLessThan30d": "Hết hạn ≤ 30 ngày",
            "renewImmediately": "Gia hạn ngay lập tức",
            "expiring31To90d": "Hết hạn 31–90 ngày",
            "planRenewalSoon": "Lên kế hoạch gia hạn sớm",
            "totalDomainCost": "Tổng Chi phí Tên miền",
            "filteredTotal": "Tổng sau khi lọc",
            "expiryDistribution": "Phân phối Hạn hết",

            "domainsByRegistrant": "Tên miền theo Người đăng ký",

            "allRegistrants": "TẤT CẢ NGƯỜI ĐĂNG KÝ",

            "allExpiry": "TẤT CẢ HẠN HẾT",
            "clear": "Xóa bộ lọc",
            "thRegistrant": "Người đăng ký",
            "thDomain": "Tên miền",
            "thPurchaseDate": "Ngày mua",
            "thExpiryDate": "Ngày hết hạn",
            "thDaysLeft": "Số ngày còn lại",
            "thPrice": "Giá",
            "thToolStatus": "Trạng thái Tool",
            "statusUrgent": "KHẨN CẤP",
            "statusSoon": "SẮP TỚI",
            "statusOk": "ỔN",
            "noDomainsFound": "Không tìm thấy tên miền nào.",
            "totalRecords": "Tổng số Bản ghi",
            "totalSpend": "Tổng chi tiêu",
            "allExpenseTypes": "Tất cả loại chi phí",
            "adsSpend": "Chi phí ADS",
            "advertisingCost": "Chi phí quảng cáo",
            "domainSpend": "Chi phí Domain",
            "domainPurchases": "Mua tên miền",
            "topSpender": "Chi tiêu nhiều nhất",
            "gmcAndMail": "GMC + Mail",
            "otherCosts": "Các chi phí khác",
            "spendByCategory": "Chi tiêu theo Danh mục",
            "monthlySpend": "Chi tiêu Hàng tháng",
            "searchExpensePlaceholder": "Tìm kiếm web, người đăng ký, thẻ...",

            "allTypes": "TẤT CẢ LOẠI CHI PHÍ",
            "thType": "Loại chi phí",
            "thDate": "Ngày thanh toán",
            "thWebsite": "Trang web",
            "thAdsCard": "Thẻ Ads",
            "thAmount": "Số tiền",
            "thBill": "Hóa đơn",
            "viewBill": "Xem hóa đơn",
            "noExpenseRecordsFound": "Không tìm thấy hồ sơ chi phí nào.",
            "allTime": "Tất cả thời gian"
        }
    }
};

// 🌟 THÊM DÒNG NÀY: Kiểm tra môi trường để tránh lỗi "localStorage is not defined" trên Server
const isClient = typeof window !== "undefined";

i18n.use(initReactI18next).init({
    resources,
    // Nếu là client thì đọc localStorage, nếu chưa có hoặc là server (SSR) thì mặc định là 'en'
    lng: isClient ? (localStorage.getItem("lang") || "en") : "en",
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;