import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Copywriter from "./pages/Copywriter";
import Poster from "./pages/Poster";
import Planner from "./pages/Planner";
import Suggestions from "./pages/Suggestions";
import Recruit from "./pages/Recruit";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/copywriter" component={Copywriter} />
      <Route path="/poster" component={Poster} />
      <Route path="/planner" component={Planner} />
      <Route path="/recruit" component={Recruit} />
      <Route path="/suggestions" component={Suggestions} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Navbar />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
