import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, CreditCard, LockKeyhole, PackageCheck, Truck } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { FormField, SelectField } from '@/components/ui/FormField';
import { PageLoader } from '@/components/ui/PageLoader';
import { OrderSummary } from '@/features/cart/components/OrderSummary';
import { useCart, useClearCart } from '@/features/cart/cart-queries';
import { useAuthStore } from '@/features/auth/auth-store';
import { checkoutSchema, type CheckoutFormValues } from '@/features/checkout/checkout-schema';
import { useDiscoveryStore } from '@/features/discovery/discovery-store';
import { cartLineToProductSnapshot, getLineVariantTitle, type Cart } from '@/types/cart';
import type { Address, Order } from '@/types/user';
import { calculatePriceSummary } from '@/utils/pricing';
import { formatMoney } from '@/utils/format';

const steps = [
  { label: 'Customer', icon: Check },
  { label: 'Shipping', icon: Truck },
  { label: 'Payment', icon: CreditCard },
  { label: 'Confirmation', icon: PackageCheck },
] as const;

/**
 * Demonstration checkout. Prices come from the Shopify cart; the shipping
 * estimate and the payment step are simulated. With `VITE_HOSTED_CHECKOUT`
 * enabled the cart page sends shoppers to Shopify's checkout instead.
 */
export default function CheckoutPage() {
  const cartQuery = useCart();
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const cart = cartQuery.data ?? null;

  if (completedOrder) return <OrderConfirmation order={completedOrder} />;
  if (cartQuery.isLoading) return <PageLoader />;
  if (!cart || cart.lines.length === 0) return <Navigate to="/cart" replace />;

  return <CheckoutForm cart={cart} onComplete={setCompletedOrder} />;
}

interface CheckoutFormProps {
  cart: Cart;
  onComplete: (order: Order) => void;
}

