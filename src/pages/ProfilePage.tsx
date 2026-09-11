import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, LogOut, MapPin, Package, UserRound, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductImage } from '@/components/ui/ProductImage';
import { ProductCard } from '@/features/products/components/ProductCard';
import { useAuthStore } from '@/features/auth/auth-store';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';
import { authService } from '@/services/auth-service';
import { formatCurrency, formatDate } from '@/utils/format';

type ProfileTab = 'overview' | 'orders' | 'addresses' | 'wishlist';

export default function ProfilePage() {
  const [tab, setTab] = useState<ProfileTab>('overview');
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const orders = useAuthStore((state) => state.orders);
  const addresses = useAuthStore((state) => state.addresses);
  const logout = useAuthStore((state) => state.logout);
  const wishlist = useWishlistStore((state) => state.items);
  const userDetailsQuery = useQuery({
    queryKey: ['users', user?.id],
    queryFn: () => authService.getUserProfile(user?.id ?? 0),
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 30,
  });

  if (!user) return null;

  const tabs: Array<{ id: ProfileTab; label: string; icon: typeof UserRound }> = [
    { id: 'overview', label: 'Overview', icon: UserRound },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
  ];
  const metrics: Array<{ icon: LucideIcon; value: number; label: string; tab: ProfileTab }> = [
    { icon: Package, value: orders.length, label: 'Orders placed', tab: 'orders' },
    { icon: MapPin, value: addresses.length, label: 'Saved addresses', tab: 'addresses' },
    { icon: Heart, value: wishlist.length, label: 'Wishlist items', tab: 'wishlist' },
  ];
  const userDetails = userDetailsQuery.data;

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title={`Good to see you, ${user.firstName}`}
        description="Manage your orders, saved delivery details, and the pieces you have kept close."
      />
      <div className="page-shell grid gap-8 py-12 lg:grid-cols-[14rem_1fr]">
        <aside>
          <div className="surface rounded-3xl border p-3">
            <div className="flex items-center gap-3 p-3">
              <img
                className="size-11 shrink-0 rounded-full bg-ink-100 object-cover"
                src={user.image}
                alt=""
                width={128}
                height={128}
                decoding="async"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-ink-400">{user.email}</p>
              </div>
            </div>
            <nav className="mt-3 space-y-1" aria-label="Profile sections">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${tab === id ? 'bg-ink-100 text-ink-950 dark:bg-white/10 dark:text-white' : 'text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5'}`}
                  onClick={() => setTab(id)}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </nav>
            <button
              className="focus-ring mt-3 flex w-full items-center gap-3 border-t border-black/5 px-3 pt-4 pb-2 text-sm font-medium text-red-600 dark:border-white/8 dark:text-red-400"
              onClick={() => {
                logout();
                toast.success('You have been signed out');
                void navigate('/');
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </aside>
        <section>
          {tab === 'overview' ? (
            <div>
              <h2 className="font-display text-2xl font-semibold">Account overview</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {metrics.map(({ icon: Icon, value, label, tab: targetTab }) => (
                  <button
                    key={label}
                    className="surface rounded-3xl border p-6 text-left"
                    onClick={() => setTab(targetTab)}
                  >
                    <Icon className="size-5 text-moss-700 dark:text-moss-300" />
                    <strong className="mt-5 block text-3xl">{value}</strong>
                    <span className="text-sm text-ink-400">{label}</span>
                  </button>
                ))}
              </div>
              <div className="surface mt-6 rounded-3xl border p-6">
                <h3 className="font-display text-xl font-semibold">Personal information</h3>
                <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-ink-400">Name</dt>
                    <dd className="mt-1 font-medium">
                      {user.firstName} {user.lastName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Email</dt>
                    <dd className="mt-1 font-medium">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Username</dt>
                    <dd className="mt-1 font-medium">{user.username}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Customer ID</dt>
                    <dd className="mt-1 font-medium">LUMA-{user.id.toString().padStart(5, '0')}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Phone</dt>
                    <dd className="mt-1 font-medium">{userDetails?.phone ?? 'Not available'}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Region</dt>
                    <dd className="mt-1 font-medium">
                      {userDetails
                        ? `${userDetails.address.city}, ${userDetails.address.country}`
                        : 'Loading profile...'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : null}
          {tab === 'orders' ? (
            <div>
              <h2 className="font-display text-2xl font-semibold">Order history</h2>
              {orders.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    icon={Package}
                    title="No orders yet"
                    description="Your completed orders will appear here."
                    action={
                      <Button onClick={() => void navigate('/products')}>Start shopping</Button>
                    }
                  />
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {orders.map((order) => (
                    <article key={order.id} className="surface rounded-3xl border p-6">
                      <div className="flex flex-wrap justify-between gap-4">
                        <div>
                          <p className="font-semibold">{order.id}</p>
                          <p className="mt-1 text-xs text-ink-400">
                            Placed {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                            {order.status}
                          </span>
                          <p className="mt-2 font-semibold">{formatCurrency(order.total)}</p>
                        </div>
                      </div>
                      <div className="mt-5 flex -space-x-2">
                        {order.items.slice(0, 5).map((item) => (
                          <ProductImage
                            key={item.id}
                            className="size-12 rounded-full border-2 border-white bg-ink-100 p-1 dark:border-ink-900"
                            src={item.image ?? item.thumbnail}
                            thumbnail={item.thumbnail}
                            alt={item.title}
                            sizes="3rem"
                          />
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          {tab === 'addresses' ? (
            <div>
              <h2 className="font-display text-2xl font-semibold">Saved addresses</h2>
              {addresses.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    icon={MapPin}
                    title="No saved addresses"
                    description="Your delivery address will be saved after your first order."
                  />
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {addresses.map((address) => (
                    <article key={address.id} className="surface rounded-3xl border p-6">
                      <div className="flex justify-between">
                        <h3 className="font-semibold">{address.label}</h3>
                        {address.isDefault ? (
                          <span className="rounded-full bg-moss-100 px-2 py-1 text-xs font-bold text-moss-800">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <address className="mt-4 text-sm leading-6 text-ink-500 not-italic dark:text-ink-400">
                        {address.firstName} {address.lastName}
                        <br />
                        {address.address}
                        <br />
                        {address.city}, {address.state} {address.postalCode}
                        <br />
                        {address.country}
                        <br />
                        {address.phone}
                      </address>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          {tab === 'wishlist' ? (
            <div>
              <h2 className="font-display text-2xl font-semibold">Your wishlist</h2>
              {wishlist.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    icon={Heart}
                    title="Nothing saved yet"
                    description="Products you favorite will appear here."
                  />
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3">
                  {wishlist.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
