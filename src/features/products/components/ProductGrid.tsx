import { motion } from 'framer-motion';
import { ProductCard } from '@/features/products/components/ProductCard';
import { toProductSnapshot, type Product } from '@/types/product';

interface ProductGridProps {
  products: Product[];
  priorityCount?: number;
}

export function ProductGrid({ products, priorityCount = 0 }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -80px' }}
          transition={{ duration: 0.35, delay: Math.min(index % 4, 3) * 0.04 }}
        >
          <ProductCard product={toProductSnapshot(product)} priority={index < priorityCount} />
        </motion.div>
      ))}
    </div>
  );
}
