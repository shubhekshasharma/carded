import { useState, useEffect, useRef } from "react";
import OpenAI from "openai";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TradingCard from "@/components/TradingCard";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";
import { generateShareURL, CardPayload, addToDeck } from "@/lib/qr-utils";

const llmClient = new OpenAI({
  apiKey: import.meta.env.VITE_LLM_LITE_TOKEN,
  baseURL: import.meta.env.VITE_LLM_LITE_URL,
  dangerouslyAllowBrowser: true,
});

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cardData, setCardData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // Helper: timeout wrapper to avoid long waits on AI
  const withTimeout = async <T,>(promise: Promise<T>, ms = 8000): Promise<T | null> => {
    return Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]) as Promise<T | null>;
  };

  const generatePersonalizedFunFact = async (name: string, obsession: string, quirk: string, trophy: string, vibe: string): Promise<string> => {
    const n = name || 'This person';
    try {
      const response = await llmClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `
            Write a single funny, whimsical fun fact about a person named ${n}. 
            Their obsession is "${obsession}", 
            their quirk is "${quirk}", 
            their signature item is "${trophy}",
            and their vibe is "${vibe}". 
            Keep it under 175 characters, 
            make it personal and humorous, 
            and end it with an asterisk (*). 
            Output only the fun fact, nothing else. 
            The fun face should be funny and humanlike. 
            The output also make sense, not just random words thrown together.`,
        }],
        max_tokens: 120,
        temperature: 0.9,
      });
      let fact = response.choices[0]?.message?.content?.trim() ?? '';
      if (fact) {
        if (!fact.endsWith('*')) fact += '*';
        return fact.length > 180 ? fact.slice(0, 177) + '...*' : fact;
      }
    } catch (e) {
      console.error('LLM fun fact generation failed, using fallback:', e);
    }

    // Fallback: original hardcoded logic
    const lower = (s: string) => (s || '').toLowerCase();
    const interest = [lower(obsession), lower(trophy), lower(vibe), lower(quirk)].find(Boolean) || '';
    const pick = (i: string) => {
      if (i.includes('plant')) return `${n} can communicate with houseplants (they're surprisingly gossipy) and once mediated a dispute between a fern and a succulent*`;
      if (i.includes('coffee')) return `${n} once discovered the meaning of life after espresso shot number nine, but forgot to write it down before shot number ten*`;
      if (i.includes('game')) return `${n} holds the record for creating characters they never actually played—their character backstories have their own fan wiki*`;
      if (i.includes('music') || i.includes('headphone')) return `${n} claims perfect pitch but only for car alarms, elevator dings, and the microwave beep at exactly 2am*`;
      if (i.includes('art') || i.includes('draw') || i.includes('paint')) return `${n} can draw a perfect circle freehand—but only on Tuesdays, and only when no one's watching*`;
      if (i.includes('cook') || i.includes('chef')) return `${n} once invented a new element while making toast, but it dissolved before they could name it (probably for the best)*`;
      if (i.includes('sport')) return `${n} trained with Olympians until they asked ${n.split(' ')[0]} to slow down—turns out "casual jog" is relative*`;
      if (i.includes('late')) return `${n} has never been on time to anything, including their own birth (fashionably late is a lifestyle, not a choice)*`;
      if (i.includes('meme')) return `${n} speaks fluent meme and can translate any emotion into a TikTok sound—their thesis on internet linguistics is just 47 vine references*`;
      return `${n} once negotiated peace between two rival pigeons outside a library, and now they occasionally consult on bird diplomacy*`;
    };
    let fact = pick(interest);
    if (!fact.endsWith('*')) fact += '*';
    return fact.length > 180 ? fact.slice(0, 177) + '...*' : fact;
  };

  const generatePersonalityBadges = async (obsession: string, quirk: string, trophy: string, vibe: string): Promise<string[]> => {
    try {
      const response = await llmClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Generate exactly 2 creative personality badge names (2-3 words each) for a person with these traits: obsession="${obsession}", quirk="${quirk}", signature item="${trophy}", vibe="${vibe}". Return only a JSON array of 2 strings, e.g. ["Badge One", "Badge Two"]. No explanation.`,
        }],
        max_tokens: 40,
        temperature: 0.85,
      });
      const raw = response.choices[0]?.message?.content?.trim() ?? '';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        return parsed.slice(0, 2).map(String);
      }
    } catch (e) {
      console.error('LLM badge generation failed, using fallback:', e);
    }

    // Fallback: original hardcoded logic
    const badges: { [key: string]: string[] } = {
      coffee: ["Caffeine Oracle", "Brew Master"],
      snacks: ["Snack Sorcerer", "Munch Lord"],
      music: ["Sound Wizard", "Beat Keeper"],
      plants: ["Plant Whisperer", "Green Sage"],
      sleep: ["Sleep Ninja", "Dream Walker"],
      "always late": ["Time Rebel", "Clock Dodger"],
      "talking to pets": ["Pet Psychic", "Animal Oracle"],
      "making lists": ["List Legend", "Order Keeper"],
      "humming songs": ["Melody Maker", "Tune Weaver"],
      "checking the fridge": ["Fridge Guardian", "Snack Scout"],
      "snack hoarding": ["Stash Master", "Treat Keeper"],
      "being dramatic": ["Drama King", "Scene Stealer"],
      "dad jokes": ["Pun Legend", "Joke Master"],
      "organizing everything": ["Chaos Tamer", "Order Wizard"],
      "remembering trivia": ["Fact Keeper", "Quiz Champion"],
      "quiet but powerful": ["Silent Storm", "Hidden Force"],
      "chaotic fun": ["Chaos Bringer", "Wild Card"],
      mysterious: ["Mystery Maker", "Enigma Lord"],
      "friendly and bubbly": ["Joy Spreader", "Smile Dealer"],
      "like a boss": ["Boss Energy", "Alpha Vibe"]
    };
    const allAnswers = [obsession.toLowerCase(), quirk.toLowerCase(), trophy.toLowerCase(), vibe.toLowerCase()];
    const availableBadges: string[] = [];
    allAnswers.forEach(answer => {
      if (badges[answer]) availableBadges.push(...badges[answer]);
    });
    if (availableBadges.length === 0) {
      availableBadges.push("Unique Soul", "Wild Spirit", "Dream Chaser", "Vibe Master");
    }
    const shuffled = availableBadges.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  };

  const generateAvatarPrompt = async (name: string, obsession: string, quirk: string, trophy: string, vibe: string): Promise<string> => {
    try {
      const response = await llmClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `
            Write a concise image generation prompt (1-2 sentences, max 200 characters) 
            for a hand-drawn illustration of a gender-neutral person. 
            Their name is ${name || 'someone'}, they love "${obsession}", their quirk is "${quirk}", 
            they always carry "${trophy}", and their vibe is "${vibe}".
            Style: cozy illustration, warm colors, simple background. Output only the prompt text.
            The picture should be caartoonish and like pixel art, not realistic. 
            `,
        }],
        max_tokens: 100,
        temperature: 0.8,
      });
      const prompt = response.choices[0]?.message?.content?.trim() ?? '';
      if (prompt) return prompt;
    } catch (e) {
      console.error('LLM avatar prompt generation failed, using fallback:', e);
    }

    // Fallback: original hardcoded logic
    const lower = (s: string) => (s || '').toLowerCase();
    const vibeMap: { [key: string]: string } = {
      'quiet but powerful': 'calm, confident expression with subtle intensity',
      'chaotic fun': 'mischievous grin and energetic pose',
      'mysterious': 'enigmatic half‑smile and thoughtful gaze',
      'friendly and bubbly': 'bright cheerful smile and welcoming posture',
      'like a boss': 'confident stance with focused gaze',
    };
    const vibeDesc = vibeMap[lower(vibe)] || 'pleasant friendly expression';
    const interest = lower(obsession);
    const carry = lower(trophy);
    const props: string[] = [];
    if (interest.includes('coffee')) props.push('holding a coffee mug');
    if (interest.includes('music') || interest.includes('headphone')) props.push('wearing headphones');
    if (interest.includes('gaming') || interest.includes('game')) props.push('holding a game controller');
    if (interest.includes('plants') || interest.includes('plant')) props.push('surrounded by potted plants');
    if (interest.includes('art') || interest.includes('draw') || interest.includes('paint')) props.push('holding a paintbrush and palette');
    if (interest.includes('cook') || interest.includes('chef')) props.push('wearing a chef hat with cooking utensils');
    if (interest.includes('sport')) props.push('with sports equipment');
    if (carry.includes('coffee') && !props.some(p => p.includes('coffee'))) props.push('holding a coffee mug');
    if (carry.includes('headphone') && !props.some(p => p.includes('headphone'))) props.push('wearing headphones around neck');
    if (carry.includes('backpack')) props.push('wearing a backpack');
    if (carry.includes('water')) props.push('holding a water bottle');
    let prompt = `Hand-drawn illustration of a gender-neutral person, ${vibeDesc}`;
    if (props.length) prompt += `, ${props.slice(0, 2).join(', ')}`;
    prompt += `, cozy illustration style, warm colors, friendly expression, simple background`;
    return prompt;
  };

  const generateMusicStyle = async (obsession: string, quirk: string, trophy: string, vibe: string): Promise<string> => {
    try {
      const response = await llmClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Generate a music style identifier string (ALL_CAPS with underscores, like "CHAOTIC_CHIPTUNE_ENERGETIC") for a person with: obsession="${obsession}", quirk="${quirk}", signature item="${trophy}", vibe="${vibe}". Return only the identifier string, nothing else.`,
        }],
        max_tokens: 20,
        temperature: 0.8,
      });
      const style = response.choices[0]?.message?.content?.trim().replace(/[^A-Z0-9_]/g, '') ?? '';
      if (style) return style;
    } catch (e) {
      console.error('LLM music style generation failed, using fallback:', e);
    }

    // Fallback: original hardcoded logic
    const obsessionLower = obsession.toLowerCase();
    const quirkLower = quirk.toLowerCase();
    const trophyLower = trophy.toLowerCase();
    const vibeLower = vibe.toLowerCase();
    let baseStyle = "";
    if (vibeLower.includes("chaotic") || vibeLower.includes("fun")) baseStyle = "CHAOTIC_CHIPTUNE";
    else if (vibeLower.includes("quiet") || vibeLower.includes("powerful")) baseStyle = "ATMOSPHERIC_AMBIENT";
    else if (vibeLower.includes("mysterious")) baseStyle = "MYSTERIOUS_SYNTH";
    else if (vibeLower.includes("friendly") || vibeLower.includes("bubbly")) baseStyle = "UPBEAT_MELODY";
    else if (vibeLower.includes("boss")) baseStyle = "EPIC_FANFARE";
    else baseStyle = "CHILL_LOOP";
    let obsessionMod = "";
    if (obsessionLower.includes("coffee")) obsessionMod = "_ENERGETIC";
    else if (obsessionLower.includes("sleep")) obsessionMod = "_DREAMY";
    else if (obsessionLower.includes("music")) obsessionMod = "_HARMONIC";
    else if (obsessionLower.includes("plants")) obsessionMod = "_ORGANIC";
    else if (obsessionLower.includes("snacks")) obsessionMod = "_PLAYFUL";
    let rhythmMod = "";
    if (quirkLower.includes("dramatic") || trophyLower.includes("dramatic")) rhythmMod = "_DRAMATIC";
    else if (quirkLower.includes("organizing") || trophyLower.includes("organizing")) rhythmMod = "_STRUCTURED";
    else if (quirkLower.includes("late")) rhythmMod = "_SYNCOPATED";
    else if (quirkLower.includes("pets") || quirkLower.includes("talking")) rhythmMod = "_CONVERSATIONAL";
    return baseStyle + obsessionMod + rhythmMod;
  };

  useEffect(() => {
    if (!location.state?.answers) {
      navigate("/quiz");
      return;
    }

    // Generate card data based on new quiz format
    const generateCard = async () => {
      const answers = location.state.answers;
      const [name, obsession, quirk, trophy, vibe] = answers;
      
      // Generate personalized content (all LLM calls in parallel)
      const [personalizedFunFact, badges, avatarPrompt, musicStyle] = await Promise.all([
        generatePersonalizedFunFact(
          name || "Mystery Player",
          obsession || "mysterious things",
          quirk || "being enigmatic",
          trophy || "unexplained phenomena",
          vibe || "mysterious"
        ),
        generatePersonalityBadges(
          obsession || "mysterious things",
          quirk || "being enigmatic",
          trophy || "unexplained phenomena",
          vibe || "mysterious"
        ),
        generateAvatarPrompt(
          name || "Mystery Player",
          obsession || "mysterious things",
          quirk || "being enigmatic",
          trophy || "unexplained phenomena",
          vibe || "mysterious"
        ),
        generateMusicStyle(
          obsession || "mysterious things",
          quirk || "being enigmatic",
          trophy || "unexplained phenomena",
          vibe || "mysterious"
        ),
      ]);

      // Generate avatar and fun fact in parallel with timeout to prevent long waits
      const [avatarResult, funFactResult] = await Promise.allSettled([
        withTimeout(
          supabase.functions.invoke('generate-avatar', {
            body: { prompt: avatarPrompt }
          }),
          7000
        ),
        withTimeout(
          supabase.functions.invoke('generate-fun-fact', {
            body: { name, obsession, quirk, trophy, vibe }
          }),
          7000
        )
      ]);

      // Process avatar result with timeout handling
      let generatedAvatarUrl = null;
      if (avatarResult.status === 'fulfilled' && avatarResult.value?.data?.imageUrl) {
        generatedAvatarUrl = avatarResult.value.data.imageUrl;
        console.log('AI avatar generated successfully');
      } else if (avatarResult.status === 'fulfilled' && avatarResult.value === null) {
        console.warn('Avatar generation timed out, using fallback');
        const seed = `${name}-${obsession}-${quirk}`;
        generatedAvatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent&size=512`;
      } else {
        console.error('Failed to generate AI avatar:', avatarResult.status === 'rejected' ? avatarResult.reason : 'No image URL');
        const seed = `${name}-${obsession}-${quirk}`;
        generatedAvatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent&size=512`;
      }

      const fallbackAvatar = generatedAvatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent&size=512`;

      // Process fun fact result with timeout handling
      let aiFunFact = personalizedFunFact;
      if (funFactResult.status === 'fulfilled' && funFactResult.value?.data?.funFact) {
        aiFunFact = funFactResult.value.data.funFact;
        // Ensure it ends with asterisk
        if (!aiFunFact.endsWith('*')) {
          aiFunFact += '*';
        }
        console.log('AI fun fact generated successfully');
      } else if (funFactResult.status === 'fulfilled' && funFactResult.value === null) {
        console.warn('Fun fact generation timed out, using fallback');
      } else {
        console.error('Failed to generate AI fun fact:', funFactResult.status === 'rejected' ? funFactResult.reason : 'No fun fact');
      }

      const cardNumber = Math.floor(Math.random() * 999).toString().padStart(3, "0");

      // Create card payload for QR code
      const payload: CardPayload = {
        v: 1,
        name: name || "Mystery Player",
        hobby: obsession || "mysterious things",
        quirk: quirk || "being enigmatic",
        anchor: trophy || "unexplained phenomena",
        closer: vibe || "mysterious",
        generated: {
          icon: "",
          theme: musicStyle,
          fun_fact: aiFunFact,
          descriptors: badges,
          entrance: "",
          avatar: fallbackAvatar,
        },
      };

      // Generate ACTUAL scannable QR code with compact payload
      let generatedQrCodeUrl = null;
      try {
        const payloadForQR: CardPayload = {
          v: 1,
          name: name || "Mystery Player",
          hobby: obsession || "mysterious things",
          quirk: quirk || "being enigmatic",
          anchor: trophy || "unexplained phenomena",
          closer: vibe || "mysterious",
        } as CardPayload; // generated omitted to keep URL small

        const shareUrl = generateShareURL(payloadForQR);
        generatedQrCodeUrl = await QRCode.toDataURL(shareUrl, {
          width: 512,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
        setQrCodeUrl(generatedQrCodeUrl);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      }

      // Save to deck automatically
      addToDeck(payload);

      setCardData({
        name: name || "Mystery Player",
        avatar: fallbackAvatar,
        funFacts: [aiFunFact],
        badges: badges,
        avatarPrompt: avatarPrompt,
        sound: musicStyle,
        number: cardNumber,
        qrCodeUrl: generatedQrCodeUrl,
      });
      
      setIsGenerating(false);
    };

    // Small delay for dramatic effect (faster)
    setTimeout(generateCard, 150);
  }, [location.state, navigate, generatedAvatar]);

  const handleShare = async () => {
    if (!cardData) return;
    
    // Create payload and generate share URL
    const payload: CardPayload = {
      v: 1,
      name: cardData.name,
      hobby: location.state.answers[1],
      quirk: location.state.answers[2],
      anchor: location.state.answers[3],
      closer: location.state.answers[4],
      generated: {
        icon: "",
        theme: cardData.sound,
        fun_fact: cardData.funFacts[0],
        descriptors: cardData.badges,
        entrance: "",
        avatar: cardData.avatar,
      },
    };

    const shareUrl = generateShareURL(payload);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardData.name}'s Carded`,
          text: "Check out my digital card!",
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled share, fallback to clipboard
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "LINK COPIED!",
          description: "Share your card with friends!",
        });
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "LINK COPIED!",
        description: "Share your card with friends!",
      });
    }
  };

  const handleDownload = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const cardElement = document.querySelector('[data-card-element]');
      
      if (!cardElement) {
        toast({
          title: "Error",
          description: "Could not find card to download",
          variant: "destructive",
        });
        return;
      }

      const canvas = await html2canvas(cardElement as HTMLElement, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${cardData?.name || 'card'}-carded.png`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "SAVED!",
        description: "Card saved to your device!",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to save card",
        variant: "destructive",
      });
    }
  };

  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = [
    "Putting your card together...",
    "Designing something special...",
    "Assembling the pieces...",
    "Making magic happen...",
    "Getting everything just right...",
  ];

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1600);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div 
            key={loadingMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="font-pixel text-2xl md:text-4xl text-retro-green mb-4"
          >
            {loadingMessages[loadingMessageIndex]}
          </motion.div>
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative">
      {/* Retro scanlines */}
      <div className="absolute inset-0 bg-gradient-scanlines pointer-events-none opacity-10" />

      <div className="flex flex-col items-center gap-6">
        {/* Back to Home Button */}
        <Button 
          onClick={() => navigate("/")} 
          variant="default"
          className="absolute top-4 left-4"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-pixel text-3xl text-retro-green mb-2"
        >
          Your new card just dropped!
        </motion.h1>

        <div data-card-element>
          <TradingCard
            {...cardData}
            onShare={handleShare}
            onDownload={handleDownload}
          />
        </div>

        {/* Action Button */}
        <Button 
          onClick={() => navigate("/collection")} 
          variant="outline"
          className="font-pixel text-sm border-2 border-retro-green text-retro-green hover:bg-retro-green/10 flex items-center gap-2"
        >
          View my Deck
          <span className="text-lg">→</span>
        </Button>
      </div>
    </div>
  );
};

export default Result;