import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    paidTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amountPaise: {
      type: Number,
      required: [true, 'Settlement amount is required'],
      min: [1, 'Settlement amount must be at least 1 paise'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer paise amount',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'completed',
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note cannot exceed 200 characters'],
      default: '',
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

settlementSchema.index({ groupId: 1, status: 1, createdAt: -1 });

const Settlement = mongoose.model('Settlement', settlementSchema);

export default Settlement;
