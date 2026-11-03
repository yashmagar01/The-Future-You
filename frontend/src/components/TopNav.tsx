import { Search, Bell, HelpCircle, Settings, Flame } from 'lucide-react';
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
import { usePlay } from '@/contexts/PlayContext';

export function TopNav() {
  const { user, signOut } = useAuth();
  const { streak, playerLevel, xp } = usePlay();

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
        <div className="flex items-center gap-3">
          {/* Level Pill */}
          <Link
            to="/play"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-semibold transition-all hover:scale-105"
            title={`Level ${playerLevel.level}: ${playerLevel.currentRank.title} (${xp} XP)`}
          >
            <span className="text-sm">{playerLevel.currentRank.emoji}</span>
            <span>Lv. {playerLevel.level}</span>
            <span className="text-emerald-300">·</span>
            <span className="flex items-center gap-0.5 text-orange-600 font-bold">
              <Flame className="h-3.5 w-3.5" />
              {streak}d
            </span>
          </Link>
          {/* Notifications */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative before:absolute before:-inset-1 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500" aria-label="Notifications">
            <Bell className="h-5 w-5 text-gray-600" />
          </button>

          {/* Help */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative before:absolute before:-inset-1 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500" aria-label="Help">
            <HelpCircle className="h-5 w-5 text-gray-600" />
          </button>

          {/* Settings */}
          <Link to="/settings" aria-label="Settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative before:absolute before:-inset-1 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
            <Settings className="h-5 w-5 text-gray-600" />
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2" aria-label="Account menu">
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
              <DropdownMenuItem onClick={() => signOut()}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
