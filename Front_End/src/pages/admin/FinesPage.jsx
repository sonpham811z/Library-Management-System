import { useEffect, useState, useCallback } from 'react';
import { DollarSign, User, X } from 'lucide-react';
import { phieuthuApi } from '../../api/phieuthu.api';
import { docgiaApi } from '../../api/docgia.api';
import { AutocompleteInput } from '../../components/common/AutocompleteInput';
import { Table, Pagination } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatDate, formatCurrency } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export const FinesPage = () => {
  const { isAdminOrStaff } = useAuth();
  const [rows, setRows]             = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);

  // Reader search state
  const [readerQuery, setReaderQuery]       = useState('');
  const [selectedReader, setSelectedReader] = useState(null); // { madocgia, hoten, email, tienno }
  const [loadingDebt, setLoadingDebt]       = useState(false);

  // Payment amount
  const [sotienthu, setSotienthu] = useState('');
  const [saving, setSaving]       = useState(false);

  const fetchAll = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await phieuthuApi.getAll({ page, limit: 15 });
      setRows(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch {
      toast.error('Không thể tải phiếu thu tiền phạt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* Load debt after reader is selected */
  const loadDebt = async (madocgia) => {
    setLoadingDebt(true);
    setSotienthu('');
    try {
      const { data } = await phieuthuApi.getDebt(madocgia);
      setSelectedReader((prev) => ({ ...prev, tienno: data.data.tienno }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải thông tin nợ');
      setSelectedReader(null);
      setReaderQuery('');
    } finally {
      setLoadingDebt(false);
    }
  };

  const handleSelectReader = (r) => {
    setSelectedReader({ madocgia: r.madocgia, hoten: r.hoten, email: r.email, tienno: null });
    setReaderQuery(`#${r.madocgia} — ${r.hoten}`);
    loadDebt(r.madocgia);
  };

  const clearReader = () => {
    setSelectedReader(null);
    setReaderQuery('');
    setSotienthu('');
  };

  const handleCollect = async () => {
    const amount = parseFloat(sotienthu);
    if (!amount || amount <= 0) { toast.error('Số tiền không hợp lệ'); return; }
    if (selectedReader?.tienno !== null && amount > selectedReader.tienno) {
      toast.error(`Số tiền vượt quá tổng nợ (${formatCurrency(selectedReader.tienno)})`);
      return;
    }
    setSaving(true);
    try {
      const { data } = await phieuthuApi.create({
        madocgia:  selectedReader.madocgia,
        sotienthu: amount,
      });
      toast.success(data.message || 'Thu tiền phạt thành công');
      setModal(false);
      resetModal();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const resetModal = () => {
    setReaderQuery('');
    setSelectedReader(null);
    setSotienthu('');
  };

  /* Derived */
  const isAmountValid = (() => {
    const amount = parseFloat(sotienthu);
    if (!amount || amount <= 0) return false;
    if (selectedReader?.tienno !== null && amount > selectedReader.tienno) return false;
    return true;
  })();

  const canCollect = selectedReader && selectedReader.tienno > 0 && isAmountValid;

  const columns = [
    { key: 'maphieuthu', title: 'Mã PT' },
    {
      key: 'docgia', title: 'Độc giả',
      render: (v, row) => (
        <div>
          <p className="font-medium text-sm">{v?.hoten ?? '—'}</p>
          <p className="text-xs text-gray-400">#{row.madocgia}</p>
        </div>
      ),
    },
    {
      key: 'sotienthu', title: 'Số tiền thu',
      render: (v) => <span className="font-semibold text-green-600">{formatCurrency(v)}</span>,
    },
    {
      key: 'conlai', title: 'Còn lại sau thu',
      render: (v) => (
        <span className={+v > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          {formatCurrency(v)}
        </span>
      ),
    },
    { key: 'ngaythu', title: 'Ngày thu', render: formatDate },
  ];

  return (
    <div className="space-y-4">
      {isAdminOrStaff && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setModal(true)}>
            <DollarSign size={15} /> Lập phiếu thu tiền
          </Button>
        </div>
      )}

      <Table columns={columns} data={rows} loading={loading} />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchAll} />

      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); resetModal(); }}
        title="Thu tiền phạt độc giả"
        size="md"
      >
        <div className="space-y-4">

          {/* ── Step 1: Reader autocomplete ── */}
          <div>
            <AutocompleteInput
              label="Tìm độc giả *"
              placeholder="Nhập tên, email hoặc mã độc giả..."
              value={readerQuery}
              onChange={setReaderQuery}
              onSearch={async (q) => {
                const { data } = await docgiaApi.search(q);
                return data.data || [];
              }}
              onSelect={handleSelectReader}
              renderItem={(r) => (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <User size={13} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      <span className="text-indigo-600 font-mono">#{r.madocgia}</span> — {r.hoten}
                    </p>
                    <p className="text-xs text-gray-400">{r.email || 'Không có email'}</p>
                  </div>
                </div>
              )}
            />
          </div>

          {/* ── Step 2: Debt summary ── */}
          {selectedReader && (
            <div className={`rounded-lg border p-4 transition-all ${
              loadingDebt ? 'bg-gray-50 border-gray-200' :
              selectedReader.tienno > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-800">{selectedReader.hoten}</p>
                  {selectedReader.email && (
                    <p className="text-xs text-gray-500">{selectedReader.email}</p>
                  )}
                </div>
                <button onClick={clearReader} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>

              {loadingDebt ? (
                <p className="text-sm text-gray-400 mt-2">Đang tải thông tin nợ...</p>
              ) : (
                <div className="mt-3">
                  <p className="text-sm">
                    Tổng nợ hiện tại:{' '}
                    <span className={`font-bold text-base ${
                      selectedReader.tienno > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(selectedReader.tienno)}
                    </span>
                  </p>
                  {selectedReader.tienno === 0 && (
                    <p className="text-xs text-green-600 mt-1">Độc giả không có khoản nợ nào.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Enter amount ── */}
          {selectedReader && !loadingDebt && selectedReader.tienno > 0 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Số tiền thu (VNĐ) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={selectedReader.tienno}
                  value={sotienthu}
                  onChange={(e) => setSotienthu(e.target.value)}
                  placeholder={`Tối đa ${formatCurrency(selectedReader.tienno)}`}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    sotienthu && !isAmountValid
                      ? 'border-red-300 focus:ring-red-400'
                      : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {sotienthu && !isAmountValid && (
                <p className="text-xs text-red-500">
                  Số tiền không hợp lệ (phải từ 1 đến {formatCurrency(selectedReader.tienno)})
                </p>
              )}
              {/* Quick-fill buttons */}
              <div className="flex gap-2 flex-wrap pt-1">
                {[25, 50, 100].map((pct) => {
                  const val = Math.floor(selectedReader.tienno * pct / 100);
                  if (val <= 0) return null;
                  return (
                    <button
                      key={pct}
                      onClick={() => setSotienthu(String(val))}
                      className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                    >
                      {pct}% ({formatCurrency(val)})
                    </button>
                  );
                })}
                <button
                  onClick={() => setSotienthu(String(selectedReader.tienno))}
                  className="text-xs px-2 py-1 border border-indigo-300 rounded hover:bg-indigo-50 text-indigo-600"
                >
                  Toàn bộ ({formatCurrency(selectedReader.tienno)})
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => { setModal(false); resetModal(); }}>Hủy</Button>
          <Button onClick={handleCollect} loading={saving} disabled={!canCollect}>
            Xác nhận thu tiền
          </Button>
        </div>
      </Modal>
    </div>
  );
};
