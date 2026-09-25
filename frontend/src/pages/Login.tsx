import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2, AlertCircle, Video, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { signIn, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate input
      const validatedData = loginSchema.parse({ email, password });

      // Attempt sign in
      const { error: signInError } = await signIn(validatedData.email, validatedData.password);

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Please confirm your email before signing in");
        } else {
          setError(signInError.message);
        }
        return;
      }

      // Success - redirect to the page they were trying to access
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your account",
      });
      
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    
    try {
      const { error: googleError } = await signInWithGoogle();
      
      if (googleError) {
        setError(googleError.message);
        setGoogleLoading(false);
      }
      // If no error, user will be redirected by OAuth flow
    } catch (err) {
      setError("Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Login Form */}
      <div className="flex items-center justify-center p-8 bg-gray-50 lg:order-1">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6">
              <Link to="/" className="inline-flex items-center gap-2 text-primary group">
                <Video className="h-7 w-7 group-hover:scale-110 transition-transform" />
                <span className="text-xl font-bold">The Future You</span>
              </Link>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-600">Sign in to continue your journey</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full h-12 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-gray-600" />
                  <span className="text-gray-600">Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-gray-700 font-medium">Continue with Google</span>
                </>
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  className="h-11 border-gray-300 focus:border-primary focus:ring-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || googleLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-11 border-gray-300 focus:border-primary focus:ring-primary pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || googleLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md before:absolute before:-inset-3 before:content-['']"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg hover:shadow-xl transition-all" 
                type="submit"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center text-sm pt-4">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Create Account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 lg:order-2">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-white group">
            <Video className="h-8 w-8 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-bold">The Future You</span>
          </Link>
        </div>
        
        <div className="space-y-6 text-white">
          <h1 className="text-4xl font-bold leading-tight">
            Build Confidence Through Daily Reflections
          </h1>
          <p className="text-lg text-white/90">
            Transform your communication skills with AI-powered video feedback. 
            Practice daily, track progress, and become the confident speaker you aspire to be.
          </p>
          <div className="flex items-center gap-2 pt-4">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Secure • Private • Always Available</span>
          </div>
        </div>

        <div className="text-white/80 text-sm">
          Join thousands building confidence through practice 🚀
        </div>
      </div>
    </div>
  );
};

export default Login;
