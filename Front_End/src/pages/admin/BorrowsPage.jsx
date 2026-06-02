/**
 * BorrowsPage — Quản lý Phiếu Mượn / Phiếu Trả
 *
 * Phiếu Mượn tab:
 *   • Danh sách phiếu mượn với phân trang
 *   • Lập phiếu mượn (tạo mới)
 *   • Xem chi tiết — hiển thị snapshot thông tin sách tại thời điểm mượn
 *   • Sửa hạn trả (chỉ thay đổi HanTra)
 *   • Xóa phiếu mượn (sẽ trả lại trạng thái sách)
 *
 * Phiếu Trả tab: giữ nguyên như cũ.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, BookOpen, RotateCcw, X, User,
  Eye, Edit2, Trash2, Calendar, AlertTriangle,
} from 'lucide-react';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { phieumuonApi } from '../../api/phieumuon.api';
import { phieutraApi }  from '../../api/phieutra.api';
import { docgiaApi }    from '../../api/docgia.api';
import { sachApi }      from '../../api/sach.api';
import { thamsoApi }    from '../../api/thamso.api';
import { AutocompleteInput } from '../../components/common/AutocompleteInput';
import { Table, Pagination } from '../../components/common/Table';
import { Button }            from '../../components/common/Button';
import { Modal }             from '../../components/common/Modal';
import { Input }             from '../../components/common/Input';
import { formatDate, formatCurrency } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// ─── Helper: trạng thái phiếu mượn ──────────────────────────────────────────
const slipStatus = (row) => {
  const books = row.ct_phieumuon || [];
  if (books.length === 0) return null;
  const allReturned = books.every(
    (b) => b.sach?.trangthai === 'Có sẵn' || b.sach?.trangthai === 'Đang giữ chỗ'
  );
  if (allReturned) return { label: 'Đã trả',    cls: 'bg-green-100 text-green-700' };
  if (new Date(row.hantra) < new Date())
               return { label: 'Quá hạn',   cls: 'bg-red-100 text-red-700' };
  return        { label: 'Đang mượn', cls: 'bg-blue-100 text-blue-700' };
};

/* ════════════════════════════════════════════════════════════════════════════
   PHIẾU MƯỢN TAB
════════════════════════════════════════════════════════════════════════════ */
const PhieuMuonTab = () => {
  const { isAdminOrStaff } = useAuth();

  // ── Danh sách ──────────────────────────────────────────────────────────────
  const [rows, setRows]             = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading]       = useState(true);

  // ── Bộ lọc ────────────────────────────────────────────────────────────────
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── Modal Lập phiếu ────────────────────────────────────────────────────────
  const [createModal, setCreateModal] = useState(false);
  const [readerQuery, setReaderQuery]     = useState('');
  const [selectedReader, setSelectedReader] = useState(null);
  const [bookQuery, setBookQuery] = useState('');
  const [sachList, setSachList]   = useState([]);
  const [maxBooks, setMaxBooks]   = useState(5);
  const [saving, setSaving]       = useState(false);

  // ── Modal Chi tiết ─────────────────────────────────────────────────────────
  const [detailModal, setDetailModal]   = useState({ open: false, data: null });
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── Modal Sửa hạn trả ──────────────────────────────────────────────────────
  const [editModal, setEditModal] = useState({ open: false, data: null, hantra: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Modal Xóa phiếu mượn ───────────────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState({ open: false, row: null });

  // ─── Tải danh sách ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await phieumuonApi.getAll({
        page, limit: 15,
        search:    search    || undefined,
        trangthai: statusFilter || undefined,
      });
      setRows(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch { toast.error('Không thể tải phiếu mượn'); }
    finally  { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Lấy SoSachMuonToiDa khi mở modal tạo
  useEffect(() => {
    if (!createModal) return;
    thamsoApi.getAll()
      .then(({ data }) => {
        const found = (data.data || []).find((p) => p.tenthamso === 'SoSachMuonToiDa');
        if (found) setMaxBooks(Number(found.giatri));
      })
      .catch(() => {});
  }, [createModal]);

  const resetCreateModal = () => {
    setReaderQuery('');
    setSelectedReader(null);
    setBookQuery('');
    setSachList([]);
  };

  // ─── Tìm kiếm độc giả / sách ──────────────────────────────────────────────
  const searchReaders = async (q) => {
    const { data } = await docgiaApi.search(q);
    return data.data || [];
  };

  const searchBooks = async (q) => {
    const { data } = await sachApi.search(q);
    return data.data || [];
  };

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

  // ─── Tạo phiếu mượn ───────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!selectedReader)     { toast.error('Vui lòng chọn độc giả'); return; }
    if (sachList.length === 0){ toast.error('Vui lòng thêm ít nhất 1 cuốn sách'); return; }
    setSaving(true);
    try {
      await phieumuonApi.create({
        madocgia:   selectedReader.madocgia,
        masachlist: sachList.map((s) => s.masach),
      });
      toast.success('Lập phiếu mượn thành công');
      setCreateModal(false);
      resetCreateModal();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  // ─── Xem chi tiết ─────────────────────────────────────────────────────────
  const openDetail = async (row) => {
    setDetailModal({ open: true, data: null });
    setLoadingDetail(true);
    try {
      const { data } = await phieumuonApi.getById(row.maphieumuon);
      setDetailModal({ open: true, data: data.data });
    } catch {
      toast.error('Không thể tải chi tiết phiếu mượn');
      setDetailModal({ open: false, data: null });
    } finally {
      setLoadingDetail(false);
    }
  };

  // ─── Mở modal sửa hạn trả ─────────────────────────────────────────────────
  const openEdit = (row) => {
    setEditModal({ open: true, data: row, hantra: row.hantra?.split('T')[0] || row.hantra || '' });
  };

  const handleEdit = async () => {
    if (!editModal.hantra) { toast.error('Vui lòng nhập hạn trả'); return; }
    setSavingEdit(true);
    try {
      await phieumuonApi.update(editModal.data.maphieumuon, { hantra: editModal.hantra });
      toast.success('Đã cập nhật hạn trả');
      setEditModal({ open: false });
      fetchAll(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── Xóa phiếu mượn ───────────────────────────────────────────────────────
  const handleDelete = (row) => {
    setConfirmModal({ open: true, row });
  };

  const confirmDelete = async () => {
    try {
      await phieumuonApi.remove(confirmModal.row.maphieumuon);
      toast.success('Đã xóa phiếu mượn');
      setConfirmModal({ open: false, row: null });
      fetchAll(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa phiếu mượn');
    }
  };

  // ─── Cột bảng ─────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'maphieumuon', title: 'Mã PM',
      render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span>,
    },
    { key: 'madocgia', title: 'Mã ĐG' },
    { key: 'docgia',   title: 'Độc giả', render: (v) => v?.hoten ?? '—' },
    { key: 'ngaymuon', title: 'Ngày mượn', render: formatDate },
    {
      key: 'hantra', title: 'Hạn trả',
      render: (v) => (
        <span className={new Date(v) < new Date() ? 'text-red-600 font-medium' : ''}>
          {formatDate(v)}
        </span>
      ),
    },
    {
      key: 'ct_phieumuon', title: 'Số sách',
      render: (v) => Array.isArray(v) ? v.length : '—',
    },
    {
      key: '_status', title: 'Trạng thái',
      render: (_, row) => {
        const s = slipStatus(row);
        return s ? (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
            {s.label}
          </span>
        ) : '—';
      },
    },
    {
      key: 'actions', title: '',
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={() => openDetail(row)}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Xem chi tiết">
            <Eye size={14} />
          </button>
          {isAdminOrStaff && (
            <>
              <button onClick={() => openEdit(row)}
                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Sửa hạn trả">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDelete(row)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Xóa phiếu">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên độc giả hoặc mã phiếu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Đang mượn">Đang mượn</option>
            <option value="Quá hạn">Quá hạn</option>
            <option value="Đã trả">Đã trả</option>
          </select>
        </div>
        {isAdminOrStaff && (
          <Button size="sm" onClick={() => setCreateModal(true)} className="shrink-0">
            <Plus size={15} /> Lập phiếu mượn
          </Button>
        )}
      </div>

      <Table columns={columns} data={rows} loading={loading} />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchAll} />

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, row: null })}
        onConfirm={confirmDelete}
        title="Xóa phiếu mượn"
        message={(() => {
          const row = confirmModal.row;
          if (!row) return '';
          const status = slipStatus(row);
          const warn = status?.label === 'Đang mượn' || status?.label === 'Quá hạn'
            ? '\n⚠️ Phiếu còn sách chưa trả — sách sẽ được đặt lại trạng thái "Có sẵn".'
            : '';
          return `Xóa phiếu mượn #${row.maphieumuon}?\nĐộc giả: ${row.docgia?.hoten || '—'}${warn}`;
        })()}
        confirmLabel="Xóa"
      />

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Lập phiếu mượn mới
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={createModal}
        onClose={() => { setCreateModal(false); resetCreateModal(); }}
        title="Lập phiếu mượn sách"
        size="lg"
      >
        <div className="space-y-5">
          {/* Tìm độc giả */}
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

          {/* Tìm sách */}
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
                    <img src={b.tuasach.anhbia} alt="" className="w-8 h-11 object-cover rounded border border-gray-200 flex-shrink-0" />
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

          {/* Danh sách sách đã chọn */}
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
                            {s.anhbia && (
                              <img src={s.anhbia} alt="" className="w-6 h-9 object-cover rounded border border-gray-200 flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-medium text-gray-800 text-xs leading-tight">{s.tentuasach}</p>
                              <p className="text-xs text-gray-400 font-mono">#{s.masach}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{s.nhaxb}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{s.namxb}</td>
                        <td className="px-2 py-2 text-right">
                          <button onClick={() => removeBook(s.masach)} className="text-red-400 hover:text-red-600 p-0.5">
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
          <Button variant="secondary" onClick={() => { setCreateModal(false); resetCreateModal(); }}>Hủy</Button>
          <Button onClick={handleCreate} loading={saving}>Tạo phiếu mượn</Button>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Chi tiết phiếu mượn (với Snapshot)
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, data: null })}
        title={`Chi tiết Phiếu Mượn${detailModal.data ? ` #${detailModal.data.maphieumuon}` : ''}`}
        size="lg"
      >
        {loadingDetail ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-7 w-7 rounded-full border-b-2 border-indigo-600" />
          </div>
        ) : detailModal.data ? (
          <DetailContent data={detailModal.data} />
        ) : null}
        <div className="flex justify-end mt-5">
          <Button variant="secondary" onClick={() => setDetailModal({ open: false, data: null })}>
            Đóng
          </Button>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Sửa hạn trả
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false })}
        title={`Sửa hạn trả — Phiếu #${editModal.data?.maphieumuon}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm">
            <p className="text-gray-500">Độc giả: <span className="font-medium text-gray-800">{editModal.data?.docgia?.hoten || '—'}</span></p>
            <p className="text-gray-500 mt-1">Ngày mượn: <span className="font-medium text-gray-800">{formatDate(editModal.data?.ngaymuon)}</span></p>
            <p className="text-gray-500 mt-1">Hạn trả hiện tại: <span className="font-medium text-red-600">{formatDate(editModal.data?.hantra)}</span></p>
          </div>
          <Input
            label="Hạn trả mới *"
            type="date"
            value={editModal.hantra}
            onChange={(e) => setEditModal((p) => ({ ...p, hantra: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
          />
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Thay đổi hạn trả không tạo lại phiếu — chỉ cập nhật ngày trên phiếu hiện tại.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => setEditModal({ open: false })}>Hủy</Button>
          <Button onClick={handleEdit} loading={savingEdit}>
            <Calendar size={14} /> Cập nhật hạn trả
          </Button>
        </div>
      </Modal>
    </>
  );
};

/* ─── Chi tiết phiếu mượn (Snapshot) ───────────────────────────────────────── */
const DetailContent = ({ data }) => {
  const status = slipStatus(data);
  const books  = data.ct_phieumuon || [];

  return (
    <div className="space-y-4">
      {/* Header thông tin */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1.5">
          <p className="text-gray-500">Mã phiếu mượn</p>
          <p className="font-bold text-gray-800 font-mono">#{data.maphieumuon}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1.5">
          <p className="text-gray-500">Trạng thái</p>
          {status ? (
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${status.cls}`}>
              {status.label}
            </span>
          ) : '—'}
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1.5">
          <p className="text-gray-500">Độc giả</p>
          <p className="font-medium text-gray-800">
            <span className="text-indigo-600 font-mono">#{data.madocgia}</span> {data.docgia?.hoten}
          </p>
          {data.docgia?.email && (
            <p className="text-xs text-gray-400">{data.docgia.email}</p>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1.5">
          <p className="text-gray-500">Ngày mượn / Hạn trả</p>
          <p className="font-medium text-gray-800">{formatDate(data.ngaymuon)}</p>
          <p className={`text-sm font-semibold ${new Date(data.hantra) < new Date() ? 'text-red-600' : 'text-gray-700'}`}>
            → {formatDate(data.hantra)}
          </p>
        </div>
      </div>

      {/* Danh sách sách — dùng snapshot */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Sách trong phiếu ({books.length} cuốn)
          <span className="ml-2 text-xs font-normal text-gray-400">
            — thông tin tại thời điểm mượn
          </span>
        </p>
        {books.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Không có sách nào</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
            {books.map((b) => {
              /* Ưu tiên snapshot, fallback sang join live */
              const title  = b.tentuasach_snapshot || b.sach?.tuasach?.tentuasach || `Sách #${b.masach}`;
              const anhBia = b.anhbia_snapshot      || b.sach?.tuasach?.anhbia     || null;
              const nhaxb  = b.nhaxb_snapshot       || b.sach?.nhaxb               || '—';
              const namxb  = b.namxb_snapshot       || b.sach?.namxb               || '—';
              const tt     = b.sach?.trangthai;
              return (
                <div key={b.masach} className="flex items-center gap-3 px-3 py-2.5">
                  <img
                    src={anhBia || `https://placehold.co/32x46/e2e8f0/94a3b8?text=S`}
                    alt=""
                    className="w-9 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                    onError={(e) => { e.target.src = `https://placehold.co/32x46/e2e8f0/94a3b8?text=S`; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {nhaxb} · {namxb} · Mã sách <span className="font-mono">#{b.masach}</span>
                    </p>
                  </div>
                  {tt && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
                      tt === 'Có sẵn' ? 'bg-green-100 text-green-700' :
                      tt === 'Đã mượn'? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {tt}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ghi chú snapshot */}
      <p className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
        🔒 Thông tin sách hiển thị là <strong>snapshot</strong> tại thời điểm lập phiếu mượn —
        không bị ảnh hưởng khi sách được chỉnh sửa sau đó.
      </p>
    </div>
  );
};


/* ════════════════════════════════════════════════════════════════════════════
   PHIẾU TRẢ TAB  (giữ nguyên logic cũ)
════════════════════════════════════════════════════════════════════════════ */
const PhieuTraTab = () => {
  const { isAdminOrStaff } = useAuth();
  const [rows, setRows]             = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);

  const [readerQuery, setReaderQuery]       = useState('');
  const [selectedReader, setSelectedReader] = useState(null);
  const [activeBooks, setActiveBooks]       = useState([]);
  const [selectedIds, setSelectedIds]       = useState([]);
  const [loadingActive, setLoadingActive]   = useState(false);
  const [saving, setSaving]                 = useState(false);

  // ── Modal chi tiết phiếu trả ───────────────────────────────────────────────
  const [detailModal, setDetailModal]     = useState({ open: false, data: null });
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const openDetail = async (row) => {
    setDetailModal({ open: true, data: null });
    setLoadingDetail(true);
    try {
      const { data } = await phieutraApi.getById(row.maphieutra);
      setDetailModal({ open: true, data: data.data });
    } catch {
      toast.error('Không thể tải chi tiết phiếu trả');
      setDetailModal({ open: false, data: null });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreate = async () => {
    if (saving) return;
    if (!selectedReader)          { toast.error('Vui lòng chọn độc giả'); return; }
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
    {
      key: 'maphieutra', title: 'Mã PT',
      render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span>,
    },
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
    {
      key: 'actions', title: '',
      render: (_, row) => (
        <button
          onClick={() => openDetail(row)}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
          title="Xem chi tiết phiếu trả"
        >
          <Eye size={14} />
        </button>
      ),
    },
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

          {activeBooks.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Chọn sách muốn trả ({selectedIds.length}/{activeBooks.length}):
              </p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {activeBooks.map((book) => {
                  const checked   = selectedIds.includes(book.masach);
                  const isOverdue = book.is_overdue;
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

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Chi tiết phiếu trả (với Snapshot)
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, data: null })}
        title={`Chi tiết Phiếu Trả${detailModal.data ? ` #${detailModal.data.maphieutra}` : ''}`}
        size="lg"
      >
        {loadingDetail ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-7 w-7 rounded-full border-b-2 border-indigo-600" />
          </div>
        ) : detailModal.data ? (
          <PhieuTraDetailContent data={detailModal.data} />
        ) : null}
        <div className="flex justify-end mt-5">
          <Button variant="secondary" onClick={() => setDetailModal({ open: false, data: null })}>
            Đóng
          </Button>
        </div>
      </Modal>
    </>
  );
};

/* ─── Chi tiết phiếu trả (Snapshot) ─────────────────────────────────────────── */
const PhieuTraDetailContent = ({ data }) => {
  const books = data.ct_phieutra || [];
  const hasOverdue = books.some((b) => (b.songaytratre ?? 0) > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1.5">
          <p className="text-gray-500">Mã phiếu trả</p>
          <p className="font-bold text-gray-800 font-mono">#{data.maphieutra}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1.5">
          <p className="text-gray-500">Ngày trả</p>
          <p className="font-semibold text-gray-800">{formatDate(data.ngaytra)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1.5">
          <p className="text-gray-500">Độc giả</p>
          <p className="font-medium text-gray-800">
            <span className="text-indigo-600 font-mono">#{data.madocgia}</span>{' '}
            {data.docgia?.hoten}
          </p>
          {data.docgia?.email && (
            <p className="text-xs text-gray-400">{data.docgia.email}</p>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1.5">
          <p className="text-gray-500">Tổng tiền phạt</p>
          {data.tienphatkynay > 0 ? (
            <p className="font-bold text-red-600 text-lg">{formatCurrency(data.tienphatkynay)}</p>
          ) : (
            <p className="font-semibold text-green-600">Không có phạt</p>
          )}
        </div>
      </div>

      {/* Danh sách sách trả — snapshot */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Sách đã trả ({books.length} cuốn)
          <span className="ml-2 text-xs font-normal text-gray-400">
            — thông tin tại thời điểm mượn
          </span>
        </p>
        {books.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Không có sách nào</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
            {books.map((b) => {
              const title = b.tentuasach_snapshot || b.sach?.tuasach?.tentuasach || `Sách #${b.masach}`;
              const anhBia = b.anhbia_snapshot    || b.sach?.tuasach?.anhbia     || null;
              const nhaxb  = b.nhaxb_snapshot     || b.sach?.nhaxb               || '—';
              const namxb  = b.namxb_snapshot     || b.sach?.namxb               || '—';
              const overdue = b.songaytratre ?? 0;
              const fine    = b.tienphat ?? 0;
              return (
                <div key={b.masach} className="flex items-center gap-3 px-3 py-2.5">
                  <img
                    src={anhBia || `https://placehold.co/32x46/e2e8f0/94a3b8?text=S`}
                    alt=""
                    className="w-9 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                    onError={(e) => { e.target.src = `https://placehold.co/32x46/e2e8f0/94a3b8?text=S`; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {nhaxb} · {namxb} · Mã sách <span className="font-mono">#{b.masach}</span>
                    </p>
                    {overdue > 0 && (
                      <p className="text-xs text-red-500 mt-0.5">Trễ {overdue} ngày</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {fine > 0 ? (
                      <span className="text-xs font-semibold text-red-600">{formatCurrency(fine)}</span>
                    ) : (
                      <span className="text-xs text-green-600">0 đ</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Snapshot note */}
      <p className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
        🔒 Thông tin sách hiển thị là <strong>snapshot</strong> tại thời điểm lập phiếu mượn —
        không bị ảnh hưởng khi sách được chỉnh sửa sau đó.
      </p>

      {hasOverdue && (
        <p className="text-xs bg-red-50 border border-red-100 text-red-700 rounded-lg px-3 py-2">
          ⚠️ Một hoặc nhiều cuốn sách được trả trễ hạn. Tiền phạt đã được ghi vào tài khoản độc giả.
        </p>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   BorrowsPage — Tab container
════════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'muon', label: 'Phiếu Mượn', icon: BookOpen },
  { key: 'tra',  label: 'Phiếu Trả',  icon: RotateCcw },
];

export const BorrowsPage = () => {
  const [tab, setTab] = useState('muon');

  return (
    <div className="space-y-4">
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
