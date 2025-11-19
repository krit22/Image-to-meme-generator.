import React, { useRef, useEffect } from 'react';

interface MemeCanvasProps {
  imageSrc: string;
  topText: string;
  bottomText: string;
  topTextSize: number;
  bottomTextSize: number;
  className?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const MemeCanvas: React.FC<MemeCanvasProps> = ({ 
  imageSrc, 
  topText, 
  bottomText, 
  topTextSize,
  bottomTextSize,
  className,
  onCanvasReady 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw Image
      ctx.drawImage(img, 0, 0);

      const drawText = (text: string, sizePercent: number, isBottom: boolean) => {
        if (!text) return;
        
        const maxW = canvas.width * 0.96; // 2% padding each side
        
        // Calculate font size based on percentage of image height
        // Ensure a minimum readable pixel size (e.g., 16px)
        const calculatedSize = canvas.height * (sizePercent / 100);
        const fontSize = Math.max(16, calculatedSize);

        // Helper to calculate lines given a font size
        const calculateLines = (size: number) => {
          ctx.font = `900 ${size}px 'Oswald', sans-serif`;
          const words = text.split(' ');
          const currentLines: string[] = [];
          let currentLine = words[0];

          for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxW) {
              currentLine += " " + word;
            } else {
              currentLines.push(currentLine);
              currentLine = word;
            }
          }
          currentLines.push(currentLine);
          return currentLines;
        };

        const lines = calculateLines(fontSize);

        // Setup context for drawing
        ctx.font = `900 ${fontSize}px 'Oswald', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        // Thicker outline for readability
        ctx.lineWidth = Math.max(3, Math.floor(fontSize / 8)); 
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;

        const lineHeight = fontSize * 1.15;
        const x = canvas.width / 2;
        
        let startY: number;

        if (isBottom) {
           // Bottom text: Last line baseline is near bottom edge
           const bottomPadding = Math.max(20, canvas.height * 0.05);
           const totalTextBlockHeight = (lines.length - 1) * lineHeight;
           const lastLineBaseline = canvas.height - bottomPadding;
           startY = lastLineBaseline - totalTextBlockHeight;
        } else {
           // Top text: First line baseline is near top edge
           const topPadding = Math.max(20, canvas.height * 0.05);
           startY = topPadding + fontSize; // Baseline of first line
        }

        lines.forEach((line, i) => {
           const lineY = startY + (i * lineHeight);
           ctx.strokeText(line, x, lineY);
           ctx.fillText(line, x, lineY);
        });
      };

      // Draw Top Text
      if (topText) {
        drawText(topText.toUpperCase(), topTextSize, false);
      }

      // Draw Bottom Text
      if (bottomText) {
        drawText(bottomText.toUpperCase(), bottomTextSize, true);
      }

      if (onCanvasReady) {
        onCanvasReady(canvas);
      }
    };
  }, [imageSrc, topText, bottomText, topTextSize, bottomTextSize, onCanvasReady]);

  return (
    <div className={`rounded-lg overflow-hidden shadow-2xl bg-gray-900 ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-auto block max-h-[70vh] object-contain mx-auto"
      />
    </div>
  );
};

export default MemeCanvas;