import type { CartAttributeInput } from '../../src/services/storefront/types';
import {
  addLines,
  createCart,
  getCart,
  removeLines,
  touchCart,
  updateAttributes,
  updateDiscountCodes,
  updateLines,
  type LineInput,
  type LineUpdateInput,
} from './carts';
import {
  collections,
  findProduct,
  products,
  productsInCollection,
  searchProducts,
} from './catalog';

/**
 * Answers the GraphQL operations the storefront sends (see
 * `src/services/storefront/queries.ts`) by operation name. Responses carry
 * every field the app's fragments ask for, typed with the app's own raw
 * response types, so a fragment change that the fake does not follow fails
 * the typecheck or the E2E run instead of drifting silently.
 */

export interface GraphQLRequestBody {
  query: string;
  variables: Record<string, unknown>;
}

export type GraphQLResponse =
  { data: Record<string, unknown> } | { errors: Array<{ message: string }> };

type Variables = Record<string, unknown>;

/** Name of the first `query`/`mutation` in the document (fragments come first). */
export function operationName(query: string): string | null {
  return /\b(?:query|mutation)\s+([A-Za-z_]\w*)/.exec(query)?.[1] ?? null;
}

export function parseRequestBody(raw: string): GraphQLRequestBody | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || typeof parsed.query !== 'string') return null;
  return { query: parsed.query, variables: isRecord(parsed.variables) ? parsed.variables : {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(variables: Variables, name: string): string {
  const value = variables[name];
  return typeof value === 'string' ? value : '';
}

function count(variables: Variables, name: string, fallback = 250): number {
  const value = variables[name];
  return typeof value === 'number' ? value : fallback;
}

function list(variables: Variables, name: string): Record<string, unknown>[] {
  const value = variables[name];
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function strings(variables: Variables, name: string): string[] {
  const value = variables[name];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function lineInputs(variables: Variables): LineInput[] {
  return list(variables, 'lines').map((line) => ({
    merchandiseId: typeof line.merchandiseId === 'string' ? line.merchandiseId : '',
    quantity: typeof line.quantity === 'number' ? line.quantity : 1,
  }));
}

function lineUpdates(variables: Variables): LineUpdateInput[] {
  return list(variables, 'lines').map((line) => ({
    id: typeof line.id === 'string' ? line.id : '',
    quantity: typeof line.quantity === 'number' ? line.quantity : 0,
  }));
}

function attributeInputs(variables: Variables): CartAttributeInput[] {
  return list(variables, 'attributes').map((attribute) => ({
    key: typeof attribute.key === 'string' ? attribute.key : '',
    value: typeof attribute.value === 'string' ? attribute.value : '',
  }));
}

const handlers: Record<string, (variables: Variables) => Record<string, unknown>> = {
  Products: (variables) => ({
    products: { nodes: products.slice(0, count(variables, 'first')) },
  }),
  ProductByHandle: (variables) => ({ product: findProduct(text(variables, 'handle')) ?? null }),
  Collections: (variables) => ({
    collections: { nodes: collections.slice(0, count(variables, 'first')) },
  }),
  CollectionProducts: (variables) => {
    const handle = text(variables, 'handle');
    const known = collections.some((collection) => collection.handle === handle);
    return {
      collection: known
        ? { products: { nodes: productsInCollection(handle).slice(0, count(variables, 'first')) } }
        : null,
    };
  },
  SearchProducts: (variables) => ({
    search: { nodes: searchProducts(text(variables, 'query')).slice(0, count(variables, 'first')) },
  }),
  ProductRecommendations: (variables) => {
    const productId = text(variables, 'productId');
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) return { productRecommendations: null };
    const collection = product.collections.nodes[0]?.handle ?? '';
    return {
      productRecommendations: productsInCollection(collection)
        .filter((candidate) => candidate.id !== productId)
        .slice(0, 4),
    };
  },
  Cart: (variables) => ({ cart: getCart(text(variables, 'cartId')) }),
  CartCreate: (variables) => ({
    cartCreate: createCart(lineInputs(variables), attributeInputs(variables)),
  }),
  CartLinesAdd: (variables) => ({
    cartLinesAdd: addLines(text(variables, 'cartId'), lineInputs(variables)),
  }),
  CartLinesUpdate: (variables) => ({
    cartLinesUpdate: updateLines(text(variables, 'cartId'), lineUpdates(variables)),
  }),
  CartLinesRemove: (variables) => ({
    cartLinesRemove: removeLines(text(variables, 'cartId'), strings(variables, 'lineIds')),
  }),
  CartAttributesUpdate: (variables) => ({
    cartAttributesUpdate: updateAttributes(text(variables, 'cartId'), attributeInputs(variables)),
  }),
  CartDiscountCodesUpdate: (variables) => ({
    cartDiscountCodesUpdate: updateDiscountCodes(
      text(variables, 'cartId'),
      strings(variables, 'discountCodes'),
    ),
  }),
  CartBuyerIdentityUpdate: (variables) => ({
    cartBuyerIdentityUpdate: touchCart(text(variables, 'cartId')),
  }),
};

export function executeOperation(body: GraphQLRequestBody): GraphQLResponse {
  const name = operationName(body.query);
  const handler = name ? handlers[name] : undefined;
  if (!name || !handler) {
    // Loud on purpose: a new query in the app must be taught to the fake.
    return { errors: [{ message: `Fake Storefront API: unsupported operation "${name ?? '?'}"` }] };
  }
  return { data: handler(body.variables) };
}
