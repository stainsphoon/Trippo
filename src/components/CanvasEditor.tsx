import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { DraggableStamp } from '../types';

export interface EditorStamp extends DraggableStamp {
  imageObj?: HTMLImageElement;
}

interface CanvasEditorProps {
  text: string;
  onChangeText?: (text: string) => void;
  stamps: EditorStamp[];
  onChangeStamps?: (stamps: EditorStamp[]) => void;
  placeholder?: string;
  readOnly?: boolean;
  isDarkMode?: boolean;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ 
  text, 
  onChangeText, 
  stamps, 
  onChangeStamps, 
  placeholder = "내용을 입력하세요...",
  readOnly = false,
  isDarkMode = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [width, setWidth] = useState(300);
  
  // Synchronous initial width measurement to prevent visual layout jumps/clipping before paint
  useLayoutEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        setWidth(Math.floor(rect.width));
      }
    }
  }, []);
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [liftedId, setLiftedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [isFocused, setIsFocused] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const didDragRef = useRef(false);

  const activePointers = useRef<Map<number, { x: number, y: number }>>(new Map());
  const pinchState = useRef<{ 
    id: string; 
    initialDist: number; 
    initialW: number; 
    initialH: number;
    initialAngle: number;
    initialRotation: number;
  } | null>(null);
  const pressTimeout = useRef<number | null>(null);

  // Blinking cursor effect
  useEffect(() => {
    if (!isFocused) return;
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);
    return () => clearInterval(interval);
  }, [isFocused]);

  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  const [updateCount, setUpdateCount] = useState(0);

  // Dynamic spring animation states for each stamp
  const animationStates = useRef<Record<string, {
    yOffset: number;
    yOffsetVel: number;
    scale: number;
    scaleVel: number;
    shadowBlur: number;
    shadowBlurVel: number;
    shadowOpacity: number;
    shadowOpacityVel: number;
    shadowY: number;
    shadowYVel: number;
  }>>({});

  const [animTick, setAnimTick] = useState(0);

  // Safe stamps filtering
  const safeStamps = (stamps || []).filter(s => 
    s && 
    (typeof s.id === 'string' || typeof s.id === 'number') && 
    typeof s.imageUrl === 'string' &&
    typeof s.x === 'number' &&
    typeof s.y === 'number' &&
    typeof s.w === 'number' &&
    typeof s.h === 'number'
  ).map(s => ({
    ...s,
    id: String(s.id)
  }));

  // Check if a specific coordinate (canvasX, canvasY) is on an opaque pixel (>20 alpha) of the stamp image.
  const checkPixelOpaque = (stamp: any, canvasX: number, canvasY: number): boolean => {
    if (!stamp || !stamp.imageUrl) return false;
    
    const anim = animationStates.current[stamp.id] || { yOffset: 0, scale: 1 };
    const scale = anim.scale;
    const yOffset = anim.yOffset;
    
    const cx = stamp.x + stamp.w / 2;
    const cy = stamp.y + stamp.h / 2;
    
    // Map canvas coordinates back to original un-transformed and un-rotated stamp coordinates
    const theta = stamp.rotation ? (stamp.rotation * Math.PI) / 180 : 0;
    const dx = (canvasX - cx) / scale;
    const dy = (canvasY - cy - yOffset) / scale;
    
    // Rotate point back by -theta around origin to align with un-rotated stamp bounding box
    const rx = dx * Math.cos(-theta) - dy * Math.sin(-theta);
    const ry = dx * Math.sin(-theta) + dy * Math.cos(-theta);
    
    const px = cx + rx;
    const py = cy + ry;
    
    // Check bounding box first
    if (
      px < stamp.x ||
      px > stamp.x + stamp.w ||
      py < stamp.y ||
      py > stamp.y + stamp.h
    ) {
      return false;
    }

    // Emojis are treated as opaque in their entire bounding box
    if (!stamp.imageUrl.startsWith('/') && !stamp.imageUrl.startsWith('data:') && !stamp.imageUrl.startsWith('http')) {
      return true;
    }

    const cachedImage = imageCache.current[stamp.id];
    if (!cachedImage || !cachedImage.complete || cachedImage.naturalWidth === 0 || cachedImage.naturalHeight === 0) {
      // Fallback if image isn't loaded yet
      return true;
    }

    try {
      // Map to original image coordinates
      const normX = (px - stamp.x) / stamp.w;
      const normY = (py - stamp.y) / stamp.h;
      
      const imgX = normX * cachedImage.naturalWidth;
      const imgY = normY * cachedImage.naturalHeight;

      // Draw a 1x1 slice of the image on a temporary canvas
      const offscreen = document.createElement('canvas');
      offscreen.width = 1;
      offscreen.height = 1;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return true; // fallback

      offCtx.drawImage(cachedImage, imgX, imgY, 1, 1, 0, 0, 1, 1);
      const imgData = offCtx.getImageData(0, 0, 1, 1);
      const alpha = imgData.data[3];

      // Alpha value threshold (e.g., 20 out of 255)
      return alpha > 20;
    } catch (e) {
      // Fallback on security/CORS or other error
      return true;
    }
  };

  // Pre-load images
  useEffect(() => {
    safeStamps.forEach(stamp => {
      if (!stamp || !stamp.imageUrl) return;
      if (!imageCache.current[stamp.id] && (stamp.imageUrl.startsWith('/') || stamp.imageUrl.startsWith('data:') || stamp.imageUrl.startsWith('http'))) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = stamp.imageUrl;
        img.onload = () => {
          setUpdateCount(v => v + 1); // trigger re-render
        };
        imageCache.current[stamp.id] = img;
      }
    });
  }, [stamps]);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const roundedWidth = Math.floor(entry.contentRect.width);
        setWidth(prev => {
          if (prev === 0 || Math.abs(prev - roundedWidth) > 2) {
            return roundedWidth;
          }
          return prev;
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Continuous spring physics animation loop
  useEffect(() => {
    let active = true;
    let lastTime = performance.now();
    
    const loop = (now: number) => {
      if (!active) return;
      
      let dt = (now - lastTime) / 1000;
      lastTime = now;
      
      // Clamp dt to prevent giant physics jumps when tab is backgrounded
      if (dt > 0.03) dt = 0.03;
      
      let needsDraw = false;
      
      safeStamps.forEach(stamp => {
        let state = animationStates.current[stamp.id];
        if (!state) {
          animationStates.current[stamp.id] = {
            yOffset: 0,
            yOffsetVel: 0,
            scale: 1,
            scaleVel: 0,
            shadowBlur: 12,
            shadowBlurVel: 0,
            shadowOpacity: 0.10,
            shadowOpacityVel: 0,
            shadowY: 4,
            shadowYVel: 0
          };
          state = animationStates.current[stamp.id];
        }
        
        const isCurrentlyActive = (draggingId === stamp.id || liftedId === stamp.id) && !readOnly;
        const isCurrentlyHovered = (hoveredId === stamp.id) && !isCurrentlyActive && !readOnly;
        
        let targetYOffset = 0;
        let targetScale = 1.0;
        let targetShadowBlur = 12;
        let targetShadowOpacity = 0.10;
        let targetShadowY = 4;
        
        if (isCurrentlyActive) {
          targetYOffset = -8;
          targetScale = 1.03;
          targetShadowBlur = 18;
          targetShadowOpacity = 0.18;
          targetShadowY = 10;
        } else if (isCurrentlyHovered) {
          targetYOffset = -2;
          targetScale = 1.01;
          targetShadowBlur = 14;
          targetShadowOpacity = 0.12;
          targetShadowY = 6;
        }
        
        // Spring formulas constants
        const k = 460; // stiffness
        const c = 34;  // damping
        
        // 1. yOffset
        const fSpringY = -k * (state.yOffset - targetYOffset);
        const fDamperY = -c * state.yOffsetVel;
        state.yOffsetVel += (fSpringY + fDamperY) * dt;
        state.yOffset += state.yOffsetVel * dt;
        
        // 2. scale
        const fSpringS = -k * (state.scale - targetScale);
        const fDamperS = -c * state.scaleVel;
        state.scaleVel += (fSpringS + fDamperS) * dt;
        state.scale += state.scaleVel * dt;
        
        // 3. shadowBlur
        const fSpringBlur = -k * (state.shadowBlur - targetShadowBlur);
        const fDamperBlur = -c * state.shadowBlurVel;
        state.shadowBlurVel += (fSpringBlur + fDamperBlur) * dt;
        state.shadowBlur += state.shadowBlurVel * dt;
        
        // 4. shadowOpacity
        const fSpringOp = -k * (state.shadowOpacity - targetShadowOpacity);
        const fDamperOp = -c * state.shadowOpacityVel;
        state.shadowOpacityVel += (fSpringOp + fDamperOp) * dt;
        state.shadowOpacity += state.shadowOpacityVel * dt;
        
        // 5. shadowY
        const fSpringShY = -k * (state.shadowY - targetShadowY);
        const fDamperShY = -c * state.shadowYVel;
        state.shadowYVel += (fSpringShY + fDamperShY) * dt;
        state.shadowY += state.shadowYVel * dt;
        
        // Check if there is still visual motion that requires redrawing
        const threshold = 0.005;
        if (
          Math.abs(state.yOffsetVel) > threshold || Math.abs(state.yOffset - targetYOffset) > threshold ||
          Math.abs(state.scaleVel) > threshold || Math.abs(state.scale - targetScale) > threshold ||
          Math.abs(state.shadowBlurVel) > threshold || Math.abs(state.shadowBlur - targetShadowBlur) > threshold ||
          Math.abs(state.shadowOpacityVel) > threshold || Math.abs(state.shadowOpacity - targetShadowOpacity) > threshold ||
          Math.abs(state.shadowYVel) > threshold || Math.abs(state.shadowY - targetShadowY) > threshold
        ) {
          needsDraw = true;
        }
      });
      
      if (needsDraw) {
        setAnimTick(t => t + 1);
      }
      
      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
    return () => {
      active = false;
    };
  }, [safeStamps.length, draggingId, liftedId, hoveredId, readOnly]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const FONT = '16px sans-serif';
    const LINE_HEIGHT = 24;
    const PADDING = 16;
    const containerWidth = width - PADDING * 2;
    
    const getSegments = (y: number) => {
      const obstacles = safeStamps
        .filter(s => s.y < y + LINE_HEIGHT && s.y + s.h > y)
        .map(s => ({ start: s.x - 6, end: s.x + s.w + 6 })) // 6px padding around stamps
        .sort((a, b) => a.start - b.start);
        
      const segments: { x: number; width: number }[] = [];
      let currentX = PADDING;
      const endX = width - PADDING;
      
      for (const obs of obstacles) {
        if (obs.start > currentX) {
          segments.push({ x: currentX, width: obs.start - currentX });
        }
        if (obs.end > currentX) {
          currentX = obs.end;
        }
      }
      if (currentX < endX) {
        segments.push({ x: currentX, width: endX - currentX });
      }
      return segments;
    };

    let totalHeight = PADDING;
    
    // Draw loop function
    const draw = (height: number) => {
      // Setup canvas for high DPI
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);
      
      // Draw Placeholder or Text
      ctx.font = FONT;
      ctx.textBaseline = 'top';
      
      const content = text || (readOnly ? "" : placeholder);
      const isDarkActive = isDarkMode || (typeof document !== 'undefined' && (document.documentElement.classList.contains('dark') || document.body.classList.contains('dark')));
      ctx.fillStyle = text 
        ? (isDarkActive ? '#f4f4f5' : '#1c1917') 
        : (isDarkActive ? '#71717a' : '#a8a29e');

      let cursorX = PADDING;
      let cursorY = PADDING;

      // Position cursor initially on the first available segment of the first line
      const initialSegments = getSegments(PADDING);
      if (initialSegments.length > 0) {
        cursorX = initialSegments[0].x;
      }

      if (content) {
        let y = PADDING;
        let charIndex = 0;
        const totalChars = content.length;

        while (charIndex < totalChars) {
          const segments = getSegments(y);
          let progressedOnLine = false;

          for (const segment of segments) {
            if (segment.width <= 15) continue; // Skip very narrow segments to prevent weird rendering
            
            let lineText = '';
            let tempIndex = charIndex;
            let hitNewline = false;
            
            while (tempIndex < totalChars) {
              const char = content[tempIndex];
              
              if (char === '\n') {
                hitNewline = true;
                break;
              }
              
              const testLine = lineText + char;
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > segment.width) {
                break;
              }
              
              lineText = testLine;
              tempIndex++;
            }
            
            if (lineText !== '') {
              ctx.fillText(lineText, segment.x, y);
              cursorX = segment.x + ctx.measureText(lineText).width;
              cursorY = y;
              charIndex = tempIndex;
              progressedOnLine = true;
            } else {
              if (segment.width > 20 && charIndex < totalChars && content[charIndex] !== '\n') {
                const char = content[charIndex];
                ctx.fillText(char, segment.x, y);
                cursorX = segment.x + ctx.measureText(char).width;
                cursorY = y;
                charIndex++;
                progressedOnLine = true;
              }
            }
            
            if (hitNewline) {
              charIndex++; // Skip the newline character
              cursorX = segment.x + ctx.measureText(lineText).width;
              cursorY = y;
              progressedOnLine = true;
              break;
            }
            
            if (charIndex >= totalChars) {
              break;
            }
          }
          
          y += LINE_HEIGHT;
          // Safeguard to prevent infinite loops
          if (y > 5000) break;
        }
        
        totalHeight = Math.max(y + PADDING, readOnly ? 100 : 300);
      } else {
         totalHeight = readOnly ? 100 : 300;
      }

      // If the text ends with a newline, position cursor on the next line
      if (text && text.endsWith('\n')) {
        const nextY = cursorY + LINE_HEIGHT;
        const nextSegments = getSegments(nextY);
        if (nextSegments.length > 0) {
          cursorX = nextSegments[0].x;
        } else {
          cursorX = PADDING;
        }
        cursorY = nextY;
      }

      // Draw Cursor
      if (!readOnly && isFocused && cursorVisible) {
        ctx.fillStyle = isDarkActive ? '#3b82f6' : '#2563eb';
        ctx.fillRect(cursorX, cursorY + 2, 2, LINE_HEIGHT - 4);
      }
      
      // Draw Stamps in reverse order so index 0 is on the very top (drawn last)
      for (let i = safeStamps.length - 1; i >= 0; i--) {
        const stamp = safeStamps[i];
        if (!stamp || !stamp.imageUrl) continue;
        
        const anim = animationStates.current[stamp.id] || {
          yOffset: 0,
          scale: 1,
          shadowBlur: 0,
          shadowOpacity: 0,
          shadowY: 0
        };

        const cx = stamp.x + stamp.w / 2;
        const cy = stamp.y + stamp.h / 2;
        
        // 1. Draw independent alpha shadow using offscreen cast technique
        if (anim.shadowOpacity > 0.01) {
          ctx.save();
          // We translate and scale, but DO NOT apply yOffset here.
          // This keeps the shadow anchored to the ground.
          ctx.translate(cx, cy);
          ctx.scale(anim.scale, anim.scale);
          if (stamp.rotation) {
            ctx.rotate((stamp.rotation * Math.PI) / 180);
          }
          ctx.translate(-cx, -cy);
          
          ctx.shadowColor = `rgba(0, 0, 0, ${anim.shadowOpacity})`;
          ctx.shadowBlur = anim.shadowBlur;
          
          // Offset the actual drawing out of bounds, and offset the shadow back into bounds
          const offscreenX = 10000;
          ctx.translate(offscreenX, 0);
          ctx.shadowOffsetX = -offscreenX;
          ctx.shadowOffsetY = anim.shadowY;

          if (stamp.imageUrl.startsWith('data:') || stamp.imageUrl.startsWith('/') || stamp.imageUrl.startsWith('http')) {
             const cachedImage = imageCache.current[stamp.id];
             if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0 && cachedImage.naturalHeight > 0) {
               try {
                 const aspectRatio = cachedImage.naturalWidth / cachedImage.naturalHeight;
                 const drawH = stamp.w / aspectRatio;
                 ctx.drawImage(cachedImage, stamp.x, stamp.y, stamp.w, drawH);
               } catch (e) {
                 // ignore
               }
             }
          } else {
             const fontSize = Math.min(stamp.w, stamp.h) * 0.8;
             ctx.font = `${fontSize}px sans-serif`;
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText(stamp.imageUrl, stamp.x + stamp.w / 2, stamp.y + stamp.h / 2);
          }
          ctx.restore();
        }

        // 2. Draw actual object
        ctx.save();
        ctx.translate(cx, cy + anim.yOffset);
        ctx.scale(anim.scale, anim.scale);
        if (stamp.rotation) {
          ctx.rotate((stamp.rotation * Math.PI) / 180);
        }
        ctx.translate(-cx, -cy);
        
        if (stamp.imageUrl.startsWith('data:') || stamp.imageUrl.startsWith('/') || stamp.imageUrl.startsWith('http')) {
           const cachedImage = imageCache.current[stamp.id];
           if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0 && cachedImage.naturalHeight > 0) {
             try {
               const aspectRatio = cachedImage.naturalWidth / cachedImage.naturalHeight;
               const drawH = stamp.w / aspectRatio;
               ctx.drawImage(cachedImage, stamp.x, stamp.y, stamp.w, drawH);
             } catch (e) {
               console.warn("Failed to draw stamp image:", e);
             }
           }
        } else {
           // It's an emoji
           const fontSize = Math.min(stamp.w, stamp.h) * 0.8;
           ctx.font = `${fontSize}px sans-serif`;
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           ctx.fillText(stamp.imageUrl, stamp.x + stamp.w / 2, stamp.y + stamp.h / 2);
        }
        
        ctx.restore();
      }
    };

    // Synchronously compute the needed height first to avoid visual shifting or loops
    const maxStampY = safeStamps.reduce((max, s) => Math.max(max, s.y + s.h), 0);
    let calculatedHeight = Math.max(maxStampY + PADDING, readOnly ? 100 : 300);
    const content = text || (readOnly ? "" : placeholder);
    if (content) {
      let y = PADDING;
      let charIndex = 0;
      const totalChars = content.length;
      while (charIndex < totalChars) {
        const segments = getSegments(y);
        let progressedOnLine = false;

        for (const segment of segments) {
          if (segment.width <= 15) continue;
          
          let lineText = '';
          let tempIndex = charIndex;
          let hitNewline = false;
          
          while (tempIndex < totalChars) {
            const char = content[tempIndex];
            if (char === '\n') {
              hitNewline = true;
              break;
            }
            const testLine = lineText + char;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > segment.width) {
              break;
            }
            lineText = testLine;
            tempIndex++;
          }
          
          if (lineText !== '') {
            charIndex = tempIndex;
            progressedOnLine = true;
          } else {
            if (segment.width > 20 && charIndex < totalChars && content[charIndex] !== '\n') {
              charIndex++;
              progressedOnLine = true;
            }
          }
          
          if (hitNewline) {
            charIndex++;
            progressedOnLine = true;
            break;
          }
          
          if (charIndex >= totalChars) {
            break;
          }
        }
        
        y += LINE_HEIGHT;
        if (y > 5000) break;
      }
      calculatedHeight = Math.max(y + PADDING, maxStampY + PADDING, readOnly ? 100 : 300);
    }

    draw(calculatedHeight);

  }, [text, stamps, width, placeholder, draggingId, liftedId, hoveredId, updateCount, readOnly, isDarkMode, animTick, isFocused, cursorVisible]);

  // Interaction handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    activePointers.current.set(e.pointerId, { x, y });
    didDragRef.current = false; // Reset drag flag

    if (activePointers.current.size === 2 && draggingId) {
       const pts = Array.from(activePointers.current.values()) as {x: number, y: number}[];
       const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
       const angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
       const stamp = safeStamps.find(s => s.id === draggingId);
       if (stamp) {
         pinchState.current = { 
           id: draggingId, 
           initialDist: dist, 
           initialW: stamp.w, 
           initialH: stamp.h,
           initialAngle: angle,
           initialRotation: stamp.rotation || 0
         };
       }
       if (pressTimeout.current) {
         clearTimeout(pressTimeout.current);
         pressTimeout.current = null;
       }
       if (e.currentTarget && typeof e.currentTarget.setPointerCapture === 'function') {
         try {
           e.currentTarget.setPointerCapture(e.pointerId);
         } catch (err) {}
       }
       return;
    }

    if (activePointers.current.size === 1) {
      // Check if clicked on a stamp (forward order so index 0, which is top-most, is picked first) using pixel-precise check
      let found = null;
      for (let i = 0; i < safeStamps.length; i++) {
        const stamp = safeStamps[i];
        if (checkPixelOpaque(stamp, x, y)) {
          found = stamp;
          break;
        }
      }
      
      if (found) {
        // Move the tapped stamp to the front of the array (index 0) so it renders on top
        if (onChangeStamps) {
          const restOfStamps = stamps.filter(s => s && s.id !== found.id);
          const targetStamp = stamps.find(s => s && s.id === found.id);
          if (targetStamp) {
            onChangeStamps([targetStamp, ...restOfStamps]);
          }
        }

        setDraggingId(found.id);
        setDragOffset({ x: x - found.x, y: y - found.y });
        
        if (e.currentTarget && typeof e.currentTarget.setPointerCapture === 'function') {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch (err) {}
        }

        // Touch and hold for 400ms
        pressTimeout.current = window.setTimeout(() => {
           setLiftedId(found!.id);
           if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
             try {
               navigator.vibrate(50);
             } catch (vibrateError) {
               console.warn("navigator.vibrate is blocked or failed:", vibrateError);
             }
           }
        }, 400);
      } else {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (readOnly) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x, y });
    }

    // Dynamic hoveredId detection when not dragging (forward order so top-most is matched first)
    if (activePointers.current.size === 0) {
      let hovered = null;
      for (let i = 0; i < safeStamps.length; i++) {
        const stamp = safeStamps[i];
        if (checkPixelOpaque(stamp, x, y)) {
          hovered = stamp;
          break;
        }
      }
      setHoveredId(hovered ? hovered.id : null);
    }

    if (activePointers.current.size === 2 && pinchState.current && onChangeStamps) {
       didDragRef.current = true; // Mark as dragged/manipulated
       const pts = Array.from(activePointers.current.values()) as {x: number, y: number}[];
       const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
       const scale = dist / pinchState.current.initialDist;
       
       const newW = Math.max(20, pinchState.current.initialW * scale);
       const newH = Math.max(20, pinchState.current.initialH * scale);
       
       const currentAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
       const angleDiff = currentAngle - pinchState.current.initialAngle;
       const angleDiffDeg = (angleDiff * 180) / Math.PI;
       const newRotation = (pinchState.current.initialRotation + angleDiffDeg) % 360;
       
       onChangeStamps(safeStamps.map(s => {
         if (s.id === pinchState.current?.id) {
            const cx = s.x + s.w / 2;
            const cy = s.y + s.h / 2;
            return {
              ...s,
              w: newW,
              h: newH,
              x: cx - newW / 2,
              y: cy - newH / 2,
              rotation: newRotation
            };
         }
         return s;
       }));
       return;
    }

    if (activePointers.current.size === 1 && draggingId && onChangeStamps) {
      didDragRef.current = true; // Mark as dragged/manipulating
      onChangeStamps(safeStamps.map(s => {
        if (s.id === draggingId) {
          return {
            ...s,
            x: Math.max(0, Math.min(width - s.w, x - dragOffset.x)),
            y: Math.max(0, y - dragOffset.y)
          };
        }
        return s;
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (readOnly) return;
    activePointers.current.delete(e.pointerId);
    
    if (e.currentTarget && typeof e.currentTarget.releasePointerCapture === 'function') {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
    
    if (activePointers.current.size < 2) {
       pinchState.current = null;
     }
     
     if (activePointers.current.size === 0) {
       setDraggingId(null);
       setLiftedId(null);
       setHoveredId(null);
       if (pressTimeout.current) {
         clearTimeout(pressTimeout.current);
         pressTimeout.current = null;
       }
     }
   };

   return (
     <div ref={containerRef} className={`relative w-full rounded-2xl overflow-hidden bg-stone-50 dark:bg-surface-secondary border transition-all ${readOnly ? 'pointer-events-none' : 'min-h-[300px]'} ${isFocused ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm' : 'border-stone-200 dark:border-subtle-border'}`} style={{ minHeight: readOnly ? 'auto' : '300px' }}>
       <canvas
         ref={canvasRef}
         onPointerDown={handlePointerDown}
         onPointerMove={handlePointerMove}
         onPointerUp={handlePointerUp}
         onPointerCancel={handlePointerUp}
         onClick={(e) => {
           if (readOnly) return;
           if (!didDragRef.current) {
             textareaRef.current?.focus();
           }
         }}
         style={{ cursor: draggingId ? 'grabbing' : (hoveredId ? 'grab' : 'text') }}
         className={`block select-none z-10 relative ${readOnly ? '' : 'touch-none'}`}
       />
       {/* Hidden textarea for actual text input */}
       {!readOnly && (
         <textarea
           ref={textareaRef}
           value={text}
           onChange={(e) => onChangeText && onChangeText(e.target.value)}
           onFocus={() => setIsFocused(true)}
           onBlur={() => setIsFocused(false)}
           className="absolute top-0 left-0 w-full h-full opacity-0 z-0 resize-none"
           style={{ pointerEvents: draggingId ? 'none' : 'auto' }}
         />
       )}
     </div>
   );
 };
