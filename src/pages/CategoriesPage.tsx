import { Navigate } from 'react-router-dom';

/** Legacy route: the catalog is organised in Shopify collections now. */
export default function CategoriesPage() {
  return <Navigate to="/collections" replace />;
}
