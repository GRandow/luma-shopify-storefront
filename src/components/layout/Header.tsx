import { useState, type FormEvent } from 'react';
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { selectCartCount, useCartStore } from '@/features/cart/cart-store';
import { useDiscoveryStore } from '@/features/discovery/discovery-store';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';
import { cn } from '@/utils/cn';

const navItems = [
  { to: '/products', label: 'Shop' },
  { to: '/categories', label: 'Collections' },
  { to: '/products?sort=newest', label: 'New arrivals' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const cartCount = useCartStore(selectCartCount);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const recordSearch = useDiscoveryStore((state) => state.recordSearch);
  const recentSearches = useDiscoveryStore((state) => state.recentSearches);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    recordSearch(value);
    void navigate(`/products?q=${encodeURIComponent(value)}`);
    setSearchOpen(false);
    setQuery('');
  }

  return (
    <>
      <a
        href="#main-content"
        className="focus-ring fixed top-2 left-2 z-[100] -translate-y-20 rounded-full bg-ink-950 px-4 py-2 text-sm text-white focus:translate-y-0"
      >
        Skip to content
      </a>
      <div className="bg-ink-950 px-4 py-2 text-center text-xs font-medium text-white dark:bg-moss-700">
        Complimentary shipping on orders over $100
      </div>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[#f9f8f5]/90 backdrop-blur-xl dark:border-white/8 dark:bg-ink-950/90">
        <div className="page-shell flex h-17 items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <Logo />
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'focus-ring rounded-md text-sm font-medium transition hover:text-moss-700 dark:hover:text-moss-300',
                    isActive
                      ? 'text-moss-700 dark:text-moss-300'
                      : 'text-ink-600 dark:text-ink-300',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-5" aria-hidden="true" />
            </Button>
            <ThemeToggle />
            <NavLink
              to="/profile"
              className="focus-ring hidden size-10 items-center justify-center rounded-full hover:bg-ink-100 sm:flex dark:hover:bg-white/8"
              aria-label="Profile"
            >
              <UserRound className="size-5" aria-hidden="true" />
            </NavLink>
            <NavLink
              to="/wishlist"
              className="focus-ring relative hidden size-10 items-center justify-center rounded-full hover:bg-ink-100 sm:flex dark:hover:bg-white/8"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <Heart className="size-5" aria-hidden="true" />
              {wishlistCount > 0 ? (
                <span className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-coral text-[0.62rem] font-bold text-white">
                  {wishlistCount}
                </span>
              ) : null}
            </NavLink>
            <NavLink
              to="/cart"
              className="focus-ring relative flex size-10 items-center justify-center rounded-full hover:bg-ink-100 dark:hover:bg-white/8"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingBag className="size-5" aria-hidden="true" />
              {cartCount > 0 ? (
                <span className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-moss-600 text-[0.62rem] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </NavLink>
          </div>
        </div>
        {menuOpen ? (
          <nav
            id="mobile-navigation"
            className="surface border-t px-4 py-5 md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="page-shell flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="focus-ring rounded-xl px-3 py-3 font-medium hover:bg-ink-100 dark:hover:bg-white/8"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink className="focus-ring rounded-xl px-3 py-3 font-medium" to="/wishlist">
                Wishlist ({wishlistCount})
              </NavLink>
              <NavLink className="focus-ring rounded-xl px-3 py-3 font-medium" to="/profile">
                Profile
              </NavLink>
            </div>
          </nav>
        ) : null}
      </header>
      {searchOpen ? (
        <div
          className="fixed inset-0 z-50 bg-ink-950/45 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSearchOpen(false);
          }}
        >
          <div
            className="surface mx-auto mt-[10vh] max-w-2xl rounded-3xl border p-5 shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
          >
            <form onSubmit={submitSearch} className="flex items-center gap-3">
              <Search className="size-5 text-ink-400" aria-hidden="true" />
              <label htmlFor="global-search" className="sr-only">
                Search products
              </label>
              <input
                id="global-search"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent py-2 text-lg outline-none placeholder:text-ink-400"
                placeholder="Search objects, categories, brands..."
              />
              <Button size="sm" variant="ghost" onClick={() => setSearchOpen(false)}>
                Close
              </Button>
            </form>
            {recentSearches.length > 0 ? (
              <div className="mt-5 border-t pt-4">
                <p className="mb-3 text-xs font-bold tracking-wider text-ink-400 uppercase">
                  Recent
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      className="focus-ring rounded-full bg-ink-100 px-3 py-1.5 text-sm hover:bg-ink-200 dark:bg-white/8 dark:hover:bg-white/12"
                      onClick={() => {
                        void navigate(`/products?q=${encodeURIComponent(search)}`);
                        setSearchOpen(false);
                      }}
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