function CheckoutForm({ cart, onComplete }: CheckoutFormProps) {
  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const user = useAuthStore((state) => state.user);
  const addOrder = useAuthStore((state) => state.addOrder);
  const addAddress = useAuthStore((state) => state.addAddress);
  const recordPurchase = useDiscoveryStore((state) => state.recordPurchase);
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: {
      customer: {
        email: user?.email ?? '',
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        phone: '',
      },
      shipping: {
        address: '',
        apartment: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
        shippingMethod: 'standard',
      },
      payment: {
        cardholderName: user ? `${user.firstName} ${user.lastName}` : '',
        cardNumber: '',
        expiry: '',
        cvv: '',
      },
    },
  });
  const selectedShippingMethod = useWatch({
    control: form.control,
    name: 'shipping.shippingMethod',
  });
  const summary = useMemo(
    () => calculatePriceSummary(cart, selectedShippingMethod ?? 'standard'),
    [cart, selectedShippingMethod],
  );

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  async function nextStep() {
    const fields: Array<
      Array<
        | keyof CheckoutFormValues
        | `customer.${keyof CheckoutFormValues['customer']}`
        | `shipping.${keyof CheckoutFormValues['shipping']}`
      >
    > = [
      ['customer.email', 'customer.firstName', 'customer.lastName', 'customer.phone'],
      [
        'shipping.address',
        'shipping.city',
        'shipping.state',
        'shipping.postalCode',
        'shipping.country',
        'shipping.shippingMethod',
      ],
    ];
    const valid = await form.trigger(fields[step] ?? []);
    if (valid) setStep((current) => Math.min(current + 1, 2));
  }

  async function placeOrder(values: CheckoutFormValues) {
    setProcessing(true);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 900));
    const address: Address = {
      id: crypto.randomUUID(),
      label: 'Home',
      firstName: values.customer.firstName,
      lastName: values.customer.lastName,
      address: `${values.shipping.address}${values.shipping.apartment ? `, ${values.shipping.apartment}` : ''}`,
      city: values.shipping.city,
      state: values.shipping.state,
      postalCode: values.shipping.postalCode,
      country: values.shipping.country,
      phone: values.customer.phone,
      isDefault: true,
    };
    const order: Order = {
      id: `LM-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      status: 'Processing',
      items: cart.lines.map((line) => ({
        id: line.id,
        variantId: line.merchandise.id,
        handle: line.merchandise.product.handle,
        title: line.merchandise.product.title,
        variantTitle: getLineVariantTitle(line),
        image: line.merchandise.image,
        price: line.cost.perQuantity,
        quantity: line.quantity,
      })),
      total: summary.total,
      shippingAddress: address,
    };
    addOrder(order);
    addAddress(address);
    recordPurchase(cart.lines.map(cartLineToProductSnapshot));
    setProcessing(false);
    // The cart is cleared by the confirmation screen once it is on screen, so
    // this form never sees an empty cart and bounces back to the bag.
    onComplete(order);
    toast.success('Order placed successfully');
  }

  return (
    <div className="page-shell py-10 sm:py-14">
      <CheckoutProgress step={step} />
      <form
        className="grid gap-10 lg:grid-cols-[1fr_23rem]"
        onSubmit={(event) => {
          void form.handleSubmit(placeOrder)(event);
        }}
        noValidate
      >
        <section className="surface rounded-3xl border p-6 sm:p-8">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="focus:outline-none font-display text-3xl font-semibold tracking-tight"
          >
            {steps[step]?.label}
          </h1>
          {step === 0 ? (
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <FormField
                id="checkout-email"
                label="Email"
                type="email"
                autoComplete="email"
                className="sm:col-span-2"
                error={form.formState.errors.customer?.email?.message}
                {...form.register('customer.email')}
              />
              <FormField
                id="checkout-first-name"
                label="First name"
                autoComplete="given-name"
                error={form.formState.errors.customer?.firstName?.message}
                {...form.register('customer.firstName')}
              />
              <FormField
                id="checkout-last-name"
                label="Last name"
                autoComplete="family-name"
                error={form.formState.errors.customer?.lastName?.message}
                {...form.register('customer.lastName')}
              />
              <FormField
                id="checkout-phone"
                label="Phone"
                type="tel"
                autoComplete="tel"
                className="sm:col-span-2"
                error={form.formState.errors.customer?.phone?.message}
                {...form.register('customer.phone')}
              />
            </div>
          ) : null}
          {step === 1 ? (
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <FormField
                id="shipping-address"
                label="Street address"
                autoComplete="street-address"
                className="sm:col-span-2"
                error={form.formState.errors.shipping?.address?.message}
                {...form.register('shipping.address')}
              />
              <FormField
                id="shipping-apartment"
                label="Apartment, suite (optional)"
                className="sm:col-span-2"
                error={form.formState.errors.shipping?.apartment?.message}
                {...form.register('shipping.apartment')}
              />
              <FormField
                id="shipping-city"
                label="City"
                autoComplete="address-level2"
                error={form.formState.errors.shipping?.city?.message}
                {...form.register('shipping.city')}
              />
              <FormField
                id="shipping-state"
                label="State / region"
                autoComplete="address-level1"
                error={form.formState.errors.shipping?.state?.message}
                {...form.register('shipping.state')}
              />
              <FormField
                id="shipping-postal"
                label="Postal code"
                autoComplete="postal-code"
                error={form.formState.errors.shipping?.postalCode?.message}
                {...form.register('shipping.postalCode')}
              />
              <SelectField
                id="shipping-country"
                label="Country"
                autoComplete="country-name"
                error={form.formState.errors.shipping?.country?.message}
                {...form.register('shipping.country')}
              >
                <option>United States</option>
                <option>Canada</option>
                <option>Brazil</option>
                <option>United Kingdom</option>
              </SelectField>
              <fieldset className="sm:col-span-2">
                <legend className="mb-3 text-sm font-semibold">Shipping method</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ['standard', 'Standard', '3–5 business days'],
                      ['express', 'Express', '1–2 business days'],
                    ] as const
                  ).map(([value, label, detail]) => (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-2xl border p-4 ${selectedShippingMethod === value ? 'border-moss-600 bg-moss-50 dark:bg-moss-950' : ''}`}
                    >
                      <input
                        type="radio"
                        value={value}
                        className="mr-2 accent-moss-600"
                        {...form.register('shipping.shippingMethod')}
                      />
                      <strong className="text-sm">{label}</strong>
                      <p className="mt-1 pl-5 text-xs text-ink-400">{detail}</p>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : null}
          {step === 2 ? (
            <div className="mt-7">
              <div className="mb-6 flex items-center gap-2 rounded-2xl bg-moss-50 p-4 text-sm text-moss-800 dark:bg-moss-950 dark:text-moss-200">
                <LockKeyhole className="size-4" />
                Payment is simulated. Use any 16-digit number.
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  id="card-name"
                  label="Name on card"
                  autoComplete="cc-name"
                  className="sm:col-span-2"
                  error={form.formState.errors.payment?.cardholderName?.message}
                  {...form.register('payment.cardholderName')}
                />
                <FormField
                  id="card-number"
                  label="Card number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  className="sm:col-span-2"
                  error={form.formState.errors.payment?.cardNumber?.message}
                  {...form.register('payment.cardNumber')}
                />
                <FormField
                  id="card-expiry"
                  label="Expiry"
                  autoComplete="cc-exp"
                  placeholder="12/30"
                  error={form.formState.errors.payment?.expiry?.message}
                  {...form.register('payment.expiry')}
                />
                <FormField
                  id="card-cvv"
                  label="Security code"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  error={form.formState.errors.payment?.cvv?.message}
                  {...form.register('payment.cvv')}
                />
              </div>
            </div>
          ) : null}
          <div className="mt-8 flex justify-between gap-3">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep((current) => current - 1)}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < 2 ? (
              <Button onClick={() => void nextStep()}>Continue</Button>
            ) : (
              <Button type="submit" loading={processing} icon={<LockKeyhole className="size-4" />}>
                Pay {formatMoney(summary.total)}
              </Button>
            )}
          </div>
        </section>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary cart={cart} summary={summary} />
        </aside>
      </form>
    </div>
  );
}

