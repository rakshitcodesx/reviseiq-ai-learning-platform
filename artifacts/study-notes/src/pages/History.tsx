import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trash2, FileText, ChevronRight, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { getHistory, deleteHistoryItem, clearHistory, saveCurrentSession } from "@/lib/storage";
import type { StudySession } from "@/lib/types";

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "bg-green-500/15 text-green-600 dark:text-green-400",
  Intermediate: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Advanced: "bg-red-500/15 text-red-600 dark:text-red-400",
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function History() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setSessions(getHistory());
  }, []);

  const handleDelete = (id: string) => {
    deleteHistoryItem(id);
    setSessions(getHistory());
  };

  const handleClearAll = () => {
    clearHistory();
    setSessions([]);
  };

  const handleLoad = (session: StudySession) => {
    saveCurrentSession(session);
    setLocation("/");
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">No History Yet</h2>
        <p className="text-muted-foreground max-w-sm">Your generated note sessions will appear here so you can revisit them any time.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground text-sm mt-1">{sessions.length} saved session{sessions.length !== 1 ? "s" : ""}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl gap-2"
          data-testid="button-clear-history"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear All</span>
        </Button>
      </div>

      {/* Session list */}
      <ul className="space-y-3" data-testid="history-list">
        <AnimatePresence>
          {sessions.map((session, i) => (
            <motion.li
              key={session.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className="group bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-sm transition-all overflow-hidden"
            >
              <div className="flex items-start gap-4 p-4 sm:p-5">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                  <FileText className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[session.difficulty]}`}>
                      {session.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(session.timestamp)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {session.readingTimeMin} min read
                    </span>
                  </div>
                  <div className="space-y-1">
                    {session.notes.slice(0, 2).map((note, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground truncate">
                        <span className="font-medium text-foreground/70">{idx + 1}.</span> {note}
                      </p>
                    ))}
                    {session.notes.length > 2 && (
                      <p className="text-xs text-muted-foreground">+{session.notes.length - 2} more note{session.notes.length - 2 !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                  {session.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {session.keywords.slice(0, 4).map(kw => (
                        <span key={kw} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(session.id)}
                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                    data-testid={`button-delete-${session.id}`}
                    aria-label="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleLoad(session)}
                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                    data-testid={`button-load-${session.id}`}
                    aria-label="Load session"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
