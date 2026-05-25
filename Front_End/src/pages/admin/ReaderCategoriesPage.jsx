import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { loaidocgiaApi } from "../../api/loaidocgia.api";
import { Table, Pagination } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  tenloaidocgia: "",
};

export const ReaderCategoriesPage = () => {
  const [items, setItems] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState({
    open: false,
    mode: "create",
    data: null,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);

    try {
      const { data } = await loaidocgiaApi.getAll({
        page,
        limit: 15,
      });

      const result = data?.data || [];
      const count = data?.count || 0;

      setItems(result);

      setPagination({
        page,
        totalPages: Math.ceil(count / 15) || 1,
      });
    } catch {
      toast.error("Không thể tải loại độc giả");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({
      open: true,
      mode: "create",
      data: null,
    });
  };

  const openEdit = (item) => {
    setForm({
      tenloaidocgia: item.tenloaidocgia,
    });

    setModal({
      open: true,
      mode: "edit",
      data: item,
    });
  };

  const handleSave = async () => {
    if (!form.tenloaidocgia.trim()) {
      toast.error("Tên loại độc giả là bắt buộc");
      return;
    }

    setSaving(true);

    try {
      if (modal.mode === "create") {
        await loaidocgiaApi.create({
          tenloaidocgia: form.tenloaidocgia.trim(),
        });

        toast.success("Thêm loại độc giả thành công");
      } else {
        await loaidocgiaApi.update(modal.data.maloaidocgia, {
          tenloaidocgia: form.tenloaidocgia.trim(),
        });

        toast.success("Cập nhật loại độc giả thành công");
      }

      setModal({ open: false, mode: "create", data: null });
      fetchData(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa "${item.tenloaidocgia}" ?`)) return;

    try {
      await loaidocgiaApi.remove(item.maloaidocgia);

      toast.success("Đã xóa loại độc giả");
      fetchData(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa");
    }
  };

  const columns = [
    {
      key: "maloaidocgia",
      title: "ID",
      render: (v) => (
        <span className="text-xs text-gray-400 font-mono">#{v}</span>
      ),
    },
    {
      key: "tenloaidocgia",
      title: "Tên loại độc giả",
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
          Thêm loại độc giả
        </Button>
      </div>

      <Table columns={columns} data={items} loading={loading} />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={fetchData}
      />

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: "create", data: null })}
        title={
          modal.mode === "create"
            ? "Thêm loại độc giả"
            : "Cập nhật loại độc giả"
        }
      >
        <div className="space-y-4">
          <Input
            label="Tên loại độc giả *"
            value={form.tenloaidocgia}
            onChange={(e) =>
              setForm({ ...form, tenloaidocgia: e.target.value })
            }
            placeholder="Nhập tên loại độc giả"
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
            {modal.mode === "create" ? "Thêm" : "Lưu thay đổi"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
