import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
const Home = () => {
  const navigate = useNavigate();

  // Floating pixel components for background animation
  const FloatingPixel = ({
    delay,
    duration
  }: {
    delay: number;
    duration: number;
  }) => <motion.div className="absolute w-2 h-2 bg-retro-green" initial={{
    opacity: 0
  }} animate={{
    opacity: [0, 1, 0],
    y: [-20, -100],
    x: [0, Math.random() * 50 - 25]
  }} transition={{
    duration,
    delay,
    repeat: Infinity,
    repeatDelay: Math.random() * 3 + 2
  }} style={{
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`
  }} />;
  return <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Retro scanlines effect */}
      <div className="absolute inset-0 bg-gradient-scanlines pointer-events-none opacity-20" />
      
      {/* Floating pixels animation */}
      {Array.from({
      length: 15
    }).map((_, i) => <FloatingPixel key={i} delay={i * 0.3} duration={3 + Math.random() * 2} />)}

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {/* Retro game-style title */}
        <motion.div initial={{
        opacity: 0,
        scale: 0.8
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        duration: 0.8,
        type: "spring"
      }} className="mb-12">
          <h1 className="font-pixel text-4xl md:text-6xl lg:text-7xl text-retro-green mb-4 drop-shadow-lg">Carded.</h1>
          <div className="w-32 h-1 bg-retro-green mx-auto mb-6 shadow-pixel"></div>
        </motion.div>

        {/* Tagline */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3,
        duration: 0.6
      }} className="mb-12">
          <p className="font-mono text-base md:text-lg text-muted-foreground px-4">Create. Share. Scan. Collect.</p>
        </motion.div>

        {/* Main CTA Buttons */}
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.6,
        duration: 0.6
      }} className="mb-8 space-y-4 w-full max-w-xs mx-auto">
          <Button onClick={() => navigate("/quiz")} className="font-pixel text-base md:text-lg px-8 py-6 w-full bg-retro-green text-background border-2 border-background shadow-pixel hover:shadow-hover transition-all duration-200 hover:translate-x-1 hover:translate-y-1">CREATE MY CARD</Button>
          <Button variant="secondary" onClick={() => navigate("/scan")} className="font-pixel text-base md:text-lg px-8 py-6 w-full border-2 border-retro-blue text-retro-blue bg-background hover:bg-retro-blue/10">SCAN</Button>
        </motion.div>

        {/* Tertiary link */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.9,
        duration: 0.6
      }} className="flex justify-center">
          <Button onClick={() => navigate("/deck")} variant="link" className="font-mono text-base underline-offset-4">View My Collection</Button>
        </motion.div>

        {/* Version info like old games */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 1.2,
        duration: 0.6
      }} className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          
        </motion.div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-retro-green"></div>
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-retro-green"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-retro-green"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-retro-green"></div>
    </div>;
};
export default Home;