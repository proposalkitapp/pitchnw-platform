"use client";

import Link from 'next/link';
import { usePathname } from "next/navigation";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  to: string;
  className?: string | ((props: { isActive: boolean }) => string);
  activeClassName?: string;
  children: ReactNode;
  end?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, to, end, children, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = end ? pathname === to : pathname.startsWith(to);

    const computedClassName = typeof className === 'function' 
      ? className({ isActive }) 
      : cn(className, isActive && activeClassName);

    return (
      <Link
        href={to}
        ref={ref}
        className={computedClassName}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
