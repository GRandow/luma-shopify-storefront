import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { PageLoader } from '@/components/ui/PageLoader';
import { QuickViewModal } from '@/features/products/components/QuickViewModal';
import { CompareTray } from '@/features/products/components/CompareTray';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';

export function StorefrontLayout() {
  useScrollRestoration();

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <QuickViewModal />
      <CompareTray />
    </div>
  );
}
