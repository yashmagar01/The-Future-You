import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, LogOut, Home, Video, Image as ImageIcon, TrendingUp, Settings } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
}

const navLinks = [
  { name: "Home", path: "/", icon: Home },
  { name: "Record", path: "/record", icon: Video },
  { name: "Gallery", path: "/gallery", icon: ImageIcon },
  { name: "Dashboard", path: "/dashboard", icon: TrendingUp },
];

const NavLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className="relative">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "font-medium transition-all duration-300",
          isActive
            ? "text-brand-green bg-brand-green/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
      </motion.div>
      
      {isActive && (
        <motion.div
          layoutId="navActiveIndicator"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-green rounded-full"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
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
    <div className="min-h-screen flex flex-col">
      <nav
        className={cn(
          "sticky top-0 z-50",
          "px-4 py-3",
          "transition-all duration-300",
          "backdrop-filter backdrop-blur-lg",
          "border-b",
          isScrolled
            ? "bg-background/80 shadow-md border-border"
            : "bg-background/60 border-transparent"
        )}
      >
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Sparkles className="h-8 w-8 text-brand-green transition-transform" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-bold text-xl group-hover:text-brand-green transition-colors">
                Yash
              </span>
              <span className="hidden md:block text-xs text-muted-foreground font-medium">
                The Future You
              </span>
            </div>
          </Link>
          
          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                icon={link.icon}
                label={link.name}
              />
            ))}
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Join Waitlist CTA */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hidden lg:inline-flex border-brand-green/30 hover:bg-brand-green/10 hover:border-brand-green"
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
                    className="focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 rounded-full"
                  >
                    <Avatar className="h-9 w-9 border-2 border-brand-green/20 hover:border-brand-green transition-colors cursor-pointer">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                      <AvatarFallback className="bg-brand-green text-white text-sm font-semibold">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </motion.button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground leading-none">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/dashboard" className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/gallery" className="flex items-center">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Gallery
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="cursor-pointer text-destructive focus:text-destructive"
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
                  variant="default"
                  size="sm"
                  asChild
                  className="bg-brand-green hover:bg-brand-green/90"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Mobile Nav Links (Bottom of Navbar) */}
        <div className="md:hidden flex items-center justify-around gap-1 mt-3 pt-3 border-t border-border/50">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              icon={link.icon}
              label={link.name}
            />
          ))}
        </div>
      </nav>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t border-border bg-card/50 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Yash AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
