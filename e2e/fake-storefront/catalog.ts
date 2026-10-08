import type {
  CollectionNode,
  ImageNode,
  MoneyV2Node,
  ProductNode,
  ProductVariantNode,
} from '../../src/services/storefront/types';
import { FAKE_IMAGE_BASE } from './constants';

/**
 * The catalog the fake Storefront API serves: the same products the demo
 * store was seeded with (`seed/luma-products.csv`), written out by hand so a
 * test can rely on specific facts. A few of them matter to the specs:
 *
 * - `stoneware-mug`: one option (Color), three in-stock variants.
 * - `linen-cushion-cover`: two options; 50 × 50 cm / Rust is sold out.
 * - `ceramic-table-lamp`: a single variant with 2 left (low-stock badge).
 * - `linen-throw-blanket`, `matte-black-kettle`: compare-at prices (on sale).
 * - `walnut-serving-tray`: a single default variant, added straight to the bag.
 */

const CURRENCY = 'USD';
const VENDOR = 'Luma';

export const COLLECTIONS = {
  tableware: { title: 'Tableware', description: 'Mugs, carafes and trays for the table.' },
  textiles: { title: 'Textiles', description: 'Linen, cotton and jute for every room.' },
  kitchen: { title: 'Kitchen', description: 'Tools that earn their place on the counter.' },
  'lighting-decor': {
    title: 'Lighting & Decor',
    description: 'Lamps, candles and the small things that make a room.',
  },
} as const;

type CollectionHandle = keyof typeof COLLECTIONS;

interface VariantSpec {
  /** Option values in the order of `ProductSpec.options`. */
  values: string[];
  sku: string;
  price: string;
  compareAt?: string;
  stock: number;
}

interface ProductSpec {
  handle: string;
  title: string;
  productType: string;
  collection: CollectionHandle;
  tags: string[];
  description: string;
  createdAt: string;
  /** Option names; omit for a product with only the default variant. */
  options?: string[];
  variants: VariantSpec[];
}

const DEFAULT_OPTION = 'Title';
const DEFAULT_VALUE = 'Default Title';

