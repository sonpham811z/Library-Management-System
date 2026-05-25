import { useEffect, useState } from 'react';
import { BookOpen, Users, BookCopy, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { reportsApi } from '../../api/reports.api';
import { StatCard } from '../../components/common/StatCard';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

export const StaffDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.getDashboard()
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Không thể tải dữ liệu dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-emerald-700 font-medium">Xin chào, Nhân viên! Đây là tổng quan hoạt động thư viện hôm nay.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng số Sách" value={stats?.totalBooks ?? 0} icon={BookOpen} color="indigo" />
        <StatCard title="Độc giả" value={stats?.totalReaders ?? 0} icon={Users} color="green" />
        <StatCard title="Đang mượn" value={stats?.activeBorrows ?? 0} icon={BookCopy} color="yellow" />
        <StatCard
          title="Tổng tiền phạt thu"
          value={formatCurrency(stats?.totalFineCollected ?? 0)}
          icon={DollarSign}
          color="red"
        />
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-700 mb-4">Lượt mượn sách theo tháng</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stats?.monthlyBorrows || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Lượt mượn" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
