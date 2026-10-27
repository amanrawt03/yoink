import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

dotenv.config();

const categories = [
  {
    name: 'Audio',
    slug: 'audio',
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    imageUrl:
      'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Wearables',
    slug: 'wearables',
    imageUrl:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    imageUrl:
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=85',
  },
];

const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;
const products = [
  [
    'studio-wireless-headphones',
    'Studio Wireless Headphones',
    'audio',
    129.99,
    34,
    'Over-ear wireless headphones with rich, balanced sound, soft memory foam cushions, and 40-hour battery life.',
    'photo-1505740420928-5e560c06d30e',
  ],
  [
    'portable-bluetooth-speaker',
    'Portable Bluetooth Speaker',
    'audio',
    79.0,
    58,
    'A compact, water-resistant speaker with room-filling sound and a 16-hour rechargeable battery.',
    'photo-1608043152269-423dbba4e7e1',
  ],
  [
    'noise-cancelling-earbuds',
    'Noise-Cancelling Earbuds',
    'audio',
    99.5,
    42,
    'Pocket-sized earbuds with adaptive noise cancellation, a clear call microphone, and a wireless charging case.',
    'photo-1606220945770-b5b6c2c55bf1',
  ],
  [
    'vinyl-turntable',
    'Belt-Drive Vinyl Turntable',
    'audio',
    219.0,
    12,
    'A ready-to-play belt-drive turntable with an adjustable tonearm and warm, detailed analog sound.',
    'photo-1603048588665-791ca8aea617',
  ],
  [
    'compact-digital-radio',
    'Compact Digital Radio',
    'audio',
    64.0,
    27,
    'A simple tabletop radio with digital tuning, crisp reception, and a clean oak-look finish.',
    'photo-1593078166036-9e7d5e3c43a7',
  ],
  [
    'usb-c-dac-headphone-amp',
    'USB-C Headphone DAC',
    'audio',
    49.99,
    65,
    'A pocket-sized digital-to-analog converter that brings detailed high-resolution audio to wired headphones.',
    'photo-1484704849700-f032a568e944',
  ],
  [
    'ceramic-table-lamp',
    'Ceramic Table Lamp',
    'home-living',
    89.0,
    21,
    'A sculptural matte ceramic lamp with a linen shade and a warm, welcoming glow.',
    'photo-1507473885765-e6ed057f782c',
  ],
  [
    'woven-throw-blanket',
    'Woven Cotton Throw',
    'home-living',
    59.0,
    46,
    'A soft, breathable cotton throw with a textured weave and relaxed fringe for the sofa or bed.',
    'photo-1600210492486-724fe5c67fb0',
  ],
  [
    'stoneware-mug-set',
    'Stoneware Mug Set',
    'home-living',
    38.0,
    73,
    'A set of four hand-finished stoneware mugs, each with a comfortable handle and subtle glaze variation.',
    'photo-1514228742587-6b1558fcca3d',
  ],
  [
    'walnut-desk-organizer',
    'Walnut Desk Organizer',
    'home-living',
    42.5,
    30,
    'A solid walnut tray with dedicated spaces for pens, notes, and small everyday essentials.',
    'photo-1499951360447-b19be8fe80f5',
  ],
  [
    'reusable-glass-carafe',
    'Glass Water Carafe',
    'home-living',
    32.0,
    39,
    'A clear borosilicate glass carafe with a cork stopper for serving water, juice, or iced tea.',
    'photo-1513558161293-cdaf765edfd4',
  ],
  [
    'linen-cushion-cover',
    'Linen Cushion Cover',
    'home-living',
    28.0,
    52,
    'A naturally textured European linen cushion cover with a discreet zip and easy-care construction.',
    'photo-1584100936595-c0654b55a2e2',
  ],
  [
    'everyday-analog-watch',
    'Everyday Analog Watch',
    'wearables',
    145.0,
    18,
    'A minimalist stainless steel watch with a dependable quartz movement and a versatile brushed finish.',
    'photo-1523275335684-37898b6baf30',
  ],
  [
    'fitness-smartwatch',
    'Fitness Smartwatch',
    'wearables',
    189.0,
    25,
    'Track daily activity, heart rate, and sleep with a bright display and multi-day battery life.',
    'photo-1523398002811-999ca8dec234',
  ],
  [
    'classic-leather-watch',
    'Classic Leather Watch',
    'wearables',
    159.0,
    14,
    'A timeless analog watch with a clean dial, polished case, and a comfortable genuine leather strap.',
    'photo-1524592094714-0f0654e20314',
  ],
  [
    'sport-silicone-watch-band',
    'Sport Silicone Watch Band',
    'wearables',
    24.0,
    80,
    'A flexible, sweat-resistant replacement band with a secure pin-and-tuck closure.',
    'photo-1434493789847-2f02dc6ca35d',
  ],
  [
    'everyday-sunglasses',
    'Everyday Sunglasses',
    'wearables',
    68.0,
    33,
    'Lightweight acetate sunglasses with UV-protective lenses and a flattering everyday shape.',
    'photo-1511499767150-a48a237f0083',
  ],
  [
    'canvas-weekender-bag',
    'Canvas Weekender Bag',
    'wearables',
    112.0,
    16,
    'A roomy cotton canvas travel bag with a reinforced base, zip closure, and detachable shoulder strap.',
    'photo-1553062407-98eeb64c6a62',
  ],
  [
    'instant-film-camera',
    'Instant Film Camera',
    'accessories',
    99.0,
    20,
    'An easy-to-use instant camera with automatic exposure and a classic design for spontaneous snapshots.',
    'photo-1526170375885-4d8ecf77b99f',
  ],
  [
    'mechanical-pencil-set',
    'Mechanical Pencil Set',
    'accessories',
    19.5,
    90,
    'A tidy set of precision mechanical pencils with smooth lead advance and a durable metal clip.',
    'photo-1455390582262-044cdead277a',
  ],
  [
    'leather-card-holder',
    'Leather Card Holder',
    'accessories',
    35.0,
    44,
    'A slim full-grain leather card holder with four card slots and a central pocket for folded notes.',
    'photo-1627123424574-724758594e93',
  ],
  [
    'recycled-notebook-set',
    'Recycled Paper Notebook Set',
    'accessories',
    22.0,
    61,
    'Three thread-bound notebooks made with recycled paper for sketches, lists, and daily notes.',
    'photo-1531346878377-a5be20888e57',
  ],
  [
    'foldable-laptop-stand',
    'Foldable Laptop Stand',
    'accessories',
    54.0,
    29,
    'A sturdy, adjustable aluminum stand that lifts your laptop to a more comfortable viewing height.',
    'photo-1527864550417-7fd91fc51a46',
  ],
  [
    'wireless-charging-pad',
    'Wireless Charging Pad',
    'accessories',
    31.0,
    47,
    'A slim Qi-compatible charging pad with a grippy surface and an understated fabric finish.',
    'photo-1609091839311-d5365f9ff1c5',
  ],
];

