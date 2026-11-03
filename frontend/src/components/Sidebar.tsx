import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Video, 
  FolderOpen, 
  BarChart3, 
  Gamepad2,
  User, 
  Settings,
  Sparkles,
  GraduationCap, // NEW: graduation-cap icon for the Learn item
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const navigationItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Play', href: '/play', icon: Gamepad2 },
  { name: 'Record', href: '/record', icon: Video },
  { name: 'Learn', href: '/learn', icon: GraduationCap }, // NEW: label, URL to open, icon to draw
  { name: 'Gallery', href: '/gallery', icon: FolderOpen },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Companion', href: '/companion', icon: Sparkles },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ collapsed: controlledCollapsed, onCollapse }: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const location = useLocation();

  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapse ?? setInternalCollapsed;

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out z-30',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <nav className="flex flex-col h-full">
        <div className="flex-1 py-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center px-4 py-3 mx-2 rounded-lg transition-colors duration-200',
                  'hover:bg-gray-100',
                  isActive && 'bg-green-50 text-green-600 border-l-4 border-green-600 ml-0 pl-3.5',
                  !isActive && 'text-gray-600'
                )}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-green-600')} />
                {!collapsed && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center p-4 border-t border-gray-200 hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 text-gray-600" />
              <span className="ml-2 text-sm text-gray-600">Collapse</span>
            </>
          )}
        </button>
      </nav>
    </aside>
  );
}
