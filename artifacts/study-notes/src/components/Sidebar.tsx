import { Link, useLocation } from "wouter";
import { BookOpen, LayoutDashboard, Layers, HelpCircle, Clock, Sun, Moon, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/flashcards", icon: Layers, label: "Flashcards" },
  { path: "/quiz", icon: HelpCircle, label: "Quiz Me" },
  { path: "/history", icon: Clock, label: "History" },
];

interface SidebarProps {
  isDark: boolean;
  onToggleDark: () => void;
  onClose?: () => void;
}

export default function Sidebar({ isDark, onToggleDark, onClose }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside className="w-60 h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-none">StudyAI</p>
            <p className="text-xs text-slate-500 mt-0.5">AI Study Partner</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2">Menu</p>
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          return (
            <Link
              key={path}
              href={path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-indigo-400" : ""}`} />
              {label}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <button
          onClick={onToggleDark}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.span key="sun" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.15 }} className="block">
                <Sun className="w-4 h-4" />
              </motion.span>
            ) : (
              <motion.span key="moon" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.15 }} className="block">
                <Moon className="w-4 h-4" />
              </motion.span>
            )}
          </AnimatePresence>
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
        <p className="text-center text-xs text-slate-700">StudyAI v2.0</p>
      </div>
    </aside>
  );
}
