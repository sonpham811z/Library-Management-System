import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { theloaiApi } from "../../api/theloai.api";
import { Table, Pagination } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import toast from "react-hot-toast";

const EMPTY_FORM = { tentheloai: "" };

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
  });

  const [modal, setModal] = useState({
    open: false,
    mode: "create",
    data: null,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async (page = 1) => {
    setLoading(true);

    try {
      const { data } = await theloaiApi.getAll({
        page,
        limit: 15,
      });

      setCategories(data.data || []);

      setPagination({
        page: data.pagination?.page || 1,
        totalPages: data.pagination?.totalPages || 1,
      });
    } catch {
      toast.error("Không thể tải danh sách thể loại");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(1);
  }, [fetchCategories]);

  const handlePageChange = (page) => {
    fetchCategories(page);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ open: true, mode: "create", data: null });
  };

  const openEdit = (category) => {
    setForm({ tentheloai: category.tentheloai });
    setModal({ open: true, mode: "edit", data: category });
  };

  const handleSave = async () => {
    if (!form.tentheloai.trim()) {
      toast.error("Tên thể loại là bắt buộc");
      return;
    }

    setSaving(true);

    try {
      if (modal.mode === "create") {
        await theloaiApi.create({
          tentheloai: form.tentheloai.trim(),
        });
        toast.success("Thêm thể loại thành công");
      } else {
        await theloaiApi.update(modal.data.matheloai, {
          tentheloai: form.tentheloai.trim(),
        });
        toast.success("Cập nhật thể loại thành công");
      }

      setModal({ open: false, mode: "create", data: null });
      fetchCategories(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Xóa thể loại "${category.tentheloai}" ?`)) return;

    try {
      await theloaiApi.remove(category.matheloai);
      toast.success("Đã xóa thể loại");
      fetchCategories(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const columns = [
    {
      key: "matheloai",
      title: "ID",
      render: (v) => (
        <span className="text-xs text-gray-400 font-mono">#{v}</span>
      ),
    },
    {
      key: "tentheloai",
      title: "Tên thể loại",
      render: (v) => <span className="font-medium text-gray-800">{v}</span>,
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
          >
            <Edit2 size={14} />
          </button>

          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus size={16} />
          Thêm thể loại
        </Button>
      </div>

      <Table columns={columns} data={categories} loading={loading} />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: "create", data: null })}
        title={modal.mode === "create" ? "Thêm thể loại" : "Cập nhật thể loại"}
      >
        <div className="space-y-4">
          <Input
            label="Tên thể loại *"
            value={form.tentheloai}
            onChange={(e) => setForm({ ...form, tentheloai: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <Button
            variant="secondary"
            onClick={() =>
              setModal({ open: false, mode: "create", data: null })
            }
          >
            Hủy
          </Button>

          <Button onClick={handleSave} loading={saving}>
            {modal.mode === "create" ? "Thêm" : "Lưu"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
