// Model: CHITIETPHIEUNHAP (Chi Tiết Phiếu Nhập)
// Table: chitietphieunhap | Composite PK: (maphieunhap, masach)
const supabase = require("../config/supabase");
const TABLE = "chitietphieunhap";

const addMany = async (maPhieuNhap, items) => {
  const maPN = Number(maPhieuNhap);

  if (!Number.isFinite(maPN) || !Array.isArray(items) || items.length === 0) {
    throw {
      statusCode: 400,
      message: "Dữ liệu chi tiết phiếu nhập không hợp lệ",
    };
  }

  const rows = items.map((item) => {
    const masach = Number(item.masach);
    const dongia = Number(item.dongia);

    if (!Number.isFinite(masach) || !Number.isFinite(dongia)) {
      throw { statusCode: 400, message: "Mã sách hoặc đơn giá không hợp lệ" };
    }

    return {
      maphieunhap: maPN,
      masach,
      dongia,
      tentuasach_snapshot: item.tentuasach_snapshot || item.tentuasach || null,
      anhbia_snapshot: item.anhbia_snapshot || item.anhbia || null,
      nhaxb_snapshot: item.nhaxb_snapshot || item.nhaxb || null,
      namxb_snapshot: item.namxb_snapshot || item.namxb || null,
    };
  });

  const { data, error } = await supabase.from(TABLE).insert(rows).select();
  if (error) throw error;
  return data;
};

module.exports = { addMany };