const PRODUCTS: ProductSpec[] = [
  {
    handle: 'stoneware-mug',
    title: 'Stoneware Mug',
    productType: 'Mugs',
    collection: 'tableware',
    tags: ['tableware', 'stoneware', 'ceramics', 'kitchen', 'bestseller'],
    description: 'A 350 ml mug in glazed stoneware with a matte exterior and a smooth interior.',
    createdAt: '2026-08-04T10:00:00Z',
    options: ['Color'],
    variants: [
      { values: ['Sand'], sku: 'LUMA-MUG-SAND', price: '28.00', stock: 24 },
      { values: ['Charcoal'], sku: 'LUMA-MUG-CHAR', price: '28.00', stock: 18 },
      { values: ['Sage'], sku: 'LUMA-MUG-SAGE', price: '28.00', stock: 9 },
    ],
  },
  {
    handle: 'linen-throw-blanket',
    title: 'Linen Throw Blanket',
    productType: 'Throws',
    collection: 'textiles',
    tags: ['textiles', 'linen', 'living room', 'bedroom', 'new'],
    description: 'Stonewashed European linen, soft from the first night and softer every wash.',
    createdAt: '2026-09-20T10:00:00Z',
    options: ['Color'],
    variants: [
      { values: ['Oat'], sku: 'LUMA-THROW-OAT', price: '120.00', compareAt: '150.00', stock: 14 },
      { values: ['Forest'], sku: 'LUMA-THROW-FOR', price: '120.00', compareAt: '150.00', stock: 6 },
    ],
  },
  {
    handle: 'oak-cutting-board',
    title: 'Oak Cutting Board',
    productType: 'Cutting Boards',
    collection: 'kitchen',
    tags: ['kitchen', 'oak', 'wood', 'cooking'],
    description: 'Solid European oak with a juice groove on one side and a flat serving side.',
    createdAt: '2026-07-14T10:00:00Z',
    options: ['Size'],
    variants: [
      { values: ['Small'], sku: 'LUMA-BOARD-S', price: '45.00', stock: 20 },
      { values: ['Large'], sku: 'LUMA-BOARD-L', price: '65.00', stock: 11 },
    ],
  },
  {
    handle: 'ceramic-table-lamp',
    title: 'Ceramic Table Lamp',
    productType: 'Table Lamps',
    collection: 'lighting-decor',
    tags: ['lighting', 'ceramics', 'living room', 'bedroom', 'low-stock'],
    description: 'A hand-thrown ceramic base under a linen shade, with a warm dimmable glow.',
    createdAt: '2026-06-30T10:00:00Z',
    variants: [{ values: [DEFAULT_VALUE], sku: 'LUMA-LAMP-01', price: '180.00', stock: 2 }],
  },
  {
    handle: 'soy-candle-cedar-fig',
    title: 'Soy Candle · Cedar & Fig',
    productType: 'Candles',
    collection: 'lighting-decor',
    tags: ['decor', 'candle', 'soy', 'gift'],
    description: 'Hand-poured soy wax with notes of cedarwood, green fig and a little smoke.',
    createdAt: '2026-08-18T10:00:00Z',
    options: ['Size'],
    variants: [
      { values: ['8 oz'], sku: 'LUMA-CANDLE-8', price: '32.00', stock: 40 },
      { values: ['14 oz'], sku: 'LUMA-CANDLE-14', price: '48.00', stock: 22 },
    ],
  },
  {
    handle: 'linen-cushion-cover',
    title: 'Linen Cushion Cover',
    productType: 'Cushion Covers',
    collection: 'textiles',
    tags: ['textiles', 'linen', 'living room', 'sofa'],
    description: 'Heavyweight linen with a hidden zip. Insert sold separately.',
    createdAt: '2026-07-28T10:00:00Z',
    options: ['Size', 'Color'],
    variants: [
      { values: ['45 × 45 cm', 'Rust'], sku: 'LUMA-CUSH-45-RUST', price: '55.00', stock: 16 },
      { values: ['45 × 45 cm', 'Stone'], sku: 'LUMA-CUSH-45-STONE', price: '55.00', stock: 12 },
      { values: ['50 × 50 cm', 'Rust'], sku: 'LUMA-CUSH-50-RUST', price: '65.00', stock: 0 },
      { values: ['50 × 50 cm', 'Stone'], sku: 'LUMA-CUSH-50-STONE', price: '65.00', stock: 8 },
    ],
  },
  {
    handle: 'glass-carafe-and-cup',
    title: 'Glass Carafe with Cup',
    productType: 'Carafes',
    collection: 'tableware',
    tags: ['tableware', 'glass', 'kitchen', 'bedroom'],
    description: 'A one-litre borosilicate carafe whose cup doubles as the lid.',
    createdAt: '2026-05-12T10:00:00Z',
    variants: [
      {
        values: [DEFAULT_VALUE],
        sku: 'LUMA-CARAFE-01',
        price: '38.00',
        compareAt: '48.00',
        stock: 30,
      },
    ],
  },
  {
    handle: 'brass-wall-hook-set',
    title: 'Brass Wall Hook · Set of 3',
    productType: 'Wall Hooks',
    collection: 'lighting-decor',
    tags: ['decor', 'brass', 'hallway', 'bathroom', 'storage'],
    description: 'Solid brass hooks that darken to a soft patina over time.',
    createdAt: '2026-04-22T10:00:00Z',
    variants: [{ values: [DEFAULT_VALUE], sku: 'LUMA-HOOK-3', price: '34.00', stock: 35 }],
  },
  {
    handle: 'handwoven-jute-rug',
    title: 'Handwoven Jute Rug',
    productType: 'Rugs',
    collection: 'textiles',
    tags: ['textiles', 'jute', 'living room', 'natural fibre'],
    description: 'A dense, hand-braided jute rug that brings texture to any floor.',
    createdAt: '2026-06-02T10:00:00Z',
    options: ['Size'],
    variants: [
      { values: ['120 × 180 cm'], sku: 'LUMA-RUG-120', price: '190.00', stock: 7 },
      { values: ['160 × 230 cm'], sku: 'LUMA-RUG-160', price: '290.00', stock: 4 },
    ],
  },
  {
    handle: 'walnut-serving-tray',
    title: 'Walnut Serving Tray',
    productType: 'Serving Trays',
    collection: 'tableware',
    tags: ['tableware', 'walnut', 'wood', 'kitchen', 'gift'],
    description: 'Oiled American walnut with carved handles, sized for two cups and a pot.',
    createdAt: '2026-08-26T10:00:00Z',
    variants: [{ values: [DEFAULT_VALUE], sku: 'LUMA-TRAY-01', price: '72.00', stock: 15 }],
  },
  {
    handle: 'matte-black-kettle',
    title: 'Matte Black Stovetop Kettle',
    productType: 'Kettles',
    collection: 'kitchen',
    tags: ['kitchen', 'coffee', 'tea', 'stainless steel'],
    description: 'A 1.2 litre stainless steel kettle with a gooseneck spout for slow pours.',
    createdAt: '2026-03-16T10:00:00Z',
    variants: [
      {
        values: [DEFAULT_VALUE],
        sku: 'LUMA-KETTLE-01',
        price: '95.00',
        compareAt: '115.00',
        stock: 10,
      },
    ],
  },
  {
    handle: 'waffle-bath-towel',
    title: 'Cotton Waffle Bath Towel',
    productType: 'Bath Towels',
    collection: 'textiles',
    tags: ['textiles', 'cotton', 'bathroom', 'waffle'],
    description: 'Long-staple cotton in a light waffle weave that dries fast.',
    createdAt: '2026-05-30T10:00:00Z',
    options: ['Color'],
    variants: [
      { values: ['White'], sku: 'LUMA-TOWEL-WHT', price: '42.00', stock: 26 },
      { values: ['Clay'], sku: 'LUMA-TOWEL-CLAY', price: '42.00', stock: 19 },
    ],
  },
  {
    handle: 'stoneware-vase',
    title: 'Stoneware Vase',
    productType: 'Vases',
    collection: 'lighting-decor',
    tags: ['decor', 'ceramics', 'stoneware', 'living room', 'new'],
    description: 'A speckled stoneware vase, wheel-thrown and glazed inside to hold water.',
    createdAt: '2026-09-28T10:00:00Z',
    variants: [{ values: [DEFAULT_VALUE], sku: 'LUMA-VASE-01', price: '58.00', stock: 13 }],
  },
];

