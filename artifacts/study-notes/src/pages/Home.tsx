import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!text.trim()) {
      setError("Please paste some text first to generate notes.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    // Simulate AI loading delay
    setTimeout(() => {
      const splitRegex = /(?<=[.!?])\s+/;
      const sentences = text
        .split(splitRegex)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const topSentences = sentences.slice(0, 3);
      setNotes(topSentences);
      setIsGenerating(false);
    }, 800);
  };

  const handleClear = () => {
    setText("");
    setNotes([]);
    setError(null);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground py-12 px-4 sm:px-6 md:px-8 font-sans selection:bg-primary/20">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
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
              <div className="bg-muted/50 px-6 py-4 border-b border-border">
                <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                  Your Summary Notes
                </h2>
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
