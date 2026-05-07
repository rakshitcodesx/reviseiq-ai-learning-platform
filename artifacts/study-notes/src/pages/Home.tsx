import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, RotateCcw, AlertCircle, Copy, Check, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleGenerate = () => {
    if (!text.trim()) {
      setError("Please paste some text first to generate notes.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    setTimeout(() => {
      const splitRegex = /(?<=[.!?])\s+/;
      const sentences = text
        .split(splitRegex)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const topSentences = sentences.slice(0, 3);
      setNotes(topSentences);
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

  const handleCopy = async () => {
    if (notes.length === 0) return;
    const formatted = notes.map((note, i) => `${i + 1}. ${note}`).join("\n");
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground py-12 px-4 sm:px-6 md:px-8 font-sans selection:bg-primary/20 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-4 relative">
          <button
            onClick={() => setIsDark(!isDark)}
            data-testid="button-dark-mode"
            aria-label="Toggle dark mode"
            className="absolute right-0 top-0 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span
                  key="sun"
                  initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  <Sun className="w-5 h-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  <Moon className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            AI Study Notes Generator
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Distill any textbook paragraph or wall of text into quick, focused bullet points.
          </p>
        </header>

        {/* Main Interface */}
        <main className="space-y-8">
          {/* Input Area */}
          <section className="space-y-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
              <Textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Paste your study notes or textbook paragraph here..."
                className="relative w-full h-48 resize-none p-6 text-lg rounded-2xl border-border bg-card shadow-sm transition-shadow focus-visible:ring-primary focus-visible:ring-offset-2"
                data-testid="textarea-input"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-destructive text-sm font-medium px-2"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="flex items-center gap-4 justify-end">
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
                disabled={isGenerating}
                className="rounded-xl px-8 shadow-md hover:shadow-lg transition-all"
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
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
          <section className="pt-8">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[200px] flex flex-col">
              <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                  Your Summary Notes
                </h2>
                {notes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      data-testid="button-copy"
                      className="text-muted-foreground hover:text-foreground gap-2 h-8 px-3 text-xs"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {copied ? (
                          <motion.span
                            key="check"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1.5 text-green-600 dark:text-green-400"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Copied!
                          </motion.span>
                        ) : (
                          <motion.span
                            key="copy"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy Notes
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                )}
              </div>

              <div className="p-6 md:p-8 flex-1 flex flex-col" data-testid="results-area">
                {notes.length > 0 ? (
                  <ul className="space-y-6 flex-1 flex flex-col justify-center" data-testid="results-list">
                    <AnimatePresence>
                      {notes.map((note, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                          transition={{ delay: index * 0.15, duration: 0.4, ease: "easeOut" }}
                          className="flex items-start gap-4 group"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {index + 1}
                          </div>
                          <p className="text-lg leading-relaxed text-card-foreground">
                            {note}
                          </p>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
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
