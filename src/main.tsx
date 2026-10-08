import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { captureReferralFromUrl } from '@/features/referral/referral-capture';
// Self-hosted (bundled) fonts: no render-blocking request to a third-party origin.
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import '@/styles/index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element was not found.');
}

// Distributor links (`/?ref=CODE`) are read before the router takes over the URL.
captureReferralFromUrl();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
