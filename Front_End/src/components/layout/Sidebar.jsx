import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  CreditCard,
  BookCopy,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  BookMarked,
  BarChart3,
  User,
  Tag,
  Layers,
  Library,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

const adminNav = [
  { to: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { to: "/books",        icon: BookOpen,        label: "Tựa sách" },
  { to: "/book-copies",  icon: Library,         label: "Bản sao sách" },
  { to: "/users",        icon: Users,           label: "Người dùng" },
  { to: "/authors",      icon: User,            label: "Tác giả" },
  { to: "/reader-categories", icon: Layers,     label: "Loại độc giả" },
  { to: "/categories",   icon: Tag,             label: "Thể loại" },
  { to: "/reader-cards", icon: CreditCard,      label: "Thẻ Độc giả" },
  { to: "/borrows",      icon: BookCopy,        label: "Phiếu Mượn/Trả" },
  { to: "/reservations", icon: BookMarked,      label: "Đặt trước" },
  { to: "/fines",        icon: DollarSign,      label: "Thu tiền phạt" },
  { to: "/reports",      icon: BarChart3,       label: "Báo cáo" },
  { to: "/policies",     icon: Settings,        label: "Quy định" },
];

const staffNav = [
  { to: "/staff/dashboard",         icon: LayoutDashboard, label: "Dashboard" },
  { to: "/staff/books",             icon: BookOpen,        label: "Tựa sách" },
  { to: "/staff/book-copies",       icon: Library,         label: "Bản sao sách" },
  { to: "/staff/reader-cards",      icon: CreditCard,      label: "Thẻ Độc giả" },
  { to: "/staff/reader-categories", icon: Layers,          label: "Loại độc giả" },
  { to: "/staff/authors",           icon: User,            label: "Tác giả" },
  { to: "/staff/categories",        icon: Tag,             label: "Thể loại" },
  { to: "/staff/borrows",           icon: BookCopy,        label: "Phiếu Mượn/Trả" },
  { to: "/staff/reservations",      icon: BookMarked,      label: "Đặt trước" },
  { to: "/staff/fines",             icon: DollarSign,      label: "Thu tiền phạt" },
  { to: "/staff/reports",           icon: BarChart3,       label: "Báo cáo" },
];

const readerNav = [
  { to: "/my-profile", icon: CreditCard, label: "Thông tin cá nhân" },
  { to: "/search", icon: BookOpen, label: "Tra cứu sách" },
  { to: "/my-borrows", icon: BookCopy, label: "Lịch sử mượn" },
  { to: "/my-reservations", icon: BookMarked, label: "Đặt trước" },
  { to: "/my-fines", icon: DollarSign, label: "Tiền phạt" },
];

export const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems =
    user?.role === "ADMIN"
      ? adminNav
      : user?.role === "STAFF"
        ? staffNav
        : readerNav;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className={`flex flex-col h-screen bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div
        className={`flex items-center h-16 px-4 border-b border-gray-100 ${
          collapsed ? "justify-center" : "gap-3"
        }`}
      >
        <BookOpen size={24} className="text-[#E28359] shrink-0" />
        {!collapsed && (
          <div className="flex items-center truncate">
            <span className="font-bold text-[#E28359] text-lg">Libra</span>
            <span className="font-bold text-[#354336] text-lg">Byte</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${
                isActive
                  ? "bg-[#F4EFE7] text-[#354336]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#354336]"
              }
              ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 p-2 space-y-1">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>

        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-50 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} />
              <span>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
