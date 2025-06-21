import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['debt', 'credit'],
    required: true
  },
  isPaid: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

debtSchema.index({ userId: 1, dueDate: 1 });
debtSchema.index({ userId: 1, isPaid: 1 });

export default mongoose.model('Debt', debtSchema);