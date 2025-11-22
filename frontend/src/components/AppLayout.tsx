import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
      
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
