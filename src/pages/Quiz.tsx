import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Loader2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  question: string;
  type: "multiple" | "text" | "ai_dynamic";
  answers?: string[];
  placeholder?: string;
  saveAs?: string;
}

const baseQuestions: Question[] = [
  {
    id: 1,
    question: "First things first — what name should we stamp on your card?",
    type: "text",
    placeholder: "e.g. Maya, Jay",
    saveAs: "NAME",
  },
  {
    id: 2,
    question: "Nice to meet you, [NAME]! What's something you're really into these days?",
    type: "multiple",
    answers: ["Music 🎶", "Gaming 🎮", "Sports 🏀", "Cooking 🍳", "Plants 🪴", "Art 🎨"],
    placeholder: "e.g. thrift shopping, horror movies, rock climbing",
    saveAs: "HOBBY",
  },
  {
    id: 3,
    question: "What's one thing you always do without even thinking about it?",
    type: "multiple",
    answers: ["Running late ⏰", "Quoting shows/memes 📺", "Talking with hand gestures ✋", "Forgetting names 🙃", "Scrolling on your phone 📱"],
    placeholder: "e.g. humming out loud",
    saveAs: "QUIRK",
  },
  {
    id: 4,
    question: "What's something you basically always have with you?",
    type: "multiple",
    answers: ["Coffee ☕", "Headphones 🎧", "Backpack 🎒", "Water bottle 💧", "Snacks 🍫"],
    placeholder: "e.g. notebook, lip balm, charger",
    saveAs: "ANCHOR",
  },
  {
    id: 5,
    question: "Loading your personalized question...",
    type: "ai_dynamic",
    answers: [],
    placeholder: "Or type your own...",
    saveAs: "DYNAMIC_ANSWER",
  },
];

const Quiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [questions, setQuestions] = useState<Question[]>(baseQuestions);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [showSomethingElse, setShowSomethingElse] = useState(false);
  
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  // Unified animation variants for options and input
  const listVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 },
    },
  } as const;

  // Interpolate name in question text
  const getQuestionText = (questionText: string) => {
    const name = answers[0] || "";
    return questionText.replace(/\[NAME\]/g, name);
  };

  const formatTextInput = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const handleAnswer = (answer: string) => {
    setSelected(answer);
  };

  const advanceToNext = async (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    
    if (currentQuestion < questions.length - 1) {
      // Check if next question is AI dynamic - generate it before advancing
      if (currentQuestion === 3 && questions[4].type === "ai_dynamic") {
        setIsGeneratingQuestion(true);
        await generateDynamicQuestion(newAnswers);
        setIsGeneratingQuestion(false);
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setCurrentQuestion(currentQuestion + 1);
      }
    } else {
      navigate("/result", { state: { answers: newAnswers } });
    }
  };

  const generateDynamicQuestion = async (currentAnswers: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-dynamic-question', {
        body: { answers: currentAnswers }
      });

      if (error) throw error;

      if (data?.question && data?.options) {
        const updatedQuestions = [...questions];
        updatedQuestions[4] = {
          ...updatedQuestions[4],
          question: data.question,
          answers: data.options,
          type: "multiple",
        };
        setQuestions(updatedQuestions);
      }
    } catch (error) {
      console.error("Error generating dynamic question:", error);
      toast({
        title: "Couldn't generate personalized question",
        description: "Using a default question instead.",
        variant: "destructive",
      });
      // Fallback question
      const updatedQuestions = [...questions];
      const userName = currentAnswers[0];
      updatedQuestions[4] = {
        ...updatedQuestions[4],
        question: "One last thing — what's your signature move when meeting new people?",
        answers: ["Big smile", "Awkward wave", "Firm handshake", "Finger guns", "Just vibe"],
        type: "multiple",
      };
      setQuestions(updatedQuestions);
    }
  };

  // Reset state when moving forward to a new question (not when going back)
  const isGoingBack = useRef(false);
  
  useEffect(() => {
    if (!isGoingBack.current) {
      setSelected(null);
      setTextInput("");
      setShowSomethingElse(false);
    }
    isGoingBack.current = false;
  }, [currentQuestion]);

  const handleNext = async () => {
    if (question.type === "text" && textInput.trim() === "") return;
    if ((question.type === "multiple" || question.type === "ai_dynamic") && !selected && textInput.trim() === "") return;
    
    let answer = "";
    if (question.type === "text") {
      answer = formatTextInput(textInput);
    } else if (textInput.trim()) {
      // Free form text input was used
      answer = formatTextInput(textInput);
    } else {
      answer = selected || "";
    }
    
    await advanceToNext(answer);
  };

  const handlePrevious = async () => {
    if (currentQuestion > 0) {
      isGoingBack.current = true;
      
      const targetQuestion = currentQuestion - 1;
      const prevAnswer = answers[targetQuestion];
      const prevQuestion = questions[targetQuestion];
      
      // Set the previous answer state BEFORE changing currentQuestion
      if (prevQuestion.type === "multiple" || (prevQuestion.answers && prevQuestion.answers.length > 0)) {
        if (prevQuestion.answers && prevQuestion.answers.includes(prevAnswer)) {
          setSelected(prevAnswer);
          setTextInput("");
        } else {
          setSelected(null);
          setTextInput(prevAnswer || "");
        }
      } else {
        setTextInput(prevAnswer || "");
        setSelected(null);
      }
      
      // Remove the answer for the question we're going back to (so it can be re-answered)
      const newAnswers = answers.slice(0, targetQuestion);
      setAnswers(newAnswers);
      setCurrentQuestion(targetQuestion);
      
      // If we're going back from question 5, reset question 5 so it can be regenerated
      if (currentQuestion === 4) {
        const resetQuestions = [...questions];
        resetQuestions[4] = {
          id: 5,
          question: "Loading your personalized question...",
          type: "ai_dynamic",
          answers: [],
          placeholder: "Or type your own...",
          saveAs: "DYNAMIC_ANSWER",
        };
        setQuestions(resetQuestions);
      }
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Retro scanlines */}
      <div className="absolute inset-0 bg-gradient-scanlines pointer-events-none opacity-10" />
      
      {/* Floating pixels */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-retro-green animate-pixel-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
      
      <div className="relative z-10 container mx-auto max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <Button
              size="sm"
              onClick={handleBackToHome}
              className="font-pixel text-xs bg-retro-green hover:bg-retro-green/90 text-background border-2 border-background shadow-pixel transition-all duration-200"
            >
              <Home className="w-4 h-4" />
            </Button>
            <div className="font-pixel text-sm text-retro-green bg-retro-green/10 px-4 py-2 rounded-full border border-retro-green/30">
              {currentQuestion + 1} of {questions.length}
            </div>
            <div className="w-8" />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Loading overlay */}
            {isGeneratingQuestion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg"
              />
            )}
            
            <Card className="p-6 border-2 border-retro-green bg-card shadow-pixel">
              <div className="text-center mb-6 border-b-2 border-retro-green pb-4">
                <h2 className="text-xl md:text-2xl font-pixel text-retro-green mb-2 leading-relaxed">
                  {getQuestionText(question.question)}
                </h2>
              </div>

              {(question.type === "multiple" || question.type === "ai_dynamic") && question.answers && question.answers.length > 0 && (
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 gap-3">
                    {question.answers.map((answer, index) => (
                      <motion.button
                        key={index}
                        variants={itemVariants}
                        onClick={() => {
                          setSelected(answer);
                          setTextInput("");
                        }}
                        className={cn(
                          "h-14 px-4 rounded border-2 transition-all duration-300 font-mono text-left flex items-center group relative overflow-hidden",
                          selected === answer
                            ? "border-retro-green bg-retro-green/20 text-retro-green shadow-pixel scale-[1.02]"
                            : "border-border bg-card hover:border-retro-green hover:bg-retro-green/10 hover:scale-[1.01] text-foreground"
                        )}
                      >
                        <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center shrink-0 mr-3">
                          {selected === answer && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2.5 h-2.5 bg-retro-green rounded-full"
                            />
                          )}
                        </div>
                        <span className="text-sm md:text-base flex-1">{answer}</span>
                      </motion.button>
                    ))}
                  </div>

                  {question.placeholder && (
                    <motion.div variants={itemVariants}>
                      <div className="relative">
                        <Input
                          value={textInput}
                          onChange={(e) => {
                            setTextInput(e.target.value);
                            if (e.target.value.trim()) {
                              setSelected(null);
                            }
                          }}
                          placeholder={question.placeholder}
                          className={cn(
                            "font-mono text-sm md:text-base h-14 px-4 border transition-all duration-200 bg-muted/30 placeholder:text-muted-foreground/60",
                            textInput.trim()
                              ? "border-retro-green bg-retro-green/5 placeholder:text-muted-foreground"
                              : "border-muted-foreground/20 hover:border-retro-green/50 focus:border-retro-green focus:bg-retro-green/5"
                          )}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && textInput.trim()) {
                              handleNext();
                            }
                          }}
                        />
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: textInput.trim() ? 1 : 0 }}
                          className="absolute -bottom-1 -right-1 w-2 h-2 bg-retro-green"
                          style={{
                            animation: textInput.trim() ? "blink 1s step-end infinite" : "none"
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {(question.type === "text" || (question.type === "ai_dynamic" && (!question.answers || question.answers.length === 0))) && (
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring" }}
                    className="relative"
                  >
                    <Input
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={question.placeholder}
                      className="font-mono text-base h-14 px-4 border bg-muted/30 border-muted-foreground/20 placeholder:text-muted-foreground/60 focus:border-retro-green focus:bg-retro-green/5 transition-all duration-200"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && textInput.trim()) {
                          handleNext();
                        }
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-retro-green animate-retro-blink" />
                  </motion.div>
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 mb-16">
          {currentQuestion === 0 ? (
            <Button
              variant="outline"
              onClick={handleBackToHome}
              className="font-pixel text-xs border-2 border-retro-blue hover:border-retro-blue hover:bg-retro-blue/10 hover:shadow-pixel transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              BACK
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="font-pixel text-xs border-2 border-retro-blue hover:border-retro-blue hover:bg-retro-blue/10 hover:shadow-pixel transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              BACK
            </Button>
          )}

          {(textInput.trim() || question.type === "text" || question.type === "multiple" || question.type === "ai_dynamic") && (
            <Button
              onClick={handleNext}
              disabled={
                (question.type === "text" && textInput.trim() === "") ||
                ((question.type === "multiple" || question.type === "ai_dynamic") && !selected && textInput.trim() === "") ||
                isGeneratingQuestion
              }
              className="font-pixel text-xs bg-retro-green hover:bg-retro-green/90 text-background border-2 border-background shadow-pixel hover:shadow-hover hover:translate-x-1 hover:translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
            >
              {isGeneratingQuestion ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  LOADING...
                </>
              ) : (
                <>
                  {currentQuestion === questions.length - 1 ? "CREATE CARD" : "CONTINUE"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;