function CheckoutProgress({ step }: { step: number }) {
  return (
    <div className="mb-10 flex items-center justify-center" aria-label="Checkout progress">
      {steps.map((item, index) => (
        <div key={item.label} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <span
              className={`grid size-9 place-items-center rounded-full text-sm font-semibold ${index <= step ? 'bg-ink-950 text-white dark:bg-white dark:text-ink-950' : 'bg-ink-100 text-ink-400 dark:bg-ink-800'}`}
            >
              {index < step ? <Check className="size-4" /> : index + 1}
            </span>
            <span
              className={`hidden text-xs font-semibold sm:block ${index <= step ? '' : 'text-ink-400'}`}
            >
              {item.label}
            </span>
          </div>
          {index < steps.length - 1 ? (
            <span
              className={`mx-2 mb-6 h-px w-10 sm:w-20 ${index < step ? 'bg-ink-950 dark:bg-white' : 'bg-ink-200 dark:bg-ink-700'}`}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function OrderConfirmation({ order }: { order: Order }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const clearCart = useClearCart();

  useEffect(() => {
    // The order is placed; forget the Shopify cart so the next visit starts fresh.
    clearCart();
    headingRef.current?.focus();
  }, [clearCart]);

  return (
    <div className="page-shell py-10 sm:py-14">
      <CheckoutProgress step={3} />
      <section className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-moss-100 text-moss-800 dark:bg-moss-900 dark:text-moss-200">
          <Check className="size-7" />
        </div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="focus:outline-none font-display mt-6 text-4xl font-semibold tracking-tight"
        >
          Thank you, {order.shippingAddress.firstName}.
        </h1>
        <p className="mt-3 text-ink-500 dark:text-ink-400">
          Order <strong className="text-ink-900 dark:text-white">{order.id}</strong> is confirmed.
          We are getting it ready now.
        </p>
        <div className="surface mt-8 rounded-3xl border p-6 text-left">
          <div className="flex justify-between">
            <span className="text-ink-500 dark:text-ink-400">Order total</span>
            <strong>{formatMoney(order.total)}</strong>
          </div>
          <div className="mt-4 flex justify-between">
            <span className="text-ink-500 dark:text-ink-400">Status</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
              {order.status}
            </span>
          </div>
        </div>
        <div className="mt-7 flex justify-center gap-3">
          <Link
            className="focus-ring inline-flex h-11 items-center rounded-full bg-ink-950 px-5 text-sm font-semibold text-white dark:bg-white dark:text-ink-950"
            to="/profile"
          >
            View your orders
          </Link>
          <Link
            className="focus-ring inline-flex h-11 items-center rounded-full border border-ink-200 px-5 text-sm font-semibold dark:border-white/15"
            to="/products"
          >
            Continue shopping
          </Link>
        </div>
      </section>
    </div>
  );
}