async function seed() {
  if (!process.env.MONGO_URI)
    throw new Error('MONGO_URI is not set. Add it to svc-yoink/.env or the environment.');

  await mongoose.connect(process.env.MONGO_URI);

  // init() builds declared unique indexes before any upserts are attempted.
  await Promise.all([Category.init(), Product.init()]);

  for (const category of categories) {
    await Category.updateOne(
      { slug: category.slug },
      { $set: category },
      { upsert: true, runValidators: true },
    );
  }

  const categoryIds = new Map(
    (
      await Category.find(
        { slug: { $in: categories.map(({ slug }) => slug) } },
        { _id: 1, slug: 1 },
      ).lean()
    ).map(({ _id, slug }) => [slug, _id]),
  );

  for (const [slug, name, categorySlug, price, stock, description, imageId] of products) {
    const categoryId = categoryIds.get(categorySlug);
    if (!categoryId) throw new Error(`Seed category not found: ${categorySlug}`);
    const product = {
      name,
      slug,
      description,
      price,
      images: [photo(imageId)],
      category: categoryId,
      stock,
      featured: [
        'studio-wireless-headphones',
        'ceramic-table-lamp',
        'everyday-analog-watch',
        'instant-film-camera',
      ].includes(slug),
      isActive: true,
    };
    await Product.updateOne({ slug }, { $set: product }, { upsert: true, runValidators: true });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

seed()
  .catch((error) => {
    if (error.code === 11000) {
      console.error(
        `Seed stopped on duplicate key (${error.keyPattern ? Object.keys(error.keyPattern).join(', ') : 'unique index'}). Check existing conflicting data and index definitions.`,
      );
    } else {
      console.error(`Seed failed: ${error.message}`);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
