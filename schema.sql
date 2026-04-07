-- ============================================================
-- DATABASE QUẢN LÝ THƯ VIỆN - CHUẨN 100% THEO ẢNH GIẢNG VIÊN
-- ============================================================

-- ─── 1. QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN (Ảnh 3) ──────────────
CREATE TABLE NHOMNGUOIDUNG (
    MaNhom SERIAL PRIMARY KEY,
    TenNhom VARCHAR(255) NOT NULL
);

CREATE TABLE NGUOIDUNG (
    MaNguoiDung SERIAL PRIMARY KEY,
    TenDangNhap VARCHAR(255) UNIQUE NOT NULL,
    MatKhau VARCHAR(255) NOT NULL,
    MaNhom INT REFERENCES NHOMNGUOIDUNG(MaNhom)
);

CREATE TABLE CHUCNANG (
    MaChucNang SERIAL PRIMARY KEY,
    TenChucNang VARCHAR(255) NOT NULL,
    TenManHinh VARCHAR(255) NOT NULL
);

CREATE TABLE PHANQUYEN (
    MaNhom INT REFERENCES NHOMNGUOIDUNG(MaNhom),
    MaChucNang INT REFERENCES CHUCNANG(MaChucNang),
    PRIMARY KEY (MaNhom, MaChucNang)
);


-- ─── 2. QUẢN LÝ ĐỘC GIẢ (Ảnh 1) ──────────────────────────────
CREATE TABLE LOAIDOCGIA (
    MaLoaiDocGia SERIAL PRIMARY KEY,
    TenLoaiDocGia VARCHAR(255) NOT NULL
);

CREATE TABLE DOCGIA (
    MaDocGia SERIAL PRIMARY KEY,
    HoTen VARCHAR(255) NOT NULL,
    NgaySinh DATE NOT NULL,
    DiaChi TEXT,
    Email VARCHAR(255) UNIQUE,
    NgayLapThe DATE NOT NULL,
    NgayHetHan DATE NOT NULL,
    TienNo NUMERIC(10,0) DEFAULT 0,
    MaLoaiDocGia INT REFERENCES LOAIDOCGIA(MaLoaiDocGia)
);


-- ─── 3. DANH MỤC THÔNG TIN SÁCH (Ảnh 1) ──────────────────────
CREATE TABLE THELOAI (
    MaTheLoai SERIAL PRIMARY KEY,
    TenTheLoai VARCHAR(255) NOT NULL
);

CREATE TABLE TACGIA (
    MaTacGia SERIAL PRIMARY KEY,
    TenTacGia VARCHAR(255) NOT NULL
);

CREATE TABLE TUASACH (
    MaTuaSach SERIAL PRIMARY KEY,
    TenTuaSach VARCHAR(500) NOT NULL,
    AnhBia TEXT,
    MaTheLoai INT REFERENCES THELOAI(MaTheLoai)
);

CREATE TABLE CT_TACGIA (
    MaTuaSach INT REFERENCES TUASACH(MaTuaSach) ON DELETE CASCADE,
    MaTacGia INT REFERENCES TACGIA(MaTacGia) ON DELETE CASCADE,
    PRIMARY KEY (MaTuaSach, MaTacGia)
);


-- ─── 4. KHO SÁCH / BẢN IN VẬT LÝ (Ảnh 2) ─────────────────────
CREATE TABLE SACH (
    MaSach SERIAL PRIMARY KEY,
    MaTuaSach INT REFERENCES TUASACH(MaTuaSach) ON DELETE CASCADE,
    NamXB INT NOT NULL,
    NhaXB VARCHAR(255),
    NgayNhap DATE NOT NULL,
    TriGia NUMERIC(10,0) NOT NULL,
    TrangThai VARCHAR(50) DEFAULT 'Có sẵn' -- VD: 'Có sẵn', 'Đã mượn'
);


-- ─── 5. QUẢN LÝ MƯỢN - TRẢ (Ảnh 2) ───────────────────────────
CREATE TABLE PHIEUMUON (
    MaPhieuMuon SERIAL PRIMARY KEY,
    MaDocGia INT REFERENCES DOCGIA(MaDocGia),
    NgayMuon DATE NOT NULL,
    HanTra DATE NOT NULL
);

CREATE TABLE CT_PHIEUMUON (
    MaPhieuMuon INT REFERENCES PHIEUMUON(MaPhieuMuon) ON DELETE CASCADE,
    MaSach INT REFERENCES SACH(MaSach),
    PRIMARY KEY (MaPhieuMuon, MaSach)
);

