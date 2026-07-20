import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductFilters } from '@/features/products/components/ProductFilters';
import { DEFAULT_FILTERS } from '@/features/products/filter-products';

const categories = [
  { slug: 'home-decoration', name: 'Home Decoration', url: '/home-decoration' },
  { slug: 'furniture', name: 'Furniture', url: '/furniture' },
];

describe('ProductFilters', () => {
  it('emits strongly typed search and category updates', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ProductFilters
        filters={{ ...DEFAULT_FILTERS, maxPrice: 1000 }}
        categories={categories}
        priceCeiling={1000}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'lamp');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'p' }));

    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'furniture');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'furniture' }));
  });

  it('calls reset from the reset control', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(
      <ProductFilters
        filters={{ ...DEFAULT_FILTERS, maxPrice: 1000 }}
        categories={categories}
        priceCeiling={1000}
        onChange={vi.fn()}
        onReset={onReset}
      />,
    );

    await user.click(screen.getByRole('button', { name: /reset filters/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
