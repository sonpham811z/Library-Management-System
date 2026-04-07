import { useEffect, useState } from 'react';
import { BookOpen, Users, BookCopy, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { reportsApi } from '../../api/reports.api';
import { StatCard } from '../../components/common/StatCard';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const DashboardPage = () => {
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Monthly Borrows */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Lượt mượn sách theo tháng</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats?.monthlyBorrows || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Lượt mượn" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Tình trạng hệ thống</h3>
          <div className="space-y-4">
            {[
              { label: 'Tổng số sách', value: stats?.totalBooks, color: 'indigo' },
              { label: 'Tổng độc giả', value: stats?.totalReaders, color: 'green' },
              { label: 'Sách đang mượn', value: stats?.activeBorrows, color: 'yellow' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <span className={`font-bold text-${color}-600`}>{value ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
