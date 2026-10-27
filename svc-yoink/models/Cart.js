import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [cartItemSchema], default: [] },
}, { timestamps: true });

cartSchema.index({ user: 1 }, { unique: true });

export default mongoose.model('Cart', cartSchema);
