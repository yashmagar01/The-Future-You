import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, LogOut, Home, Video, Image as ImageIcon, TrendingUp, Menu, X, User, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/home/Footer";

interface LayoutProps {
  children: ReactNode;
}

const navLinks = [
  { name: "Home", path: "/", icon: Home },
  { name: "Record", path: "/record", icon: Video },
  { name: "Gallery", path: "/gallery", icon: ImageIcon },
  { name: "Dashboard", path: "/dashboard", icon: TrendingUp },
];

const userLinks = [
  { name: "Profile", path: "/profile", icon: User },
  { name: "Settings", path: "/settings", icon: Settings },
];

const NavLink = ({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick?: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className="relative" onClick={onClick}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm",
          "font-medium transition-all duration-300",
          isActive
            ? "text-brand-green bg-brand-green/10"
            : "text-slate-600 hover:text-brand-green hover:bg-brand-green/5"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </motion.div>
    </Link>
  );
};

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "Come back soon!",
    });
    navigate("/login");
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <nav
        className={cn(
          "sticky top-0 z-50",
          "px-4 py-4",
          "transition-all duration-300",
          "backdrop-blur-md",
          "border-b",
          isScrolled
            ? "bg-white/80 border-slate-200 shadow-sm"
            : "bg-white/60 border-transparent"
        )}
      >
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-brand-green p-1.5 rounded-lg shadow-sm"
              >
                <Sparkles className="h-5 w-5 text-white transition-transform" />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-brand-green tracking-tight">
                  Yash
                </span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Nav Links - Centered */}
          <div className="hidden md:flex items-center justify-center flex-1 px-8">
            <div className="flex items-center gap-1 bg-white/50 p-1 rounded-full border border-slate-100 shadow-sm">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  icon={link.icon}
                  label={link.name}
                />
              ))}
            </div>
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Join Waitlist CTA */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="default"
                size="sm"
                asChild
                className="hidden lg:inline-flex bg-brand-green text-white hover:bg-brand-green/90 rounded-full px-6 font-medium shadow-lg shadow-brand-green/20"
              >
                <Link to="/waitlist">Join Waitlist</Link>
              </Button>
            </motion.div>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center h-11 w-11 focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 rounded-full transition-all"
                    aria-label="Open profile menu"
                  >
                    <Avatar className="h-9 w-9 border-2 border-brand-green/20 shadow-sm cursor-pointer">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                      <AvatarFallback className="bg-brand-green text-white text-xs font-bold">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </motion.button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-slate-200 shadow-xl">
                  <DropdownMenuLabel className="px-2 py-1.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-brand-green">
                        {user?.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 leading-none">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator className="bg-slate-100" />
                  
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-brand-green/5 focus:text-brand-green">
                    <Link to="/dashboard" className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-brand-green/5 focus:text-brand-green">
                    <Link to="/gallery" className="flex items-center">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Gallery
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-slate-100" />
                  
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-brand-green/5 focus:text-brand-green">
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-brand-green/5 focus:text-brand-green">
                    <Link to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-slate-100" />
                  
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 rounded-lg"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-full px-4 font-medium"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
              </motion.div>
            )}

            {/* Mobile/Tablet Menu Trigger */}
            <div className="md:hidden ml-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-11 w-11 rounded-lg hover:bg-brand-green/10 active:bg-brand-green/20 text-brand-green transition-colors"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                {/* Mobile: Top Dropdown (< 768px) */}
                <SheetContent 
                  side="top" 
                  className="w-full border-b-slate-200/50 p-0 rounded-b-3xl shadow-2xl md:hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="flex flex-col max-h-[85vh] overflow-y-auto">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100/80">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-brand-green p-2 rounded-xl shadow-sm">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-brand-green tracking-tight">
                          Yash
                        </span>
                      </div>
                      <span className="font-semibold text-brand-green text-base">Menu</span>
                    </div>
                    
                    {/* Navigation Links */}
                    <div className="flex flex-col px-4 py-5 gap-1">
                      {navLinks.map((link) => (
                        <SheetClose key={link.path} asChild>
                          <Link
                            to={link.path}
                            className={cn(
                              "flex items-center gap-4 px-5 py-4 rounded-xl text-base font-medium transition-all duration-200",
                              location.pathname === link.path
                                ? "bg-brand-green/10 text-brand-green shadow-sm"
                                : "text-slate-700 hover:bg-slate-50 hover:text-brand-green"
                            )}
                          >
                            <link.icon className={cn(
                              "h-5 w-5",
                              location.pathname === link.path ? "text-brand-green" : "text-slate-500"
                            )} />
                            {link.name}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>

                    {/* User Links Section */}
                    {user && (
                      <>
                        {/* Visual Separator */}
                        <div className="mx-4 my-2 border-t border-slate-100" />
                        
                        <div className="px-4 py-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5">Account</p>
                        </div>
                        <div className="flex flex-col px-4 pb-3 gap-1">
                          {userLinks.map((link) => (
                            <SheetClose key={link.path} asChild>
                              <Link
                                to={link.path}
                                className={cn(
                                  "flex items-center gap-4 px-5 py-4 rounded-xl text-base font-medium transition-all duration-200",
                                  location.pathname === link.path
                                    ? "bg-brand-green/10 text-brand-green shadow-sm"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-brand-green"
                                )}
                              >
                                <link.icon className={cn(
                                  "h-5 w-5",
                                  location.pathname === link.path ? "text-brand-green" : "text-slate-500"
                                )} />
                                {link.name}
                              </Link>
                            </SheetClose>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Bottom Actions */}
                    <div className="mt-auto border-t border-slate-100/80 bg-gradient-to-b from-slate-50/30 to-slate-50/60 p-4">
                      {!user && (
                        <div className="flex flex-col gap-3 mb-4">
                          <SheetClose asChild>
                            <Button asChild className="w-full bg-brand-green text-white hover:bg-brand-green/90 rounded-xl h-12 text-base font-medium shadow-lg shadow-brand-green/20">
                              <Link to="/login">Sign In</Link>
                            </Button>
                          </SheetClose>
                          <SheetClose asChild>
                            <Button asChild variant="outline" className="w-full border-brand-green/30 hover:bg-brand-green/5 hover:border-brand-green rounded-xl h-12 text-base font-medium">
                              <Link to="/waitlist">Join Waitlist</Link>
                            </Button>
                          </SheetClose>
                        </div>
                      )}
                      
                      {user && (
                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/40">
                          <Avatar className="h-11 w-11 border-2 border-brand-green/20 shadow-sm">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-brand-green text-white font-bold">
                              {user?.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-brand-green truncate leading-tight">
                              {user?.user_metadata?.full_name || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">
                              {user?.email}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSignOut}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full h-9 w-9"
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop/Tablet Menu Trigger (≥ 768px) */}
            <div className="hidden md:block">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-brand-green/10 text-brand-green">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                {/* Desktop: Left-Side Drawer (≥ 768px) - Supermemory Style */}
                <SheetContent 
                  side="left" 
                  className="w-[400px] max-w-[85vw] p-0 border-r-slate-200/50 shadow-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="flex flex-col h-full">
                    {/* Header Section with Logo */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center shadow-sm">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-semibold text-brand-green">Yash</span>
                      </div>
                      
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <X className="h-5 w-5 text-slate-600" />
                        </Button>
                      </SheetClose>
                    </div>

                    {/* Navigation Links with 8px Grid Spacing */}
                    <nav className="px-6 py-4 space-y-2">
                      {navLinks.map((link) => (
                        <SheetClose key={link.path} asChild>
                          <Link
                            to={link.path}
                            className={cn(
                              "flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                              location.pathname === link.path
                                ? "bg-brand-green/10 text-brand-green shadow-sm"
                                : "text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            <link.icon className={cn(
                              "h-5 w-5",
                              location.pathname === link.path ? "text-brand-green" : "text-slate-500"
                            )} />
                            <span>{link.name}</span>
                          </Link>
                        </SheetClose>
                      ))}
                    </nav>

                    {/* Account Section */}
                    {user && (
                      <>
                        <div className="px-6 py-3 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4">
                            Account
                          </p>
                        </div>
                        <nav className="px-6 pb-4 space-y-2">
                          {userLinks.map((link) => (
                            <SheetClose key={link.path} asChild>
                              <Link
                                to={link.path}
                                className={cn(
                                  "flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                                  location.pathname === link.path
                                    ? "bg-brand-green/10 text-brand-green shadow-sm"
                                    : "text-slate-700 hover:bg-slate-50"
                                )}
                              >
                                <link.icon className={cn(
                                  "h-5 w-5",
                                  location.pathname === link.path ? "text-brand-green" : "text-slate-500"
                                )} />
                                <span>{link.name}</span>
                              </Link>
                            </SheetClose>
                          ))}
                        </nav>
                      </>
                    )}

                    {/* Secondary CTA */}
                    {!user && (
                      <div className="px-6 py-4 space-y-3 border-t border-slate-100">
                        <SheetClose asChild>
                          <Button asChild className="w-full bg-brand-green text-white hover:bg-brand-green/90 rounded-xl h-12 font-medium shadow-lg shadow-brand-green/20">
                            <Link to="/login">Sign In</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild variant="outline" className="w-full border-brand-green/30 hover:bg-brand-green/5 rounded-xl h-12 font-medium">
                            <Link to="/waitlist">Join Waitlist</Link>
                          </Button>
                        </SheetClose>
                      </div>
                    )}

                    {/* User Profile Card (Bottom) */}
                    {user && (
                      <div className="mt-auto p-6 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-brand-green/20 shadow-sm">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-brand-green text-white font-bold">
                              {user?.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {user?.user_metadata?.full_name || 'User'}
                            </p>
                            <p className="text-sm text-slate-500 truncate">
                              {user?.email}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSignOut}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <LogOut className="h-4 w-4 text-slate-600" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;
