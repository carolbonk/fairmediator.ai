/**
 * Invoices API
 *
 * Mediator-issued invoices for case work, plus PDF rendering via pdfkit.
 *
 * @module routes/invoices
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Case = require('../models/Case');
const Invoice = require('../models/Invoice');
const { authenticateWithRole } = require('../middleware/roleAuth');
const logger = require('../config/logger');

router.use(authenticateWithRole(['mediator', 'admin']));

function fmtMoney(n, ccy = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy }).format(n || 0);
}

/**
 * GET /api/invoices?caseId=...&status=...
 */
router.get('/', async (req, res) => {
  try {
    const filter = { mediatorId: req.user._id };
    if (req.query.caseId && mongoose.isValidObjectId(req.query.caseId)) {
      filter.caseId = req.query.caseId;
    }
    if (req.query.status) filter.status = req.query.status;

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    logger.error('[Invoices API] list failed:', error);
    res.status(500).json({ success: false, error: 'Failed to list invoices' });
  }
});

/**
 * POST /api/invoices
 * Body: { caseId, billTo, lineItems[], taxRate?, dueAt?, notes? }
 */
router.post('/', async (req, res) => {
  try {
    const { caseId, billTo, lineItems, taxRate, dueAt, notes } = req.body;
    if (!caseId || !mongoose.isValidObjectId(caseId)) {
      return res.status(400).json({ success: false, error: 'caseId required' });
    }
    if (!billTo || !billTo.name) {
      return res.status(400).json({ success: false, error: 'billTo.name required' });
    }
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one line item required' });
    }

    const owned = await Case.findOne({ _id: caseId, 'mediator.userId': req.user._id }).select('_id').lean();
    if (!owned) return res.status(403).json({ success: false, error: 'Not your case' });

    const invoice = await Invoice.create({
      caseId,
      mediatorId: req.user._id,
      billTo,
      lineItems,
      taxRate: taxRate || 0,
      dueAt,
      notes
    });

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    logger.error('[Invoices API] create failed:', error);
    res.status(500).json({ success: false, error: 'Failed to create invoice' });
  }
});

/**
 * GET /api/invoices/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      mediatorId: req.user._id
    }).lean();
    if (!invoice) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, invoice });
  } catch (error) {
    logger.error('[Invoices API] get failed:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
});

/**
 * GET /api/invoices/:id/pdf
 * Streams a freshly rendered PDF.
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      mediatorId: req.user._id
    }).populate('caseId', 'caseNumber title').lean();

    if (!invoice) return res.status(404).json({ success: false, error: 'Not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('INVOICE', { align: 'right' });
    doc.fontSize(10).text(invoice.invoiceNumber, { align: 'right' });
    doc.moveDown();

    doc.fontSize(12).text('FairMediator', 50, 110);
    doc.fontSize(9).fillColor('#666')
      .text(`Issued: ${new Date(invoice.issuedAt).toLocaleDateString()}`)
      .text(invoice.dueAt ? `Due: ${new Date(invoice.dueAt).toLocaleDateString()}` : 'Due on receipt');

    doc.moveDown().fillColor('#000').fontSize(10);
    doc.text('Bill To:', 50, 170);
    doc.fontSize(11).text(invoice.billTo.name);
    if (invoice.billTo.email) doc.fontSize(9).text(invoice.billTo.email);
    if (invoice.billTo.address) doc.fontSize(9).text(invoice.billTo.address);

    if (invoice.caseId?.caseNumber) {
      doc.moveDown().fontSize(10).text(`Case: ${invoice.caseId.caseNumber} — ${invoice.caseId.title || ''}`);
    }

    let y = 270;
    doc.fontSize(10).fillColor('#000');
    doc.text('Description', 50, y);
    doc.text('Qty', 320, y, { width: 50, align: 'right' });
    doc.text('Rate', 380, y, { width: 70, align: 'right' });
    doc.text('Amount', 470, y, { width: 80, align: 'right' });
    doc.moveTo(50, y + 15).lineTo(560, y + 15).stroke();
    y += 25;

    invoice.lineItems.forEach(li => {
      doc.fontSize(10).fillColor('#222');
      doc.text(li.description, 50, y, { width: 260 });
      doc.text(String(li.quantity || 1), 320, y, { width: 50, align: 'right' });
      doc.text(fmtMoney(li.rate, invoice.currency), 380, y, { width: 70, align: 'right' });
      doc.text(fmtMoney(li.amount, invoice.currency), 470, y, { width: 80, align: 'right' });
      y += 20;
    });

    y += 10;
    doc.moveTo(380, y).lineTo(560, y).stroke();
    y += 8;
    doc.fontSize(10).text('Subtotal', 380, y, { width: 70, align: 'right' });
    doc.text(fmtMoney(invoice.subtotal, invoice.currency), 470, y, { width: 80, align: 'right' });
    y += 16;
    if (invoice.tax) {
      doc.text(`Tax (${(invoice.taxRate * 100).toFixed(1)}%)`, 380, y, { width: 70, align: 'right' });
      doc.text(fmtMoney(invoice.tax, invoice.currency), 470, y, { width: 80, align: 'right' });
      y += 16;
    }
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total', 380, y, { width: 70, align: 'right' });
    doc.text(fmtMoney(invoice.total, invoice.currency), 470, y, { width: 80, align: 'right' });

    if (invoice.notes) {
      doc.font('Helvetica').fontSize(9).fillColor('#666')
        .text(`Notes: ${invoice.notes}`, 50, y + 60, { width: 510 });
    }

    doc.end();
  } catch (error) {
    logger.error('[Invoices API] pdf failed:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to render PDF' });
    }
  }
});

module.exports = router;
