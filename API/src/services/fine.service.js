/**
 * fine.service.js  (new schema)
 * Uses DOCGIA.TienNo and PHIEUTHUTIENPHAT table.
 */
const docgiaModel    = require('../models/docgia.model');
const phieuthuModel  = require('../models/phieuthutienphat.model');

const getReaderDebt = async (madocgia) => {
  const docgia = await docgiaModel.findById(+madocgia);
  const { data: receipts } = await phieuthuModel.findAll({ maDocGia: +madocgia, limit: 100 });
  return {
    totalDebt: Number(docgia.tienno ?? 0),
    hoten:     docgia.hoten,
    receipts:  receipts || [],
  };
};

const getFineReceipts = async ({ page = 1, limit = 10, madocgia } = {}) => {
  return phieuthuModel.findAll({ page: +page, limit: +limit, maDocGia: madocgia ? +madocgia : undefined });
};

module.exports = { getReaderDebt, getFineReceipts };
