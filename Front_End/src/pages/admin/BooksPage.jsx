import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, BookCopy, X, Upload, Download } from 'lucide-react';
import { tuasachApi } from '../../api/tuasach.api';
import { sachApi } from '../../api/sach.api';
import { theloaiApi } from '../../api/theloai.api';
import { tacgiaApi } from '../../api/tacgia.api';
import { Table, Pagination } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Input, Select } from '../../components/common/Input';
import { formatDate, formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

// ─── Empty form states ────────────────────────────────────────────────────────
const EMPTY_TUASACH = { tentuasach: '', matheloai: '', anhbia: '', matacgialist: [] };
const EMPTY_SACH    = { namxb: new Date().getFullYear(), nhaxb: '', ngaynhap: new Date().toISOString().split('T')[0], trigia: '' };

// ─── Sub-component: Author checkbox picker ───────────────────────────────────
const AuthorPicker = ({ tacgiaList, selected, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả</label>
    <div className="border border-gray-300 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1">
      {tacgiaList.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">Chưa có tác giả nào</p>
      )}
      {tacgiaList.map((tg) => (
        <label key={tg.matacgia} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
          <input
            type="checkbox"
            checked={selected.includes(tg.matacgia)}
            onChange={(e) => {
              if (e.target.checked) onChange([...selected, tg.matacgia]);
              else onChange(selected.filter((id) => id !== tg.matacgia));
            }}
            className="accent-indigo-600"
          />
          <span className="text-sm text-gray-700">{tg.tentacgia}</span>
        </label>
      ))}
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export const BooksPage = () => {
  // ── Lookup data ──────────────────────────────────────────────────────────
  const [theloaiList, setTheloaiList] = useState([]);
  const [tacgiaList,  setTacgiaList]  = useState([]);

  // ── TUASACH list state ────────────────────────────────────────────────────
  const [titles, setTitles]           = useState([]);
  const [pagination, setPagination]   = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [theloaiFilter, setTheloaiFilter] = useState('');

  // ── TUASACH modal ─────────────────────────────────────────────────────────
  const [titleModal, setTitleModal]   = useState({ open: false, mode: 'create', data: null });
  const [titleForm, setTitleForm]     = useState(EMPTY_TUASACH);
  const [savingTitle, setSavingTitle] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [savingAuthor, setSavingAuthor] = useState(false);

  // ── SACH copies modal ─────────────────────────────────────────────────────
  const [sachModal, setSachModal]     = useState({ open: false, tuasach: null });
  const [sachList,  setSachList]      = useState([]);
  const [loadingSach, setLoadingSach] = useState(false);

  // ── SACH add/edit modal ───────────────────────────────────────────────────
  const [sachForm, setSachForm]       = useState({ open: false, mode: 'create', data: null, form: EMPTY_SACH });
  const [savingSach, setSavingSach]   = useState(false);

  // ── Bulk import state ─────────────────────────────────────────────────────
  const [bulkPanel, setBulkPanel]     = useState(false);
  const [bulkFile, setBulkFile]       = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult]   = useState(null); // { insertedCount, skippedCount, errors[] }
  const fileInputRef                  = useRef(null);

  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, target: null });

  // ─── Load lookup data once ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([theloaiApi.getAll(), tacgiaApi.getAll()])
      .then(([tl, tg]) => {
        setTheloaiList(tl.data.data || []);
        setTacgiaList(tg.data.data || []);
      })
      .catch(() => toast.error('Không thể tải dữ liệu danh mục'));
  }, []);

  // ─── Fetch TUASACH list ────────────────────────────────────────────────────
  const fetchTitles = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await tuasachApi.getAll({
        page,
        limit: 12,
        search: search || undefined,
        matheloai: theloaiFilter || undefined,
      });
      setTitles(data.data || []);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch {
      toast.error('Không thể tải danh sách tựa sách');
    } finally {
      setLoading(false);
    }
  }, [search, theloaiFilter]);

  useEffect(() => { fetchTitles(); }, [fetchTitles]);

  // ─── TUASACH create / edit ─────────────────────────────────────────────────
  const openCreateTitle = () => {
    setTitleForm({ ...EMPTY_TUASACH, matheloai: theloaiList[0]?.matheloai ?? '' });
    setNewAuthorName('');
    setTitleModal({ open: true, mode: 'create', data: null });
  };

  const openEditTitle = async (row) => {
    // Fetch full record so we get the author list
    try {
      const { data } = await tuasachApi.getById(row.matuasach);
      const full = data.data;
      const authorIds = (full.ct_tacgia || []).map((ct) => ct.matacgia);
      setTitleForm({
        tentuasach:   full.tentuasach,
        matheloai:    full.matheloai,
        anhbia:       full.anhbia || '',
        matacgialist: authorIds,
      });
      setNewAuthorName('');
      setTitleModal({ open: true, mode: 'edit', data: full });
    } catch {
      toast.error('Không thể tải chi tiết tựa sách');
    }
  };

  const handleCreateAuthorInline = async () => {
    const name = newAuthorName.trim();
    if (!name) {
      toast.error('Nhập tên tác giả trước khi thêm');
      return;
    }

    setSavingAuthor(true);
    try {
      const { data } = await tacgiaApi.create({ tentacgia: name });
      const created = data.data;
      const nextList = [created, ...tacgiaList];
      setTacgiaList(nextList);

      setTitleForm((prev) => ({
        ...prev,
        matacgialist: prev.matacgialist.includes(created.matacgia)
          ? prev.matacgialist
          : [...prev.matacgialist, created.matacgia],
      }));
      setNewAuthorName('');
      toast.success('Đã thêm tác giả mới');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm tác giả');
    } finally {
      setSavingAuthor(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!titleForm.tentuasach?.trim()) { toast.error('Tên tựa sách là bắt buộc'); return; }
    if (!titleForm.matheloai)          { toast.error('Thể loại là bắt buộc');     return; }

    setSavingTitle(true);
    try {
      const payload = {
        tentuasach:   titleForm.tentuasach.trim(),
        matheloai:    +titleForm.matheloai,
        anhbia:       titleForm.anhbia || null,
        matacgialist: titleForm.matacgialist,
      };

      if (titleModal.mode === 'create') {
        await tuasachApi.create(payload);
        toast.success('Thêm tựa sách thành công');
      } else {
        await tuasachApi.update(titleModal.data.matuasach, payload);
        toast.success('Cập nhật tựa sách thành công');
      }
      setTitleModal({ open: false });
      fetchTitles(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSavingTitle(false);
    }
  };

  const handleDeleteTitle = (row) => {
    setConfirmModal({ open: true, type: 'title', target: row });
  };

  // ─── SACH copies management ────────────────────────────────────────────────
  const openSachModal = async (tuasach) => {
    setSachModal({ open: true, tuasach });
    setLoadingSach(true);
    try {
      const { data } = await sachApi.getAll({ matuasach: tuasach.matuasach, limit: 100 });
      setSachList(data.data || []);
    } catch {
      toast.error('Không thể tải danh sách bản sao');
    } finally {
      setLoadingSach(false);
    }
  };

  const openAddSach = () => {
    setSachForm({
      open: true,
      mode: 'create',
      data: null,
      form: { ...EMPTY_SACH },
    });
  };

  const openEditSach = (s) => {
    setSachForm({
      open: true,
      mode: 'edit',
      data: s,
      form: {
        namxb:    s.namxb,
        nhaxb:    s.nhaxb || '',
        ngaynhap: s.ngaynhap,
        trigia:  s.trigia,
      },
    });
  };

  const handleSaveSach = async () => {
    const { form, mode, data } = sachForm;
    if (!form.namxb || !form.ngaynhap || form.trigia === '') {
      toast.error('Năm XB, ngày nhập và trị giá là bắt buộc');
      return;
    }

    setSavingSach(true);
    try {
      if (mode === 'create') {
        await sachApi.create({
          matuasach: sachModal.tuasach.matuasach,
          namxb:     +form.namxb,
          nhaxb:     form.nhaxb || null,
          ngaynhap:  form.ngaynhap,
          trigia:   +form.trigia,
        });
        toast.success('Thêm bản sao thành công');
      } else {
        await sachApi.update(data.masach, {
          namxb:    +form.namxb,
          nhaxb:    form.nhaxb || null,
          ngaynhap: form.ngaynhap,
          trigia:  +form.trigia,
        });
        toast.success('Cập nhật bản sao thành công');
      }
      setSachForm((prev) => ({ ...prev, open: false }));
      // Refresh sach list
      const { data: refreshed } = await sachApi.getAll({ matuasach: sachModal.tuasach.matuasach, limit: 100 });
      setSachList(refreshed.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSavingSach(false);
    }
  };

  const handleDeleteSach = (s) => {
    setConfirmModal({ open: true, type: 'sach', target: s });
  };

  const confirmDelete = async () => {
    const { type, target } = confirmModal;
    try {
      if (type === 'title') {
        await tuasachApi.remove(target.matuasach);
        toast.success('Đã xóa tựa sách');
        setConfirmModal({ open: false, type: null, target: null });
        fetchTitles(pagination.page);
      } else {
        await sachApi.remove(target.masach);
        toast.success('Đã xóa bản sao');
        setConfirmModal({ open: false, type: null, target: null });
        setSachList((prev) => prev.filter((x) => x.masach !== target.masach));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa');
    }
  };

  const handleBulkImport = async () => {
    if (!bulkFile) { toast.error('Vui lòng chọn file Excel hoặc CSV'); return; }
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const { data } = await sachApi.bulkInsert(bulkFile);
      setBulkResult(data.data);
      toast.success(data.message || `Nhập thành công ${data.data.insertedCount} bản sao`);
      // Refresh list
      const { data: refreshed } = await sachApi.getAll({ matuasach: sachModal.tuasach.matuasach, limit: 100 });
      setSachList(refreshed.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Nhập thất bại');
    } finally {
      setBulkLoading(false);
    }
  };

  const openBulkPanel = () => {
    setBulkPanel(true);
    setBulkFile(null);
    setBulkResult(null);
    setSachForm((p) => ({ ...p, open: false }));
  };

  const closeBulkPanel = () => {
    setBulkPanel(false);
    setBulkFile(null);
    setBulkResult(null);
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getAuthorNames = (row) => {
    const authors = row.ct_tacgia || [];
    if (!authors.length) return '—';
    return authors.map((ct) => ct.tacgia?.tentacgia || '').filter(Boolean).join(', ');
  };

  // ─── TUASACH table columns ─────────────────────────────────────────────────
  const columns = [
    {
      key: 'anhbia',
      title: 'Bìa',
      width: '80px',
      render: (v, row) => (
        <img
          src={v || `https://placehold.co/40x56/e2e8f0/64748b?text=${encodeURIComponent(row.tentuasach?.[0] || 'S')}`}
          alt=""
          className="w-10 h-14 object-cover rounded border border-gray-200"
        />
      ),
    },
    {
      key: 'tentuasach',
      title: 'Tựa sách',
      render: (v, row) => (
        <div>
          <p className="font-medium text-gray-800">{v}</p>
          <p className="text-xs text-gray-500 mt-0.5">{getAuthorNames(row)}</p>
        </div>
      ),
    },
    {
      key: 'theloai',
      title: 'Thể loại',
      render: (v) => v ? (
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
          {v.tentheloai}
        </span>
      ) : '—',
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (_, row) => (
        <div className="flex gap-1.5">
          <button
            onClick={() => openSachModal(row)}
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
            title="Xem / Thêm bản sao"
          >
            <BookCopy size={14} />
          </button>
          <button
            onClick={() => openEditTitle(row)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
            title="Sửa tựa sách"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDeleteTitle(row)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
            title="Xóa tựa sách"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  // ─── SACH copies table columns ─────────────────────────────────────────────
  const sachColumns = [
    { key: 'masach', title: 'Mã sách', render: (v) => <span className="font-mono text-xs text-gray-400">#{v}</span> },
    { key: 'namxb',  title: 'Năm XB' },
    { key: 'nhaxb',  title: 'NXB', render: (v) => v || '—' },
    { key: 'ngaynhap', title: 'Ngày nhập', render: (v) => formatDate(v) },
    { key: 'trigia',  title: 'Trị giá', render: (v) => formatCurrency(v) },
    {
      key: 'trangthai',
      title: 'Trạng thái',
      render: (v) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          v === 'Có sẵn' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {v}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (_, row) => (
        <div className="flex gap-1.5">
          <button onClick={() => openEditSach(row)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded">
            <Edit2 size={13} />
          </button>
          <button onClick={() => handleDeleteSach(row)} className="p-1 text-red-500 hover:bg-red-50 rounded">
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tựa sách..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={theloaiFilter}
            onChange={(e) => setTheloaiFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả thể loại</option>
            {theloaiList.map((tl) => (
              <option key={tl.matheloai} value={tl.matheloai}>{tl.tentheloai}</option>
            ))}
          </select>
        </div>
        <Button onClick={openCreateTitle} size="sm">
          <Plus size={16} /> Thêm tựa sách
        </Button>
      </div>

      {/* ── TUASACH Table ── */}
      <Table columns={columns} data={titles} loading={loading} />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchTitles} />

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, type: null, target: null })}
        onConfirm={confirmDelete}
        title={confirmModal.type === 'title' ? 'Xóa tựa sách' : 'Xóa bản sao'}
        message={
          confirmModal.type === 'title'
            ? `Bạn có chắc muốn xóa tựa sách "${confirmModal.target?.tentuasach}"?`
            : `Bạn có chắc muốn xóa bản sao #${confirmModal.target?.masach}?`
        }
        confirmLabel="Xóa"
      />

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1: Create / Edit TUASACH
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={titleModal.open}
        onClose={() => setTitleModal({ open: false })}
        title={titleModal.mode === 'create' ? 'Thêm tựa sách mới' : 'Chỉnh sửa tựa sách'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Tên tựa sách *"
            value={titleForm.tentuasach}
            onChange={(e) => setTitleForm({ ...titleForm, tentuasach: e.target.value })}
            placeholder="Nhập tên sách..."
          />
          <Select
            label="Thể loại *"
            value={titleForm.matheloai}
            onChange={(e) => setTitleForm({ ...titleForm, matheloai: e.target.value })}
          >
            <option value="">-- Chọn thể loại --</option>
            {theloaiList.map((tl) => (
              <option key={tl.matheloai} value={tl.matheloai}>{tl.tentheloai}</option>
            ))}
          </Select>

          <AuthorPicker
            tacgiaList={tacgiaList}
            selected={titleForm.matacgialist}
            onChange={(ids) => setTitleForm({ ...titleForm, matacgialist: ids })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thêm tác giả mới</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAuthorName}
                onChange={(e) => setNewAuthorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateAuthorInline();
                  }
                }}
                placeholder="Nhập tên tác giả..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateAuthorInline}
                loading={savingAuthor}
                disabled={!newAuthorName.trim()}
              >
                <Plus size={14} /> Thêm
              </Button>
            </div>
          </div>

          <Input
            label="URL Ảnh bìa (AnhBia)"
            value={titleForm.anhbia}
            onChange={(e) => setTitleForm({ ...titleForm, anhbia: e.target.value })}
            placeholder="https://..."
          />
          {titleForm.anhbia && (
            <img
              src={titleForm.anhbia}
              alt="preview"
              className="h-20 w-14 object-cover rounded border border-gray-200"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => setTitleModal({ open: false })}>Hủy</Button>
          <Button onClick={handleSaveTitle} loading={savingTitle}>
            {titleModal.mode === 'create' ? 'Thêm tựa sách' : 'Lưu thay đổi'}
          </Button>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2: SACH copies list for a TUASACH
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={sachModal.open}
        onClose={() => setSachModal({ open: false, tuasach: null })}
        title={`Bản sao: ${sachModal.tuasach?.tentuasach || ''}`}
        size="xl"
      >
        <div className="space-y-3">
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={openBulkPanel}>
              <Upload size={15} /> Nhập hàng loạt
            </Button>
            <Button size="sm" onClick={openAddSach}>
              <Plus size={15} /> Thêm bản sao
            </Button>
          </div>

          {loadingSach ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 rounded-full border-b-2 border-indigo-600" />
            </div>
          ) : (
            <Table columns={sachColumns} data={sachList} loading={false} />
          )}

          {!loadingSach && sachList.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Chưa có bản sao nào. Nhấn "Thêm bản sao" để thêm.
            </p>
          )}
        </div>

        {/* ── Nested: Bulk Import panel ── */}
        {bulkPanel && (
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Nhập bản sao hàng loạt (Excel / CSV)</h3>
              <button onClick={closeBulkPanel} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-3">
              Các cột yêu cầu (không phân biệt hoa/thường):<br />
              <span className="font-mono font-medium">matuasach</span>,{' '}
              <span className="font-mono font-medium">namxb</span>,{' '}
              <span className="font-mono font-medium">ngaynhap</span>,{' '}
              <span className="font-mono font-medium">trigia</span>{' '}
              — tuỳ chọn: <span className="font-mono">nhaxb</span>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  setBulkFile(e.target.files[0] || null);
                  setBulkResult(null);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <Download size={15} />
                {bulkFile ? bulkFile.name : 'Chọn file .xlsx / .xls / .csv'}
              </button>
              <Button size="sm" onClick={handleBulkImport} loading={bulkLoading} disabled={!bulkFile}>
                <Upload size={15} /> Nhập
              </Button>
            </div>

            {/* Results */}
            {bulkResult && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-4 text-sm">
                  <span className="text-green-700 font-medium">
                    Thành công: {bulkResult.insertedCount}
                  </span>
                  {bulkResult.skippedCount > 0 && (
                    <span className="text-red-600 font-medium">
                      Bỏ qua: {bulkResult.skippedCount}
                    </span>
                  )}
                </div>
                {bulkResult.errors?.length > 0 && (
                  <div className="max-h-32 overflow-y-auto text-xs border border-red-200 rounded-lg bg-red-50 p-2 space-y-0.5">
                    {bulkResult.errors.map((e, i) => (
                      <p key={i} className="text-red-700">Dòng {e.row}: {e.reason}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Nested: Add / Edit SACH form ── */}
        {sachForm.open && (
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                {sachForm.mode === 'create' ? 'Thêm bản sao mới' : `Sửa bản sao #${sachForm.data?.masach}`}
              </h3>
              <button
                onClick={() => setSachForm((p) => ({ ...p, open: false }))}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Năm xuất bản *"
                type="number"
                value={sachForm.form.namxb}
                onChange={(e) => setSachForm((p) => ({ ...p, form: { ...p.form, namxb: e.target.value } }))}
              />
              <Input
                label="Nhà xuất bản"
                value={sachForm.form.nhaxb}
                onChange={(e) => setSachForm((p) => ({ ...p, form: { ...p.form, nhaxb: e.target.value } }))}
                placeholder="NXB Giáo Dục..."
              />
              <Input
                label="Ngày nhập *"
                type="date"
                value={sachForm.form.ngaynhap}
                onChange={(e) => setSachForm((p) => ({ ...p, form: { ...p.form, ngaynhap: e.target.value } }))}
              />
              <Input
                label="Trị giá (VNĐ) *"
                type="number"
                min="0"
                value={sachForm.form.trigia}
                onChange={(e) => setSachForm((p) => ({ ...p, form: { ...p.form, trigia: e.target.value } }))}
                placeholder="e.g. 85000"
              />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="secondary" size="sm" onClick={() => setSachForm((p) => ({ ...p, open: false }))}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleSaveSach} loading={savingSach}>
                {sachForm.mode === 'create' ? 'Thêm bản sao' : 'Lưu'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
