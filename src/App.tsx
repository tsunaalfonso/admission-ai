import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CharacterSelect from "./pages/CharacterSelect.tsx";
import Interview from "./pages/Interview.tsx";
import Result from "./pages/Result.tsx";
import History from "./pages/History.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminCharacters from "./pages/admin/AdminCharacters.tsx";
import AdminQuestions from "./pages/admin/AdminQuestions.tsx";
import AdminResults from "./pages/admin/AdminResults.tsx";
import AdminApprovals from "./pages/admin/AdminApprovals.tsx";

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
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/interview/select" element={<ProtectedRoute><CharacterSelect /></ProtectedRoute>} />
            <Route path="/interview/:characterId" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
            <Route path="/result/:interviewId" element={<ProtectedRoute><Result /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="characters" element={<AdminCharacters />} />
              <Route path="questions" element={<AdminQuestions />} />
              <Route path="results" element={<AdminResults />} />
              <Route path="approvals" element={<AdminApprovals />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
