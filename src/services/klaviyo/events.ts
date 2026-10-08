import type { Cart, CartLineInput } from '@/types/cart';
import { getProductImage, type Product, type ProductVariant } from '@/types/product';

/**
 * Payloads for Klaviyo's standard ecommerce events, built from the app's
 * domain model. Property names follow Klaviyo's guides, so its flow templates
 * (browse abandonment, added to cart) and product blocks work as published.
 */

/** `gid://shopify/Product/123` → `123`: the id Klaviyo's Shopify catalog uses. */
export function shopifyNumericId(gid: string): string {
  const match = /\/(\d+)(?:\?.*)?$/.exec(gid);
  return match?.[1] ?? gid.slice(gid.lastIndexOf('/') + 1);
}

/** Absolute URL of a product page. Routes live in the URL hash. */
export function productPageUrl(handle: string): string {
  return new URL(
    `${import.meta.env.BASE_URL}#/products/${encodeURIComponent(handle)}`,
    window.location.origin,
  ).toString();
}

/** "Viewed Product", for the variant on screen (or the product's defaults). */
export function viewedProductProperties(product: Product, variant: ProductVariant | undefined) {
  // A variant's own compare-at price wins, even when it has none.
  const price = variant ? variant.price : product.price;
  const compareAtPrice = variant ? variant.compareAtPrice : product.compareAtPrice;
  const image = variant?.image ?? getProductImage(product);
  return {
    ProductName: product.title,
    // Klaviyo's Shopify guides call the same field `Name`; sending both keeps
    // Shopify-style templates and generic ones working.
    Name: product.title,
    ProductID: shopifyNumericId(product.id),
    SKU: variant?.sku ?? null,
    Categories: product.collections.map((collection) => collection.title),
    ImageURL: image?.url ?? null,
    URL: productPageUrl(product.handle),
    Brand: product.vendor,
    Price: price.amount,
    CompareAtPrice: compareAtPrice?.amount ?? null,
  };
}

/** Item for `trackViewedItem` (recently viewed products on the profile). */
export function viewedItem(product: Product, variant: ProductVariant | undefined) {
  const viewed = viewedProductProperties(product, variant);
  return {
    Title: viewed.ProductName,
    ItemId: viewed.ProductID,
    Categories: viewed.Categories,
    ImageUrl: viewed.ImageURL,
    Url: viewed.URL,
    Metadata: {
      Brand: viewed.Brand,
      Price: viewed.Price,
      CompareAtPrice: viewed.CompareAtPrice,
    },
  };
}

/**
 * "Added to Cart" for one added line, with the whole cart as Shopify returned
 * it (so `$value` and `Items` reflect discounts and earlier lines). `null`
 * when the line is not in the cart, which would mean Shopify rejected it.
 */
export function addedToCartProperties(cart: Cart, added: CartLineInput) {
  const line = cart.lines.find((cartLine) => cartLine.merchandise.id === added.merchandiseId);
  if (!line) return null;

  return {
    $value: cart.cost.total.amount,
    AddedItemProductName: line.merchandise.product.title,
    AddedItemProductID: shopifyNumericId(line.merchandise.product.id),
    AddedItemSKU: line.merchandise.sku,
    AddedItemImageURL: line.merchandise.image?.url ?? null,
    AddedItemURL: productPageUrl(line.merchandise.product.handle),
    AddedItemPrice: line.cost.perQuantity.amount,
    AddedItemQuantity: added.quantity,
    ItemNames: cart.lines.map((cartLine) => cartLine.merchandise.product.title),
    CheckoutURL: cart.checkoutUrl,
    Items: cart.lines.map((cartLine) => ({
      ProductID: shopifyNumericId(cartLine.merchandise.product.id),
      SKU: cartLine.merchandise.sku,
      ProductName: cartLine.merchandise.product.title,
      Quantity: cartLine.quantity,
      ItemPrice: cartLine.cost.perQuantity.amount,
      RowTotal: cartLine.cost.total.amount,
      ProductURL: productPageUrl(cartLine.merchandise.product.handle),
      ImageURL: cartLine.merchandise.image?.url ?? null,
    })),
  };
}
