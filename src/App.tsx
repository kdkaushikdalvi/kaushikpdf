import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignatureProvider } from "@/context/SignatureContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Home as SignatureV2 } from "./components/signature-v2";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SignatureProvider>
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<SignatureV2 />} />
            <Route path="/v1" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SignatureProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
