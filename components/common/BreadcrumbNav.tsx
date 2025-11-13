'use client';
 
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/store/hooks';
 
interface BreadcrumbItem {
  label: string;
  href?: string;
}
 
interface BreadcrumbsNavBarProps {
  customItems?: BreadcrumbItem[];
  showPathSegments?: boolean;
}
 
const BreadcrumbsNavBar = ({
  customItems,
  showPathSegments = true
}: BreadcrumbsNavBarProps) => {
  const pathname = usePathname();
  // const { companyThemeColor } = useTheme();
 
  // Generate breadcrumbs from custom items or URL path
  const breadcrumbItems: BreadcrumbItem[] = customItems || (() => {
    if (!showPathSegments) return [];
   
    const pathSegments = pathname.split('/').filter(Boolean);
    return pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = decodeURIComponent(segment)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
     
      return { label, href };
    });
  })();

  return (
    <nav aria-label="breadcrumbs">
      <ol style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0 }}>
        <li>
          <Link href="/dashboard">Home</Link>
        </li>
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
 
          return (
            <li key={`${item.label}-${index}`} style={{ marginLeft: 3 }}>
              <span style={{ margin: '0 3px' }}>{'>'}</span>
              {isLast || !item.href ? (
                // <span style={{ color: companyThemeColor || '#C81C1F' }}>
                <span style={{ color:'#C81C1F' }}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
 
export default BreadcrumbsNavBar;
 