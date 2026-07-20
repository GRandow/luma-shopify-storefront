import { ArrowRight, Camera, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Logo } from '@/components/brand/Logo';

const footerLinks: Record<string, Array<readonly [string, string]>> = {
  Shop: [
    ['All products', '/products'],
    ['Collections', '/categories'],
    ['Wishlist', '/wishlist'],
    ['Cart', '/cart'],
  ],
  Company: [
    ['Our story', '/about'],
    ['Journal', '/journal'],
    ['Contact', '/contact'],
    ['Careers', '/careers'],
  ],
};

export function Footer() {
  return (
    <footer className="mt-20 border-t border-black/5 bg-sand dark:border-white/8 dark:bg-ink-900">
      <div className="page-shell grid gap-12 py-14 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm leading-7 text-ink-500 dark:text-ink-400">
            Considered objects for a calmer, more useful everyday. Curated with an eye for lasting
            design.
          </p>
          <div className="mt-6 flex gap-2">
            <a
              className="focus-ring rounded-full p-2.5 hover:bg-black/5 dark:hover:bg-white/8"
              href="https://instagram.com"
              aria-label="Instagram"
            >
              <Camera className="size-5" />
            </a>
            <a
              className="focus-ring rounded-full p-2.5 hover:bg-black/5 dark:hover:bg-white/8"
              href="https://github.com"
              aria-label="GitHub"
            >
              <Code2 className="size-5" />
            </a>
          </div>
        </div>
        {Object.entries(footerLinks).map(([group, links]) => (
          <div key={group}>
            <h2 className="text-sm font-bold">{group}</h2>
            <ul className="mt-4 space-y-3">
              {links.map(([label, path]) => (
                <li key={label}>
                  <Link
                    className="focus-ring rounded text-sm text-ink-500 hover:text-ink-950 dark:text-ink-400 dark:hover:text-white"
                    to={path}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-black/5 py-5 dark:border-white/8">
        <div className="page-shell flex flex-col justify-between gap-3 text-xs text-ink-500 sm:flex-row dark:text-ink-400">
          <p>© {new Date().getFullYear()} Luma Goods. Built as a headless commerce reference.</p>
          <button
            className="focus-ring flex w-fit items-center gap-1 rounded hover:text-ink-950 dark:hover:text-white"
            onClick={() => toast.info('Privacy preferences are already set to essential only.')}
          >
            Privacy preferences <ArrowRight className="size-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
