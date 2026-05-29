import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  BookOpen,
  FileText,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  DollarSign,
  Trash,
} from "lucide-react";
import { sachApi } from "../../api/sach.api";
import { tuasachApi } from "../../api/tuasach.api";
import { phieunhapApi } from "../../api/phieunhap.api";
import { Table, Pagination } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { AutocompleteInput } from "../../components/common/AutocompleteInput";
import { formatDate, formatCurrency } from "../../utils/format";
import toast from "react-hot-toast";

function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const StatusBadge = ({ value }) => {
  const cfg = {
    "Có sẵn": { cls: "bg-green-100 text-green-700", icon: CheckCircle },
    "Đã mượn": { cls: "bg-blue-100 text-blue-700", icon: Clock },
    "Đang giữ chỗ": { cls: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  }[value] || { cls: "bg-gray-100 text-gray-600", icon: Package };
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}
    >
      <Icon size={11} /> {value || "—"}
    </span>
  );
};

// ─── TAB 1: BẢN SAO SÁCH ───────────────────────────────────────────────────
const BanSaoSachTab = ({ onOpenImport }) => {
  const [copies, setCopies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const debouncedSearch = useDebounce(search, 400);

  const fetchAll = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const { data } = await sachApi.getAll({
          page,
          limit: 15,
          search: debouncedSearch || undefined,
          trangthai: statusFilter || undefined,
        });
        setCopies(data.data || []);
        setPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
        });
      } catch {
        toast.error("Không thể tải danh sách bản sao sách");
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, statusFilter],
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Xóa bản sao #${row.masach}?`)) return;
    try {
      await sachApi.remove(row.masach);
      toast.success("Đã xóa bản sao thành công");
      fetchAll(pagination.page);
    } catch {
      toast.error("Lỗi khi xóa bản in sách");
    }
  };

  const columns = [
    {
      key: "masach",
      title: "Mã",
      width: "72px",
      render: (v) => (
        <span className="font-mono text-xs text-gray-400">#{v}</span>
      ),
    },
    {
      key: "tuasach",
      title: "Tựa sách",
      render: (v, row) => (
        <div className="flex items-center gap-2.5">
          <img
            src={v?.anhbia || `https://placehold.co/32x46`}
            alt=""
            className="w-8 h-11 object-cover rounded border"
          />
          <div className="min-w-0">
            <p className="font-medium text-gray-800 text-sm leading-tight line-clamp-2">
              {v?.tentuasach || "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              MTS #{row.matuasach}
            </p>
          </div>
        </div>
      ),
    },
    { key: "namxb", title: "Năm XB", width: "80px" },
    {
      key: "nhaxb",
      title: "NXB",
      render: (v) => v || <span className="text-gray-300">—</span>,
    },
    { key: "ngaynhap", title: "Ngày nhập", render: (v) => formatDate(v) },
    { key: "trigia", title: "Trị giá", render: (v) => formatCurrency(v) },
    {
      key: "trangthai",
      title: "Trạng thái",
      render: (v) => <StatusBadge value={v} />,
    },
    {
      key: "actions",
      title: "",
      width: "50px",
      render: (_, row) => (
        <button
          onClick={() => handleDelete(row)}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
          disabled={row.trangthai !== "Có sẵn"}
        >
          <Trash2
            size={14}
            className={row.trangthai !== "Có sẵn" ? "opacity-20" : ""}
          />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm sách nhanh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-full border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        <Button onClick={onOpenImport} size="sm">
          <Plus size={15} /> Nhập bản sao
        </Button>
      </div>
      <Table columns={columns} data={copies} loading={loading} />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={fetchAll}
      />
    </div>
  );
};

// ─── TAB 2: NHẬT KÝ PHIẾU NHẬP ─────────────────────────────────────────────
const PhieuNhapTab = ({ triggerReload, setTriggerReload }) => {
  const [bills, setBills] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState({ open: false, data: null });

  const fetchBills = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await phieunhapApi.getAll({ page, limit: 15 });
      setBills(data.data || []);
      setPagination({
        page: data.pagination.page,
        totalPages: data.pagination.totalPages,
      });
    } catch {
      toast.error("Lỗi hệ thống khi tải danh sách phiếu nhập");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
    if (triggerReload) setTriggerReload(false);
  }, [fetchBills, triggerReload, setTriggerReload]);

  const openDetail = async (id) => {
    try {
      const { data } = await phieunhapApi.getById(id);
      setDetailModal({ open: true, data: data.data });
    } catch {
      toast.error("Không tìm thấy dữ liệu chi tiết chứng từ");
    }
  };

  const columns = [
    {
      key: "maphieunhap",
      title: "Mã Phiếu",
      render: (v) => (
        <span className="font-mono text-xs text-indigo-600 font-bold">
          #{v}
        </span>
      ),
    },
    { key: "ngaynhap", title: "Ngày nhập", render: formatDate },
    {
      key: "tongtien",
      title: "Tổng giá trị đơn nhập",
      render: (v) => (
        <span className="font-bold text-gray-800">{formatCurrency(v)}</span>
      ),
    },
    {
      key: "actions",
      title: "",
      width: "60px",
      render: (_, row) => (
        <button
          onClick={() => openDetail(row.maphieunhap)}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
        >
          <Eye size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Table columns={columns} data={bills} loading={loading} />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={fetchBills}
      />

      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, data: null })}
        title={`Biểu mẫu chi tiết đơn nhập kho #${detailModal.data?.maphieunhap}`}
        size="lg"
      >
        {detailModal.data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 bg-slate-50 p-3 rounded-lg text-xs gap-2">
              <p className="text-gray-500">
                Ngày nhập:{" "}
                <span className="font-medium text-gray-800">
                  {formatDate(detailModal.data.ngaynhap)}
                </span>
              </p>
              <p className="text-gray-500 text-right">
                Tổng thanh toán:{" "}
                <span className="font-bold text-indigo-600 text-sm">
                  {formatCurrency(detailModal.data.tongtien)}
                </span>
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-gray-600 uppercase font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      Bản in sách (Dữ liệu đóng băng)
                    </th>
                    <th className="px-3 py-2 text-right">Giá nhập snapshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(detailModal.data.chitietphieunhap || []).map((b, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 flex items-center gap-2">
                        <img
                          src={
                            b.anhbia_snapshot || "https://placehold.co/24x36"
                          }
                          alt=""
                          className="w-6 h-9 object-cover rounded"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">
                            {b.tentuasach_snapshot}
                          </p>
                          <p className="text-gray-400">
                            NXB: {b.nhaxb_snapshot || "—"} · Năm XB:{" "}
                            {b.namxb_snapshot} · Mã cuốn: #{b.masach}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium text-gray-700">
                        {formatCurrency(b.dongia)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex justify-end mt-4">
          <Button
            variant="secondary"
            onClick={() => setDetailModal({ open: false, data: null })}
          >
            Đóng
          </Button>
        </div>
      </Modal>
    </div>
  );
};

// ─── MAIN COMPONENT CONTAINER ──────────────────────────────────────────────
export const BookCopiesPage = () => {
  const [activeTab, setActiveTab] = useState("copies");
  const [importModal, setImportModal] = useState(false);
  const [reloadBills, setReloadBills] = useState(false);

  const [importItems, setImportItems] = useState([]);
  const [titleQuery, setTitleQuery] = useState("");
  const [selectedTitle, setSelectedTitle] = useState(null);

  const [rowForm, setRowForm] = useState({
    namxb: new Date().getFullYear(),
    nhaxb: "",
    trigia: "",
    soluong: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchTitles = async (q) => {
    const { data } = await tuasachApi.getAll({ search: q, limit: 10 });
    return data.data || [];
  };

  const handleAddRowItem = () => {
    if (!selectedTitle) {
      toast.error("Vui lòng chọn tựa sách!");
      return;
    }
    if (!rowForm.namxb || !rowForm.trigia || !rowForm.soluong) {
      toast.error("Vui lòng điền đủ thông tin!");
      return;
    }
    if (Number(rowForm.trigia) <= 0 || Number(rowForm.soluong) <= 0) {
      toast.error("Giá và số lượng phải lớn hơn 0!");
      return;
    }

    const existingIndex = importItems.findIndex(
      (x) =>
        x.matuasach === selectedTitle.matuasach && +x.namxb === +rowForm.namxb,
    );

    if (existingIndex > -1) {
      const updated = [...importItems];
      updated[existingIndex].soluong += Number(rowForm.soluong);
      setImportItems(updated);
    } else {
      setImportItems((prev) => [
        ...prev,
        {
          matuasach: selectedTitle.matuasach,
          tentuasach: selectedTitle.tentuasach,
          anhbia: selectedTitle.anhbia,
          namxb: +rowForm.namxb,
          nhaxb: rowForm.nhaxb || "Không rõ NXB",
          trigia: +rowForm.trigia,
          soluong: +rowForm.soluong,
        },
      ]);
    }

    setSelectedTitle(null);
    setTitleQuery("");
    setRowForm({
      namxb: new Date().getFullYear(),
      nhaxb: "",
      trigia: "",
      soluong: 1,
    });
    toast.success("Đã thêm dòng sách vào danh sách chờ.");
  };

  const handleRemoveRowItem = (idx) => {
    setImportItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─── ĐIỀU PHỐI FLOW NHẬP SÁCH CHUẨN TẠI FRONTEND ───────────────────────────
  const handleSaveWholeInvoice = async () => {
    if (importItems.length === 0) {
      toast.error("Danh sách chờ nhập rỗng!");
      return;
    }

    setIsSubmitting(true);
    const today = new Date().toISOString().split("T")[0];
    let createdBooks = []; // Mảng backup cứu hộ xóa rác nếu lỗi giữa chừng
    let pNhapRes = null;

    try {
      // BƯỚC 1: Gọi API tạo Phiếu Nhập trước với tổng tiền tạm tính = 0
      const { data: resPN } = await phieunhapApi.create({
        ngaynhap: today,
        tongtien: 0,
      });
      pNhapRes = resPN.data;

      const detailsPayload = [];
      let calculatedTotal = 0;

      // BƯỚC 2: Chạy vòng lặp điều phối tạo từng cuốn sách vật lý (Bản sao sách)
      for (const item of importItems) {
        calculatedTotal += item.trigia * item.soluong;

        for (let i = 0; i < item.soluong; i++) {
          // Gọi API tạo sách lẻ có sẵn của bạn
          const { data: resSach } = await sachApi.create({
            matuasach: item.matuasach,
            namxb: item.namxb,
            nhaxb: item.nhaxb,
            ngaynhap: today,
            trigia: item.trigia,
          });

          const bookData = resSach.data;
          createdBooks.push(bookData.masach);

          // Đóng gói mảng dữ liệu snapshot chi tiết từng cuốn lẻ
          detailsPayload.push({
            masach: bookData.masach,
            dongia: item.trigia,
            tentuasach_snapshot: item.tentuasach,
            anhbia_snapshot: item.anhbia,
            nhaxb_snapshot: item.nhaxb,
            namxb_snapshot: item.namxb,
          });
        }
      }

      // BƯỚC 3: Đẩy toàn bộ danh sách snapshot chi tiết cùng tổng tiền cuối cùng lên Server
      await phieunhapApi.saveDetails(pNhapRes.maphieunhap, {
        details: detailsPayload,
        tongtien: calculatedTotal,
      });

      toast.success(
        "Đã khởi tạo bản sao sách và lưu chứng từ nhập kho thành công!",
      );
      setImportItems([]);
      setImportModal(false);
      setReloadBills(true);
      setActiveTab("bills");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Lỗi quy trình đồng bộ hóa đơn kho",
      );

      // ROLLBACK TẠI FRONTEND: Nếu lỗi, dọn sạch sách rác vừa tạo ra để tránh rác DB
      if (createdBooks.length > 0) {
        await Promise.all(createdBooks.map((id) => sachApi.remove(id)));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalInvoiceCost = () => {
    return importItems.reduce(
      (sum, item) => sum + item.trigia * item.soluong,
      0,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-0 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab("copies")}
          className={`flex items-center gap-1.5 px-5 py-2 text-sm -mb-0.5 border-b-2 transition-colors ${activeTab === "copies" ? "border-indigo-600 text-indigo-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <Package size={15} /> Bản sao Sách
        </button>
        <button
          onClick={() => setActiveTab("bills")}
          className={`flex items-center gap-1.5 px-5 py-2 text-sm -mb-0.5 border-b-2 transition-colors ${activeTab === "bills" ? "border-indigo-600 text-indigo-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <FileText size={15} /> Phiếu nhập sách
        </button>
      </div>

      {activeTab === "copies" ? (
        <BanSaoSachTab onOpenImport={() => setImportModal(true)} />
      ) : (
        <PhieuNhapTab
          triggerReload={reloadBills}
          setTriggerReload={setReloadBills}
        />
      )}

      <Modal
        isOpen={importModal}
        onClose={() => setImportModal(false)}
        title="Lập chứng từ nhập kho đợt hàng mới"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 space-y-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Khai báo thông tin dòng sách mới
            </p>
            <div>
              <AutocompleteInput
                placeholder="Gõ tên để tra cứu tựa sách hệ thống..."
                value={titleQuery}
                onChange={setTitleQuery}
                onSearch={searchTitles}
                onSelect={(t) => {
                  setSelectedTitle(t);
                  setTitleQuery(t.tentuasach);
                }}
                renderItem={(t) => (
                  <div className="flex items-center gap-2 text-xs">
                    <img
                      src={t.anhbia || "https://placehold.co/20x30"}
                      alt=""
                      className="w-5 h-7 object-cover rounded"
                    />
                    <span>
                      {t.tentuasach} (Mã tựa: #{t.matuasach})
                    </span>
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Input
                label="Năm XB *"
                type="number"
                value={rowForm.namxb}
                onChange={(e) =>
                  setRowForm((p) => ({ ...p, namxb: e.target.value }))
                }
              />
              <Input
                label="Nhà xuất bản"
                placeholder="Kim Đồng, Trẻ..."
                value={rowForm.nhaxb}
                onChange={(e) =>
                  setRowForm((p) => ({ ...p, nhaxb: e.target.value }))
                }
              />
              <Input
                label="Giá nhập kho *"
                type="number"
                placeholder="VND"
                value={rowForm.trigia}
                onChange={(e) =>
                  setRowForm((p) => ({ ...p, trigia: e.target.value }))
                }
              />
              <Input
                label="Số lượng *"
                type="number"
                min="1"
                value={rowForm.soluong}
                onChange={(e) =>
                  setRowForm((p) => ({ ...p, soluong: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAddRowItem}
                disabled={!selectedTitle}
                variant="secondary"
              >
                <Plus size={14} /> Xác nhận thêm dòng này
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1.5">
              Danh sách mặt hàng chờ lưu biểu mẫu ({importItems.length} mục):
            </p>
            {importItems.length === 0 ? (
              <div className="text-center py-6 border rounded-lg bg-white text-gray-400 text-xs">
                Biểu mẫu trống. Vui lòng thêm dòng sách ở khu vực phía trên.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-gray-500 font-medium border-b">
                    <tr>
                      <th className="px-3 py-1.5 text-left">
                        Tên sách / NXB / Năm XB
                      </th>
                      <th className="px-3 py-1.5 text-right">Đơn giá</th>
                      <th className="px-3 py-1.5 text-center">SL</th>
                      <th className="px-3 py-1.5 text-right">Thành tiền</th>
                      <th className="px-2 py-1.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="px-3 py-1.5">
                          <p className="font-semibold text-gray-800 line-clamp-1">
                            {item.tentuasach}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {item.nhaxb} · Năm XB: {item.namxb}
                          </p>
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-600">
                          {formatCurrency(item.trigia)}
                        </td>
                        <td className="px-3 py-1.5 text-center font-medium text-gray-700">
                          {item.soluong}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold text-gray-800">
                          {formatCurrency(item.trigia * item.soluong)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            onClick={() => handleRemoveRowItem(idx)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {importItems.length > 0 && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg flex items-center justify-between text-xs">
              <span className="font-medium text-indigo-900 flex items-center gap-1">
                <DollarSign size={14} /> Tổng chi phí quyết toán biểu mẫu phiếu
                nhập:
              </span>
              <strong className="text-base text-indigo-700">
                {formatCurrency(calculateTotalInvoiceCost())}
              </strong>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <Button
            variant="secondary"
            onClick={() => {
              setImportModal(false);
              setImportItems([]);
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSaveWholeInvoice}
            loading={isSubmitting}
            disabled={importItems.length === 0 || isSubmitting}
          >
            Nhập sách
          </Button>
        </div>
      </Modal>
    </div>
  );
};
