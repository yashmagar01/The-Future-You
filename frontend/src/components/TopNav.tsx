import { Search, Bell, HelpCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

export function TopNav() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌟</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Yash</h1>
            <p className="text-xs text-gray-500">The Future You</p>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search... ⌘K"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5 text-gray-600" />
          </button>

          {/* Help */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HelpCircle className="h-5 w-5 text-gray-600" />
          </button>

          {/* Settings */}
          <Link to="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="h-5 w-5 text-gray-600" />
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar>
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.user_metadata?.full_name || 'User'}</span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
