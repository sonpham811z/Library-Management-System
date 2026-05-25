import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, BookOpen, RotateCcw, X, User } from 'lucide-react';
import { phieumuonApi } from '../../api/phieumuon.api';
import { phieutraApi } from '../../api/phieutra.api';
import { docgiaApi } from '../../api/docgia.api';
import { sachApi } from '../../api/sach.api';
import { thamsoApi } from '../../api/thamso.api';
import { AutocompleteInput } from '../../components/common/AutocompleteInput';
import { Table, Pagination } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatDate, formatCurrency } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

/* ─── Phiếu Mượn Tab ────────────────────────────────────────────────────── */
const PhieuMuonTab = () => {
  const { isAdminOrStaff } = useAuth();
  const [rows, setRows]             = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);

  // Reader search
  const [readerQuery, setReaderQuery]     = useState('');
  const [selectedReader, setSelectedReader] = useState(null); // { madocgia, hoten, email }

  // Book search
  const [bookQuery, setBookQuery] = useState('');
  const [sachList, setSachList]   = useState([]); // [{ masach, tentuasach, nhaxb, namxb, anhbia }]

  // Constraint from THAMSO
  const [maxBooks, setMaxBooks] = useState(5);

  const [saving, setSaving] = useState(false);

  /* Fetch borrow list */
  const fetchAll = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await phieumuonApi.getAll({ page, limit: 15 });
      setRows(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch { toast.error('Không thể tải phiếu mượn'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* Fetch SoSachMuonToiDa when modal opens */
  useEffect(() => {
    if (!modal) return;
    thamsoApi.getAll()
      .then(({ data }) => {
        const found = (data.data || []).find((p) => p.tenthamso === 'SoSachMuonToiDa');
        if (found) setMaxBooks(Number(found.giatri));
      })
      .catch(() => { /* use default 5 */ });
  }, [modal]);

  /* Reset form */
  const resetModal = () => {
    setReaderQuery('');
    setSelectedReader(null);
    setBookQuery('');
    setSachList([]);
  };

  /* Search functions */
  const searchReaders = async (q) => {
    const { data } = await docgiaApi.search(q);
    return data.data || [];
  };

  const searchBooks = async (q) => {
    const { data } = await sachApi.search(q);
    return data.data || [];
  };

  /* Add book to selection list */
  const addBook = (book) => {
    if (sachList.some((s) => s.masach === book.masach)) {
      toast.error(`Sách #${book.masach} đã có trong danh sách`);
      return;
    }
    if (sachList.length >= maxBooks) {
      toast.error(`Tối đa ${maxBooks} cuốn sách mỗi phiếu mượn`);
      return;
    }
    setSachList((prev) => [
      ...prev,
      {
        masach:     book.masach,
        tentuasach: book.tuasach?.tentuasach || `Sách #${book.masach}`,
        nhaxb:      book.nhaxb || '—',
        namxb:      book.namxb,
        anhbia:     book.tuasach?.anhbia || null,
      },
    ]);
    setBookQuery('');
  };

  const removeBook = (masach) => setSachList((prev) => prev.filter((s) => s.masach !== masach));

  /* Submit */
  const handleCreate = async () => {
    if (!selectedReader) { toast.error('Vui lòng chọn độc giả'); return; }
    if (sachList.length === 0) { toast.error('Vui lòng thêm ít nhất 1 cuốn sách'); return; }
    setSaving(true);
    try {
      await phieumuonApi.create({
        madocgia:   selectedReader.madocgia,
        masachlist: sachList.map((s) => s.masach),
      });
      toast.success('Lập phiếu mượn thành công');
      setModal(false);
      resetModal();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  /* Table columns */
  const columns = [
    { key: 'maphieumuon', title: 'Mã PM' },
    { key: 'madocgia',    title: 'Mã ĐG' },
    { key: 'docgia',      title: 'Độc giả', render: (v) => v?.hoten ?? '—' },
    { key: 'ngaymuon',    title: 'Ngày mượn', render: formatDate },
    {
      key: 'hantra', title: 'Hạn trả',
      render: (v) => (
        <span className={new Date(v) < new Date() ? 'text-red-600 font-medium' : ''}>
          {formatDate(v)}
        </span>
      ),
    },
    { key: 'ct_phieumuon', title: 'Số sách', render: (v) => Array.isArray(v) ? v.length : '—' },
  ];

  return (
    <>
      {isAdminOrStaff && (
        <div className="flex justify-end mb-3">
          <Button size="sm" onClick={() => setModal(true)}>
            <Plus size={15} /> Lập phiếu mượn
          </Button>
        </div>
      )}

      <Table columns={columns} data={rows} loading={loading} />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchAll} />

      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); resetModal(); }}
        title="Lập phiếu mượn sách"
        size="lg"
      >
        <div className="space-y-5">

          {/* ── Reader Search ── */}
          <div>
            <AutocompleteInput
              label="Tìm độc giả *"
              placeholder="Nhập tên, email hoặc mã độc giả..."
              value={readerQuery}
              onChange={setReaderQuery}
              onSearch={searchReaders}
              onSelect={(r) => {
                setSelectedReader(r);
                setReaderQuery(`#${r.madocgia} — ${r.hoten}`);
              }}
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
            {selectedReader && (
              <div className="mt-2 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                <User size={14} className="text-indigo-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-indigo-800 truncate">
                    #{selectedReader.madocgia} — {selectedReader.hoten}
                  </p>
                  {selectedReader.email && (
                    <p className="text-xs text-indigo-500">{selectedReader.email}</p>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedReader(null); setReaderQuery(''); }}
                  className="text-indigo-400 hover:text-indigo-600 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ── Book Search ── */}
          <div>
            <AutocompleteInput
              label={`Thêm sách (tối đa ${maxBooks} cuốn) *`}
              placeholder="Tìm theo tên sách, NXB hoặc mã sách..."
              value={bookQuery}
              onChange={setBookQuery}
              onSearch={searchBooks}
              onSelect={addBook}
              disabled={sachList.length >= maxBooks}
              renderItem={(b) => (
                <div className="flex items-center gap-2.5">
                  {b.tuasach?.anhbia ? (
                    <img
                      src={b.tuasach.anhbia}
                      alt=""
                      className="w-8 h-11 object-cover rounded border border-gray-200 flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-8 h-11 rounded border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={12} className="text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      <span className="text-indigo-600 font-mono">#{b.masach}</span> — {b.tuasach?.tentuasach || '—'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {b.nhaxb || 'Không rõ NXB'} · {b.namxb}
                    </p>
                  </div>
                </div>
              )}
            />
            {sachList.length >= maxBooks && (
              <p className="mt-1.5 text-xs text-amber-600">
                Đã đạt giới hạn {maxBooks} cuốn sách / phiếu mượn.
              </p>
            )}
          </div>

          {/* ── Selected Books Table ── */}
          {sachList.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Sách sẽ mượn ({sachList.length}/{maxBooks}):
              </p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">Sách</th>
                      <th className="px-3 py-2 text-left">NXB</th>
                      <th className="px-3 py-2 text-left">Năm XB</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sachList.map((s) => (
                      <tr key={s.masach} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {s.anhbia ? (
                              <img
                                src={s.anhbia}
                                alt=""
                                className="w-6 h-9 object-cover rounded border border-gray-200 flex-shrink-0"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : null}
                            <div>
                              <p className="font-medium text-gray-800 text-xs leading-tight">{s.tentuasach}</p>
                              <p className="text-xs text-gray-400 font-mono">#{s.masach}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{s.nhaxb}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{s.namxb}</td>
                        <td className="px-2 py-2 text-right">
                          <button
                            onClick={() => removeBook(s.masach)}
                            className="text-red-400 hover:text-red-600 p-0.5"
                          >
                            <X size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            Hệ thống sẽ tự kiểm tra: thẻ còn hạn, không có sách quá hạn, giới hạn số sách, và trạng thái từng cuốn.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => { setModal(false); resetModal(); }}>Hủy</Button>
          <Button onClick={handleCreate} loading={saving}>Tạo phiếu mượn</Button>
        </div>
      </Modal>
    </>
  );
};

/* ─── Phiếu Trả Tab ─────────────────────────────────────────────────────── */
const PhieuTraTab = () => {
  const { isAdminOrStaff } = useAuth();
  const [rows, setRows]             = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);

  // Reader search
  const [readerQuery, setReaderQuery]       = useState('');
  const [selectedReader, setSelectedReader] = useState(null);

  const [activeBooks, setActiveBooks]   = useState([]);
  const [selectedIds, setSelectedIds]   = useState([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [saving, setSaving]             = useState(false);

  const fetchAll = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await phieutraApi.getAll({ page, limit: 15 });
      setRows(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch { toast.error('Không thể tải phiếu trả'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const searchReaders = async (q) => {
    const { data } = await docgiaApi.search(q);
    return data.data || [];
  };

  const lookupActive = async () => {
    if (!selectedReader) { toast.error('Vui lòng chọn độc giả'); return; }
    setLoadingActive(true);
    setActiveBooks([]);
    setSelectedIds([]);
    try {
      const { data } = await phieumuonApi.getActive(selectedReader.madocgia);
      if (!data.data || data.data.length === 0) {
        toast('Độc giả không có sách đang mượn', { icon: 'ℹ️' });
      }
      setActiveBooks(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tìm thấy độc giả');
    } finally {
      setLoadingActive(false);
    }
  };

  const toggleSelect = (masach) => {
    setSelectedIds((prev) =>
      prev.includes(masach) ? prev.filter((x) => x !== masach) : [...prev, masach]
    );
  };

  const estimatedFine = activeBooks
    .filter((b) => selectedIds.includes(b.masach))
    .reduce((sum, b) => sum + (b.tienphat_est || 0), 0);

  const resetModal = () => {
    setReaderQuery('');
    setSelectedReader(null);
    setActiveBooks([]);
    setSelectedIds([]);
  };

  const handleCreate = async () => {
    if (saving) return;
    if (!selectedReader) { toast.error('Vui lòng chọn độc giả'); return; }
    if (selectedIds.length === 0) { toast.error('Chọn ít nhất 1 cuốn sách để trả'); return; }
    setSaving(true);
    try {
      const { data } = await phieutraApi.create({
        madocgia:   selectedReader.madocgia,
        masachlist: selectedIds,
      });
      const msg = data.data?.tong_tien_phat > 0
        ? `Trả sách thành công. Tiền phạt: ${formatCurrency(data.data.tong_tien_phat)}`
        : 'Trả sách thành công. Không có phạt.';
      toast.success(msg);
      setModal(false);
      resetModal();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'maphieutra',  title: 'Mã PT' },
    { key: 'madocgia',    title: 'Mã ĐG' },
    { key: 'docgia',      title: 'Độc giả', render: (v) => v?.hoten ?? '—' },
    { key: 'ngaytra',     title: 'Ngày trả', render: formatDate },
    {
      key: 'tienphatkynay', title: 'Tiền phạt',
      render: (v) => v > 0
        ? <span className="text-red-600 font-semibold">{formatCurrency(v)}</span>
        : <span className="text-green-600">0 đ</span>,
    },
    { key: 'ct_phieutra', title: 'Số sách', render: (v) => Array.isArray(v) ? v.length : '—' },
  ];

  return (
    <>
      {isAdminOrStaff && (
        <div className="flex justify-end mb-3">
          <Button size="sm" onClick={() => setModal(true)}>
            <RotateCcw size={15} /> Lập phiếu trả
          </Button>
        </div>
      )}

      <Table columns={columns} data={rows} loading={loading} />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchAll} />

      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); resetModal(); }}
        title="Lập phiếu trả sách"
        size="lg"
      >
        <div className="space-y-4">

          {/* ── Reader Search ── */}
          <div>
            <AutocompleteInput
              label="Tìm độc giả *"
              placeholder="Nhập tên, email hoặc mã độc giả..."
              value={readerQuery}
              onChange={setReaderQuery}
              onSearch={searchReaders}
              onSelect={(r) => {
                setSelectedReader(r);
                setReaderQuery(`#${r.madocgia} — ${r.hoten}`);
                setActiveBooks([]);
                setSelectedIds([]);
              }}
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
            {selectedReader && (
              <div className="mt-2 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                <User size={14} className="text-indigo-500 flex-shrink-0" />
                <p className="flex-1 text-sm font-medium text-indigo-800 truncate">
                  #{selectedReader.madocgia} — {selectedReader.hoten}
                </p>
                <Button size="sm" variant="secondary" onClick={lookupActive} loading={loadingActive}>
                  <Search size={13} /> Tra sách đang mượn
                </Button>
                <button
                  onClick={() => { setSelectedReader(null); setReaderQuery(''); setActiveBooks([]); setSelectedIds([]); }}
                  className="text-indigo-400 hover:text-indigo-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ── Active Books ── */}
          {activeBooks.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Chọn sách muốn trả ({selectedIds.length}/{activeBooks.length}):
              </p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {activeBooks.map((book) => {
                  const checked    = selectedIds.includes(book.masach);
                  const isOverdue  = book.is_overdue;
                  return (
                    <label
                      key={book.masach}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${
                        checked ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(book.masach)}
                        className="accent-indigo-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {book.tentuasach ?? `Sách #${book.masach}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Mã sách: {book.masach} · Hạn trả: {formatDate(book.hantra)}
                          {isOverdue && (
                            <span className="text-red-600 font-semibold">
                              {' '}— Trễ {book.songaytratre_est} ngày
                            </span>
                          )}
                        </p>
                      </div>
                      {isOverdue && (
                        <span className="text-xs text-red-600 font-semibold whitespace-nowrap">
                          +{formatCurrency(book.tienphat_est)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className={`p-3 rounded-lg border text-sm ${
              estimatedFine > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            }`}>
              <p className="font-medium">
                Dự kiến tiền phạt:{' '}
                <span className={`font-bold ${estimatedFine > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {estimatedFine > 0 ? formatCurrency(estimatedFine) : 'Không có phạt'}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                * Số tiền phạt chính xác được tính tại thời điểm xác nhận trả sách.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => { setModal(false); resetModal(); }}>Hủy</Button>
          <Button onClick={handleCreate} loading={saving} disabled={selectedIds.length === 0}>
            Xác nhận trả sách
          </Button>
        </div>
      </Modal>
    </>
  );
};

/* ─── BorrowsPage (tabbed) ───────────────────────────────────────────────── */
const TABS = [
  { key: 'muon', label: 'Phiếu Mượn', icon: BookOpen },
  { key: 'tra',  label: 'Phiếu Trả',  icon: RotateCcw },
];

export const BorrowsPage = () => {
  const [tab, setTab] = useState('muon');

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-0 border-b-2 border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-5 py-2 text-sm -mb-0.5 border-b-2 transition-colors ${
              tab === key
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 font-normal'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'muon' ? <PhieuMuonTab /> : <PhieuTraTab />}
    </div>
  );
};
