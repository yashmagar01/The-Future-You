import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Analytics } from "@vercel/analytics/react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";

// ponytail: route-level splitting only, Home stays eager for FCP. Fallback renders
// nothing to avoid layout shift; final visuals unchanged.
const Record = lazy(() => import("./pages/Record"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Companion = lazy(() => import("./pages/Companion"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const WaitlistConfirm = lazy(() => import("./pages/WaitlistConfirm"));
const WaitlistAdmin = lazy(() => import("./pages/WaitlistAdmin"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Analysis = lazy(() => import("./pages/Analysis"));
// Load the Learn page only when someone visits /learn (lazy = on demand)
const Learn = lazy(() => import("./pages/Learn"));
const FillerWordsLesson = lazy(() => import("./pages/FillerWordsLesson")); // load the lesson page only when visited
const PaceLesson = lazy(() => import("./pages/PaceLesson")); // load lesson 2 only when visited
const PostureLesson = lazy(() => import("./pages/PostureLesson")); // load lesson 3 only when visited
const VoiceLesson = lazy(() => import("./pages/VoiceLesson")); // load lesson 4 only when visited
const ToneLesson = lazy(() => import("./pages/ToneLesson")); // load lesson 5 only when visited
const StructureLesson = lazy(() => import("./pages/StructureLesson")); // load lesson 6 only when visited

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/register" element={<Signup />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route 
                path="/record" 
                element={
                  <ProtectedRoute>
                    <Record />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/gallery" 
                element={
                  <ProtectedRoute>
                    <Gallery />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/companion" 
                element={
                  <ProtectedRoute>
                    <Companion />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              {/* Waitlist Routes */}
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/waitlist/confirm" element={<WaitlistConfirm />} />
              <Route 
                path="/admin/waitlist" 
                element={
                  <ProtectedRoute>
                    <WaitlistAdmin />
                  </ProtectedRoute>
                } 
              />
              {/* Admin Routes */}
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analysis/:id" 
                element={
                  <ProtectedRoute>
                    <Analysis />
                  </ProtectedRoute>
                } 
              />
              {/* TODO: wrap in ProtectedRoute before the final version (public only while developing) */}
              <Route path="/learn" element={<Learn />} /> {/* URL /learn shows the Learn page */}
              <Route path="/learn/cutting-filler-words" element={<FillerWordsLesson />} /> {/* this URL shows lesson 1 */}
              <Route path="/learn/finding-your-pace" element={<PaceLesson />} /> {/* this URL shows lesson 2 */}
              <Route path="/learn/posture-and-body-language" element={<PostureLesson />} /> {/* this URL shows lesson 3 */}
              <Route path="/learn/voice-energy-and-volume" element={<VoiceLesson />} /> {/* this URL shows lesson 4 */}
              <Route path="/learn/tone-and-expression" element={<ToneLesson />} /> {/* this URL shows lesson 5 */}
              <Route path="/learn/structuring-your-thoughts" element={<StructureLesson />} /> {/* this URL shows lesson 6 */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
          <Analytics />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
