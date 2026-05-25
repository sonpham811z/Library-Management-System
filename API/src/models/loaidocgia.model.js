// Model: LOAIDOCGIA (Loại Độc Giả / Reader Types)
// Table: loaidocgia | PK: maloaidocgia
const supabase = require("../config/supabase");

const TABLE = "loaidocgia";

const findAll = async ({ search, page = 1, limit = 20 } = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from(TABLE).select("*", { count: "exact" });

  if (search) {
    query = query.ilike("tenloaidocgia", `%${search}%`);
  }

  query = query.order("maloaidocgia").range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
  };
};
const findById = async (maLoai) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("maloaidocgia", maLoai)
    .single();
  if (error) throw error;
  return data;
};

const create = async ({ tenloaidocgia }) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ tenloaidocgia })
    .select()
    .single();
  if (error) throw error;
  return data;
};

const update = async (maLoai, { tenloaidocgia }) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ tenloaidocgia })
    .eq("maloaidocgia", maLoai)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const remove = async (maLoai) => {
  // check xem còn độc giả thuộc loại này không
  const { data, error: checkError } = await supabase
    .from("docgia")
    .select("madocgia")
    .eq("maloaidocgia", maLoai)
    .limit(1);

  if (checkError) throw checkError;

  if (data && data.length > 0) {
    const err = new Error(
      "Không thể xóa loại độc giả vì còn độc giả liên quan",
    );
    err.status = 409;
    throw err;
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("maloaidocgia", maLoai);

  if (error) throw error;
};
module.exports = { findAll, findById, create, update, remove };
