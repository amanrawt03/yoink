import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  images: { type: [{ type: String, trim: true }], required: true, validate: {
    validator: (images) => images.length > 0 && images.every(Boolean),
    message: 'At least one product image URL is required',
  } },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: false },
  stock: { type: Number, required: true, min: 0, validate: {
    validator: Number.isInteger,
    message: 'Stock must be a nonnegative integer',
  } },
  ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0, min: 0, validate: Number.isInteger },
  featured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1, createdAt: -1 });
productSchema.index({ featured: 1, isActive: 1, createdAt: -1 });

export default mongoose.model('Product', productSchema);
