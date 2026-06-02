import { useEffect, useState } from 'react';
import { BookOpen, Users, BookCopy, DollarSign, TrendingUp, Calendar, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { reportsApi } from '../../api/reports.api';
import { StatCard } from '../../components/common/StatCard';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getDaysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const TREND_TYPES = [
  { key: 'day',   label: 'Theo ngày' },
  { key: 'month', label: 'Theo tháng' },
  { key: 'year',  label: 'Theo năm' },
];

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showTrend, setShowTrend] = useState(false);
  const [trendType, setTrendType] = useState('month');
  const [trendFrom, setTrendFrom] = useState(getDaysAgoStr(29));
  const [trendTo, setTrendTo] = useState(getTodayStr());
  const [trendYear, setTrendYear] = useState(new Date().getFullYear());
  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    reportsApi.getDashboard()
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Không thể tải dữ liệu dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const fetchTrend = async ({ type = trendType, from = trendFrom, to = trendTo, year = trendYear } = {}) => {
    if (type === 'day' && from > to) {
      toast.error('Ngày bắt đầu không được sau ngày kết thúc');
      return;
    }
    setTrendLoading(true);
    try {
      const params = { type };
      if (type === 'day')   { params.from = from; params.to = to; }
      if (type === 'month') params.year = year;
      const { data } = await reportsApi.getBorrowTrend(params);
      setTrendData(data.data);
    } catch {
      toast.error('Không thể tải dữ liệu lượt mượn');
    } finally {
      setTrendLoading(false);
    }
  };

  const handleOpenTrend = () => {
    setShowTrend(true);
    fetchTrend();
  };

  const handleTypeChange = (type) => {
    setTrendType(type);
    fetchTrend({ type });
  };

  const handleYearChange = (year) => {
    setTrendYear(year);
    fetchTrend({ year });
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-700">Lượt mượn sách theo tháng</h3>
            <button
              onClick={handleOpenTrend}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <Calendar size={15} />
              Xem theo ngày / tháng / năm
            </button>
          </div>
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

      {/* Borrow Trend Modal */}
      {showTrend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowTrend(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600" />
                Lượt mượn theo thời gian
              </h2>
              <button onClick={() => setShowTrend(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Type Toggle */}
            <div className="flex gap-2 mb-4">
              {TREND_TYPES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleTypeChange(key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    trendType === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4 min-h-[38px]">
              {trendType === 'day' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Từ</label>
                    <input
                      type="date"
                      value={trendFrom}
                      onChange={(e) => setTrendFrom(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Đến</label>
                    <input
                      type="date"
                      value={trendTo}
                      onChange={(e) => setTrendTo(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <button
                    onClick={() => fetchTrend()}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Xem
                  </button>
                </>
              )}
              {trendType === 'month' && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Năm</label>
                  <select
                    value={trendYear}
                    onChange={(e) => handleYearChange(+e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
              {trendType === 'year' && (
                <p className="text-sm text-gray-500">Hiển thị toàn bộ các năm có dữ liệu</p>
              )}
            </div>

            {/* Total */}
            {trendData && !trendLoading && (
              <p className="text-sm text-gray-600 mb-3">
                Tổng: <span className="font-semibold text-indigo-600">{trendData.total}</span> lượt mượn
              </p>
            )}

            {/* Chart */}
            <div className="h-56">
              {trendLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : trendData?.chartData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData.chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, 'Lượt mượn']} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Lượt mượn" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Không có dữ liệu trong khoảng thời gian này
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
