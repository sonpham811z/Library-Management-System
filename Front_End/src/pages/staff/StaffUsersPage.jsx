import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { nguoidungApi } from '../../api/nguoidung.api';
import { nhomnguoidungApi } from '../../api/nhomnguoidung.api';
import { Table, Pagination } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Select } from '../../components/common/Input';
import toast from 'react-hot-toast';

const EMPTY_FORM = { tendangnhap: '', matkhau: '', manhom: '' };

const nhomColor = (tenNhom) => {
  const upper = (tenNhom || '').toUpperCase();
  if (upper === 'ADMIN') return 'bg-red-100 text-red-700';
  if (upper === 'STAFF') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-700';
};

export const StaffUsersPage = () => {
  const [users, setUsers]           = useState([]);
  const [nhoms, setNhoms]           = useState([]);
  const [readerNhoms, setReaderNhoms] = useState([]); // only non-admin/staff groups
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  // Load all groups once; filter out ADMIN and STAFF for the create form
  useEffect(() => {
    nhomnguoidungApi.getAll()
      .then(({ data }) => {
        const all = data.data || [];
        setNhoms(all);
        const allowed = all.filter(
          (n) => !['ADMIN', 'STAFF'].includes((n.tennhom || '').toUpperCase())
        );
        setReaderNhoms(allowed);
        if (allowed.length > 0) {
          setForm((f) => ({ ...f, manhom: allowed[0].manhom }));
        }
      })
      .catch(() => toast.error('Không thể tải danh sách nhóm'));
  }, []);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await nguoidungApi.getAll({ page, limit: 15 });
      setUsers(data.data || []);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch {
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setForm({ tendangnhap: '', matkhau: '', manhom: readerNhoms[0]?.manhom ?? '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.tendangnhap || !form.matkhau || !form.manhom) {
      toast.error('Tên đăng nhập, mật khẩu và nhóm là bắt buộc');
      return;
    }
    if (form.matkhau.length < 6) {
      toast.error('Mật khẩu cần ít nhất 6 ký tự');
      return;
    }
    setSaving(true);
    try {
      await nguoidungApi.create({
        tendangnhap: form.tendangnhap.trim(),
        matkhau: form.matkhau,
        manhom: +form.manhom,
      });
      toast.success('Tạo tài khoản thành công');
      setModal(false);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const getNhomName = (maNhom) =>
    nhoms.find((n) => n.manhom === maNhom)?.tennhom || `Nhóm ${maNhom}`;

  const columns = [
    {
      key: 'manguoidung',
      title: 'ID',
      render: (v) => <span className="text-xs text-gray-400 font-mono">#{v}</span>,
    },
    {
      key: 'tendangnhap',
      title: 'Tên đăng nhập',
      render: (v) => <span className="font-medium text-gray-800">{v}</span>,
    },
    {
      key: 'manhom',
      title: 'Nhóm',
      render: (v) => {
        const name = getNhomName(v);
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${nhomColor(name)}`}>
            {name}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Staff chỉ có thể tạo tài khoản nhóm <strong>READER</strong>.
        </p>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} /> Tạo tài khoản
        </Button>
      </div>

      <Table columns={columns} data={users} loading={loading} />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={fetchUsers}
      />

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Tạo tài khoản mới"
      >
        <div className="space-y-4">
          <Input
            label="Tên đăng nhập *"
            value={form.tendangnhap}
            onChange={(e) => setForm({ ...form, tendangnhap: e.target.value })}
            placeholder="Nhập tên đăng nhập"
          />
          <Input
            label="Mật khẩu *"
            type="password"
            value={form.matkhau}
            onChange={(e) => setForm({ ...form, matkhau: e.target.value })}
            placeholder="Tối thiểu 6 ký tự"
          />
          <Select
            label="Nhóm *"
            value={form.manhom}
            onChange={(e) => setForm({ ...form, manhom: e.target.value })}
          >
            {readerNhoms.length === 0 && <option value="">-- Không có nhóm hợp lệ --</option>}
            {readerNhoms.map((n) => (
              <option key={n.manhom} value={n.manhom}>{n.tennhom}</option>
            ))}
          </Select>
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Chỉ có thể tạo tài khoản nhóm READER. Để tạo ADMIN hoặc STAFF vui lòng liên hệ Admin.
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => setModal(false)}>Hủy</Button>
          <Button onClick={handleSave} loading={saving}>Tạo tài khoản</Button>
        </div>
      </Modal>
    </div>
  );
};
