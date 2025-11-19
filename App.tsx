import React, { useState, useRef } from 'react';
import { PhotoIcon, SparklesIcon, ArrowDownTrayIcon, PaintBrushIcon, ChatBubbleBottomCenterTextIcon, TrashIcon, AdjustmentsHorizontalIcon, LightBulbIcon } from '@heroicons/react/24/solid';
import MemeCanvas from './components/MemeCanvas';
import Loader from './components/Loader';
import { generateMagicCaptions, editImageWithGenAI, generateEditSuggestions } from './services/geminiService';
import { CaptionSuggestion, EditMode, MemeState } from './types';

const App: React.FC = () => {
  const [memeState, setMemeState] = useState<MemeState>({
    topText: "",
    bottomText: "",
    topTextSize: 10, // Default 10% of image height
    bottomTextSize: 10, // Default 10% of image height
    imageSrc: null,
    originalImageSrc: null
  });

  const [captions, setCaptions] = useState<CaptionSuggestion[]>([]);
  const [editSuggestions, setEditSuggestions] = useState<string[]>([]);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isSuggestingEdits, setIsSuggestingEdits] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<EditMode>(EditMode.CAPTION);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle File Upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setMemeState({
          topText: "",
          bottomText: "",
          topTextSize: 10,
          bottomTextSize: 10,
          imageSrc: result,
          originalImageSrc: result
        });
        setCaptions([]);
        setEditSuggestions([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Magic Captions
  const handleMagicCaption = async () => {
    if (!memeState.imageSrc) return;

    setIsGeneratingCaptions(true);
    setError(null);
    try {
      const suggestions = await generateMagicCaptions(memeState.imageSrc);
      setCaptions(suggestions);
    } catch (err) {
      setError("Failed to generate captions. Please try again.");
      console.error(err);
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  // Suggest Edit Prompts
  const handleSuggestEdits = async () => {
    if (!memeState.imageSrc) return;
    setIsSuggestingEdits(true);
    try {
      const suggestions = await generateEditSuggestions(memeState.imageSrc);
      setEditSuggestions(suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggestingEdits(false);
    }
  };

  // Trigger Generative Edit
  const handleGenEdit = async () => {
    if (!memeState.imageSrc || !editPrompt.trim()) return;

    setIsEditingImage(true);
    setError(null);
    try {
      const newImageBase64 = await editImageWithGenAI(memeState.imageSrc, editPrompt);
      setMemeState(prev => ({
        ...prev,
        imageSrc: newImageBase64,
        // We keep originalImageSrc pointing to the raw upload if we want a "Reset All"
        // but for undo functionality, we might want a history stack. For now, simple reset.
      }));
      setEditPrompt("");
      setEditSuggestions([]); // Clear suggestions after use
    } catch (err) {
      setError("Failed to edit image. Try a different prompt.");
      console.error(err);
    } finally {
      setIsEditingImage(false);
    }
  };

  // Apply a caption
  const applyCaption = (suggestion: CaptionSuggestion) => {
    setMemeState(prev => ({ 
      ...prev, 
      topText: suggestion.topText || "",
      bottomText: suggestion.bottomText || ""
    }));
  };

  // Download functionality
  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'meme-gen-ai.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  const handleReset = () => {
    setMemeState(prev => ({
      ...prev,
      imageSrc: prev.originalImageSrc,
      topText: "",
      bottomText: "",
      topTextSize: 10,
      bottomTextSize: 10,
    }));
    setEditPrompt("");
    setCaptions([]);
    setEditSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col md:flex-row">
      
      {/* Sidebar Controls */}
      <aside className="w-full md:w-96 bg-slate-800 p-6 flex flex-col gap-6 overflow-y-auto border-r border-slate-700 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">MemeGen AI</h1>
        </div>

        {/* Upload Section */}
        <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600 border-dashed hover:border-purple-400 transition-colors cursor-pointer"
             onClick={() => fileInputRef.current?.click()}>
          <div className="flex flex-col items-center gap-2 text-center">
            <PhotoIcon className="w-8 h-8 text-purple-400" />
            <span className="text-sm font-medium text-slate-300">
              {memeState.imageSrc ? "Change Image" : "Upload Image"}
            </span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>
        </div>

        {memeState.imageSrc && (
          <>
            {/* Tabs */}
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab(EditMode.CAPTION)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === EditMode.CAPTION 
                    ? 'bg-slate-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                Captions
              </button>
              <button
                onClick={() => setActiveTab(EditMode.MAGIC_EDIT)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === EditMode.MAGIC_EDIT 
                    ? 'bg-slate-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PaintBrushIcon className="w-4 h-4" />
                Magic Edit
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col gap-4">
              {activeTab === EditMode.CAPTION && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Manual Text */}
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
                      <div className="flex justify-between items-center mb-1">
                         <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Text</label>
                         <span className="text-[10px] text-slate-500">Size: {memeState.topTextSize}%</span>
                      </div>
                      <input
                        type="text"
                        value={memeState.topText}
                        onChange={(e) => setMemeState(prev => ({ ...prev, topText: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none font-meme uppercase mb-2"
                        placeholder="WHEN YOU..."
                      />
                      <div className="flex items-center gap-2">
                         <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-500" />
                         <input 
                            type="range" 
                            min="5" 
                            max="25" 
                            step="0.5"
                            value={memeState.topTextSize}
                            onChange={(e) => setMemeState(prev => ({...prev, topTextSize: parseFloat(e.target.value)}))}
                            className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                         />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
                      <div className="flex justify-between items-center mb-1">
                         <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bottom Text</label>
                         <span className="text-[10px] text-slate-500">Size: {memeState.bottomTextSize}%</span>
                      </div>
                      <input
                        type="text"
                        value={memeState.bottomText}
                        onChange={(e) => setMemeState(prev => ({ ...prev, bottomText: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none font-meme uppercase mb-2"
                        placeholder="BOTTOM TEXT"
                      />
                      <div className="flex items-center gap-2">
                         <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-500" />
                         <input 
                            type="range" 
                            min="5" 
                            max="25" 
                            step="0.5"
                            value={memeState.bottomTextSize}
                            onChange={(e) => setMemeState(prev => ({...prev, bottomTextSize: parseFloat(e.target.value)}))}
                            className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                         />
                      </div>
                    </div>
                  </div>

                  {/* AI Magic Button */}
                  <div className="pt-4 border-t border-slate-700">
                    <button
                      onClick={handleMagicCaption}
                      disabled={isGeneratingCaptions}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3 px-4 rounded-lg font-semibold shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingCaptions ? (
                        <span className="animate-pulse">Analyzing Context...</span>
                      ) : (
                        <>
                          <SparklesIcon className="w-5 h-5" />
                          Generate Magic Captions
                        </>
                      )}
                    </button>
                  </div>

                  {/* Suggestions List */}
                  {captions.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-xs font-semibold text-slate-400">SUGGESTIONS (Click to Apply)</p>
                      {captions.map((cap, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyCaption(cap)}
                          className="w-full text-left p-3 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-purple-500 transition-all group"
                        >
                           <div className="flex flex-col items-start gap-1 w-full">
                             {cap.topText && <span className="text-xs text-slate-400 font-medium uppercase">{cap.topText}</span>}
                             <div className="flex justify-between items-start gap-2 w-full">
                                <span className="text-sm text-slate-200 font-bold leading-snug uppercase">{cap.bottomText}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider whitespace-nowrap ${
                                  cap.category === 'sarcastic' ? 'bg-yellow-900/50 text-yellow-400' :
                                  cap.category === 'dark' ? 'bg-red-900/50 text-red-400' :
                                  'bg-blue-900/50 text-blue-400'
                                }`}>
                                  {cap.category}
                                </span>
                             </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === EditMode.MAGIC_EDIT && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-blue-900/20 border border-blue-800 p-3 rounded-lg">
                    <p className="text-xs text-blue-200 leading-relaxed">
                      Use text prompts to modify the image itself. E.g., "Add pixelated sunglasses" or "Make it look like a deep-fried meme".
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Edit Prompt</label>
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:outline-none h-24 resize-none"
                      placeholder="Describe how to change the image..."
                    />

                    {/* Prominent Get Ideas Button */}
                    <button 
                        onClick={handleSuggestEdits}
                        disabled={isSuggestingEdits}
                        className="mt-3 w-full py-2.5 px-3 bg-gradient-to-r from-indigo-900/80 to-purple-900/80 hover:from-indigo-800 hover:to-purple-800 border border-indigo-500/50 hover:border-indigo-400 text-indigo-100 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-md group"
                    >
                      <LightBulbIcon className={`w-5 h-5 ${isSuggestingEdits ? 'animate-pulse' : 'text-yellow-400 group-hover:scale-110 transition-transform'}`} />
                      {isSuggestingEdits ? "Brainstorming..." : "Need inspiration? Get AI Ideas"}
                    </button>

                    {editSuggestions.length > 0 && (
                        <div className="flex flex-col gap-2 mt-3 animate-fadeIn">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Try one of these:</p>
                            <div className="flex flex-wrap gap-2">
                              {editSuggestions.map((suggestion, i) => (
                                  <button 
                                      key={i}
                                      onClick={() => setEditPrompt(suggestion)}
                                      className="text-xs bg-slate-800 hover:bg-purple-900/40 border border-slate-600 hover:border-purple-500 text-slate-300 px-3 py-2 rounded-lg transition-all text-left shadow-sm flex-grow md:flex-grow-0"
                                  >
                                      ✨ {suggestion}
                                  </button>
                              ))}
                            </div>
                        </div>
                    )}
                  </div>

                  <button
                    onClick={handleGenEdit}
                    disabled={isEditingImage || !editPrompt.trim()}
                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white py-3 px-4 rounded-lg font-semibold shadow-lg shadow-pink-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                     {isEditingImage ? (
                        <span className="animate-pulse">Processing Edits...</span>
                      ) : (
                        <>
                          <PaintBrushIcon className="w-5 h-5" />
                          Apply Magic Edit
                        </>
                      )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        
        <div className="mt-auto pt-6 border-t border-slate-700">
             {memeState.imageSrc && (
               <button
                 onClick={handleReset}
                 className="w-full text-slate-400 hover:text-red-400 text-sm py-2 flex items-center justify-center gap-2 transition-colors mb-2"
               >
                 <TrashIcon className="w-4 h-4" />
                 Reset Image
               </button>
             )}
             <p className="text-xs text-slate-500 text-center">
               Powered by Advanced AI
             </p>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 bg-slate-950 p-4 md:p-8 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center min-h-0">
          {!memeState.imageSrc ? (
            <div className="text-center space-y-4 opacity-50">
              <div className="w-64 h-64 bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto">
                <PhotoIcon className="w-16 h-16 text-slate-600" />
              </div>
              <p className="text-xl font-medium text-slate-400">Upload an image to start memeing</p>
            </div>
          ) : (
            <div className="relative w-full max-w-4xl flex flex-col items-center justify-center">
              {isEditingImage ? (
                <Loader text="AI is repainting your reality..." />
              ) : (
                <MemeCanvas
                  imageSrc={memeState.imageSrc}
                  topText={memeState.topText}
                  bottomText={memeState.bottomText}
                  topTextSize={memeState.topTextSize}
                  bottomTextSize={memeState.bottomTextSize}
                  onCanvasReady={(canvas) => { canvasRef.current = canvas; }}
                />
              )}
              
              {error && (
                 <div className="absolute bottom-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
                   {error}
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Action Bar (Mobile Friendly) */}
        {memeState.imageSrc && !isEditingImage && (
          <div className="absolute bottom-6 right-6 left-6 md:left-auto md:w-auto z-10">
            <button
              onClick={handleDownload}
              className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full shadow-2xl shadow-emerald-900/50 font-bold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <ArrowDownTrayIcon className="w-6 h-6" />
              Download Meme
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;