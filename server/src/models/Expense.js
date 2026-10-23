import mongoose from 'mongoose';

const participantShareSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sharePaise: {
      type: Number,
      required: true,
      min: [0, 'Share must be non-negative integer paise'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value in paise',
      },
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Expense description is required'],
      trim: true,
      maxlength: [100, 'Description cannot exceed 100 characters'],
    },
    amountPaise: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1 paise'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer paise amount',
      },
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    participants: {
      type: [participantShareSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one participant is required',
      },
    },
    splitType: {
      type: String,
      enum: ['EQUAL', 'CUSTOM', 'PERCENTAGE'],
      default: 'EQUAL',
    },
    category: {
      type: String,
      enum: [
        'Food',
        'Travel',
        'Accommodation',
        'Shopping',
        'Entertainment',
        'Groceries',
        'Rent',
        'Utilities',
        'Other',
      ],
      default: 'Other',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: '',
    },
    expenseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying expenses within a group by date
expenseSchema.index({ groupId: 1, expenseDate: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
