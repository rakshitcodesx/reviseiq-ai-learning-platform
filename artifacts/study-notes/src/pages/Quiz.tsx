import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/storage";

export default function Quiz() {
  const session = getCurrentSession();
  const questions = session?.quizQuestions ?? [];

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = questions[index];

  const handleSelect = (option: string) => {
    if (selected !== null) return;
    setSelected(option);
    if (option === current.answer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (index < questions.length - 1) {
      setSelected(null);
      setIndex(i => i + 1);
    } else {
      setDone(true);
    }
  };

  const handleRestart = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">No Quiz Available</h2>
        <p className="text-muted-foreground max-w-sm">Generate notes from the Dashboard first to unlock your quiz.</p>
        <Link href="/"><Button>Go to Dashboard</Button></Link>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 80 ? "Excellent!" : pct >= 60 ? "Good work!" : "Keep practicing!";
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto"
        >
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>
        <div>
          <h2 className="text-3xl font-bold">{grade}</h2>
          <p className="text-muted-foreground mt-2">You scored {score} out of {questions.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="text-5xl font-bold text-primary">{pct}%</div>
          <div className="h-3 bg-muted rounded-full mt-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="outline" onClick={handleRestart} className="gap-2 rounded-xl">
            <RotateCcw className="w-4 h-4" /> Try Again
          </Button>
          <Link href="/"><Button className="rounded-xl">Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quiz Me</h1>
          <p className="text-muted-foreground text-sm mt-1">Select the correct answer</p>
        </div>
        <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          {index + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${((index + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Question {index + 1}
            </p>
            <p className="text-lg sm:text-xl font-medium leading-relaxed text-card-foreground" data-testid="quiz-question">
              {current.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3" data-testid="quiz-options">
            {current.options.map((opt, i) => {
              const isSelected = selected === opt;
              const isCorrect = opt === current.answer;
              const revealed = selected !== null;

              let style = "border-border bg-card text-card-foreground hover:bg-muted/50";
              if (revealed) {
                if (isCorrect) style = "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300";
                else if (isSelected) style = "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300";
                else style = "border-border bg-muted/30 text-muted-foreground";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(opt)}
                  disabled={revealed}
                  data-testid={`quiz-option-${i}`}
                  className={`w-full flex items-center justify-between gap-3 p-4 rounded-xl border text-left text-sm font-medium transition-all ${
                    revealed ? "cursor-default" : "cursor-pointer"
                  } ${style}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs flex-shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </span>
                  {revealed && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                  {revealed && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Next button */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <Button onClick={handleNext} className="rounded-xl px-8">
              {index < questions.length - 1 ? "Next Question" : "See Results"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
