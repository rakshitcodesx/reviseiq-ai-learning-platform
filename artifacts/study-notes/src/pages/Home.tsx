import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Sparkles, RotateCcw, AlertCircle,
  Copy, Check, Sun, Moon, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_CHARS = 5000;
const TYPING_SPEED_MS = 18;

function TypewriterText({
  text,
  startDelay = 0,
  typingKey,
  onComplete,
}: {
  text: string;
  startDelay?: number;
  typingKey: number;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);

    const start = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
          onComplete?.();
        }
      }, TYPING_SPEED_MS);
      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(start);
  }, [typingKey]);

  return (
    <span>
      {displayed}
      {!done && (
        <span className="inline-block w-0.5 h-[1em] bg-primary align-middle ml-0.5 animate-pulse" />
      )}
    </span>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [typingKey, setTypingKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const charsLeft = MAX_CHARS - text.length;
  const nearLimit = charsLeft <= 200;
  const atLimit = charsLeft <= 0;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS) return;
    setText(val);
    if (error) setError(null);
  };

  const handleGenerate = () => {
    if (!text.trim()) {
      setError("Please paste some text first to generate notes.");
      return;
    }
    setError(null);
    setIsGenerating(true);

    setTimeout(() => {
      const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      setNotes(sentences.slice(0, 3));
      setTypingKey((k) => k + 1);
      setIsGenerating(false);
      setCopied(false);
    }, 800);
  };

  const handleClear = () => {
    setText("");
    setNotes([]);
    setError(null);
    setCopied(false);
  };

  const handleCopy = useCallback(async () => {
    if (notes.length === 0) return;
    const formatted = notes.map((n, i) => `${i + 1}. ${n}`).join("\n");
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [notes]);

  const handleDownload = useCallback(() => {
    if (notes.length === 0) return;
    const content = `AI Study Notes\n${"=".repeat(40)}\n\n${notes
      .map((n, i) => `${i + 1}. ${n}`)
      .join("\n\n")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study-notes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [notes]);

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-sans selection:bg-primary/20 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">

        {/* Header */}
        <header className="text-center space-y-3 relative pt-2">
          <button
            onClick={() => setIsDark(!isDark)}
            data-testid="button-dark-mode"
            aria-label="Toggle dark mode"
            className="absolute right-0 top-0 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span key="sun" initial={{ opacity: 0, rotate: -90, scale: 0.8 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.8 }} transition={{ duration: 0.2 }} className="block">
                  <Sun className="w-5 h-5" />
                </motion.span>
              ) : (
                <motion.span key="moon" initial={{ opacity: 0, rotate: 90, scale: 0.8 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: -90, scale: 0.8 }} transition={{ duration: 0.2 }} className="block">
                  <Moon className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            AI Study Notes Generator
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Distill any textbook paragraph or wall of text into quick, focused bullet points.
          </p>
        </header>

        {/* Main Interface */}
        <main className="space-y-6 sm:space-y-8">

          {/* Input Area */}
          <section className="space-y-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500" />
              <Textarea
                value={text}
                onChange={handleTextChange}
                placeholder="Paste your study notes or textbook paragraph here..."
                className="relative w-full h-40 sm:h-48 resize-none p-4 sm:p-6 text-base sm:text-lg rounded-2xl border-border bg-card shadow-sm transition-shadow focus-visible:ring-primary focus-visible:ring-offset-2"
                data-testid="textarea-input"
              />
            </div>

            {/* Word count + char limit row */}
            <div className="flex items-center justify-between px-1 text-xs sm:text-sm" data-testid="text-counters">
              <span className="text-muted-foreground">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
              <span className={nearLimit ? (atLimit ? "text-destructive font-semibold" : "text-amber-500 dark:text-amber-400") : "text-muted-foreground"}>
                {charsLeft.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters remaining
              </span>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-destructive text-sm font-medium px-1"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={handleClear}
                disabled={isGenerating || (!text && notes.length === 0)}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-clear"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || atLimit && !text.trim()}
                className="rounded-xl px-6 sm:px-8 shadow-md hover:shadow-lg transition-all"
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Notes</span>
                  </div>
                )}
              </Button>
            </div>
          </section>

          {/* Results Area */}
          <section>
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              {/* Results header */}
              <div className="bg-muted/50 px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-2">
                <h2 className="text-xs sm:text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                  Your Summary Notes
                </h2>
                {notes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
                  >
                    {/* Copy button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      data-testid="button-copy"
                      className="text-muted-foreground hover:text-foreground h-8 px-2 sm:px-3 text-xs gap-1.5"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {copied ? (
                          <motion.span key="check" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }} className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Copied!</span>
                          </motion.span>
                        ) : (
                          <motion.span key="copy" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }} className="flex items-center gap-1.5">
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Copy</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>

                    {/* Download button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      data-testid="button-download"
                      className="text-muted-foreground hover:text-foreground h-8 px-2 sm:px-3 text-xs gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Results body */}
              <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col min-h-[180px] sm:min-h-[200px]" data-testid="results-area">
                {notes.length > 0 ? (
                  <ul className="space-y-5 sm:space-y-6" data-testid="results-list">
                    {notes.map((note, index) => (
                      <motion.li
                        key={`${typingKey}-${index}`}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.35, ease: "easeOut" }}
                        className="flex items-start gap-3 sm:gap-4 group"
                      >
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs sm:text-sm mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {index + 1}
                        </div>
                        <p className="text-base sm:text-lg leading-relaxed text-card-foreground pt-0.5">
                          <TypewriterText
                            text={note}
                            typingKey={typingKey}
                            startDelay={index * (note.length * TYPING_SPEED_MS * 0.5 + 150)}
                          />
                        </p>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 opacity-50 py-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-muted flex items-center justify-center">
                      <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Your generated notes will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
