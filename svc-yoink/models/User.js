import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('User', userSchema);
