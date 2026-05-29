// Model: PHIEUNHAP (Phiếu Nhập Sách)
// Table: phieunhap | PK: maphieunhap
const supabase = require("../config/supabase");
const TABLE = "phieunhap";

const create = async (payload) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ngaynhap: payload.ngaynhap, tongtien: payload.tongtien || 0 }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      `
      *,
      chitietphieunhap(
        masach,
        dongia,
        tentuasach_snapshot,
        anhbia_snapshot,
        nhaxb_snapshot,
        namxb_snapshot
      )
    `,
    )
    .eq("maphieunhap", id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const findAll = async ({ page = 1, limit = 15 } = {}) => {
  const from = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from(TABLE)
    .select("*", { count: "exact" })
    .range(from, from + limit - 1)
    .order("maphieunhap", { ascending: false });

  if (error) throw error;
  return { data, count };
};

const update = async (id, payload) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("maphieunhap", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

module.exports = { create, findById, findAll, update };
