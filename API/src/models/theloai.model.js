const supabase = require("../config/supabase");

const TABLE = "theloai";
const SACH_TABLE = "sach";

const findAll = async ({ search, page = 1, limit = 20 } = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from(TABLE).select("*", { count: "exact" });

  if (search) {
    query = query.ilike("tentheloai", `%${search}%`);
  }

  query = query.order("tentheloai").range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
  };
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("matheloai", id)
    .single();

  if (error) throw error;
  return data;
};

const create = async ({ tentheloai }) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ tentheloai })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const update = async (id, { tentheloai }) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ tentheloai })
    .eq("matheloai", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const remove = async (id) => {
  const { data, error: checkError } = await supabase
    .from("tuasach")
    .select("matuasach")
    .eq("matheloai", id)
    .limit(1);

  if (checkError) throw checkError;

  if (data && data.length > 0) {
    const err = new Error("Không thể xóa thể loại vì còn tựa sách liên quan");
    err.status = 409;
    throw err;
  }

  const { error } = await supabase.from("theloai").delete().eq("matheloai", id);

  if (error) throw error;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
