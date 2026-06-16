import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  className,
}) => {
  return (
    <div className={cn("flex flex-col gap-2 mb-8", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-white transition-colors duration-200"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>
          
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-white/20" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-white transition-colors duration-200 capitalize"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-white/70 capitalize">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title & Subtitle */}
      <div className="flex flex-col gap-1 mt-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-white/50 max-w-2xl font-normal leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
