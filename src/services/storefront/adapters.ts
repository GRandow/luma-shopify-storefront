import type { Cart, CartLine } from '@/types/cart';
import type { Collection, Money, Product, ProductVariant, StorefrontImage } from '@/types/product';
import type {
  CartLineNode,
  CartNode,
  CollectionNode,
  ImageNode,
  MoneyV2Node,
  ProductNode,
  ProductVariantNode,
} from '@/services/storefront/types';

export function toMoney(money: MoneyV2Node): Money {
  return { amount: Number.parseFloat(money.amount), currencyCode: money.currencyCode };
}

function toOptionalMoney(money: MoneyV2Node | null): Money | null {
  return money ? toMoney(money) : null;
}

export function toImage(image: ImageNode | null): StorefrontImage | null {
  if (!image) return null;
  return { url: image.url, altText: image.altText, width: image.width, height: image.height };
}

export function toVariant(node: ProductVariantNode): ProductVariant {
  return {
    id: node.id,
    title: node.title,
    sku: node.sku,
    availableForSale: node.availableForSale,
    quantityAvailable: node.quantityAvailable,
    price: toMoney(node.price),
    compareAtPrice: toOptionalMoney(node.compareAtPrice),
    selectedOptions: node.selectedOptions.map((option) => ({
      name: option.name,
      value: option.value,
    })),
    image: toImage(node.image),
  };
}

/** Compare-at price shown next to the "from" price: the cheapest variant's, when it is a real markdown. */
function resolveCompareAtPrice(price: Money, variants: ProductVariant[]): Money | null {
  const cheapest = variants.reduce<ProductVariant | undefined>(
    (candidate, variant) =>
      candidate && candidate.price.amount <= variant.price.amount ? candidate : variant,
    undefined,
  );
  const compareAt = cheapest?.compareAtPrice ?? null;
  return compareAt && compareAt.amount > price.amount ? compareAt : null;
}

export function toProduct(node: ProductNode): Product {
  const variants = node.variants.nodes.map(toVariant);
  const price = toMoney(node.priceRange.minVariantPrice);

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description,
    descriptionHtml: node.descriptionHtml,
    vendor: node.vendor,
    productType: node.productType,
    tags: node.tags,
    createdAt: node.createdAt,
    availableForSale: node.availableForSale,
    featuredImage: toImage(node.featuredImage),
    images: node.images.nodes.map((image) => toImage(image)).filter((image) => image !== null),
    price,
    compareAtPrice: resolveCompareAtPrice(price, variants),
    priceVaries: Number.parseFloat(node.priceRange.maxVariantPrice.amount) > price.amount,
    options: node.options.map((option) => ({
      name: option.name,
      values: option.optionValues.map((value) => value.name),
    })),
    variants,
    collections: node.collections.nodes.map((collection) => ({
      id: collection.id,
      handle: collection.handle,
      title: collection.title,
    })),
  };
}

export function toCollection(node: CollectionNode): Collection {
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description,
    image: toImage(node.image),
  };
}

export function toCartLine(node: CartLineNode): CartLine {
  const { product, ...variant } = node.merchandise;
  return {
    id: node.id,
    quantity: node.quantity,
    merchandise: {
      ...toVariant(variant),
      product: {
        id: product.id,
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
      },
    },
    cost: {
      total: toMoney(node.cost.totalAmount),
      perQuantity: toMoney(node.cost.amountPerQuantity),
      compareAtPerQuantity: toOptionalMoney(node.cost.compareAtAmountPerQuantity),
    },
  };
}

export function toCart(node: CartNode): Cart {
  return {
    id: node.id,
    checkoutUrl: node.checkoutUrl,
    totalQuantity: node.totalQuantity,
    lines: node.lines.nodes.map(toCartLine),
    discountCodes: node.discountCodes.map((code) => ({
      code: code.code,
      applicable: code.applicable,
    })),
    cost: {
      subtotal: toMoney(node.cost.subtotalAmount),
      total: toMoney(node.cost.totalAmount),
      tax: toOptionalMoney(node.cost.totalTaxAmount),
    },
  };
}
