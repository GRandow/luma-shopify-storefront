import { useState } from 'react';
import {
  ExternalLink,
  Heart,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader } from '@/components/ui/PageLoader';
import { ProductImage } from '@/components/ui/ProductImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCustomer, useCustomerOrders } from '@/features/auth/customer-queries';
import { signOut } from '@/features/auth/session';
import { useClearCart } from '@/features/cart/cart-queries';
import { ProductCard } from '@/features/products/components/ProductCard';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';
import type { Address, Customer, Order } from '@/types/user';
import { formatDate, formatMoney } from '@/utils/format';

type ProfileTab = 'overview' | 'orders' | 'addresses' | 'wishlist';

/** `gid://shopify/Customer/123` → `123`. */
function customerNumber(id: string): string {
  return id.split('/').pop() ?? id;
}

function initials(customer: Customer): string {
  const letters = [customer.firstName, customer.lastName]
    .map((part) => part.trim().charAt(0))
    .join('');
  return (letters || customer.displayName.charAt(0) || '?').toUpperCase();
}

function paymentTone(status: string): 'success' | 'warning' | 'neutral' {
  if (status === 'Paid') return 'success';
  if (status.includes('refunded') || status === 'Voided') return 'neutral';
  return 'warning';
}

function fulfillmentTone(status: string): 'success' | 'warning' | 'neutral' {
  if (status === 'Fulfilled') return 'success';
  if (status === 'Partially fulfilled' || status === 'In progress') return 'warning';
  return 'neutral';
}

/**
 * The account area. Profile, addresses and orders come from Shopify's
 * Customer Account API (`features/auth/customer-queries.ts`); the wishlist
 * is kept in the browser.
 */
