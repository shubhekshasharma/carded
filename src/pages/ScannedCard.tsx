import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TradingCard from "@/components/TradingCard";
import { CardPayload, addToDeck } from "@/lib/qr-utils";
import { supabase } from "@/integrations/supabase/client";

const ScannedCard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cardData, setCardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const payload = location.state?.payload as CardPayload;

    if (!payload) {
      navigate("/");
      return;
    }

    generateCardData(payload);
  }, [location.state, navigate]);

  const generateCardData = async (payload: CardPayload) => {
    setIsLoading(true);

    // If generated data exists, use it
    if (payload.generated) {
      setCardData({
        name: payload.name,
        avatar: payload.generated.avatar,
        funFacts: [payload.generated.fun_fact],
        badges: payload.generated.descriptors,
        sound: payload.generated.theme,
        number: Math.floor(Math.random() * 999).toString().padStart(3, "0"),
      });
      setIsLoading(false);
      return;
    }

    // Otherwise, regenerate using AI
    try {
      const { data: funFactData } = await supabase.functions.invoke('generate-fun-fact', {
        body: {
          name: payload.name,
          obsession: payload.hobby,
          quirk: payload.quirk,
          trophy: payload.anchor,
          vibe: payload.closer,
        }
      });

      const funFact = funFactData?.funFact || "A mysterious individual with untold stories.";

      // Generate avatar
      const seed = `${payload.name}-${payload.hobby}-${payload.quirk}`;
      const avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent&size=512`;

      setCardData({
        name: payload.name,
        avatar,
        funFacts: [funFact],
        badges: ["Mystery Person", "Card Collector"],
        sound: "CHILL_LOOP",
        number: Math.floor(Math.random() * 999).toString().padStart(3, "0"),
      });
    } catch (error) {
      console.error("Failed to generate card data:", error);
      toast({
        title: "Couldn't unwrap this card",
        description: "Something went wrong. Try scanning again?",
        variant: "destructive",
      });
      navigate("/scan");
    }

    setIsLoading(false);
  };

  const handleAddToDeck = () => {
    const payload = location.state?.payload as CardPayload;
    if (!payload) return;

    addToDeck(payload);

    toast({
      title: "Added to your deck",
      description: `${payload.name}'s card is now in your collection!`,
    });

    navigate("/deck");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="font-pixel text-3xl text-retro-green mb-4 animate-pulse">
            Unwrapping this card…
          </div>
          <div className="flex justify-center gap-2">
            <div className="w-4 h-4 bg-retro-green animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-4 h-4 bg-retro-blue animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-4 h-4 bg-retro-purple animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!cardData) return null;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-gradient-scanlines pointer-events-none opacity-10" />

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="font-pixel text-sm text-retro-green hover:text-retro-green hover:bg-retro-green/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl pt-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="font-pixel text-2xl md:text-3xl text-retro-green mb-2">
            Card Scanned!
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            Add this card to your deck?
          </p>
        </motion.div>

        <div className="flex flex-col items-center justify-center gap-6">
          {/* Card Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex justify-center"
          >
            <TradingCard {...cardData} />
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3 w-full max-w-xs"
          >
            <Button
              onClick={handleAddToDeck}
              className="w-full font-pixel text-base px-8 py-6 bg-retro-green text-background border-2 border-background shadow-pixel hover:shadow-hover"
            >
              Add to Deck
            </Button>

            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full font-mono text-sm border-2 border-muted hover:bg-background/70"
            >
              Close
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ScannedCard;
