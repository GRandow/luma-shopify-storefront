import type { Product } from '@/types/product';

export const productFixture: Product = {
  id: 42,
  title: 'Considered Desk Lamp',
  description: 'A warm and adjustable task light.',
  category: 'home-decoration',
  price: 80,
  discountPercentage: 10,
  rating: 4.7,
  stock: 8,
  tags: ['lighting'],
  brand: 'Luma Studio',
  sku: 'LUMA-LAMP-42',
  weight: 2,
  dimensions: { width: 20, height: 35, depth: 20 },
  warrantyInformation: '2 year warranty',
  shippingInformation: 'Ships in 2 days',
  availabilityStatus: 'In Stock',
  reviews: [
    {
      rating: 5,
      comment: 'Excellent light.',
      date: '2026-01-01T00:00:00.000Z',
      reviewerName: 'Sam Test',
      reviewerEmail: 'sam@example.com',
    },
  ],
  returnPolicy: '30 day returns',
  minimumOrderQuantity: 1,
  meta: {
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    barcode: '123456789',
    qrCode: 'https://example.com/qr',
  },
  thumbnail: 'https://dummyjson.com/image/400x500/efefeb/20201d?text=Lamp',
  images: ['https://dummyjson.com/image/800x800/efefeb/20201d?text=Lamp'],
};
