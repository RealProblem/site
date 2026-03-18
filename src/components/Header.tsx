'use client';

import Link from 'next/link';

export default function Header() {
  const navItems = [
    { label: '首页', href: '/' },
    { label: '浏览', href: '/browse' },
    { label: '投稿', href: '/submit' },
    { label: '关于', href: '/about' },
  ];

  return (
    <header className="border-b border-stone-200 bg-white">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-serif font-bold tracking-tight text-stone-900 hover:text-stone-600 transition-colors"
          >
            RealProblem
          </Link>

          {/* Nav Links */}
          <ul className="flex gap-8">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
