import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
}

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Record", path: "/record" },
  { name: "Gallery", path: "/gallery" },
  { name: "Dashboard", path: "/dashboard" },
];

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

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
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center gap-2 group transition-transform hover:scale-105"
            >
              <Sparkles className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Yash
              </span>
              <span className="hidden sm:inline text-sm text-muted-foreground font-medium">
                The Future You
              </span>
            </Link>
            
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "relative text-sm font-medium transition-colors hover:text-primary",
                    "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full",
                    "after:origin-left after:scale-x-0 after:bg-primary after:transition-transform",
                    "hover:after:scale-x-100",
                    location.pathname === link.path
                      ? "text-primary after:scale-x-100"
                      : "text-muted-foreground"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              
              {user ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  asChild
                >
                  <Link to="/login">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
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
