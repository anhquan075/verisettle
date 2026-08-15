import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, ShieldCheck, Radio, Route, WalletCards } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { AttestationOrbit } from "./AttestationOrbit";
import { VeriSettleBrand } from "./VeriSettleBrand";
import { WalletReadinessPanel } from "./WalletReadinessPanel";
import { WalletSessionCountdown } from "./WalletSessionCountdown";

const menuItems = [
  { icon: LayoutDashboard, label: "Deal register", path: "/app" },
  { icon: ShieldCheck, label: "Protocol reference", path: "/protocol" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user, refresh } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040b0e] px-5 py-10 text-white">
        <a href="#workspace-sign-in" className="sr-only z-50 rounded-md bg-cyan-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to workspace sign-in</a>
        <div className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-12 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div id="workspace-sign-in" className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-cyan-100/15 bg-[#071216]/90 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.42)] backdrop-blur sm:p-9">
          <div className="absolute inset-x-0 top-0 h-px bg-cyan-200/40" />
          <VeriSettleBrand className="relative" compact />
          <div className="mt-8 grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-300/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-100"><Radio className="h-3.5 w-3.5" /> Secure wallet sign-in</div>
              <h1 className="mt-5 max-w-xl font-veri-display text-4xl font-semibold leading-[0.92] tracking-[-0.07em] text-white sm:text-5xl">Choose a wallet.<br /><span className="text-cyan-200">Prove the address.</span></h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">Connect a testnet wallet, sign one VeriSettle session message, then check CC3 and Sepolia. Sign-in never sends a transaction or requests a recovery phrase.</p>
            </div>
            <ol className="grid gap-2 text-xs leading-5">
              <li className="rounded-xl border border-cyan-100/10 bg-cyan-300/[0.04] p-3"><span className="font-semibold text-cyan-100">01 · Connect</span><span className="ml-2 text-slate-400">Choose your wallet.</span></li>
              <li className="rounded-xl border border-cyan-100/10 bg-cyan-300/[0.04] p-3"><span className="font-semibold text-cyan-100">02 · Sign</span><span className="ml-2 text-slate-400">Approve one session message.</span></li>
              <li className="rounded-xl border border-cyan-100/10 bg-cyan-300/[0.04] p-3"><span className="font-semibold text-cyan-100">03 · Ready</span><span className="ml-2 text-slate-400">Check CC3 and Sepolia.</span></li>
            </ol>
          </div>
          <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5"><WalletReadinessPanel signIn onSignedIn={() => void refresh()} /></div>
          <p className="mt-4 text-center text-xs text-slate-500">Wallet signatures prove control of an address. They never authorize transactions.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      className="min-h-svh bg-[#040b0e]"
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === "/app" ? location === "/app" || location.startsWith("/deals/") : location === item.path);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <a href="#workspace-content" className="sr-only z-[60] rounded-md bg-cyan-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to workspace content</a>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-cyan-100/10 bg-[#061014] text-slate-200 [&_[data-slot=sidebar-inner]]:!bg-[#061014] [&_[data-slot=sidebar-inner]]:!text-slate-200"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-20 justify-start border-b border-cyan-100/10">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? <VeriSettleBrand className="min-w-0" /> : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-1 pt-4">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 group-data-[collapsible=icon]:hidden">Command center</p>
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = item.path === "/app" ? location === "/app" || location.startsWith("/deals/") : location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-11 rounded-xl transition-all font-medium data-[active=true]:bg-cyan-300/10 data-[active=true]:text-cyan-100 hover:bg-white/[0.04]`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-cyan-100/10 p-3">
            {!isCollapsed && <div className="mb-3 rounded-xl border border-teal-200/10 bg-teal-300/[0.045] px-3 py-2.5"><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-100"><Radio className="h-3.5 w-3.5" /> Testnet live</div><p className="mt-1 text-xs text-slate-400">Sepolia × CC3 proof path</p></div>}
            {!isCollapsed && user?.sessionKind === "siwe" && user.sessionExpiresAt && <div className="mb-3 rounded-xl border border-cyan-200/10 bg-cyan-300/[0.035] px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">Wallet session</p><div className="mt-1"><WalletSessionCountdown expiresAt={user.sessionExpiresAt} /></div><p className="mt-2 text-xs leading-5 text-slate-400">Sign in with your wallet again when it expires.</p></div>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="relative min-w-0 overflow-hidden bg-[#040b0e]">
        <AttestationOrbit variant="workspace" />
        <header className="veri-workspace-header sticky top-0 z-40 border-b border-cyan-100/10 bg-[#061014]/92 text-slate-100 backdrop-blur-xl supports-[backdrop-filter]:bg-[#061014]/78">
          <div className="flex min-h-14 w-full items-center gap-3 px-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              {isMobile && <SidebarTrigger className="h-9 w-9 shrink-0 rounded-lg border border-white/10 bg-white/[0.045] text-cyan-100 hover:bg-cyan-300/10" />}
              <span className="sm:hidden"><VeriSettleBrand compact /></span>
              <span className="hidden min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300 sm:inline-flex"><Route className="h-3.5 w-3.5 shrink-0 text-cyan-200" /><span className="truncate">Workspace / {activeMenuItem?.label ?? "Settlement"}</span></span>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {user?.sessionKind === "siwe" && user.sessionExpiresAt ? <WalletSessionCountdown expiresAt={user.sessionExpiresAt} /> : null}
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-100 sm:gap-2 sm:text-xs"><Radio className="h-3.5 w-3.5" /><span className="hidden lg:inline">Receipt-bound · </span><span className="sm:hidden">Testnet</span><span className="hidden sm:inline">Public testnet only</span></span>
            </div>
          </div>
        </header>
        <main id="workspace-content" className="relative z-10 flex-1 bg-[radial-gradient(circle_at_95%_0%,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_15%_25%,rgba(45,212,191,0.06),transparent_30%)] p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
