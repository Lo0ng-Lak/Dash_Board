import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { getAllData } from "../lib/dataService";

export const Route = createFileRoute("/domains")({
  component: Dashboard,
});

const ITEMS_PER_PAGE = 10;

const RenderRebuildDots = ({ countString }: { countString: string }) => {
  const count = parseInt(countString.replace(/[^0-9]/g, "")) || 0;
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i < count ? "bg-blue-500" : "bg-slate-200"}`} />
        ))}
      </div>
      <span className="text-[10px] text-slate-400 font-medium">{count}x</span>
    </div>
  );
};

const calculateDaysLeft = (dateStr: string) => {
  if (!dateStr || dateStr === "—") return null;

  // Xử lý nếu ngày có định dạng DD/MM/YYYY
  const parts = dateStr.split("/");
  let targetDate;

  if (parts.length === 3) {
    // Chuyển về YYYY-MM-DD để trình duyệt nào cũng hiểu
    targetDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  } else {
    targetDate = new Date(dateStr);
  }

  if (isNaN(targetDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Đưa về đầu ngày để tính cho chuẩn

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getAllData();
      setData(result);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch =
        item.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.dev.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" ? true :
        filterStatus === "active" ? !item.isCanceled :
          filterStatus === "canceled" ? item.isCanceled : true;

      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentItems = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  // LOGIC HIỂN THỊ SỐ TRANG RÚT GỌN 
  const renderPagination = () => {
    const pages = [];
    const maxVisible = 3;
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > maxVisible) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) { if (!pages.includes(i)) pages.push(i); }
      if (currentPage < totalPages - (maxVisible - 1)) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages.map((p, i) => (
      <button
        key={i}
        disabled={p === "..."}
        onClick={() => typeof p === "number" && setCurrentPage(p)}
        className={`px-3 py-1 border rounded text-xs transition-all ${currentPage === p
          ? "bg-blue-600 text-white border-blue-600 font-bold"
          : p === "..." ? "border-transparent text-slate-400 cursor-default" : "bg-white hover:bg-slate-50 text-slate-600"
          }`}
      >
        {p}
      </button>
    ));
  };

  if (loading) return <div className="p-10 text-center font-medium">Đang tải dữ liệu hệ thống...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCFB] p-6 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* THANH TÌM KIẾM & BỘ LỌC */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full md:w-96">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm domain, dev hoặc khách hàng..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-slate-200 rounded-lg px-4 py-2 text-sm bg-white outline-none cursor-pointer font-medium text-slate-600"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">🟢 Đang hoạt động (Active)</option>
            <option value="canceled">🔴 Đã hủy (Canceled)</option>
          </select>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#F9FAF9] text-slate-400 font-bold uppercase text-[9px] tracking-[0.15em] border-b">
              <tr>
                <th className="p-5 text-center w-12">STT</th>
                <th className="p-5">Domain</th>
                <th className="p-5">Nhân sự</th>
                <th className="p-5">Vận hành</th>
                <th className="p-5">Hạn Shopify</th>
                <th className="p-5">Hạn Domain</th>
                <th className="p-5">Nền tảng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  {/* STT */}
                  <td className="p-5 text-center text-slate-400 text-[10px]">
                    {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  </td>

                  {/* DOMAIN & NỀN TẢNG - CẬP NHẬT THEO STYLE MỚI */}
                  <td className="p-5">
                    <div className="font-bold text-slate-800 lowercase text-[15px] mb-2">{item.domain}</div>

                  </td>

                  {/* NHÂN SỰ */}
                  <td className="p-5">
                    <div className="text-slate-700 font-semibold">Dev: {item.dev}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 italic">Reg: {item.regBy}</div>

                  </td>

                  {/* VẬN HÀNH */}
                  <td className="p-5">
                    <div className="space-y-2">
                      <RenderRebuildDots countString={item.rebuildCount} />
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          // Trường hợp: Rỗng hoặc khoảng trắng -> Chưa xác định
                          if (!item.webhookStatus || item.webhookStatus === "") {
                            return (
                              <span className="text-[8px] bg-slate-50 text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded font-black">
                                CHƯA XÁC ĐỊNH
                              </span>
                            );
                          }

                          // Trường hợp: Đã thay
                          if (item.webhookStatus === "Đã thay") {
                            return (
                              <span className="text-[8px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded font-black">
                                WEBHOOK (DONE)
                              </span>
                            );
                          }

                          // Trường hợp: Chưa thay webhook
                          if (item.webhookStatus === "Chưa thay webhook") {
                            return (
                              <span className="text-[8px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-black">
                                CHƯA THAY WEBHOOK
                              </span>
                            );
                          }

                          return null;
                        })()}
                      </div>
                    </div>
                  </td>

                  {/* HẠN SHOPIFY 1$ & PLAN */}
                  <td className="p-5 text-center md:text-left">
                    <div className="flex flex-col gap-1">
                      <div className="font-bold text-slate-700 text-xs tabular-nums">
                        {item.expiryDateShopify || "—"}
                      </div>
                      {!item.isCanceled && item.expiryDateShopify !== "—" && (
                        <div className="mt-0.5">
                          {(() => {
                            const days = calculateDaysLeft(item.expiryDateShopify);
                            if (days === null) return null;
                            return (
                              <span className={`text-[10px] font-bold uppercase tracking-tight ${days <= 7 ? 'text-red-500' : 'text-blue-500'}`}>
                                Còn {days} ngày
                              </span>
                            );
                          })()}
                        </div>
                      )}
                      <div className="text-[9px] text-slate-400 italic">Start: {item.startDate || "—"}</div>
                    </div>
                  </td>

                  {/* HẠN DOMAIN */}
                  <td className="p-5">
                    <div className={`font-bold text-xs tabular-nums ${item.daysLeft <= 7 ? 'text-red-500' : 'text-slate-700'}`}>
                      {item.expiryDateSheet || "—"}
                    </div>
                    <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-md w-fit
                    ${item.daysLeft <= 7 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                      Còn {item.daysLeft} ngày
                    </div>
                  </td>

                  {/* NỀN TẢNG */}
                  <td className="p-5">
                    <div >
                      {/* Badge Nền tảng linh hoạt */}
                      {item.isCanceled && item.isHuyRegMoi ? (
                        <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 rounded-full font-bold border border-red-100 line-through decoration-red-400">
                          × Shopify (đã hủy)
                        </span>
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${item.type?.toLowerCase() === 'shopify'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                          {item.type}
                        </span>
                      )}


                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PHÂN TRANG (Giữ nguyên) */}
          <div className="p-4 border-t flex items-center justify-between bg-[#F9FAF9]">
            <div className="text-[11px] text-slate-400 font-medium">
              Hiển thị <span className="text-slate-600 font-bold">{currentItems.length}</span> trên tổng số <span className="text-slate-600 font-bold">{filteredData.length}</span> domain
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-white bg-slate-50 disabled:opacity-30"
              >◀</button>
              <div className="flex gap-1 mx-2">{renderPagination()}</div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-white bg-slate-50 disabled:opacity-30"
              >▶</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}