import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MotionPreferenceProvider } from "@/contexts/MotionPreferenceContext";
import { MotionConfig } from "framer-motion";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DealDashboard from "./pages/DealDashboard";
import DashboardLayout from "./components/DashboardLayout";
import { useLocation, useRoute } from "wouter";
import DealDetail from "./pages/DealDetail";
import ProtocolReference from "./pages/ProtocolReference";
import JudgeEvidence from "./pages/JudgeEvidence";
import { RouteTransitionLight } from "./components/RouteTransitionLight";
import { RouteProgressIndicator } from "./components/RouteProgressIndicator";

function AppDashboard() {
  return <DashboardLayout><DealDashboard /></DashboardLayout>;
}

function DealDetailRoute() {
  const [, params] = useRoute("/deals/:orderId");
  if (!params?.orderId) return <NotFound />;
  return <DashboardLayout><DealDetail orderId={params.orderId} /></DashboardLayout>;
}

function ProtocolReferenceRoute() {
  return <DashboardLayout><ProtocolReference /></DashboardLayout>;
}

function Router() {
  const [location] = useLocation();
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <RouteTransitionLight key={location} />
      <RouteProgressIndicator key={`progress-${location}`} />
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/judge"} component={JudgeEvidence} />
        <Route path={"/app"} component={AppDashboard} />
        <Route path={"/protocol"} component={ProtocolReferenceRoute} />
        <Route path={"/deals/:orderId"} component={DealDetailRoute} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <ThemeProvider
          defaultTheme="dark"
          // switchable
        >
          <TooltipProvider>
            <MotionPreferenceProvider>
              <Toaster />
              <Router />
            </MotionPreferenceProvider>
          </TooltipProvider>
        </ThemeProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
