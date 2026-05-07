import { useState, useEffect } from "react";
import { Menu, Sun, Moon, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <div className="min-h-[100dvh] flex bg-background text-foreground transition-colors duration-300 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0 h-screen sticky top-0">
        <Sidebar isDark={isDark} onToggleDark={() => setIsDark(d => !d)} />
      </div>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 z-50 h-full lg:hidden"
            >
              <Sidebar
                isDark={isDark}
                onToggleDark={() => setIsDark(d => !d)}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-background/90 backdrop-blur-sm border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" fill="white" strokeWidth={0} />
            </div>
            <span className="font-bold text-sm tracking-tight">ReviseIQ</span>
          </div>

          <button
            onClick={() => setIsDark(d => !d)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
