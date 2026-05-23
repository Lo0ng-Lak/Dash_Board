import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";
import { getAllDataWeb } from "@/lib/dataService"; // Đường dẫn tới file chứa hàm của bạn

export const Route = createFileRoute("/settings")({
  // 1. Khai báo loader để fetch data trước khi vào trang
  loader: async () => {
    const domains = await getAllDataWeb();
    return { domains };
  },
  // 2. Component nhận data và hiển thị
  component: SettingsComponent,
});

function SettingsComponent() {
  // 3. Dùng hook này của TanStack Router để lấy dữ liệu từ loader ra ngoài
  const { domains } = Route.useLoaderData();

  return (
    <div>
      <PagePlaceholder title="Cài đặt" icon="⚙️" desc="Cấu hình hệ thống & tài khoản." />

      {/* 4. Đoạn này đổ dữ liệu ra giao diện test thử nhé */}
      <div style={{ padding: "20px", maxWidth: "600px" }}>
        <h3>Danh sách Domain cấu hình ({domains.length})</h3>

        {domains.length === 0 ? (
          <p>Không tìm thấy domain nào hoặc lỗi kết nối.</p>
        ) : (
          <ul style={{ background: "#f5f5f5", padding: "15px", borderRadius: "8px", listStyle: "none" }}>
            {domains.map((domain, index) => (
              <li key={index} style={{ padding: "5px 0", borderBottom: "1px solid #ddd" }}>
                🌐 {domain}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}