import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import Index from "./pages/Index.tsx";
import ProposalGenerator from "./pages/ProposalGenerator.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Marketplace from "./pages/Marketplace.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Settings from "./pages/Settings.tsx";
import CRM from "./pages/CRM.tsx";
import Admin from "./pages/Admin.tsx";
import TemplateDetail from "./pages/TemplateDetail.tsx";
import ClientPortal from "./pages/ClientPortal.tsx";
import Checkout from "./pages/Checkout.tsx";
import PaymentSuccess from "./pages/PaymentSuccess.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import NotFound from "./pages/NotFound.tsx";
import Testimonials from "./pages/Testimonials.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import PitchAnalysis from "./pages/PitchAnalysis.tsx";
import WinRateCoach from "./pages/WinRateCoach.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/generate" element={<ProposalGenerator />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:id" element={<TemplateDetail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/p/:slug" element={<ClientPortal />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/proposals" element={<Dashboard />} /> {/* For now, map to dashboard list */}
            <Route path="/coach" element={<WinRateCoach />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/proposals/:id/analysis" element={<PitchAnalysis />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