function money(amount: string): MoneyV2Node {
  return { amount, currencyCode: CURRENCY };
}

function image(name: string, altText: string): ImageNode {
  return { url: `${FAKE_IMAGE_BASE}/${name}.svg`, altText, width: 1200, height: 1200 };
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function collectionId(handle: CollectionHandle): string {
  return `gid://shopify/Collection/${Object.keys(COLLECTIONS).indexOf(handle) + 1}`;
}

function toProductNode(spec: ProductSpec, index: number): ProductNode {
  const productNumber = 1001 + index;
  const optionNames = spec.options ?? [DEFAULT_OPTION];
  const colorIndex = optionNames.indexOf('Color');
  const productImage = image(spec.handle, spec.title);

  const variants: ProductVariantNode[] = spec.variants.map((variant, variantIndex) => {
    const color = colorIndex >= 0 ? variant.values[colorIndex] : undefined;
    return {
      id: `gid://shopify/ProductVariant/${productNumber * 100 + variantIndex + 1}`,
      title: variant.values.join(' / '),
      sku: variant.sku,
      availableForSale: variant.stock > 0,
      quantityAvailable: variant.stock,
      price: money(variant.price),
      compareAtPrice: variant.compareAt ? money(variant.compareAt) : null,
      selectedOptions: optionNames.map((name, position) => ({
        name,
        value: variant.values[position] ?? DEFAULT_VALUE,
      })),
      image: color
        ? image(`${spec.handle}-${slug(color)}`, `${spec.title} in ${color}`)
        : productImage,
    };
  });

  const images = [
    productImage,
    ...variants
      .map((variant) => variant.image)
      .filter((variantImage): variantImage is ImageNode => variantImage !== null)
      .filter((variantImage) => variantImage.url !== productImage.url),
  ].filter(
    (entry, position, all) => all.findIndex((other) => other.url === entry.url) === position,
  );

  const prices = spec.variants.map((variant) => Number(variant.price));
  const compareAts = spec.variants.map((variant) => Number(variant.compareAt ?? 0));
  const format = (value: number) => value.toFixed(2);
  const collection = COLLECTIONS[spec.collection];

  return {
    id: `gid://shopify/Product/${productNumber}`,
    handle: spec.handle,
    title: spec.title,
    description: spec.description,
    descriptionHtml: `<p>${spec.description}</p>`,
    vendor: VENDOR,
    productType: spec.productType,
    tags: spec.tags,
    createdAt: spec.createdAt,
    availableForSale: variants.some((variant) => variant.availableForSale),
    featuredImage: productImage,
    images: { nodes: images },
    priceRange: {
      minVariantPrice: money(format(Math.min(...prices))),
      maxVariantPrice: money(format(Math.max(...prices))),
    },
    compareAtPriceRange: {
      minVariantPrice: money(format(Math.min(...compareAts))),
      maxVariantPrice: money(format(Math.max(...compareAts))),
    },
    options: optionNames.map((name, position) => ({
      name,
      optionValues: [...new Set(spec.variants.map((variant) => variant.values[position] ?? ''))]
        .filter((value) => value !== '')
        .map((value) => ({ name: value })),
    })),
    variants: { nodes: variants },
    collections: {
      nodes: [
        { id: collectionId(spec.collection), handle: spec.collection, title: collection.title },
      ],
    },
  };
}

/** Best-selling order, which is also the order of the seed file. */
export const products: readonly ProductNode[] = PRODUCTS.map(toProductNode);

export const collections: readonly CollectionNode[] = (
  Object.keys(COLLECTIONS) as CollectionHandle[]
).map((handle) => ({
  id: collectionId(handle),
  handle,
  title: COLLECTIONS[handle].title,
  description: COLLECTIONS[handle].description,
  image: null,
}));

export function findProduct(handle: string): ProductNode | undefined {
  return products.find((product) => product.handle === handle);
}

export interface VariantWithProduct {
  product: ProductNode;
  variant: ProductVariantNode;
}

export function findVariant(variantId: string): VariantWithProduct | undefined {
  for (const product of products) {
    const variant = product.variants.nodes.find((candidate) => candidate.id === variantId);
    if (variant) return { product, variant };
  }
  return undefined;
}

export function productsInCollection(handle: string): ProductNode[] {
  return products.filter((product) =>
    product.collections.nodes.some((collection) => collection.handle === handle),
  );
}

/**
 * A rough stand-in for Shopify's product search: every word of the query has
 * to appear in the title, type, tags or vendor.
 */
export function searchProducts(query: string): ProductNode[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return products.filter((product) => {
    const haystack = [product.title, product.productType, product.vendor, ...product.tags]
      .join(' ')
      .toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
