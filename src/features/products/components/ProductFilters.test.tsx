import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductFilters } from '@/features/products/components/ProductFilters';
import { DEFAULT_FILTERS } from '@/features/products/filter-products';
import type { Collection } from '@/types/product';

const collections: Collection[] = [
  {
    id: 'gid://shopify/Collection/1',
    handle: 'lighting',
    title: 'Lighting',
    description: '',
    image: null,
  },
  {
    id: 'gid://shopify/Collection/2',
    handle: 'table',
    title: 'Table',
    description: '',
    image: null,
  },
];

function renderFilters(overrides: Partial<Parameters<typeof ProductFilters>[0]> = {}) {
  const props = {
    filters: { ...DEFAULT_FILTERS, maxPrice: 1000 },
    collections,
    priceCeiling: 1000,
    currencyCode: 'CAD',
    onChange: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };
  render(<ProductFilters {...props} />);
  return props;
}

describe('ProductFilters', () => {
  it('emits strongly typed search, collection and availability updates', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilters();

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'lamp');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'p' }));

    await user.selectOptions(screen.getByRole('combobox', { name: 'Collection' }), 'table');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ collection: 'table' }));

    await user.click(screen.getByRole('checkbox', { name: 'In stock only' }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ inStockOnly: true }));
  });

  it('shows the price ceiling in the catalog currency', () => {
    renderFilters();
    expect(screen.getByText('CA$1,000.00')).toBeInTheDocument();
  });

  it('calls reset from the reset control', async () => {
    const user = userEvent.setup();
    const { onReset } = renderFilters();

    await user.click(screen.getByRole('button', { name: /reset filters/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
