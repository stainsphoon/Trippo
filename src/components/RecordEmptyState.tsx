import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Language } from '../utils/translations';

interface RecordEmptyStateProps {
  language: Language;
}

export default function RecordEmptyState({ language }: RecordEmptyStateProps) {
  const [isPressed, setIsPressed] = useState(false);

  // Ticket animation parameters
  const ticketScale = isPressed ? 1.025 : 1.0;
  const ticketY = isPressed ? -8 : 0;
  const ticketRotate = isPressed ? -1 : 0;
  
  // Shadow animation parameters
  const shadowOpacity = isPressed ? 0.18 : 0.08;
  const shadowBlur = isPressed ? 18 : 10;
  const shadowY = isPressed ? 10 : 4;
  
  // Suitcase animation parameters
  const suitcaseScale = isPressed ? 0.985 : 1.0;
  const suitcaseY = isPressed ? 2 : 0;

  return (
    <div className="flex flex-col justify-center items-center py-12 w-full select-none">
      <div 
        className="relative w-[280px] h-[280px] flex items-center justify-center cursor-pointer touch-none"
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
        onPointerCancel={() => setIsPressed(false)}
      >
        {/* Layer 2: Complete stamp asset with subtle depth response */}
        <motion.div 
          className="absolute z-10 w-[200px]"
          animate={{ scale: suitcaseScale, y: suitcaseY }}
          transition={{ type: "spring", stiffness: 400, damping: 28, duration: 0.23 }}
        >
          <img src="/stamps/Stamp.png" alt="Stamp" className="w-full h-auto pointer-events-none" referrerPolicy="no-referrer" draggable="false" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
        </motion.div>

        {/* Layer 3: Ticket silhouette shadow */}
        <motion.div 
          className="absolute z-20 w-[160px] ml-16 mt-16 pointer-events-none"
          animate={{ 
            scale: ticketScale, 
            y: ticketY + shadowY, 
            rotate: ticketRotate,
            opacity: shadowOpacity,
            filter: `blur(${shadowBlur}px)`
          }}
          transition={{ type: "spring", stiffness: 400, damping: 28, duration: 0.23 }}
        >
          <img src="/stamps/Stamp1.png" alt="" className="w-full h-auto brightness-0 pointer-events-none" referrerPolicy="no-referrer" draggable="false" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
        </motion.div>

        {/* Layer 4: Complete stamp asset */}
        <motion.div 
          className="absolute z-30 w-[160px] ml-16 mt-16 pointer-events-none"
          animate={{ 
            scale: ticketScale, 
            y: ticketY, 
            rotate: ticketRotate
          }}
          transition={{ type: "spring", stiffness: 400, damping: 28, duration: 0.23 }}
        >
          <img src="/stamps/Stamp1.png" alt="Stamp" className="w-full h-auto pointer-events-none" referrerPolicy="no-referrer" draggable="false" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-2 text-center"
      >
        <p className="text-stone-500 dark:text-text-secondary font-medium tracking-tight">
          {language === 'ko' ? '기록된 여행이 아직 없습니다.' : 'No travel records yet.'}
        </p>
        <p className="text-stone-400 dark:text-text-tertiary text-xs mt-1">
          {language === 'ko' ? '+ 버튼을 눌러 새로운 추억을 추가해보세요' : 'Press the + button to add new memories'}
        </p>
      </motion.div>
    </div>
  );
}
