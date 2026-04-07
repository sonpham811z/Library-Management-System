import { Bell, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getRoleBadgeColor } from '../../utils/format';
import { Badge } from '../common/Badge';

export const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-[#354336] hover:bg-[#F4EFE7] rounded-lg transition-colors">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          {/* Đổi màu Avatar đồng bộ */}
          <div className="w-8 h-8 rounded-full bg-[#F4EFE7] flex items-center justify-center">
            <User size={16} className="text-[#354336]" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-700 leading-tight">{user?.full_name}</p>
            <Badge className={getRoleBadgeColor(user?.role)}>{user?.role}</Badge>
          </div>
        </div>
      </div>
    </header>
  );
};