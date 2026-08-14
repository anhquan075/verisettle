import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DealDashboard from "./pages/DealDashboard";
import DashboardLayout from "./components/DashboardLayout";
import { useRoute } from "wouter";
import DealDetail from "./pages/DealDetail";

function AppDashboard() {
  return <DashboardLayout><DealDashboard /></DashboardLayout>;
}

function DealDetailRoute() {
  const [, params] = useRoute("/deals/:orderId");
  if (!params?.orderId) return <NotFound />;
  return <DashboardLayout><DealDetail orderId={params.orderId} /></DashboardLayout>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/app"} component={AppDashboard} />
      <Route path={"/deals/:orderId"} component={DealDetailRoute} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
