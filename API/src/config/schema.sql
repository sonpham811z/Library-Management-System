-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bcsachtratre (
  mabaocao integer NOT NULL DEFAULT nextval('bcsachtratre_mabaocao_seq'::regclass),
  ngay date NOT NULL,
  CONSTRAINT bcsachtratre_pkey PRIMARY KEY (mabaocao)
);
CREATE TABLE public.bctinhhinhmuonsach (
  mabaocao integer NOT NULL DEFAULT nextval('bctinhhinhmuonsach_mabaocao_seq'::regclass),
  thang integer NOT NULL,
  nam integer NOT NULL,
  tongsoluotmuon integer DEFAULT 0,
  CONSTRAINT bctinhhinhmuonsach_pkey PRIMARY KEY (mabaocao)
);
CREATE TABLE public.chucnang (
  machucnang integer NOT NULL DEFAULT nextval('chucnang_machucnang_seq'::regclass),
  tenchucnang character varying NOT NULL,
  tenmanhinh character varying NOT NULL,
  CONSTRAINT chucnang_pkey PRIMARY KEY (machucnang)
);
CREATE TABLE public.ct_bcsachtratre (
  mabaocao integer NOT NULL,
  masach integer NOT NULL,
  songaytratre integer DEFAULT 0,
  CONSTRAINT ct_bcsachtratre_pkey PRIMARY KEY (mabaocao, masach),
  CONSTRAINT ct_bcsachtratre_mabaocao_fkey FOREIGN KEY (mabaocao) REFERENCES public.bcsachtratre(mabaocao),
  CONSTRAINT ct_bcsachtratre_masach_fkey FOREIGN KEY (masach) REFERENCES public.sach(masach)
);
CREATE TABLE public.ct_bctinhhinhmuonsach (
  mabaocao integer NOT NULL,
  matheloai integer NOT NULL,
  soluotmuon integer DEFAULT 0,
  tile numeric DEFAULT 0,
  CONSTRAINT ct_bctinhhinhmuonsach_pkey PRIMARY KEY (mabaocao, matheloai),
  CONSTRAINT ct_bctinhhinhmuonsach_mabaocao_fkey FOREIGN KEY (mabaocao) REFERENCES public.bctinhhinhmuonsach(mabaocao),
  CONSTRAINT ct_bctinhhinhmuonsach_matheloai_fkey FOREIGN KEY (matheloai) REFERENCES public.theloai(matheloai)
);
CREATE TABLE public.ct_phieumuon (
  maphieumuon integer NOT NULL,
  masach integer NOT NULL,
  CONSTRAINT ct_phieumuon_pkey PRIMARY KEY (maphieumuon, masach),
  CONSTRAINT ct_phieumuon_maphieumuon_fkey FOREIGN KEY (maphieumuon) REFERENCES public.phieumuon(maphieumuon),
  CONSTRAINT ct_phieumuon_masach_fkey FOREIGN KEY (masach) REFERENCES public.sach(masach)
);
CREATE TABLE public.ct_phieutra (
  maphieutra integer NOT NULL,
  masach integer NOT NULL,
  songaytratre integer DEFAULT 0,
  tienphat numeric DEFAULT 0,
  maphieumuon integer NOT NULL,
  CONSTRAINT ct_phieutra_pkey PRIMARY KEY (maphieutra, maphieumuon, masach),
  CONSTRAINT ct_phieutra_maphieutra_fkey FOREIGN KEY (maphieutra) REFERENCES public.phieutra(maphieutra),
  CONSTRAINT ct_phieutra_masach_fkey FOREIGN KEY (masach) REFERENCES public.sach(masach),
  CONSTRAINT ct_phieutra_maphieumuon_fkey FOREIGN KEY (maphieumuon) REFERENCES public.phieumuon(maphieumuon)
);
CREATE TABLE public.ct_tacgia (
  matuasach integer NOT NULL,
  matacgia integer NOT NULL,
  CONSTRAINT ct_tacgia_pkey PRIMARY KEY (matuasach, matacgia),
  CONSTRAINT ct_tacgia_matuasach_fkey FOREIGN KEY (matuasach) REFERENCES public.tuasach(matuasach),
  CONSTRAINT ct_tacgia_matacgia_fkey FOREIGN KEY (matacgia) REFERENCES public.tacgia(matacgia)
);
CREATE TABLE public.datcho (
  madatcho integer NOT NULL DEFAULT nextval('datcho_madatcho_seq'::regclass),
  madocgia integer NOT NULL,
  matuasach integer NOT NULL,
  ngaydatcho date NOT NULL DEFAULT CURRENT_DATE,
  ngayhethan date,
  trangthai character varying NOT NULL DEFAULT 'Chờ xử lý'::character varying,
  masach integer,
  CONSTRAINT datcho_pkey PRIMARY KEY (madatcho),
  CONSTRAINT datcho_madocgia_fkey FOREIGN KEY (madocgia) REFERENCES public.docgia(madocgia),
  CONSTRAINT datcho_matuasach_fkey FOREIGN KEY (matuasach) REFERENCES public.tuasach(matuasach),
  CONSTRAINT datcho_masach_fkey FOREIGN KEY (masach) REFERENCES public.sach(masach)
);
CREATE TABLE public.docgia (
  madocgia integer NOT NULL DEFAULT nextval('docgia_madocgia_seq'::regclass),
  hoten character varying NOT NULL,
  ngaysinh date NOT NULL,
  diachi text,
  email character varying UNIQUE,
  ngaylapthe date NOT NULL,
  ngayhethan date NOT NULL,
  tienno numeric DEFAULT 0,
  maloaidocgia integer,
  manguoidung integer,
  anhdaidien text,
  CONSTRAINT docgia_pkey PRIMARY KEY (madocgia),
  CONSTRAINT docgia_maloaidocgia_fkey FOREIGN KEY (maloaidocgia) REFERENCES public.loaidocgia(maloaidocgia),
  CONSTRAINT docgia_manguoidung_fkey FOREIGN KEY (manguoidung) REFERENCES public.nguoidung(manguoidung)
);
CREATE TABLE public.loaidocgia (
  maloaidocgia integer NOT NULL DEFAULT nextval('loaidocgia_maloaidocgia_seq'::regclass),
  tenloaidocgia character varying NOT NULL,
  CONSTRAINT loaidocgia_pkey PRIMARY KEY (maloaidocgia)
);
CREATE TABLE public.nguoidung (
  manguoidung integer NOT NULL DEFAULT nextval('nguoidung_manguoidung_seq'::regclass),
  tendangnhap character varying NOT NULL UNIQUE,
  matkhau character varying NOT NULL,
  manhom integer,
  CONSTRAINT nguoidung_pkey PRIMARY KEY (manguoidung),
  CONSTRAINT nguoidung_manhom_fkey FOREIGN KEY (manhom) REFERENCES public.nhomnguoidung(manhom)
);
CREATE TABLE public.nhomnguoidung (
  manhom integer NOT NULL DEFAULT nextval('nhomnguoidung_manhom_seq'::regclass),
  tennhom character varying NOT NULL,
  CONSTRAINT nhomnguoidung_pkey PRIMARY KEY (manhom)
);
CREATE TABLE public.phanquyen (
  manhom integer NOT NULL,
  machucnang integer NOT NULL,
  CONSTRAINT phanquyen_pkey PRIMARY KEY (manhom, machucnang),
  CONSTRAINT phanquyen_machucnang_fkey FOREIGN KEY (machucnang) REFERENCES public.chucnang(machucnang),
  CONSTRAINT phanquyen_manhom_fkey FOREIGN KEY (manhom) REFERENCES public.nhomnguoidung(manhom)
);
CREATE TABLE public.phieumuon (
  maphieumuon integer NOT NULL DEFAULT nextval('phieumuon_maphieumuon_seq'::regclass),
  madocgia integer,
  ngaymuon date NOT NULL,
  hantra date NOT NULL,
  CONSTRAINT phieumuon_pkey PRIMARY KEY (maphieumuon),
  CONSTRAINT phieumuon_madocgia_fkey FOREIGN KEY (madocgia) REFERENCES public.docgia(madocgia)
);
CREATE TABLE public.phieuthutienphat (
  maphieuthu integer NOT NULL DEFAULT nextval('phieuthutienphat_maphieuthu_seq'::regclass),
  madocgia integer,
  ngaythu date NOT NULL,
  sotienthu numeric NOT NULL,
  conlai numeric DEFAULT 0,
  CONSTRAINT phieuthutienphat_pkey PRIMARY KEY (maphieuthu),
  CONSTRAINT phieuthutienphat_madocgia_fkey FOREIGN KEY (madocgia) REFERENCES public.docgia(madocgia)
);
CREATE TABLE public.phieutra (
  maphieutra integer NOT NULL DEFAULT nextval('phieutra_maphieutra_seq'::regclass),
  madocgia integer,
  ngaytra date NOT NULL,
  tienphatkynay numeric DEFAULT 0,
  CONSTRAINT phieutra_pkey PRIMARY KEY (maphieutra),
  CONSTRAINT phieutra_madocgia_fkey FOREIGN KEY (madocgia) REFERENCES public.docgia(madocgia)
);
CREATE TABLE public.sach (
  masach integer NOT NULL DEFAULT nextval('sach_masach_seq'::regclass),
  matuasach integer,
  namxb integer NOT NULL,
  nhaxb character varying,
  ngaynhap date NOT NULL,
  trigia numeric NOT NULL,
  trangthai character varying DEFAULT 'Có sẵn'::character varying,
  CONSTRAINT sach_pkey PRIMARY KEY (masach),
  CONSTRAINT sach_matuasach_fkey FOREIGN KEY (matuasach) REFERENCES public.tuasach(matuasach)
);
CREATE TABLE public.tacgia (
  matacgia integer NOT NULL DEFAULT nextval('tacgia_matacgia_seq'::regclass),
  tentacgia character varying NOT NULL,
  CONSTRAINT tacgia_pkey PRIMARY KEY (matacgia)
);
CREATE TABLE public.thamso (
  tenthamso character varying NOT NULL,
  giatri numeric NOT NULL,
  CONSTRAINT thamso_pkey PRIMARY KEY (tenthamso)
);
CREATE TABLE public.theloai (
  matheloai integer NOT NULL DEFAULT nextval('theloai_matheloai_seq'::regclass),
  tentheloai character varying NOT NULL,
  CONSTRAINT theloai_pkey PRIMARY KEY (matheloai)
);
CREATE TABLE public.tuasach (
  matuasach integer NOT NULL DEFAULT nextval('tuasach_matuasach_seq'::regclass),
  tentuasach character varying NOT NULL,
  anhbia text,
  matheloai integer,
  embedding USER-DEFINED,
  CONSTRAINT tuasach_pkey PRIMARY KEY (matuasach),
  CONSTRAINT tuasach_matheloai_fkey FOREIGN KEY (matheloai) REFERENCES public.theloai(matheloai)
);