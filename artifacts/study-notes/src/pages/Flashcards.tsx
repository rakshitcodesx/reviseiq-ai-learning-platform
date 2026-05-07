import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ChevronLeft, ChevronRight, RotateCcw, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/storage";

export default function Flashcards() {
  const session = getCurrentSession();
  const cards = session?.flashcards ?? [];

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  const current = cards[index];

  const goNext = () => {
    if (index < cards.length - 1) {
      setDirection(1);
      setFlipped(false);
      setTimeout(() => setIndex(i => i + 1), 150);
    }
  };

  const goPrev = () => {
    if (index > 0) {
      setDirection(-1);
      setFlipped(false);
      setTimeout(() => setIndex(i => i - 1), 150);
    }
  };

  const reset = () => {
    setDirection(-1);
    setFlipped(false);
    setTimeout(() => setIndex(0), 150);
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Layers className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">No Flashcards Yet</h2>
        <p className="text-muted-foreground max-w-sm">Generate notes from the Dashboard first and your flashcards will appear here automatically.</p>
        <Link href="/"><Button>Go to Dashboard</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground text-sm mt-1">Click a card to reveal the answer</p>
        </div>
        <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          {index + 1} / {cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${((index + 1) / cards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -60 }}
          transition={{ duration: 0.2 }}
          className="cursor-pointer"
          onClick={() => setFlipped(f => !f)}
          style={{ perspective: 1200 }}
          data-testid="flashcard"
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 120, damping: 15 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative min-h-[260px] sm:min-h-[300px]"
          >
            {/* Front */}
            <div
              style={{ backfaceVisibility: "hidden" }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-card border border-border rounded-3xl p-8 shadow-lg text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Question</p>
              <p className="text-lg sm:text-xl font-medium leading-relaxed text-card-foreground">
                {current.front}
              </p>
              <p className="text-xs text-muted-foreground mt-6">Tap to reveal answer</p>
            </div>

            {/* Back */}
            <div
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-primary/5 border border-primary/20 rounded-3xl p-8 shadow-lg text-center"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">Answer</p>
              <p className="text-base sm:text-lg leading-relaxed text-card-foreground">
                {current.back}
              </p>
              <p className="text-xs text-muted-foreground mt-6">Tap to flip back</p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={goPrev} disabled={index === 0} className="gap-2 rounded-xl">
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>
        <Button variant="ghost" onClick={reset} className="gap-2 text-muted-foreground rounded-xl">
          <RotateCcw className="w-4 h-4" /> Restart
        </Button>
        {index < cards.length - 1 ? (
          <Button onClick={goNext} className="gap-2 rounded-xl">
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Link href="/quiz">
            <Button className="gap-2 rounded-xl">
              Take Quiz <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
