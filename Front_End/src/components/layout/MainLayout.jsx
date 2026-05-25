import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AiChatWidget } from "../ai/AiChatWidget";

const PAGE_TITLES = {
  // Admin paths
  "/dashboard": "Dashboard",
  "/books": "Quản lý Sách",
  "/authors": "Tác giả",
  "/categories": "Thể loại",
  "/reader-categories": "Thể loại Độc Giả",
  "/users": "Quản lý Người dùng",
  "/reader-cards": "Thẻ Độc giả",
  "/borrows": "Phiếu Mượn/Trả",
  "/fines": "Thu tiền phạt",
  "/reports": "Báo cáo",
  "/policies": "Quy định Thư viện",
  "/reservations": "Quản lý Đặt trước",
  // Staff paths
  "/staff/dashboard": "Dashboard",
  "/staff/books": "Quản lý Sách",
  "/staff/authors": "Tác giả",
  "/staff/categories": "Thể loại",
  "/staff/reader-categories": "Thể loại Độc Giả",
  "/staff/reader-cards": "Thẻ Độc giả",
  "/staff/borrows": "Phiếu Mượn/Trả",
  "/staff/fines": "Thu tiền phạt",
  "/staff/reports": "Báo cáo",
  "/staff/reservations": "Quản lý Đặt trước",
  // Reader paths
  "/my-profile": "Thông tin cá nhân",
  "/search": "Tra cứu Sách",
  "/my-borrows": "Lịch sử Mượn sách",
  "/my-reservations": "Đặt trước",
  "/my-fines": "Tiền phạt của tôi",
};

export const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || "Thư viện";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <AiChatWidget />
    </div>
  );
};
