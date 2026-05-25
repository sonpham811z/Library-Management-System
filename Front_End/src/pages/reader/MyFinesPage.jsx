import { useEffect, useState } from 'react';
import { docgiaApi } from '../../api/docgia.api';
import { phieuthutienphatApi } from '../../api/phieuthutienphat.api';
import { formatDate, formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

export const MyFinesPage = () => {
  const [docgia, setDocgia] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    docgiaApi.getMe()
      .then(async ({ data }) => {
        const dg = data.data;
        setDocgia(dg);
        // Load payment receipts for this reader
        try {
          const { data: ph } = await phieuthutienphatApi.getAll({ madocgia: dg.madocgia, limit: 50 });
          setReceipts(ph.data || []);
        } catch {
          // receipts not critical
        }
      })
      .catch(() => toast.error('Không thể tải thông tin tiền phạt'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  const totalDebt = Number(docgia?.tienno ?? 0);

  return (
    <div className="max-w-2xl space-y-4">
      {/* Total Debt */}
      <div className={`rounded-xl p-5 border ${totalDebt > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
        <p className="text-sm text-gray-600">Tổng tiền phạt chưa đóng</p>
        <p className={`text-3xl font-bold mt-1 ${totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(totalDebt)}
        </p>
        {totalDebt === 0 && <p className="text-sm text-green-600 mt-1">Bạn không có khoản nợ nào!</p>}
        {totalDebt > 0 && (
          <p className="text-sm text-red-500 mt-1">Vui lòng đến thư viện để thanh toán.</p>
        )}
      </div>

      {/* Payment receipts */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Lịch sử thu tiền phạt</h3>
        </div>
        {receipts.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Chưa có lịch sử thu tiền phạt</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {receipts.map((r) => (
              <div key={r.maphieuthu} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Phiếu thu #{r.maphieuthu}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ngày thu: {formatDate(r.ngaythu)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">−{formatCurrency(r.sotienthu)}</p>
                  <p className="text-xs text-gray-400">Còn lại: {formatCurrency(r.conlai)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
