import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { tacgiaApi } from "../../api/tacgia.api";
import { Table, Pagination } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { Input } from "../../components/common/Input";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  tentacgia: "",
};

export const AuthorsPage = () => {
  const [authors, setAuthors] = useState([]);
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
  const [confirmModal, setConfirmModal] = useState({ open: false, target: null });

  const fetchAuthors = useCallback(async (page = 1) => {
    setLoading(true);

    try {
      const { data } = await tacgiaApi.getAll({
        page,
        limit: 15,
      });

      setAuthors(data.data || []);

      setPagination({
        page: data.pagination.page,
        totalPages: data.pagination.totalPages,
      });
    } catch {
      toast.error("Không thể tải danh sách tác giả");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  const openCreate = () => {
    setForm(EMPTY_FORM);

    setModal({
      open: true,
      mode: "create",
      data: null,
    });
  };

  const openEdit = (author) => {
    setForm({
      tentacgia: author.tentacgia,
    });

    setModal({
      open: true,
      mode: "edit",
      data: author,
    });
  };

  const handleSave = async () => {
    if (!form.tentacgia.trim()) {
      toast.error("Tên tác giả là bắt buộc");
      return;
    }

    setSaving(true);

    try {
      if (modal.mode === "create") {
        await tacgiaApi.create({
          tentacgia: form.tentacgia.trim(),
        });

        toast.success("Thêm tác giả thành công");
      } else {
        await tacgiaApi.update(modal.data.matacgia, {
          tentacgia: form.tentacgia.trim(),
        });

        toast.success("Cập nhật tác giả thành công");
      }

      setModal({ open: false });

      fetchAuthors(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (author) => {
    setConfirmModal({ open: true, target: author });
  };

  const confirmDelete = async () => {
    try {
      await tacgiaApi.remove(confirmModal.target.matacgia);
      toast.success("Đã xóa tác giả");
      setConfirmModal({ open: false, target: null });
      fetchAuthors(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const columns = [
    {
      key: "matacgia",
      title: "ID",
      render: (v) => (
        <span className="text-xs text-gray-400 font-mono">#{v}</span>
      ),
    },

    {
      key: "tentacgia",
      title: "Tên tác giả",
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
            title="Sửa"
          >
            <Edit2 size={14} />
          </button>

          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
            title="Xóa"
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
          Thêm tác giả
        </Button>
      </div>

      <Table columns={columns} data={authors} loading={loading} />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={fetchAuthors}
      />

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, target: null })}
        onConfirm={confirmDelete}
        title="Xóa tác giả"
        message={`Bạn có chắc muốn xóa tác giả "${confirmModal.target?.tentacgia}"?`}
        confirmLabel="Xóa"
      />

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.mode === "create" ? "Thêm tác giả" : "Cập nhật tác giả"}
      >
        <div className="space-y-4">
          <Input
            label="Tên tác giả *"
            value={form.tentacgia}
            onChange={(e) =>
              setForm({
                ...form,
                tentacgia: e.target.value,
              })
            }
            placeholder="Nhập tên tác giả"
          />
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => setModal({ open: false })}>
            Hủy
          </Button>

          <Button onClick={handleSave} loading={saving}>
            {modal.mode === "create" ? "Thêm tác giả" : "Lưu thay đổi"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
