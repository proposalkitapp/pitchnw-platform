"use client";

import { Link, useLocation } from "react-router-dom";
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
    const pathname = useLocation().pathname;
    const isActive = end ? pathname === to : pathname.startsWith(to);

    const computedClassName = typeof className === 'function' 
      ? className({ isActive }) 
      : cn(className, isActive && activeClassName);

    return (
      <Link
        to={to}
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
