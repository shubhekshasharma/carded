import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Scan } from "lucide-react";
import TradingCard from "@/components/TradingCard";
import { getDeckItems, CardPayload } from "@/lib/qr-utils";
const Collection = () => {
  const navigate = useNavigate();
  const [deck, setDeck] = useState<CardPayload[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  useEffect(() => {
    // Load deck from sessionStorage and add sample cards
    const currentDeck = getDeckItems();

    // Add sample cards if deck is empty or only has one card
    const sampleCards: CardPayload[] = [{
      v: 1,
      name: "Alex Rivera",
      hobby: "coffee obsession",
      quirk: "always late",
      anchor: "reusable water bottle",
      closer: "chaotic fun",
      generated: {
        icon: "",
        theme: "CHAOTIC_CHIPTUNE_ENERGETIC",
        fun_fact: "Alex once discovered the meaning of life after espresso shot number nine*",
        descriptors: ["Caffeine Oracle", "Time Rebel"],
        entrance: "",
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=Alex-Rivera&backgroundColor=transparent&size=512`
      }
    }, {
      v: 1,
      name: "Jordan Lee",
      hobby: "plants obsession",
      quirk: "humming songs",
      anchor: "headphones",
      closer: "quiet but powerful",
      generated: {
        icon: "",
        theme: "ATMOSPHERIC_AMBIENT_ORGANIC",
        fun_fact: "Jordan can communicate with houseplants (they're surprisingly gossipy)*",
        descriptors: ["Plant Whisperer", "Melody Maker"],
        entrance: "",
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=Jordan-Lee&backgroundColor=transparent&size=512`
      }
    }, {
      v: 1,
      name: "Sam Chen",
      hobby: "gaming obsession",
      quirk: "making lists",
      anchor: "coffee cup",
      closer: "like a boss",
      generated: {
        icon: "",
        theme: "EPIC_FANFARE_STRUCTURED",
        fun_fact: "Sam holds the record for creating characters they never actually played*",
        descriptors: ["List Legend", "Boss Energy"],
        entrance: "",
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=Sam-Chen&backgroundColor=transparent&size=512`
      }
    }];

    // Combine user's cards with sample cards (user cards first), capped at 5
    const combinedDeck = [...currentDeck, ...sampleCards].slice(0, 5);
    setDeck(combinedDeck);
  }, []);
  return <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-gradient-scanlines pointer-events-none opacity-10" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/")} className="font-pixel text-xs border-2 border-retro-blue hover:border-retro-blue hover:bg-retro-blue/10">
              <ArrowLeft className="w-4 h-4 mr-1" />
              HOME
            </Button>
                <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
                  <h1 className="font-pixel text-2xl text-retro-green">My Collection</h1>
                  <p className="font-mono text-sm text-muted-foreground">
                    {deck.length} {deck.length === 1 ? 'card' : 'cards'} collected
                  </p>
                </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => navigate("/scan")} className="font-pixel text-xs bg-retro-blue hover:bg-retro-blue/90 text-background border-2 border-background shadow-pixel">
              <Scan className="w-4 h-4 mr-1" />
              SCAN
            </Button>
            <Button onClick={() => navigate("/quiz")} className="font-pixel text-xs bg-retro-green hover:bg-retro-green/90 text-background border-2 border-background shadow-pixel">
              <Plus className="w-4 h-4 mr-1" />
              CREATE
            </Button>
          </div>
        </div>

        {deck.length === 0 ? <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="text-center py-16">
            <div className="mb-6">
              <div className="w-32 h-32 mx-auto mb-4 border-4 border-dashed border-retro-green/30 rounded-lg flex items-center justify-center">
                <Scan className="w-16 h-16 text-retro-green/30" />
              </div>
              <h2 className="font-pixel text-xl text-retro-green mb-2">No cards yet</h2>
              <p className="font-mono text-sm text-muted-foreground mb-6">
                Create yours or scan one to start your deck
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button onClick={() => navigate("/quiz")} className="font-pixel text-base px-8 py-6 bg-retro-green text-background border-2 border-background shadow-pixel hover:shadow-hover">
                Create my card
              </Button>
              <Button onClick={() => navigate("/scan")} variant="outline" className="font-mono border-2 border-retro-blue text-retro-blue hover:bg-retro-blue/10">
                <Scan className="w-4 h-4 mr-2" />
                Scan a card
              </Button>
            </div>
          </motion.div> : <div className="space-y-10">
            {/* My Card Section */}
            <section>
              <h2 className="font-pixel text-xl text-retro-green mb-4">My Card</h2>
              {deck[0] && (() => {
            const my = deck[0];
            const myData = {
              name: my.name,
              avatar: my.generated?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(my.name)}&backgroundColor=transparent&size=512`,
              funFacts: [my.generated?.fun_fact || "A mysterious individual"],
              badges: my.generated?.descriptors || ["Card Creator"],
              sound: my.generated?.theme || "CHILL_LOOP",
              number: 0 .toString().padStart(3, "0")
            };
            return <div className="flex justify-center">
                    <motion.div initial={{
                opacity: 0,
                scale: 0.9
              }} animate={{
                opacity: 1,
                scale: 1
              }} transition={{
                duration: 0.3
              }} className="cursor-pointer" onClick={() => setSelectedCard(myData)}>
                      <TradingCard {...myData} autoplaySound={false} />
                    </motion.div>
                  </div>;
          })()}
            </section>

            {/* Collection Section */}
            {deck.length > 1 && <section>
                <h2 className="font-pixel text-xl text-retro-green mb-4">Collection</h2>
                <div className="flex flex-wrap">
                {deck.slice(1).map((card, index) => {
                  const cardData = {
                    name: card.name,
                    avatar: card.generated?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(card.name)}&backgroundColor=transparent&size=512`,
                    funFacts: [card.generated?.fun_fact || "A mysterious individual"],
                    badges: card.generated?.descriptors || ["Card Collector"],
                    sound: card.generated?.theme || "CHILL_LOOP",
                    number: (index + 1).toString().padStart(3, "0")
                  };

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="cursor-pointer m-2" // <-- Add margin around each card
                      onClick={() => setSelectedCard(cardData)}
                    >
                      <TradingCard {...cardData} autoplaySound={false} />
                    </motion.div>
                  );
                })}
              </div>
              </section>}
          </div>}
      </div>
    </div>;
};
export default Collection;

