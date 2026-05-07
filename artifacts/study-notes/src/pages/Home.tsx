import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Sparkles, RotateCcw, AlertCircle, Copy, Check,
  Download, Upload, FileText, Clock, Brain, Hash,
  ChevronRight, Layers, FileDown, Loader2,
} from "lucide-react";
import { exportStudySheet } from "@/lib/exportPDF";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractTextFromPDF } from "@/lib/pdfExtract";
import { analyzeDifficulty, getReadingTime, getRevisionTime, extractKeywords } from "@/lib/textAnalysis";
import { extractNotes, generateFlashcards, generateQuiz } from "@/lib/generateContent";
import { saveCurrentSession, getCurrentSession } from "@/lib/storage";
import type { StudySession, Difficulty } from "@/lib/types";

const MAX_CHARS = 5000;
const TYPING_SPEED = 16;

function TypewriterText({ text, startDelay = 0, typingKey }: { text: string; startDelay?: number; typingKey: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    const t = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(iv); setDone(true); }
      }, TYPING_SPEED);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(t);
  }, [typingKey]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-0.5 h-[1em] bg-primary align-middle ml-0.5 animate-pulse" />}
    </span>
  );
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Beginner: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  Intermediate: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Advanced: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
};

export default function Home() {
  const [text, setText] = useState("");
  const [session, setSession] = useState<StudySession | null>(() => getCurrentSession());
  const [typingKey, setTypingKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const charsLeft = MAX_CHARS - text.length;
  const nearLimit = charsLeft <= 200;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > MAX_CHARS) return;
    setText(e.target.value);
    if (error) setError(null);
  };

  const handlePdfFile = async (file: File) => {
    if (!file.type.includes("pdf")) {
      setError("Please upload a valid PDF file.");
      return;
    }
    setIsPdfLoading(true);
    setError(null);
    setPdfName(file.name);
    try {
      const extracted = await extractTextFromPDF(file);
      const trimmed = extracted.slice(0, MAX_CHARS);
      setText(trimmed);
    } catch {
      setError("Failed to extract text from PDF. Please try another file or paste text manually.");
      setPdfName(null);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePdfFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePdfFile(file);
  };

  const handleGenerate = () => {
    if (!text.trim()) { setError("Please paste some text or upload a PDF first."); return; }
    setError(null);
    setIsGenerating(true);

    setTimeout(() => {
      const notes = extractNotes(text);
      const keywords = extractKeywords(text, 10);
      const difficulty = analyzeDifficulty(text);
      const readingTimeMin = getReadingTime(text);
      const revisionTimeMin = getRevisionTime(text);
      const flashcards = generateFlashcards(notes);
      const quizQuestions = generateQuiz(notes, text);

      const newSession: StudySession = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        inputText: text,
        notes,
        keywords,
        difficulty,
        readingTimeMin,
        revisionTimeMin,
        flashcards,
        quizQuestions,
      };

      saveCurrentSession(newSession);
      setSession(newSession);
      setTypingKey(k => k + 1);
      setCopied(false);
      setIsGenerating(false);
    }, 900);
  };

  const handleExport = useCallback(async () => {
    if (!session) return;
    setIsExporting(true);
    try {
      await exportStudySheet(session);
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setIsExporting(false);
    }
  }, [session]);

  const handleClear = () => {
    setText("");
    setSession(null);
    setError(null);
    setCopied(false);
    setPdfName(null);
  };

  const handleCopy = useCallback(async () => {
    if (!session?.notes.length) return;
    await navigator.clipboard.writeText(session.notes.map((n, i) => `${i + 1}. ${n}`).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [session]);

  const handleDownload = useCallback(() => {
    if (!session?.notes.length) return;
    const content = `AI Study Notes\n${"=".repeat(40)}\n\n${session.notes.map((n, i) => `${i + 1}. ${n}`).join("\n\n")}\n\nKeywords: ${session.keywords.join(", ")}\nDifficulty: ${session.difficulty}\nReading Time: ${session.readingTimeMin} min`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "study-notes.txt"; a.click();
    URL.revokeObjectURL(url);
  }, [session]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">

      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Upload or paste study material — ReviseIQ turns it into notes, flashcards, and a quiz.</p>
      </div>

      {/* Input card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-muted/40 px-5 py-4 border-b border-border flex items-center gap-3">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Study Material</span>
          {pdfName && (
            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full truncate max-w-[160px]">
              {pdfName}
            </span>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* PDF Upload Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            data-testid="pdf-dropzone"
            className={`flex items-center gap-4 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {isPdfLoading
                ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                : <Upload className="w-4 h-4 text-primary" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {isPdfLoading ? "Extracting text from PDF..." : "Upload PDF"}
              </p>
              <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileInput}
              data-testid="input-pdf"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">or paste text</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Text area */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl blur opacity-0 group-focus-within:opacity-60 transition duration-500" />
            <Textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Paste your study notes or textbook paragraph here..."
              className="relative w-full h-40 sm:h-48 resize-none p-4 text-base rounded-xl border-border bg-background shadow-none focus-visible:ring-primary"
              data-testid="textarea-input"
            />
          </div>

          {/* Counters */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5" data-testid="text-counters">
            <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
            <span className={nearLimit ? (charsLeft <= 0 ? "text-destructive font-semibold" : "text-amber-500 dark:text-amber-400") : ""}>
              {charsLeft.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters remaining
            </span>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-destructive text-sm font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={handleClear}
              disabled={isGenerating || (!text && !session)}
              className="text-muted-foreground hover:text-foreground rounded-xl"
              data-testid="button-clear">
              <RotateCcw className="w-4 h-4 mr-2" /> Clear
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating}
              className="rounded-xl px-7 shadow-md hover:shadow-lg transition-all"
              data-testid="button-generate">
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="flex gap-1">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </span>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Generate Notes</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics cards — shown after generation */}
      <AnimatePresence>
        {session && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            data-testid="analytics-cards"
          >
            {[
              { icon: Clock, label: "Reading Time", value: `${session.readingTimeMin} min`, sub: "avg. 200 wpm" },
              { icon: Brain, label: "Revision Time", value: `${session.revisionTimeMin} min`, sub: "estimated" },
              {
                icon: Sparkles, label: "Difficulty", value: session.difficulty,
                badge: DIFFICULTY_STYLES[session.difficulty],
              },
              { icon: Hash, label: "Word Count", value: session.inputText.trim().split(/\s+/).filter(Boolean).length.toLocaleString(), sub: "words" },
            ].map(({ icon: Icon, label, value, sub, badge }) => (
              <div key={label} className="bg-card rounded-2xl border border-border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
                {badge ? (
                  <span className={`inline-block text-sm font-bold px-2.5 py-0.5 rounded-full border ${badge}`}>{value}</span>
                ) : (
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{value}</p>
                    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keywords */}
      <AnimatePresence>
        {session && session.keywords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-5 space-y-3"
            data-testid="keywords-section"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Concepts</p>
            <div className="flex flex-wrap gap-2">
              {session.keywords.map(kw => (
                <span key={kw} className="text-sm bg-primary/10 text-primary border border-primary/15 px-3 py-1 rounded-full font-medium">
                  {kw}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Notes */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden" data-testid="results-area">
        <div className="bg-muted/40 px-5 py-3.5 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-xs sm:text-sm font-semibold tracking-wider text-muted-foreground uppercase">Summary Notes</h2>
          </div>
          {session && session.notes.length > 0 && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleCopy} data-testid="button-copy"
                className="h-8 px-2 sm:px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5">
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span key="check" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <Check className="w-3.5 h-3.5" /><span className="hidden sm:inline">Copied!</span>
                    </motion.span>
                  ) : (
                    <motion.span key="copy" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5">
                      <Copy className="w-3.5 h-3.5" /><span className="hidden sm:inline">Copy</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload} data-testid="button-download"
                className="h-8 px-2 sm:px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5">
                <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-7 min-h-[180px] flex flex-col">
          {session && session.notes.length > 0 ? (
            <ul className="space-y-5" data-testid="results-list">
              {session.notes.map((note, i) => (
                <motion.li
                  key={`${typingKey}-${i}`}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className="flex items-start gap-3 sm:gap-4 group"
                >
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs sm:text-sm mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {i + 1}
                  </div>
                  <p className="text-base sm:text-lg leading-relaxed text-card-foreground pt-0.5">
                    <TypewriterText
                      text={note}
                      typingKey={typingKey}
                      startDelay={i * (note.length * TYPING_SPEED * 0.4 + 200)}
                    />
                  </p>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 opacity-50 py-6">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Your summary notes will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick links + Export after generation */}
      <AnimatePresence>
        {session && session.notes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Quick nav cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/flashcards"
                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-sm transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Flashcards</p>
                  <p className="text-xs text-muted-foreground">{session.flashcards.length} cards ready</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
              <Link
                href="/quiz"
                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-sm transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Quiz Me</p>
                  <p className="text-xs text-muted-foreground">{session.quizQuestions.length} questions ready</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>

            {/* Export Study Sheet */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                {isExporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileDown className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold leading-none">
                  {isExporting ? "Generating PDF…" : "Export Study Sheet"}
                </p>
                <p className="text-xs text-white/70 mt-1">
                  Notes · Keywords · Flashcards · Quiz · Analytics
                </p>
              </div>
              {!isExporting && (
                <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