CREATE TABLE PHIEUTRA (
    MaPhieuTra SERIAL PRIMARY KEY,
    MaDocGia INT REFERENCES DOCGIA(MaDocGia),
    NgayTra DATE NOT NULL,
    TienPhatKyNay NUMERIC(10,0) DEFAULT 0
);

CREATE TABLE CT_PHIEUTRA (
    MaPhieuTra INT REFERENCES PHIEUTRA(MaPhieuTra) ON DELETE CASCADE,
    MaPhieuMuon INT REFERENCES PHIEUMUON(MaPhieuMuon) ON DELETE CASCADE,
    MaSach INT REFERENCES SACH(MaSach),
    SoNgayTraTre INT DEFAULT 0,
    TienPhat NUMERIC(10,0) DEFAULT 0,
    PRIMARY KEY (MaPhieuTra, MaPhieuMuon, MaSach)
);


-- ─── 6. THU TIỀN PHẠT (Ảnh 2) ────────────────────────────────
CREATE TABLE PHIEUTHUTIENPHAT (
    MaPhieuThu SERIAL PRIMARY KEY,
    MaDocGia INT REFERENCES DOCGIA(MaDocGia),
    NgayThu DATE NOT NULL,
    SoTienThu NUMERIC(10,0) NOT NULL,
    ConLai NUMERIC(10,0) DEFAULT 0
);


-- ─── 7. BÁO CÁO THỐNG KÊ (Ảnh 3) ─────────────────────────────
CREATE TABLE BCTINHHINHMUONSACH (
    MaBaoCao SERIAL PRIMARY KEY,
    Thang INT NOT NULL,
    Nam INT NOT NULL,
    TongSoLuotMuon INT DEFAULT 0
);

CREATE TABLE CT_BCTINHHINHMUONSACH (
    MaBaoCao INT REFERENCES BCTINHHINHMUONSACH(MaBaoCao) ON DELETE CASCADE,
    MaTheLoai INT REFERENCES THELOAI(MaTheLoai),
    SoLuotMuon INT DEFAULT 0,
    TiLe NUMERIC(5,2) DEFAULT 0,
    PRIMARY KEY (MaBaoCao, MaTheLoai)
);

CREATE TABLE BCSACHTRATRE (
    MaBaoCao SERIAL PRIMARY KEY,
    Ngay DATE NOT NULL
);

CREATE TABLE CT_BCSACHTRATRE (
    MaBaoCao INT REFERENCES BCSACHTRATRE(MaBaoCao) ON DELETE CASCADE,
    MaSach INT REFERENCES SACH(MaSach),
    SoNgayTraTre INT DEFAULT 0,
    PRIMARY KEY (MaBaoCao, MaSach)
);

  -- ─── DATCHO: Đặt chỗ trước sách ──────────────────────────────                                                              
  CREATE TABLE DATCHO (                                                                                                               MaDatCho    SERIAL PRIMARY KEY,                                                                                           
      MaDocGia    INT NOT NULL REFERENCES DOCGIA(MaDocGia) ON DELETE CASCADE,                                                   
      MaTuaSach   INT NOT NULL REFERENCES TUASACH(MaTuaSach) ON DELETE CASCADE,
      NgayDatCho     DATE NOT NULL DEFAULT CURRENT_DATE,
      NgayHetHan  DATE NOT NULL,
      TrangThai   VARCHAR(50) NOT NULL DEFAULT 'Chờ xử lý'
      -- TrangThai: 'Chờ xử lý' | 'Đã xử lý' | 'Hủy'
  );



-- ─── 8. THAM SỐ QUY ĐỊNH (Ảnh 3) ─────────────────────────────
CREATE TABLE THAMSO (
    TenThamSo VARCHAR(100) PRIMARY KEY,
    GiaTri NUMERIC NOT NULL
);

-- Insert sẵn một vài tham số mồi cho bro test
INSERT INTO THAMSO (TenThamSo, GiaTri) VALUES
    ('TuoiToiThieu', 18),
    ('TuoiToiDa', 55),
    ('ThoiHanTheThang', 6),
    ('SoNgayMuonToiDa', 4),
    ('SoSachMuonToiDa', 5),
    ('TienPhatTreHanMotNgay', 1000);

      -- Foreign key indexes for query performance
  CREATE INDEX idx_datcho_docgia   ON DATCHO(MaDocGia);
  CREATE INDEX idx_datcho_tuasach  ON DATCHO(MaTuaSach);