export default function ProfilePage() {
  const [tab, setTab] = useState<ProfileTab>('overview');
  const navigate = useNavigate();
  const customerQuery = useCustomer();
  const ordersQuery = useCustomerOrders();
  const clearCart = useClearCart();
  const wishlist = useWishlistStore((state) => state.items);
  const customer = customerQuery.data ?? null;

  if (!customer) {
    if (customerQuery.isError) {
      return (
        <div className="page-shell py-14">
          <EmptyState
            icon={UserRound}
            title="Your account is unavailable"
            description="We could not load your profile from Shopify. Please try again."
            action={<Button onClick={() => void customerQuery.refetch()}>Try again</Button>}
          />
        </div>
      );
    }
    return <PageLoader />;
  }

  const orders = ordersQuery.data?.pages.flatMap((page) => page.orders) ?? [];
  const ordersLabel = `${orders.length}${ordersQuery.hasNextPage ? '+' : ''}`;
  const tabs: Array<{ id: ProfileTab; label: string; icon: LucideIcon }> = [
    { id: 'overview', label: 'Overview', icon: UserRound },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
  ];
  const metrics: Array<{ icon: LucideIcon; value: string; label: string; tab: ProfileTab }> = [
    { icon: Package, value: ordersLabel, label: 'Orders placed', tab: 'orders' },
    {
      icon: MapPin,
      value: String(customer.addresses.length),
      label: 'Saved addresses',
      tab: 'addresses',
    },
    { icon: Heart, value: String(wishlist.length), label: 'Wishlist items', tab: 'wishlist' },
  ];
  const greetingName = customer.firstName || customer.displayName;

  function handleSignOut() {
    // The cart was tied to this customer; a new visitor starts with a fresh one.
    clearCart();
    signOut();
  }

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title={`Good to see you, ${greetingName}`}
        description="Manage your orders, saved delivery details, and the pieces you have kept close."
      />
      <div className="page-shell grid gap-8 py-12 lg:grid-cols-[14rem_1fr]">
        <aside>
          <div className="surface rounded-3xl border p-3">
            <div className="flex items-center gap-3 p-3">
              <span
                className="grid size-11 shrink-0 place-items-center rounded-full bg-moss-100 text-sm font-bold text-moss-800 dark:bg-moss-900 dark:text-moss-200"
                aria-hidden="true"
              >
                {initials(customer)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{customer.displayName}</p>
                <p className="truncate text-xs text-ink-400">{customer.email ?? 'No email'}</p>
              </div>
            </div>
            <nav className="mt-3 space-y-1" aria-label="Profile sections">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${tab === id ? 'bg-ink-100 text-ink-950 dark:bg-white/10 dark:text-white' : 'text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5'}`}
                  onClick={() => setTab(id)}
                  aria-current={tab === id ? 'page' : undefined}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </nav>
            <button
              className="focus-ring mt-3 flex w-full items-center gap-3 border-t border-black/5 px-3 pt-4 pb-2 text-sm font-medium text-red-600 dark:border-white/8 dark:text-red-400"
              onClick={handleSignOut}
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
                    <dd className="mt-1 font-medium">{customer.displayName}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Email</dt>
                    <dd className="mt-1 font-medium">{customer.email ?? 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Phone</dt>
                    <dd className="mt-1 font-medium">{customer.phone ?? 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Customer ID</dt>
                    <dd className="mt-1 font-medium">#{customerNumber(customer.id)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-ink-400">Default address</dt>
                    <dd className="mt-1 font-medium">
                      {customer.defaultAddress
                        ? [
                            customer.defaultAddress.address,
                            customer.defaultAddress.city,
                            customer.defaultAddress.country,
                          ]
                            .filter(Boolean)
                            .join(', ')
                        : 'None yet — it is saved with your first order.'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : null}
          {tab === 'orders' ? (
            <div>
              <h2 className="font-display text-2xl font-semibold">Order history</h2>
              <OrdersSection
                orders={orders}
                isPending={ordersQuery.isPending}
                isError={ordersQuery.isError}
                hasNextPage={ordersQuery.hasNextPage}
                isFetchingNextPage={ordersQuery.isFetchingNextPage}
                onLoadMore={() => void ordersQuery.fetchNextPage()}
                onRetry={() => void ordersQuery.refetch()}
                onStartShopping={() => void navigate('/products')}
              />
            </div>
          ) : null}
          {tab === 'addresses' ? (
            <div>
              <h2 className="font-display text-2xl font-semibold">Saved addresses</h2>
              {customer.addresses.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    icon={MapPin}
                    title="No saved addresses"
                    description="Your delivery address is saved with your first order."
                  />
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {customer.addresses.map((address) => (
                    <AddressCard key={address.id} address={address} />
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

interface OrdersSectionProps {
  orders: Order[];
  isPending: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onStartShopping: () => void;
}

function OrdersSection({
  orders,
  isPending,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onRetry,
  onStartShopping,
}: OrdersSectionProps) {
  if (isPending) {
    return (
      <div className="mt-6 space-y-4" role="status" aria-label="Loading orders">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-36 rounded-3xl" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="mt-6">
        <EmptyState
          icon={RefreshCw}
          title="Orders are unavailable"
          description="We could not load your orders from Shopify. Please try again."
          action={<Button onClick={onRetry}>Try again</Button>}
        />
      </div>
    );
  }
  if (orders.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Orders you place at checkout will appear here."
          action={<Button onClick={onStartShopping}>Start shopping</Button>}
        />
      </div>
    );
  }
  return (
    <div className="mt-6 space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
      {hasNextPage ? (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" loading={isFetchingNextPage} onClick={onLoadMore}>
            Load more orders
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="surface rounded-3xl border p-6" aria-label={`Order ${order.name}`}>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="font-semibold">Order {order.name}</p>
          <p className="mt-1 text-xs text-ink-400">
            Placed {formatDate(order.processedAt)} · {itemCount}{' '}
            {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="text-right">
          <div className="flex flex-wrap justify-end gap-2">
            <Badge tone={paymentTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
            <Badge tone={fulfillmentTone(order.fulfillmentStatus)}>{order.fulfillmentStatus}</Badge>
          </div>
          <p className="mt-2 font-semibold">{formatMoney(order.total)}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <div className="flex -space-x-2">
          {order.items.slice(0, 5).map((item) => (
            <ProductImage
              key={item.id}
              className="size-12 rounded-full border-2 border-white bg-ink-100 dark:border-ink-900"
              image={item.image}
              alt={item.title}
              sizes="3rem"
            />
          ))}
        </div>
        {order.items.length > 5 ? (
          <span className="text-xs text-ink-400">+{order.items.length - 5} more</span>
        ) : null}
      </div>
      <ul className="mt-4 space-y-1 text-sm text-ink-600 dark:text-ink-300">
        {order.items.slice(0, 3).map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span className="truncate">
              {item.title}
              {item.variantTitle ? (
                <span className="text-ink-400"> · {item.variantTitle}</span>
              ) : null}
            </span>
            <span className="shrink-0 text-ink-400">× {item.quantity}</span>
          </li>
        ))}
      </ul>
      {order.statusPageUrl ? (
        <a
          className="focus-ring mt-5 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-moss-700 hover:underline dark:text-moss-300"
          href={order.statusPageUrl}
          target="_blank"
          rel="noreferrer"
        >
          Track this order
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      ) : null}
    </article>
  );
}

function AddressCard({ address }: { address: Address }) {
  return (
    <article className="surface rounded-3xl border p-6">
      <div className="flex justify-between">
        <h3 className="font-semibold">{address.label}</h3>
        {address.isDefault ? <Badge tone="success">Default</Badge> : null}
      </div>
      <address className="mt-4 text-sm leading-6 text-ink-500 not-italic dark:text-ink-400">
        {address.firstName} {address.lastName}
        <br />
        {address.address}
        <br />
        {[address.city, address.state].filter(Boolean).join(', ')} {address.postalCode}
        <br />
        {address.country}
        {address.phone ? (
          <>
            <br />
            {address.phone}
          </>
        ) : null}
      </address>
    </article>
  );
}
