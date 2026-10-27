import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PAGE_SIZE,
  parseProductQuery,
  validateProduct,
} from '../controllers/catalogController.js';

test('catalog listing composes only supplied filters and clamps page size', () => {
  const category = '507f1f77bcf86cd799439011';
  const parsed = parseProductQuery({
    search: '  shirt  ',
    category,
    minPrice: '100',
    maxPrice: '1000',
    sortBy: 'price',
    order: 'asc',
    page: '2',
    limit: '999',
  });
  assert.deepEqual(parsed.filter, {
    isActive: true,
    $text: { $search: 'shirt' },
    category: parsed.filter.category,
    price: { $gte: 100, $lte: 1000 },
  });
  assert.equal(parsed.filter.category.toString(), category);
  assert.deepEqual(parsed.sort, { price: 1, _id: 1 });
  assert.equal(parsed.page, 2);
  assert.equal(parsed.limit, MAX_PAGE_SIZE);
});

test('catalog listing defaults pagination and rejects unsafe or invalid query values', () => {
  assert.deepEqual(parseProductQuery({}).sort, { createdAt: -1, _id: 1 });
  assert.equal(parseProductQuery({}).limit, 12);
  for (const query of [
    { sortBy: 'price.$gt' },
    { sortBy: '__proto__' },
    { sortBy: 'toString' },
    { order: 'desc,price' },
    { page: '0' },
    { minPrice: '-1' },
    { minPrice: '20', maxPrice: '10' },
    { category: 'not-an-id' },
  ]) {
    assert.throws(() => parseProductQuery(query));
  }
});

test('product writes require valid core fields, image URLs, category IDs and stock', () => {
  const valid = {
    name: 'Example',
    slug: 'example-item',
    description: 'An example item',
    price: 10,
    images: ['https://example.com/item.jpg'],
    category: '507f1f77bcf86cd799439011',
    stock: 2,
  };
  assert.equal(validateProduct(valid), null);
  assert.match(validateProduct({ ...valid, stock: 1.5 }), /Stock/);
  assert.match(validateProduct({ ...valid, images: ['javascript:alert(1)'] }), /image URLs/);
  assert.match(validateProduct({ ...valid, category: 'invalid' }), /category ID/);
  assert.match(validateProduct({ ...valid, price: -4 }), /Price/);
});
