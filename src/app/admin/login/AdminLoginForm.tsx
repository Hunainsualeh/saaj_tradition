"use client";

import React, { useState, useActionState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { adminLogin } from "@/lib/server/actions/admin-auth-actions";

export function AdminLoginForm({ redirect }: { redirect?: string }) {
  const [state, formAction, isPending] = useActionState(adminLogin, null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Custom colors matching the prompt's requirements
  const colors = {
    ivory: '#FDFBF7',
    sand: '#EAE5D9',
    rose: '#D4A3A3',
    sage: '#A3B19B',
    gold: '#C8A97E',
    dark: '#2C2C2C',
    muted: '#7A7A7A'
  };

  return (
    <div className="min-h-screen w-full flex font-sans text-gray-900 bg-[#FDFBF7]">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');

        .font-serif {
          font-family: 'Playfair Display', serif;
        }
        .font-sans {
          font-family: 'Inter', sans-serif;
        }

        /* Flowing Fabric Animation */
        @keyframes flow {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-flow-1 { animation: flow 8s ease-in-out infinite; }
        .animate-flow-2 { animation: flow 10s ease-in-out infinite reverse; }
        .animate-flow-3 { animation: flow 12s ease-in-out infinite 1s; }

        /* Stitching Animation */
        @keyframes stitch {
          to { stroke-dashoffset: -100; }
        }
        .animate-stitch {
          stroke-dasharray: 6, 6;
          animation: stitch 3s linear infinite;
        }

        /* Breathe Animation for Girl Figure */
        @keyframes breathe {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.02); }
        }
        .animate-breathe {
          animation: breathe 8s ease-in-out infinite;
        }

        /* Input focus transitions */
        .input-line {
          position: relative;
        }
        .input-line::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background-color: ${colors.gold};
          transition: width 0.4s ease;
        }
        .input-line:focus-within::after {
          width: 100%;
        }
      `}} />

      {/* LEFT PANE: Visuals & Cultural Elements */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#EAE5D9] items-center justify-center p-12">
        {/* Soft geometric block background panels */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#A3B19B] rounded-full mix-blend-multiply blur-3xl opacity-40"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#D4A3A3] rounded-full mix-blend-multiply blur-3xl opacity-40"></div>
        </div>

        {/* Vector Art Girl with Flowing Dupatta (Bahawalpuri Dress) */}
        <div className="absolute z-0 animate-breathe pointer-events-none drop-shadow-2xl opacity-90">
          <svg width="550" height="650" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
            
            <defs>
              {/* Custom Block Print Pattern based on uploaded image */}
              <pattern id="block-print" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
                {/* Yellow Base */}
                <rect x="0" y="0" width="45" height="100" fill="#ECA926" />
                {/* Orange Base */}
                <rect x="55" y="0" width="45" height="100" fill="#E65828" />
                {/* White Border */}
                <rect x="45" y="0" width="10" height="100" fill="#FDFBF7" />
                
                {/* Border Details (Black lines & X's) */}
                <line x1="45" y1="0" x2="45" y2="100" stroke="#2C2C2C" strokeWidth="1.5" />
                <line x1="55" y1="0" x2="55" y2="100" stroke="#2C2C2C" strokeWidth="1.5" />
                {/* Repeating X pattern in border */}
                <path d="M46 5 L54 15 M54 5 L46 15 M46 25 L54 35 M54 25 L46 35 M46 45 L54 55 M54 45 L46 55 M46 65 L54 75 M54 65 L46 75 M46 85 L54 95 M54 85 L46 95" stroke="#2C2C2C" strokeWidth="1" />
                
                {/* Large Paisley/Leaf Motif on Yellow */}
                <g transform="translate(0, 5)">
                  <path d="M 22 15 C 38 35, 38 65, 22 75 C 6 65, 6 35, 22 15 Z" fill="#2C2C2C" />
                  <path d="M 22 22 C 32 38, 32 58, 22 68 C 12 58, 12 38, 22 22 Z" fill="#ECA926" />
                  <path d="M 22 30 C 26 42, 26 52, 22 60 C 18 52, 18 42, 22 30 Z" fill="#E65828" />
                  {/* Paisley stem */}
                  <path d="M 22 75 Q 16 85, 12 80" stroke="#2C2C2C" strokeWidth="2" fill="none" />
                </g>
                
                {/* Small Floral/Sun stamps on Orange */}
                <circle cx="77" cy="20" r="5" fill="#2C2C2C" />
                <circle cx="77" cy="20" r="2" fill="#ECA926" />
                <circle cx="77" cy="50" r="5" fill="#2C2C2C" />
                <circle cx="77" cy="50" r="2" fill="#ECA926" />
                <circle cx="77" cy="80" r="5" fill="#2C2C2C" />
                <circle cx="77" cy="80" r="2" fill="#ECA926" />
              </pattern>
            </defs>

            {/* Skin / Face / Neck */}
            <path d="M 190 80 C 190 60, 210 60, 210 80 C 210 100, 200 110, 200 130 L 190 130 C 190 110, 190 100, 190 80 Z" fill="#C8A97E"/>
            
            {/* Hair (Elegant Traditional Updo) */}
            <path d="M 185 70 C 170 60, 170 90, 185 100 C 195 100, 215 90, 215 70 C 215 40, 185 40, 185 70 Z" fill="#2C2C2C"/>
            <circle cx="180" cy="80" r="16" fill="#2C2C2C"/>

            {/* Traditional Jhumka (Earring) */}
            <path d="M 195 98 L 192 110 L 198 110 Z" fill="#C8A97E"/>
            <circle cx="195" cy="113" r="1.5" fill="#2C2C2C"/>

            {/* Arms */}
            <path d="M 180 130 L 150 180 L 185 220" stroke="#C8A97E" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M 220 130 L 240 180 L 260 210" stroke="#C8A97E" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

            {/* Dress Bodice (Sage) */}
            <path d="M 180 130 L 220 130 L 210 200 L 190 200 Z" fill="#A3B19B"/>
            
            {/* Dress Ghera / Skirt (Sage) */}
            <path d="M 190 200 C 190 200, 100 350, 80 450 L 320 450 C 300 350, 210 200, 210 200 Z" fill="#A3B19B"/>
            
            {/* Dress Border & Block Print Pattern (Gold/Ivory) */}
            <path d="M 85 430 L 315 430 L 320 450 L 80 450 Z" fill="#C8A97E"/>
            <path d="M 90 450 L 100 430 L 110 450 M 120 450 L 130 430 L 140 450 M 150 450 L 160 430 L 170 450 M 180 450 L 190 430 L 200 450 M 210 450 L 220 430 L 230 450 M 240 450 L 250 430 L 260 450 M 270 450 L 280 430 L 290 450 M 300 450 L 310 430 L 320 450" stroke="#FDFBF7" strokeWidth="2" fill="none"/>
            
            {/* Skirt Pleats / Folds */}
            <path d="M 200 200 Q 180 350 150 450" stroke="#FDFBF7" strokeWidth="3" opacity="0.2" fill="none"/>
            <path d="M 200 200 Q 200 350 200 450" stroke="#FDFBF7" strokeWidth="3" opacity="0.3" fill="none"/>
            <path d="M 200 200 Q 220 350 250 450" stroke="#FDFBF7" strokeWidth="3" opacity="0.2" fill="none"/>

            {/* Gold Bodice Embellishments */}
            <path d="M 190 200 Q 200 210 210 200" stroke="#C8A97E" strokeWidth="3" fill="none"/>
            <path d="M 185 230 Q 200 240 215 230" stroke="#C8A97E" strokeWidth="2" fill="none"/>
            <path d="M 175 270 Q 200 280 225 270" stroke="#C8A97E" strokeWidth="2" fill="none"/>

            {/* Animated Dupatta (Hanging down left shoulder) */}
            <path fill="url(#block-print)" opacity="0.9" stroke="#E65828" strokeWidth="0.5">
              <animate 
                attributeName="d" 
                dur="7s" 
                repeatCount="indefinite"
                values="
                  M 175 125 C 150 180, 120 300, 110 430 C 130 440, 150 350, 170 250 C 180 190, 185 140, 190 135 Z;
                  M 175 125 C 130 190, 90 310, 80 440 C 110 450, 140 360, 160 260 C 170 200, 185 140, 190 135 Z;
                  M 175 125 C 150 180, 120 300, 110 430 C 130 440, 150 350, 170 250 C 180 190, 185 140, 190 135 Z
                "
              />
            </path>

            {/* Animated Dupatta (Flowing Cape - Held by right hand) */}
            <path fill="url(#block-print)" opacity="0.95" stroke="#E65828" strokeWidth="0.5">
              <animate 
                attributeName="d" 
                dur="6s" 
                repeatCount="indefinite"
                values="
                  M 215 125 C 230 160, 240 190, 260 210 C 300 280, 340 380, 330 470 C 280 480, 240 460, 220 450 C 220 350, 220 200, 215 125 Z;
                  M 215 125 C 230 160, 240 190, 260 210 C 330 290, 390 390, 370 480 C 300 490, 250 470, 220 450 C 220 350, 220 200, 215 125 Z;
                  M 215 125 C 230 160, 240 190, 260 210 C 300 280, 340 380, 330 470 C 280 480, 240 460, 220 450 C 220 350, 220 200, 215 125 Z
                "
              />
            </path>

            {/* Dupatta drape crossing the neck/chest */}
            <path d="M 175 125 C 190 140, 205 140, 220 130 L 215 145 C 200 155, 185 155, 170 140 Z" fill="url(#block-print)" opacity="0.95" stroke="#E65828" strokeWidth="0.5"/>

            {/* Hand overlapping the held dupatta to create depth */}
            <circle cx="260" cy="210" r="3.5" fill="#C8A97E"/>
            <path d="M 260 210 C 264 214, 266 208, 262 205" stroke="#2C2C2C" strokeWidth="1" strokeLinecap="round" fill="none"/>
          </svg>
        </div>

        {/* Thread/Flowing Dupatta SVGs */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            {/* Line 1 - Dusty Gold */}
            <path 
              className="animate-flow-1 animate-stitch" 
              d="M-100 300 C 200 400, 400 100, 700 300 S 1100 100, 1100 100" 
              stroke={colors.gold} 
              strokeWidth="2" 
              fill="none" 
            />
            {/* Line 2 - Muted Rose */}
            <path 
              className="animate-flow-2 animate-stitch" 
              d="M-100 500 C 300 300, 500 700, 800 500 S 1100 300, 1100 300" 
              stroke={colors.rose} 
              strokeWidth="1.5" 
              fill="none" 
            />
            {/* Line 3 - Sage */}
            <path 
              className="animate-flow-3 animate-stitch" 
              d="M-100 700 C 150 800, 350 400, 650 600 S 1100 800, 1100 800" 
              stroke={colors.sage} 
              strokeWidth="1" 
              fill="none" 
            />
          </svg>
        </div>

        {/* Editorial Text Overlay */}
        <div className="relative z-10 flex flex-col items-center text-center mt-20 p-10 backdrop-blur-sm bg-white/10 border border-white/20">
           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.dark} strokeWidth="1" className="mb-6">
             <path d="M12 2L2 12l10 10 10-10L12 2zM12 8v8M8 12h8" />
           </svg>
           <h2 className="font-serif text-4xl tracking-widest uppercase text-[#2C2C2C] mb-4">
             Heritage<br/>Reimagined
           </h2>
           <p className="text-[#7A7A7A] max-w-sm font-light leading-relaxed tracking-wide text-sm">
             Traditional Bahwalpuri dresses crafted with elegance. A tribute to the artisans of Pakistan.
           </p>
        </div>
      </div>

      {/* RIGHT PANE: Sign-In Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 md:px-24 py-12 relative">
        
        {/* Mobile decorative header (hidden on desktop) */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-32 overflow-hidden pointer-events-none opacity-50">
          <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
             <path d="M0 50 Q 100 0, 200 50 T 400 50" stroke={colors.gold} strokeWidth="1" className="animate-stitch" fill="none" />
             <path d="M0 70 Q 100 20, 200 70 T 400 70" stroke={colors.rose} strokeWidth="0.5" className="animate-stitch" fill="none" />
          </svg>
        </div>

        <div className="w-full max-w-md mx-auto relative z-10">
          
          <div className="mb-12">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2C2C] mb-2 tracking-wide">Saaj Tradition</h1>
            <p className="text-[#7A7A7A] font-light text-sm tracking-widest uppercase">Traditional Bahwalpuri Dresses</p>
          </div>

          <form action={formAction} className="space-y-8">
            <input type="hidden" name="redirect" value={redirect || "/admin"} />
            
            {/* Email Input */}
            <div className="relative input-line pb-2">
              <label className="block text-xs font-medium text-[#A3B19B] tracking-widest uppercase mb-1">
                Email Address
              </label>
              <input 
                name="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-[#EAE5D9] py-2 text-[#2C2C2C] focus:outline-none placeholder:text-[#EAE5D9] transition-colors disabled:opacity-50"
                placeholder="enter your email"
                required
                disabled={isPending}
              />
            </div>

            {/* Password Input */}
            <div className="relative input-line pb-2">
              <label className="block text-xs font-medium text-[#A3B19B] tracking-widest uppercase mb-1">
                Password
              </label>
              <input 
                name="password"
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-[#EAE5D9] py-2 text-[#2C2C2C] focus:outline-none placeholder:text-[#EAE5D9] pr-10 disabled:opacity-50"
                placeholder="••••••••"
                required
                disabled={isPending}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-4 text-[#C8A97E] hover:text-[#2C2C2C] transition-colors"
                disabled={isPending}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
              </button>
            </div>

            {state?.error && (
              <p className="text-sm text-red-600 font-medium">{state.error}</p>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isPending}
              className="w-full mt-6 bg-[#2C2C2C] text-[#FDFBF7] py-4 flex items-center justify-center space-x-3 hover:bg-[#C8A97E] transition-colors duration-500 ease-out group overflow-hidden relative disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <span className="font-light tracking-widest text-sm relative z-10">
                {isPending ? "SIGNING IN..." : "SIGN IN"}
              </span>
              <ArrowRight 
                size={16} 
                className="relative z-10" 
              />
              
              {/* Button hover internal geometric pattern */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
                <svg width="100%" height="100%">
                   <pattern id="stitchPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                     <circle cx="10" cy="10" r="1" fill="#FDFBF7" />
                     <path d="M0 10 L20 10 M10 0 L10 20" stroke="#FDFBF7" strokeWidth="0.5" strokeDasharray="2 2" />
                   </pattern>
                   <rect x="0" y="0" width="100%" height="100%" fill="url(#stitchPattern)" />
                </svg>
              </div>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
