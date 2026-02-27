import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { FlipHorizontal2, Share2, Download } from "lucide-react";
interface TradingCardProps {
  name: string;
  avatar: string;
  funFacts: string[];
  badges?: string[];
  traits?: string[];
  series?: string;
  sound: string;
  number: string;
  onFlip?: () => void;
  showBack?: boolean;
  qrCodeUrl?: string;
  onShare?: () => void;
  onDownload?: () => void;
  autoplaySound?: boolean;
}
const TradingCard = ({
  name,
  avatar,
  funFacts,
  badges = [],
  traits = [],
  sound,
  number,
  onFlip,
  showBack = false,
  qrCodeUrl,
  onShare,
  onDownload,
  autoplaySound = true
}: TradingCardProps) => {
  const [isFlipped, setIsFlipped] = useState(showBack);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showFlipHint, setShowFlipHint] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };
  useEffect(() => {
    // Auto-play sound when card loads (front side only)
    if (autoplaySound && !showBack && sound && !audioPlaying && !isFlipped) {
      setTimeout(() => {
        playSound();
      }, 500);
    }
  }, [sound, showBack, isFlipped, autoplaySound]);
  const playSound = () => {
    setAudioPlaying(true);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const createOscillator = (freq: number, type: OscillatorType = 'square') => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        osc.type = type;
        osc.frequency.value = freq;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        return {
          osc,
          gainNode
        };
      };
      const playChiptuneMelody = () => {
        const melody = [523, 659, 784, 659, 523, 392, 523];
        melody.forEach((freq, i) => {
          setTimeout(() => {
            const {
              osc,
              gainNode
            } = createOscillator(freq, 'square');
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.3);
          }, i * 200);
        });
      };
      const playAtmosphericAmbient = () => {
        const chords = [[261, 329, 392], [294, 370, 440], [330, 415, 494]];
        chords.forEach((chord, i) => {
          setTimeout(() => {
            chord.forEach(freq => {
              const {
                osc,
                gainNode
              } = createOscillator(freq, 'sine');
              gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
              osc.start(audioContext.currentTime);
              osc.stop(audioContext.currentTime + 1.5);
            });
          }, i * 1000);
        });
      };
      const playUpbeatMelody = () => {
        const pattern = [523, 659, 523, 784, 659, 880, 784, 1047];
        pattern.forEach((freq, i) => {
          setTimeout(() => {
            const {
              osc,
              gainNode
            } = createOscillator(freq, 'triangle');
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.25);
          }, i * 150);
        });
      };
      const playChillLoop = () => {
        const loopNotes = [392, 523, 659, 523, 440, 523];
        loopNotes.forEach((freq, i) => {
          setTimeout(() => {
            const {
              osc,
              gainNode
            } = createOscillator(freq, 'sine');
            gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.8);
          }, i * 400);
        });
      };
      const playEpicFanfare = () => {
        const fanfare = [523, 523, 659, 784, 1047, 880, 784, 1047];
        fanfare.forEach((freq, i) => {
          setTimeout(() => {
            const {
              osc,
              gainNode
            } = createOscillator(freq, 'sawtooth');
            gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.4);
          }, i * 250);
        });
      };

      // Play different patterns based on sound type
      if (sound.includes("CHAOTIC_CHIPTUNE")) {
        playChiptuneMelody();
      } else if (sound.includes("ATMOSPHERIC_AMBIENT")) {
        playAtmosphericAmbient();
      } else if (sound.includes("UPBEAT_MELODY")) {
        playUpbeatMelody();
      } else if (sound.includes("CHILL_LOOP")) {
        playChillLoop();
      } else if (sound.includes("EPIC_FANFARE")) {
        playEpicFanfare();
      } else if (sound.includes("MYSTERIOUS")) {
        const mysteryNotes = [220, 277, 330, 277, 220, 185];
        mysteryNotes.forEach((freq, i) => {
          setTimeout(() => {
            const {
              osc,
              gainNode
            } = createOscillator(freq, 'triangle');
            gainNode.gain.setValueAtTime(0.06, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.7);
          }, i * 500);
        });
      } else {
        playChillLoop();
      }
    } catch (e) {
      console.log("Audio not supported");
    }
    setTimeout(() => {
      setAudioPlaying(false);
    }, 4000);
  };
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (onFlip) onFlip();
  };

  // Fixed card dimensions
  const CARD_WIDTH = 420;
  const CARD_HEIGHT = 588;
  return <div className="relative" style={{
    width: `${CARD_WIDTH}px`,
    height: `${CARD_HEIGHT}px`,
    perspective: "1500px"
  }}>
      <motion.div className="relative w-full h-full" style={{
      transformStyle: "preserve-3d",
      transition: "transform 0.8s"
    }} animate={{
      rotateY: isFlipped ? 180 : 0
    }} transition={{
      duration: 0.8,
      ease: "easeInOut"
    }}>
        {/* CARD FRONT */}
        <div className="absolute inset-0 overflow-hidden" style={{
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden"
      }}>
          <div className="w-full h-full p-6 bg-card border-2 border-primary/60 relative overflow-hidden cursor-pointer" onClick={handleFlip} onMouseMove={handleMouseMove} onMouseEnter={() => setShowFlipHint(true)} onMouseLeave={() => setShowFlipHint(false)} style={{
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
        }}>
            {/* Subtle corner accents */}
            <div className="pointer-events-none absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-primary/20"></div>
            <div className="pointer-events-none absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-primary/20"></div>
            <div className="pointer-events-none absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-primary/20"></div>
            <div className="pointer-events-none absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-primary/20"></div>
            
            {/* Avatar centered with Flip Button on right */}
            <div className="relative flex justify-center mb-3">
              <div className="w-32 h-32 rounded-lg border border-primary/30 bg-muted/10 overflow-hidden">
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              </div>
              <Button onClick={(e) => { e.stopPropagation(); handleFlip(); }} onMouseEnter={() => setShowFlipHint(false)} onMouseLeave={() => setShowFlipHint(true)} size="icon" className="h-10 w-10 absolute top-0 right-0" title="Flip card">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Name - Increased size */}
            <h2 className="text-2xl text-center mb-4 text-foreground font-semibold tracking-wide">
              {name.toUpperCase()}
            </h2>

            {/* Fun Facts - Increased sizes */}
            <div className="bg-muted/5 border border-primary/20 rounded-lg p-4 mb-3">
              <h4 className="text-sm font-semibold mb-3 text-primary uppercase tracking-wider">Carded Fact  </h4>
              <ul className="space-y-2">
                {funFacts.slice(0, 2).map((fact, index) => <li key={index} className="text-sm text-muted-foreground leading-relaxed">
                    {fact}
                  </li>)}
              </ul>
              <p className="text-xs text-muted-foreground/60 mt-3 italic">*Facts not verified by science or reality!</p>
            </div>

            {/* Signature Traits - Increased title size */}
            <div className="bg-muted/5 border border-primary/20 rounded-lg p-4 mb-3">
              <h4 className="text-sm font-semibold mb-3 text-primary uppercase tracking-wider">Signature Traits</h4>
              <div className="flex flex-wrap gap-2">
                {(badges.length > 0 ? badges : traits).slice(0, 2).map((badge, index) => <span key={index} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded border border-primary/30">
                    {badge}
                  </span>)}
              </div>
            </div>

            {/* Theme Song Button - ONLY ON FRONT */}
            <button onClick={(e) => { e.stopPropagation(); playSound(); }} onMouseEnter={() => setShowFlipHint(false)} onMouseLeave={() => setShowFlipHint(true)} className={cn("w-full py-3 rounded-lg border font-medium text-sm transition-all duration-200", audioPlaying ? "bg-primary text-primary-foreground border-primary animate-pulse" : "bg-muted/5 text-muted-foreground border-primary/30 hover:bg-primary/10 hover:text-primary")}>
              {audioPlaying ? "♪ PLAYING THEME ♪" : `▶ ${name.toUpperCase()}'S THEME`}
            </button>
          </div>
        </div>

        {/* CARD BACK */}
        <div className="absolute inset-0 flex flex-col items-center justify-between p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-primary/30 cursor-pointer" onClick={handleFlip} onMouseMove={handleMouseMove} onMouseEnter={() => setShowFlipHint(true)} onMouseLeave={() => setShowFlipHint(false)} style={{
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
      }}>
          {/* Subtle corner accents */}
          <div className="pointer-events-none absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-primary/20"></div>
          <div className="pointer-events-none absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-primary/20"></div>
          <div className="pointer-events-none absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-primary/20"></div>
          <div className="pointer-events-none absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-primary/20"></div>

          {/* Flip Button - Top Right with Blue Color */}
          <div className="flex justify-end w-full">
            <Button onClick={(e) => { e.stopPropagation(); handleFlip(); }} onMouseEnter={() => setShowFlipHint(false)} onMouseLeave={() => setShowFlipHint(true)} size="icon" className="h-8 w-8 bg-retro-blue hover:bg-retro-blue/90" title="Flip card">
              <FlipHorizontal2 className="w-4 h-4" />
            </Button>
          </div>

          {/* QR Code - Large and Centered */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-72 h-72 bg-white rounded-xl p-4 mb-6">
              {qrCodeUrl ? <img src={qrCodeUrl} alt="Scan to collect card" className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                  Generating QR Code...
                </div>}
            </div>

            <p className="text-xl font-semibold text-foreground tracking-wider">
              SCAN TO COLLECT
            </p>
          </div>

          {/* Bottom Section: Action Buttons and Card Number */}
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Action Buttons - Inside Card */}
            <div className="flex gap-3 w-full px-4">
              <Button onClick={(e) => { e.stopPropagation(); onShare?.(); }} onMouseEnter={() => setShowFlipHint(false)} onMouseLeave={() => setShowFlipHint(true)} size="sm" className="flex-1 bg-retro-blue hover:bg-retro-blue/80 text-black">
                <Share2 className="w-4 h-4 mr-2" />
                Share Card
              </Button>
              <Button onClick={(e) => { e.stopPropagation(); onDownload?.(); }} onMouseEnter={() => setShowFlipHint(false)} onMouseLeave={() => setShowFlipHint(true)} size="sm" className="flex-1 bg-retro-blue hover:bg-retro-blue/80 text-black">
                <Download className="w-4 h-4 mr-2" />
                Save to Photos
              </Button>
            </div>

            {/* Card Number */}
            <p className="text-xs text-muted-foreground tracking-widest">
              CARDED™ • #{number}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Cursor-following flip hint — portalled to document.body so position:fixed isn't broken by ancestor CSS transforms */}
      {showFlipHint && createPortal(
        <div
          className="fixed pointer-events-none z-50 text-xs bg-black/80 text-white px-3 py-1.5 rounded-full whitespace-nowrap"
          style={{ left: cursorPos.x + 10, top: cursorPos.y + 18 }}
        >
          Click to Flip
        </div>,
        document.body
      )}
    </div>;
};
export default TradingCard;