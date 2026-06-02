// Model: TUASACH (Tựa Sách / Book Titles)
// Table: tuasach | PK: matuasach
// Columns: matuasach, tentuasach, matheloai, anhbia
const supabase = require("../config/supabase");

const TABLE = "tuasach";

const findById = async (maTuaSach) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*, theloai(tentheloai), ct_tacgia(matacgia, tacgia(tentacgia))")
    .eq("matuasach", maTuaSach)
    .single();
  if (error) throw error;
  return data;
};

const findAll = async ({ page = 1, limit = 20, search, maTheLoai } = {}) => {
  let query = supabase
    .from(TABLE)
    .select(
      "matuasach, tentuasach, anhbia, matheloai, theloai(tentheloai), ct_tacgia(tacgia(tentacgia))",
      { count: "exact" },
    );

  if (search) query = query.ilike("tentuasach", `%${search}%`);
  if (maTheLoai) query = query.eq("matheloai", maTheLoai);

  const from = (page - 1) * limit;
  query = query
    .range(from, from + limit - 1)
    .order("matuasach", { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
};

const create = async ({ tentuasach, matheloai, anhbia = null }) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ tentuasach, matheloai, anhbia })
    .select()
    .single();
  if (error) throw error;
  return data;
};

const update = async (maTuaSach, payload) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("matuasach", maTuaSach)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const remove = async (maTuaSach) => {
  const { data: sachTonTai } = await supabase
    .from("sach")
    .select("masach")
    .eq("matuasach", maTuaSach)
    .limit(1)
    .maybeSingle();

  if (sachTonTai) {
    throw new Error("Không thể xóa tựa sách vì tồn tại bản sao sách");
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("matuasach", maTuaSach);

  if (error) throw error;

  return true;
};
const search = async ({
  titleSearch,
  authorSearch,
  genreSearch,
  page = 1,
  limit = 8,
} = {}) => {
  let tuasachIds = null;

  if (authorSearch) {
    const { data: authors } = await supabase
      .from("tacgia")
      .select("matacgia")
      .ilike("tentacgia", `%${authorSearch}%`);

    if (!authors?.length) return { data: [], count: 0 };

    const { data: ctRecords } = await supabase
      .from("ct_tacgia")
      .select("matuasach")
      .in(
        "matacgia",
        authors.map((a) => a.matacgia),
      );

    if (!ctRecords?.length) return { data: [], count: 0 };
    tuasachIds = [...new Set(ctRecords.map((r) => r.matuasach))];
  }

  let query = supabase
    .from(TABLE)
    .select(
      "matuasach, tentuasach, anhbia, matheloai, theloai(tentheloai), ct_tacgia(tacgia(tentacgia))",
      { count: "exact" },
    );

  if (titleSearch) query = query.ilike("tentuasach", `%${titleSearch}%`);
  if (tuasachIds) query = query.in("matuasach", tuasachIds);

  if (genreSearch) {
    const { data: genres } = await supabase
      .from("theloai")
      .select("matheloai")
      .ilike("tentheloai", `%${genreSearch}%`);

    if (!genres?.length) return { data: [], count: 0 };
    query = query.in(
      "matheloai",
      genres.map((g) => g.matheloai),
    );
  }

  const from = (page - 1) * limit;
  query = query
    .range(from, from + limit - 1)
    .order("matuasach", { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

module.exports = { findById, findAll, search, create, update, remove };
