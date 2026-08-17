import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { useWalletAccess } from "@/hooks/useWalletAccess";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowLeft, Eye, FileSearch, LayoutDashboard, Loader2, LogOut, PanelLeft, ShieldCheck, Radio, Route, WalletCards } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { AttestationOrbit } from "./AttestationOrbit";
import { ProofFieldBackground } from "./ProofFieldBackground";
import { VERISETTLE_HEADER_LOGO_SRC, VeriSettleBrand } from "./VeriSettleBrand";
import { ConnectionQualityIndicator } from "./ConnectionQualityIndicator";
import { WalletSessionCountdown } from "./WalletSessionCountdown";

const menuItems = [
  { icon: LayoutDashboard, label: "Deal register", path: "/app" },
  { icon: ShieldCheck, label: "Protocol reference", path: "/protocol" },
  { icon: Eye, label: "Contrast audit", path: "/contrast-audit" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

function WorkspaceWalletControl({ fullWidth = false }: { fullWidth?: boolean }) {
  const wallet = useWalletAccess();
  const [isOpeningWalletPicker, setIsOpeningWalletPicker] = useState(false);
  return (
    <ConnectButton.Custom>
      {({ account, mounted, openAccountModal, openConnectModal }) => {
        const connected = mounted && Boolean(account);
        const connecting = !connected && (wallet.busy || isOpeningWalletPicker);
        const handleWalletClick = () => {
          if (connected) {
            openAccountModal();
            return;
          }
          setIsOpeningWalletPicker(true);
          openConnectModal();
          window.setTimeout(() => setIsOpeningWalletPicker(false), 360);
        };
        return (
          <Button
            type="button"
            size="sm"
            variant={connected ? "outline" : "default"}
            onClick={handleWalletClick}
            disabled={!mounted || connecting}
            aria-busy={connecting}
            className={`veri-action min-h-9 border-cyan-100/20 font-semibold ${connected ? "bg-white/[0.03] text-cyan-50 hover:bg-cyan-300/10" : "bg-cyan-300 text-[#06191f] hover:bg-cyan-200"} ${fullWidth ? "w-full justify-start" : "max-w-[11.5rem]"}`}
          >
            {connecting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin" /> : <WalletCards className="mr-1.5 h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{connected ? `Wallet · ${account?.displayName}` : connecting ? "Opening wallets…" : "Connect wallet"}</span>
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
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
  const hasWalletSession = user?.sessionKind === "siwe";
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === "/app" ? location === "/app" || location.startsWith("/deals/") : location === item.path);
  const isMobile = useIsMobile();

  const openJudgeEvidence = () => {
    if (location !== "/app") {
      setLocation("/app");
    }

    window.setTimeout(() => {
      window.history.replaceState(null, "", "/app#judge-route");
      const evidence = document.getElementById("judge-route");
      evidence?.scrollIntoView({ behavior: "smooth", block: "start" });
      evidence?.focus({ preventScroll: true });
    }, location === "/app" ? 0 : 80);
  };

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
      <a href="#workspace-content" className="sr-only z-[60] rounded-md bg-cyan-200 px-3 py-2 text-sm font-semibold text-[#062126] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to workspace content</a>
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={openJudgeEvidence}
                  tooltip="Judge evidence"
                  className="h-11 rounded-xl font-medium text-cyan-100 transition-all hover:bg-cyan-300/10"
                >
                  <FileSearch className="h-4 w-4 text-cyan-200" />
                  <span>Judge evidence</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-cyan-100/10 p-3">
            {!isCollapsed && <div className="mb-3 rounded-xl border border-teal-200/10 bg-teal-300/[0.045] px-3 py-2.5"><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-100"><Radio className="h-3.5 w-3.5" /> Testnet live</div><p className="mt-1 text-xs text-teal-50/75">Sepolia × CC3 proof path</p></div>}
            {!isCollapsed && user?.sessionKind === "siwe" && user.sessionExpiresAt && <div className="mb-3 rounded-xl border border-cyan-200/10 bg-cyan-300/[0.035] px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">Wallet session</p><div className="mt-1"><WalletSessionCountdown expiresAt={user.sessionExpiresAt} /></div><p className="mt-2 text-xs leading-5 text-cyan-50/70">Sign in with your wallet again when it expires.</p></div>}
            {hasWalletSession ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-9 w-9 border shrink-0">
                      <AvatarFallback className="text-xs font-medium">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                      <p className="text-sm font-medium truncate leading-none">
                        {user.name || "Wallet session"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1.5">
                        {user.email || "Private workspace"}
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
            ) : (
              <div className="rounded-xl border border-cyan-100/10 bg-cyan-300/[0.035] p-3 group-data-[collapsible=icon]:p-1.5">
                {!isCollapsed && <><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">Judge access</p><p className="mt-1 text-xs leading-5 text-slate-400">Explore the protocol freely. Connect only when you want to act.</p></>}
                <div className={isCollapsed ? "" : "mt-3"}><WorkspaceWalletControl fullWidth={!isCollapsed} /></div>
              </div>
            )}
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

      <SidebarInset className="veri-workspace-surface relative min-w-0 overflow-hidden bg-[#040b0e]">
        <ProofFieldBackground variant="workspace" />
        <AttestationOrbit variant="workspace" />
        <header className="veri-workspace-header sticky top-0 z-40 border-b border-cyan-100/10 bg-[#061014]/92 text-slate-100 backdrop-blur-xl supports-[backdrop-filter]:bg-[#061014]/78">
          <div className="veri-command-bar flex min-h-16 w-full items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {isMobile && <SidebarTrigger className="h-9 w-9 shrink-0 rounded-lg border border-white/10 bg-white/[0.045] text-cyan-100 hover:bg-cyan-300/10" />}
              <Button type="button" size="sm" variant="ghost" onClick={() => setLocation("/")} aria-label="Back to landing page" className="veri-action h-9 w-9 shrink-0 rounded-lg border border-white/10 bg-white/[0.025] p-0 text-cyan-50 hover:bg-cyan-300/10 hover:text-cyan-100"><ArrowLeft className="h-3.5 w-3.5" /><span className="sr-only">Landing</span></Button>
              <span className="sm:hidden inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-100/10 bg-white/[0.025]"><img src={VERISETTLE_HEADER_LOGO_SRC} alt="VeriSettle" className="h-6 w-6 object-contain" /></span>
              <div className="veri-command-context hidden min-w-0 items-center gap-2 sm:flex"><Route className="h-3.5 w-3.5 shrink-0 text-cyan-200" /><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100">Workspace</span><span className="h-3 w-px bg-white/10" aria-hidden="true" /><span className="truncate text-sm font-semibold text-slate-100">{activeMenuItem?.label ?? "Settlement"}</span></div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <ConnectionQualityIndicator />
              <span aria-label="Creditcoin CC3 public testnet" className="veri-network-signal hidden items-center gap-1.5 rounded-full border border-teal-200/15 bg-teal-300/[0.045] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-100 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.8)]" /><span className="hidden md:inline">CC3 testnet</span><span className="md:hidden">CC3</span></span>
              <WorkspaceWalletControl />
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
