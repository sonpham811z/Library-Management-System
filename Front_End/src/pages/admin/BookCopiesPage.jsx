/**
 * BookCopiesPage — Trang quản lý bản sao sách (SACH)
 * Tách riêng khỏi trang Tựa Sách (TUASACH) để dễ tra cứu, nhập & sửa từng bản in.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, BookOpen,
  Package, CheckCircle, Clock, AlertCircle,
} from 'lucide-react';
import { sachApi }    from '../../api/sach.api';
import { tuasachApi } from '../../api/tuasach.api';
import { Table, Pagination } from '../../components/common/Table';
import { Button }            from '../../components/common/Button';
import { Modal }             from '../../components/common/Modal';
import { Input }             from '../../components/common/Input';
import { AutocompleteInput } from '../../components/common/AutocompleteInput';
import { formatDate, formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

// ─── Trạng thái badge ─────────────────────────────────────────────────────────
const StatusBadge = ({ value }) => {
  const cfg = {
    'Có sẵn':      { cls: 'bg-green-100 text-green-700',  icon: CheckCircle },
    'Đã mượn':     { cls: 'bg-blue-100 text-blue-700',    icon: Clock },
    'Đang giữ chỗ':{ cls: 'bg-yellow-100 text-yellow-700',icon: AlertCircle },
  }[value] || { cls: 'bg-gray-100 text-gray-600', icon: Package };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>
      <Icon size={11} />
      {value || '—'}
    </span>
  );
};

// ─── Form trống ──────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  matuasach: '',
  namxb:    new Date().getFullYear(),
  nhaxb:    '',
  ngaynhap: new Date().toISOString().split('T')[0],
  trigia:   '',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const BookCopiesPage = () => {
  // ── Dữ liệu danh sách ──────────────────────────────────────────────────────
  const [copies, setCopies]         = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading]       = useState(true);

  // ── Bộ lọc ────────────────────────────────────────────────────────────────
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── Modal Thêm / Sửa ──────────────────────────────────────────────────────
  const [modal, setModal]   = useState({ open: false, mode: 'create', data: null });
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ── Autocomplete chọn tựa sách (chỉ dùng khi Thêm mới) ────────────────────
  const [titleQuery, setTitleQuery]       = useState('');
  const [selectedTitle, setSelectedTitle] = useState(null);

  // ─── Tải danh sách ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await sachApi.getAll({
        page,
        limit: 15,
        search:    search    || undefined,
        trangthai: statusFilter || undefined,
      });
      setCopies(data.data || []);
      setPagination({
        page:       data.pagination.page,
        totalPages: data.pagination.totalPages,
      });
    } catch {
      toast.error('Không thể tải danh sách bản sao sách');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Mở modal Thêm mới ─────────────────────────────────────────────────────
  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setTitleQuery('');
    setSelectedTitle(null);
    setModal({ open: true, mode: 'create', data: null });
  };

  // ─── Mở modal Sửa ──────────────────────────────────────────────────────────
  const openEdit = (row) => {
    setForm({
      matuasach: row.matuasach || '',
      namxb:     row.namxb    || new Date().getFullYear(),
      nhaxb:     row.nhaxb    || '',
      ngaynhap:  row.ngaynhap || new Date().toISOString().split('T')[0],
      trigia:    row.trigia   ?? '',
    });
    setTitleQuery(row.tuasach?.tentuasach || '');
    setSelectedTitle(row.tuasach
      ? { matuasach: row.matuasach, tentuasach: row.tuasach.tentuasach }
      : null
    );
    setModal({ open: true, mode: 'edit', data: row });
  };

  // ─── Tìm tựa sách trong Autocomplete ──────────────────────────────────────
  const searchTitles = async (q) => {
    const { data } = await tuasachApi.getAll({ search: q, limit: 10 });
    return data.data || [];
  };

  // ─── Lưu (Thêm / Sửa) ─────────────────────────────────────────────────────
  const handleSave = async () => {
    const maTuaSach = form.matuasach || selectedTitle?.matuasach;
    if (!maTuaSach && modal.mode === 'create') {
      toast.error('Vui lòng chọn tựa sách');
      return;
    }
    if (!form.namxb || !form.ngaynhap || form.trigia === '') {
      toast.error('Năm XB, ngày nhập và trị giá là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await sachApi.create({
          matuasach: +maTuaSach,
          namxb:     +form.namxb,
          nhaxb:     form.nhaxb || null,
          ngaynhap:  form.ngaynhap,
          trigia:    +form.trigia,
        });
        toast.success('Nhập bản sao sách thành công');
      } else {
        await sachApi.update(modal.data.masach, {
          namxb:    +form.namxb,
          nhaxb:    form.nhaxb || null,
          ngaynhap: form.ngaynhap,
          trigia:   +form.trigia,
        });
        toast.success('Cập nhật bản sao thành công');
      }
      setModal({ open: false });
      fetchAll(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  // ─── Xóa ──────────────────────────────────────────────────────────────────
  const handleDelete = async (row) => {
    if (!window.confirm(
      `Xóa bản sao #${row.masach}?\nSách: "${row.tuasach?.tentuasach || '?'}"\n\nLưu ý: không thể xóa bản sao đang được mượn.`
    )) return;
    try {
      await sachApi.remove(row.masach);
      toast.success('Đã xóa bản sao');
      fetchAll(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa bản sao');
    }
  };

  // ─── Cột bảng ─────────────────────────────────────────────────────────────
  const columns = [
    {
      key:   'masach',
      title: 'Mã',
      width: '72px',
      render: (v) => <span className="font-mono text-xs text-gray-400">#{v}</span>,
    },
    {
      key:   'tuasach',
      title: 'Tựa sách',
      render: (v, row) => (
        <div className="flex items-center gap-2.5">
          <img
            src={v?.anhbia || `https://placehold.co/32x46/e2e8f0/94a3b8?text=S`}
            alt=""
            className="w-8 h-11 object-cover rounded border border-gray-200 flex-shrink-0"
            onError={(e) => { e.target.src = `https://placehold.co/32x46/e2e8f0/94a3b8?text=S`; }}
          />
          <div className="min-w-0">
            <p className="font-medium text-gray-800 text-sm leading-tight line-clamp-2">
              {v?.tentuasach || '—'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              MTS #{row.matuasach}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'namxb',    title: 'Năm XB', width: '80px' },
    { key: 'nhaxb',    title: 'NXB',    render: (v) => v || <span className="text-gray-300">—</span> },
    { key: 'ngaynhap', title: 'Ngày nhập', render: (v) => formatDate(v) },
    { key: 'trigia',   title: 'Trị giá',   render: (v) => formatCurrency(v) },
    {
      key:   'trangthai',
      title: 'Trạng thái',
      render: (v) => <StatusBadge value={v} />,
    },
    {
      key:   'actions',
      title: '',
      width: '80px',
      render: (_, row) => (
        <div className="flex gap-1.5">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
            title="Sửa thông tin bản sao"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
            title="Xóa bản sao"
            disabled={row.trangthai !== 'Có sẵn'}
          >
            <Trash2 size={14} className={row.trangthai !== 'Có sẵn' ? 'opacity-30' : ''} />
          </button>
        </div>
      ),
    },
  ];

  // ─── Tổng quan nhanh ──────────────────────────────────────────────────────
  const stats = {
    total:     copies.length,
    available: copies.filter((c) => c.trangthai === 'Có sẵn').length,
    borrowed:  copies.filter((c) => c.trangthai === 'Đã mượn').length,
    held:      copies.filter((c) => c.trangthai === 'Đang giữ chỗ').length,
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Thống kê nhanh ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng bản sao', value: stats.total,     color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
          { label: 'Có sẵn',       value: stats.available, color: 'bg-green-50 text-green-700 border-green-200'   },
          { label: 'Đang mượn',    value: stats.borrowed,  color: 'bg-blue-50 text-blue-700 border-blue-200'      },
          { label: 'Đang giữ chỗ', value: stats.held,      color: 'bg-yellow-50 text-yellow-700 border-yellow-200'},
        ].map(({ label, value, color }) => (
          <div key={label} className={`border rounded-lg px-4 py-3 ${color}`}>
            <p className="text-xs font-medium opacity-75">{label}</p>
            <p className="text-2xl font-bold mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên sách hoặc mã bản sao..."
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
            <option value="Có sẵn">Có sẵn</option>
            <option value="Đã mượn">Đã mượn</option>
            <option value="Đang giữ chỗ">Đang giữ chỗ</option>
          </select>
        </div>
        <Button onClick={openCreate} size="sm" className="shrink-0">
          <Plus size={15} /> Nhập sách mới
        </Button>
      </div>

      {/* ── Bảng ── */}
      <Table columns={columns} data={copies} loading={loading} />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={fetchAll}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Thêm mới / Sửa bản sao
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={
          modal.mode === 'create'
            ? 'Nhập bản sao sách mới'
            : `Sửa bản sao #${modal.data?.masach}`
        }
        size="md"
      >
        <div className="space-y-4">

          {/* ── Chọn tựa sách (chỉ khi Thêm mới) ── */}
          {modal.mode === 'create' ? (
            <div>
              <AutocompleteInput
                label="Tựa sách *"
                placeholder="Nhập tên để tìm tựa sách..."
                value={titleQuery}
                onChange={setTitleQuery}
                onSearch={searchTitles}
                onSelect={(t) => {
                  setSelectedTitle(t);
                  setTitleQuery(t.tentuasach);
                  setForm((p) => ({ ...p, matuasach: t.matuasach }));
                }}
                renderItem={(t) => (
                  <div className="flex items-center gap-2.5">
                    <img
                      src={t.anhbia || `https://placehold.co/28x40/e2e8f0/94a3b8?text=S`}
                      alt=""
                      className="w-7 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
                      onError={(e) => { e.target.src = `https://placehold.co/28x40/e2e8f0/94a3b8?text=S`; }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.tentuasach}</p>
                      <p className="text-xs text-gray-400">
                        {t.theloai?.tentheloai || ''} · MTS #{t.matuasach}
                      </p>
                    </div>
                  </div>
                )}
              />
              {selectedTitle && (
                <div className="mt-1.5 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                  <BookOpen size={13} className="text-indigo-500 flex-shrink-0" />
                  <p className="text-sm text-indigo-800 font-medium flex-1 truncate">
                    {selectedTitle.tentuasach}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedTitle(null);
                      setTitleQuery('');
                      setForm((p) => ({ ...p, matuasach: '' }));
                    }}
                    className="text-indigo-400 hover:text-indigo-600"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Khi sửa: chỉ hiển thị tên sách, không đổi được tựa sách */
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex items-center gap-2">
              <BookOpen size={14} className="text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Tựa sách</p>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {modal.data?.tuasach?.tentuasach || '—'}
                </p>
              </div>
            </div>
          )}

          {/* ── Thông tin bản sao ── */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Năm xuất bản *"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={form.namxb}
              onChange={(e) => setForm((p) => ({ ...p, namxb: e.target.value }))}
              placeholder={String(new Date().getFullYear())}
            />
            <Input
              label="Nhà xuất bản"
              value={form.nhaxb}
              onChange={(e) => setForm((p) => ({ ...p, nhaxb: e.target.value }))}
              placeholder="NXB Giáo Dục, Kim Đồng..."
            />
            <Input
              label="Ngày nhập kho *"
              type="date"
              value={form.ngaynhap}
              onChange={(e) => setForm((p) => ({ ...p, ngaynhap: e.target.value }))}
            />
            <Input
              label="Trị giá (VNĐ) *"
              type="number"
              min="0"
              value={form.trigia}
              onChange={(e) => setForm((p) => ({ ...p, trigia: e.target.value }))}
              placeholder="85000"
            />
          </div>

          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            Trạng thái mặc định khi nhập: <strong>Có sẵn</strong>. Thay đổi trạng thái
            xảy ra tự động khi sách được mượn hoặc đặt chỗ.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => setModal({ open: false })}>
            Hủy
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {modal.mode === 'create' ? 'Nhập sách' : 'Lưu thay đổi'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
