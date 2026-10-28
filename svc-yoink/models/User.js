import mongoose from 'mongoose';

const savedAddressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home', maxlength: 40 },
    fullName: { type: String, required: true, trim: true, maxlength: 200 },
    addressLine1: { type: String, required: true, trim: true, maxlength: 200 },
    addressLine2: { type: String, trim: true, default: '', maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 200 },
    state: { type: String, required: true, trim: true, maxlength: 200 },
    postalCode: { type: String, required: true, trim: true, maxlength: 200 },
    country: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    savedAddresses: { type: [savedAddressSchema], default: [] },
    defaultAddressId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('User', userSchema);
