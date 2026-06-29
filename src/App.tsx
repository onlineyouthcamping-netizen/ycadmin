// Sync trigger for Vercel admin deployment
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const LoginPage = lazy(() => import("./pages/admin/LoginPage.tsx"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage.tsx"));
const TripsPage = lazy(() => import("./pages/admin/TripsPage.tsx"));
const BookingsPage = lazy(() => import("./pages/admin/BookingsPage.tsx"));
const InquiriesPage = lazy(() => import("./pages/admin/InquiriesPage.tsx"));
const BlogsPage = lazy(() => import("./pages/admin/BlogsPage.tsx"));
const ReviewsPage = lazy(() => import("./pages/admin/ReviewsPage.tsx"));
const MediaPage = lazy(() => import("./pages/admin/MediaPage.tsx"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage.tsx"));
const FooterManagementPage = lazy(() => import("./pages/admin/FooterManagementPage.tsx"));
const PagesPage = lazy(() => import("./pages/admin/PagesPage.tsx"));
const PageEditorPage = lazy(() => import("./pages/admin/PageEditorPage.tsx"));
const ThemePage = lazy(() => import("./pages/admin/ThemePage.tsx"));
const SeoCenterPage = lazy(() => import("./pages/admin/SeoCenterPage.tsx"));
const InquiryFormPage = lazy(() => import("./pages/admin/InquiryFormPage.tsx"));
const WebsiteControlCenterPage = lazy(() => import("./pages/admin/WebsiteControlCenterPage.tsx"));
const ApprovalsHubPage = lazy(() => import("./pages/admin/ApprovalsHubPage.tsx"));
const PageBuilderPage = lazy(() => import("./pages/admin/PageBuilderPage.tsx"));
const PreviewPage = lazy(() => import("./pages/admin/PreviewPage.tsx"));
const AttractionsPage = lazy(() => import("./pages/admin/AttractionsPage.tsx"));
const VendorsPage = lazy(() => import("./pages/admin/VendorsPage.tsx"));
const BookingLinksPage = lazy(() => import("./pages/admin/BookingLinksPage.tsx"));
const QuotationsPage = lazy(() => import("./pages/admin/QuotationsPage.tsx"));
const QuotationFormPage = lazy(() => import("./pages/admin/QuotationFormPage.tsx"));
const AIItineraryGeneratorPage = lazy(() => import("./pages/admin/AIItineraryGeneratorPage.tsx"));
const QuestionsPage = lazy(() => import("./pages/admin/QuestionsPage.tsx"));
const UserManagementPage = lazy(() => import("./pages/admin/UserManagementPage.tsx"));
const AccessControlPage = lazy(() => import("./pages/admin/AccessControlPage.tsx"));
const AuditLogsPage = lazy(() => import("./pages/admin/AuditLogsPage.tsx"));
const UnauthorizedPage = lazy(() => import("./pages/admin/UnauthorizedPage.tsx"));
const DynamicFormAdmin = lazy(() => import("./pages/admin/DynamicFormAdmin.tsx"));

// Named exports from PlaceholderPages Adapted to default exports expected by lazy
const CollectionsPage = lazy(() => import("./pages/admin/PlaceholderPages.tsx").then(m => ({ default: m.CollectionsPage })));
const PromotionsPage = lazy(() => import("./pages/admin/PlaceholderPages.tsx").then(m => ({ default: m.PromotionsPage })));
const DistributionPage = lazy(() => import("./pages/admin/PlaceholderPages.tsx").then(m => ({ default: m.DistributionPage })));
const ReportsPage = lazy(() => import("./pages/admin/PlaceholderPages.tsx").then(m => ({ default: m.ReportsPage })));
const BillingPage = lazy(() => import("./pages/admin/PlaceholderPages.tsx").then(m => ({ default: m.BillingPage })));

const LiveTripOperationsPage = lazy(() => import("./pages/admin/LiveTripOperationsPage.tsx"));
const VerificationQueuePage = lazy(() => import("./pages/admin/VerificationQueuePage.tsx"));
const TrainTemplatesPage = lazy(() => import("./pages/admin/TrainTemplatesPage.tsx"));
const TicketApprovalsPage = lazy(() => import("./pages/admin/TicketApprovalsPage.tsx"));
const AccountingPage = lazy(() => import("./pages/admin/AccountingPage.tsx"));
const OperationsHubPage = lazy(() => import("./pages/admin/OperationsHubPage.tsx"));

import { AdminLayout } from "./components/admin/AdminLayout.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import { DynamicThemeProvider } from "./components/admin/DynamicThemeProvider.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dedupe identical requests across components & avoid refetch storms
      staleTime: 60_000,              // data fresh for 1 min
      gcTime: 5 * 60_000,             // keep in cache 5 min
      refetchOnWindowFocus: false,    // huge win: no refetch when tabbing back
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const LoadingUI = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-6">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Loading page content...</p>
  </div>
);

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayout>
      <Suspense fallback={<LoadingUI />}>
        {children}
      </Suspense>
    </AdminLayout>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <DynamicThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/login" element={<Suspense fallback={<LoadingUI />}><LoginPage /></Suspense>} />
              <Route path="/admin/login" element={<Suspense fallback={<LoadingUI />}><LoginPage /></Suspense>} />
              <Route path="/" element={<AdminRoute><DashboardPage /></AdminRoute>} />
              <Route path="/admin" element={<AdminRoute><DashboardPage /></AdminRoute>} />
              <Route path="/admin/trips" element={<AdminRoute><TripsPage /></AdminRoute>} />
              <Route path="/admin/bookings" element={<AdminRoute><BookingsPage /></AdminRoute>} />
              <Route path="/admin/verification-queue" element={<AdminRoute><VerificationQueuePage /></AdminRoute>} />
              <Route path="/admin/approvals-hub" element={<AdminRoute><ApprovalsHubPage /></AdminRoute>} />
              <Route path="/admin/train-templates" element={<AdminRoute><TrainTemplatesPage /></AdminRoute>} />
              <Route path="/admin/ticket-approvals" element={<AdminRoute><TicketApprovalsPage /></AdminRoute>} />
              <Route path="/admin/collections" element={<AdminRoute><CollectionsPage /></AdminRoute>} />
              <Route path="/admin/promotions" element={<AdminRoute><PromotionsPage /></AdminRoute>} />
              <Route path="/admin/blogs" element={<AdminRoute><BlogsPage /></AdminRoute>} />
              <Route path="/admin/attractions" element={<AdminRoute><AttractionsPage /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute><ReviewsPage /></AdminRoute>} />
              <Route path="/admin/pages" element={<AdminRoute><PagesPage /></AdminRoute>} />
              <Route path="/admin/pages/:id" element={<AdminRoute><PageEditorPage /></AdminRoute>} />
              <Route path="/admin/theme" element={<AdminRoute><ThemePage /></AdminRoute>} />
              <Route path="/admin/seo" element={<AdminRoute><SeoCenterPage /></AdminRoute>} />
              <Route path="/admin/inquiry-form" element={<AdminRoute><InquiryFormPage /></AdminRoute>} />
              <Route path="/admin/website" element={<AdminRoute><WebsiteControlCenterPage /></AdminRoute>} />
              <Route path="/admin/page-builder" element={<AdminRoute><PageBuilderPage /></AdminRoute>} />
              <Route path="/admin/page_builder" element={<AdminRoute><PageBuilderPage /></AdminRoute>} />
              <Route path="/admin/preview" element={<AdminRoute><PreviewPage /></AdminRoute>} />
              <Route path="/admin/inquiries" element={<AdminRoute><InquiriesPage /></AdminRoute>} />
              <Route path="/admin/media" element={<AdminRoute><MediaPage /></AdminRoute>} />
              <Route path="/admin/vendors" element={<AdminRoute><VendorsPage /></AdminRoute>} />
              <Route path="/admin/booking-forms" element={<AdminRoute><BookingLinksPage /></AdminRoute>} />
              <Route path="/admin/quotations" element={<AdminRoute><QuotationsPage /></AdminRoute>} />
              <Route path="/admin/quotations/:id" element={<AdminRoute><QuotationFormPage /></AdminRoute>} />
              <Route path="/admin/ai-itinerary" element={<AdminRoute><AIItineraryGeneratorPage /></AdminRoute>} />
              <Route path="/admin/questions" element={<AdminRoute><QuestionsPage /></AdminRoute>} />
              <Route path="/admin/footer-management" element={<AdminRoute><FooterManagementPage /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
              <Route path="/admin/distribution" element={<AdminRoute><DistributionPage /></AdminRoute>} />
              <Route path="/admin/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
              <Route path="/admin/billing" element={<AdminRoute><BillingPage /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
              <Route path="/admin/access-control" element={<AdminRoute><AccessControlPage /></AdminRoute>} />
              <Route path="/admin/audit-logs" element={<AdminRoute><AuditLogsPage /></AdminRoute>} />
              <Route path="/admin/unauthorized" element={<AdminRoute><UnauthorizedPage /></AdminRoute>} />
              <Route path="/admin/dynamic-sync" element={<AdminRoute><DynamicFormAdmin /></AdminRoute>} />
              <Route path="/admin/live-operations" element={<AdminRoute><LiveTripOperationsPage /></AdminRoute>} />
              <Route path="/admin/accounting" element={<AdminRoute><AccountingPage /></AdminRoute>} />
              <Route path="/admin/operations" element={<AdminRoute><OperationsHubPage /></AdminRoute>} />
              {/* Guide module removed — redirect all former Guide URLs to Dashboard */}
              <Route path="/admin/guides-dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/guides-hub" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/guides" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/attendance-logs" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/assignments" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/payroll" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/expenses" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/live-operations" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/guide-portal" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/guide-portal/trip/:assignmentId" element={<Navigate to="/admin" replace />} />
              <Route path="*" element={<Suspense fallback={<LoadingUI />}><NotFound /></Suspense>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DynamicThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
export default App;
