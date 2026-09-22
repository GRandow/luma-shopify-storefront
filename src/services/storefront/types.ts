/**
 * Raw response shapes for the GraphQL documents in `./queries.ts`. They mirror
 * the Storefront API schema for exactly the fields we request, and are turned
 * into the app's domain model by `./adapters.ts`.
 */

export interface MoneyV2Node {
  amount: string;
  currencyCode: string;
}

export interface ImageNode {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface SelectedOptionNode {
  name: string;
  value: string;
}

export interface ProductVariantNode {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: MoneyV2Node;
  compareAtPrice: MoneyV2Node | null;
  selectedOptions: SelectedOptionNode[];
  image: ImageNode | null;
}

export interface ProductOptionNode {
  name: string;
  optionValues: Array<{ name: string }>;
}

export interface CollectionSummaryNode {
  id: string;
  handle: string;
  title: string;
}

export interface ProductNode {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  createdAt: string;
  availableForSale: boolean;
  featuredImage: ImageNode | null;
  images: { nodes: ImageNode[] };
  priceRange: { minVariantPrice: MoneyV2Node; maxVariantPrice: MoneyV2Node };
  compareAtPriceRange: { minVariantPrice: MoneyV2Node; maxVariantPrice: MoneyV2Node };
  options: ProductOptionNode[];
  variants: { nodes: ProductVariantNode[] };
  collections: { nodes: CollectionSummaryNode[] };
}

export interface CollectionNode {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ImageNode | null;
}

export interface CartLineNode {
  id: string;
  quantity: number;
  cost: {
    totalAmount: MoneyV2Node;
    amountPerQuantity: MoneyV2Node;
    compareAtAmountPerQuantity: MoneyV2Node | null;
  };
  merchandise: ProductVariantNode & {
    product: { id: string; handle: string; title: string; vendor: string };
  };
}

export interface CartNode {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  discountCodes: Array<{ code: string; applicable: boolean }>;
  cost: {
    subtotalAmount: MoneyV2Node;
    totalAmount: MoneyV2Node;
    totalTaxAmount: MoneyV2Node | null;
  };
  lines: { nodes: CartLineNode[] };
}

export interface CartUserErrorNode {
  field: string[] | null;
  message: string;
  code: string | null;
}

export interface CartMutationPayload {
  cart: CartNode | null;
  userErrors: CartUserErrorNode[];
}

/* Operation results */

export interface ProductsQueryData {
  products: { nodes: ProductNode[] };
}

export interface ProductByHandleQueryData {
  product: ProductNode | null;
}

export interface CollectionsQueryData {
  collections: { nodes: CollectionNode[] };
}

export interface CollectionProductsQueryData {
  collection: { products: { nodes: ProductNode[] } } | null;
}

export interface SearchProductsQueryData {
  search: { nodes: ProductNode[] };
}

export interface ProductRecommendationsQueryData {
  productRecommendations: ProductNode[] | null;
}

export interface CartQueryData {
  cart: CartNode | null;
}

export interface CartCreateData {
  cartCreate: CartMutationPayload;
}

export interface CartLinesAddData {
  cartLinesAdd: CartMutationPayload;
}

export interface CartLinesUpdateData {
  cartLinesUpdate: CartMutationPayload;
}

export interface CartLinesRemoveData {
  cartLinesRemove: CartMutationPayload;
}

export interface CartDiscountCodesUpdateData {
  cartDiscountCodesUpdate: CartMutationPayload;
}

export interface CartBuyerIdentityUpdateData {
  cartBuyerIdentityUpdate: CartMutationPayload;
}

/** Subset of `CartBuyerIdentityInput` the app uses. */
export interface CartBuyerIdentityInput {
  /** A Customer Account API access token; `null` detaches the customer from the cart. */
  customerAccessToken?: string | null;
  email?: string | null;
}
