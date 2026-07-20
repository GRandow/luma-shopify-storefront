import { useState } from 'react';
import { ChevronDown, GitCompareArrows, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDiscoveryStore } from '@/features/discovery/discovery-store';
import { formatCurrency, formatCategory } from '@/utils/format';

export function CompareTray() {
  const [expanded, setExpanded] = useState(false);
  const items = useDiscoveryStore((state) => state.compareItems);
  const toggleCompare = useDiscoveryStore((state) => state.toggleCompare);
  const clearCompare = useDiscoveryStore((state) => state.clearCompare);

  if (items.length === 0) return null;

  return (
    <section className="fixed right-3 bottom-3 left-3 z-40 mx-auto max-w-4xl rounded-3xl border border-white/10 bg-ink-950 text-white shadow-soft">
      {expanded ? (
        <div className="max-h-[65vh] overflow-auto p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Product comparison</h2>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => setExpanded(false)}
              aria-label="Collapse comparison"
            >
              <ChevronDown className="size-5" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-xl table-fixed text-left text-sm">
              <thead>
                <tr>
                  <th className="w-28 pb-4 text-ink-400">Feature</th>
                  {items.map((item) => (
                    <th key={item.id} className="px-3 pb-4 font-semibold">
                      {item.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <th className="py-3 text-ink-400">Price</th>
                  {items.map((item) => (
                    <td key={item.id} className="px-3 py-3">
                      {formatCurrency(item.price)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="py-3 text-ink-400">Rating</th>
                  {items.map((item) => (
                    <td key={item.id} className="px-3 py-3">
                      {item.rating.toFixed(1)} / 5
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="py-3 text-ink-400">Stock</th>
                  {items.map((item) => (
                    <td key={item.id} className="px-3 py-3">
                      {item.stock} units
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="py-3 text-ink-400">Category</th>
                  {items.map((item) => (
                    <td key={item.id} className="px-3 py-3">
                      {formatCategory(item.category)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="size-5 text-moss-300" />
          <span className="text-sm font-semibold">Compare {items.length}/3</span>
        </div>
        <div className="hidden flex-1 items-center gap-2 sm:flex">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-full bg-white/8 py-1 pr-2 pl-1 text-xs"
            >
              <img
                className="size-7 rounded-full bg-white object-contain"
                src={item.thumbnail}
                alt=""
              />
              <span className="max-w-28 truncate">{item.title}</span>
              <button
                onClick={() => toggleCompare(item)}
                aria-label={`Remove ${item.title} from comparison`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <Button
          size="sm"
          className="ml-auto bg-white text-ink-950 hover:bg-moss-100"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Collapse' : 'Compare'}
        </Button>
        <button
          className="focus-ring rounded p-1 text-ink-300 hover:text-white"
          onClick={clearCompare}
          aria-label="Clear comparison"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </section>
  );
}
