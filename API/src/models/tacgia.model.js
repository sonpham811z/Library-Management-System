const supabase = require("../config/supabase");

const TABLE = "tacgia";
const SACH_TABLE = "sach";

const findAll = async ({ search, page = 1, limit = 20 } = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from(TABLE).select("*", { count: "exact" });

  if (search) {
    query = query.ilike("tentacgia", `%${search}%`);
  }

  query = query.order("tentacgia").range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
  };
};

const findById = async (maTacGia) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("matacgia", maTacGia)
    .single();

  if (error) throw error;
  return data;
};

const create = async ({ tentacgia }) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ tentacgia })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const update = async (maTacGia, { tentacgia }) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ tentacgia })
    .eq("matacgia", maTacGia)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * 🚫 CHẶN XÓA NẾU CÒN SÁCH
 */
const remove = async (maTacGia) => {
  const { data, error } = await supabase
    .from("ct_tacgia")
    .select("matacgia")
    .eq("matacgia", maTacGia);

  if (error) throw error;

  if (data.length > 0) {
    const err = new Error("Không thể xóa tác giả vì còn sách liên quan");
    err.status = 409;
    throw err;
  }

  const { error: delError } = await supabase
    .from("tacgia")
    .delete()
    .eq("matacgia", maTacGia);

  if (delError) throw delError;
};
module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
