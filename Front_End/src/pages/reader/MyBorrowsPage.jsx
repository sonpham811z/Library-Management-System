import { useEffect, useState, useCallback } from 'react';
import { phieumuonApi } from '../../api/phieumuon.api';
import { Table, Pagination } from '../../components/common/Table';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export const MyBorrowsPage = () => {
  const [borrows, setBorrows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchBorrows = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await phieumuonApi.getMy({ page, limit: 10 });
      const rows = Array.isArray(data?.data) ? data.data : [];
      const paginationData = data?.pagination || {};

      setBorrows(rows);
      setPagination({
        page: Number(paginationData.page || page),
        totalPages: Number(paginationData.totalPages || 1),
      });
    } catch (err) {
      const status = err.response?.status;
      const message = String(err.response?.data?.message || '').toLowerCase();

      if (status === 404 || message.includes('không có') || message.includes('khong co')) {
        setBorrows([]);
        setPagination({ page, totalPages: 1 });
        return;
      }

      toast.error('Không thể tải lịch sử mượn sách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBorrows(); }, [fetchBorrows]);

  useEffect(() => {
    const handleFocus = () => fetchBorrows();
    const intervalId = window.setInterval(fetchBorrows, 30000);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchBorrows]);

  const isOverdue = (hantra) => new Date(hantra) < new Date();

  const columns = [
    {
      key: 'maphieumuon',
      title: 'Mã phiếu',
      render: (v) => <span className="font-mono text-xs text-gray-400">#{v}</span>,
    },
    {
      key: 'ct_phieumuon',
      title: 'Sách đã mượn',
      render: (v) => {
        const books = v || [];
        if (!books.length) return '—';
        return (
          <div className="space-y-0.5">
            {books.map((ct) => (
              <p key={ct.masach} className="text-sm text-gray-700">
                {ct.sach?.tuasach?.tentuasach || `#${ct.masach}`}
              </p>
            ))}
          </div>
        );
      },
    },
    { key: 'ngaymuon', title: 'Ngày mượn', render: (v) => formatDate(v) },
    {
      key: 'hantra',
      title: 'Hạn trả',
      render: (v) => (
        <span className={isOverdue(v) ? 'text-red-600 font-semibold' : 'text-gray-700'}>
          {formatDate(v)}
        </span>
      ),
    },
    {
      key: 'trangthai',
      title: 'Trạng thái',
      render: (_, row) => {
        const state = row.trangthai || (isOverdue(row.hantra) ? 'Quá hạn' : 'Đang mượn');
        return (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            state === 'Đã trả'
              ? 'bg-green-100 text-green-700'
              : state === 'Quá hạn'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
          }`}>
            {state}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Table columns={columns} data={borrows} loading={loading} />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchBorrows} />
      {!loading && borrows.length === 0 && (
        <p className="text-center text-gray-400 py-8">Bạn chưa có lịch sử mượn sách nào</p>
      )}
    </div>
  );
};
