'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, LayoutDashboard, User } from 'lucide-react';

const TABS = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/log', label: 'Log Symptoms', Icon: ClipboardList },
  { href: '/profile', label: 'Profile', Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bnav">
      <div className="bnav-inner">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={active ? 'active' : ''}>
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
