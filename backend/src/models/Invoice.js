/**
 * Invoice Model
 * Mediator-issued invoices for case work.
 */

const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true, maxlength: 500 },
  quantity: { type: Number, default: 1, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, required: true, index: true },

  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true
  },
  mediatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  billTo: {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true }
  },

  lineItems: {
    type: [lineItemSchema],
    validate: v => Array.isArray(v) && v.length >= 1
  },

  subtotal: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0, min: 0, max: 1 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },

  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'void'],
    default: 'draft',
    index: true
  },

  issuedAt: { type: Date, default: Date.now },
  dueAt: Date,
  paidAt: Date,
  notes: { type: String, maxlength: 2000 }
}, { timestamps: true });

invoiceSchema.pre('validate', function (next) {
  if (Array.isArray(this.lineItems)) {
    this.lineItems.forEach(li => {
      if (li.amount == null) li.amount = (li.quantity || 1) * (li.rate || 0);
    });
    this.subtotal = this.lineItems.reduce((sum, li) => sum + (li.amount || 0), 0);
    this.tax = +(this.subtotal * (this.taxRate || 0)).toFixed(2);
    this.total = +(this.subtotal + this.tax).toFixed(2);
  }
  next();
});

invoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
