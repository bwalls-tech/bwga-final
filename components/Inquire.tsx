import React, { useState, useRef, useEffect } from 'react';
import { fetchInquireSuggestions, generateSpeech, fetchCapabilities } from '../services/nexusService.ts';
import type { ReportSuggestions, AiCapabilitiesResponse, ReportParameters } from '../types.ts';
import { NexusLogo, MegaphoneIcon, ChatBubbleLeftRightIcon } from './Icons.tsx';
import Spinner from './Spinner.tsx';
import { EconomicSnapshot } from './EconomicSnapshot.tsx';
import { SavedWorkManager } from './SavedWorkManager.tsx';

// --- Audio Decoding Helpers (as per Gemini docs) ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


interface InquireProps {
    onApplySuggestions: (suggestions: ReportSuggestions) => void;
    params: ReportParameters;
    savedReports: ReportParameters[];
    onSaveReport: (params: ReportParameters) => void;
    onLoadReport: (params: ReportParameters) => void;
    onDeleteReport: (reportName: string) => void;
}

const Suggestion: React.FC<{ title: string; value: string; onApply: () => void }> = ({ title, value, onApply }) => (
    <div className="suggestion-card">
        <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-nexus-text-primary">{title}</h4>
            <button onClick={onApply} className="text-xs font-bold bg-nexus-accent-cyan text-white px-2 py-1 rounded hover:bg-nexus-accent-cyan-dark transition-colors">
                Apply
            </button>
        </div>
        <div className="suggestion-value">
            <pre className="whitespace-pre-wrap font-sans">{value}</pre>
        </div>
    </div>
);

export const Inquire: React.FC<InquireProps> = ({
    onApplySuggestions,
    params,
    savedReports,
    onSaveReport,
    onLoadReport,
    onDeleteReport
}) => {
    const [query, setQuery] = useState('');
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<ReportSuggestions | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
    const [greeting, setGreeting] = useState("Hello, how can I assist you today?");
    
    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    
    useEffect(() => {
        if (!audioContextRef.current) {
            // @ts-ignore
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 24000});
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setQuery(transcript);
                setIsListening(false);
                handleSubmit(undefined, transcript);
            };
            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                let errorMessage = "Speech recognition failed. Please try again.";
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    errorMessage = "Microphone access denied. Please enable it in your browser settings.";
                }
                setError(errorMessage);
                setIsListening(false);
            };
            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        const loadGreeting = async () => {
             try {
                const caps = await fetchCapabilities();
                setGreeting(caps.greeting);
                speak(caps.greeting);
            } catch (err) {
                // Use default greeting if API fails, don't show error
                console.error("Failed to fetch capabilities:", err);
            }
        };

        loadGreeting();
        
        return () => {
             if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        }
    }, []);
    
    const speak = async (text: string) => {
        if (!isSpeechEnabled || !text || !audioContextRef.current) return;
        
        try {
            if (audioContextRef.current.state === 'suspended') {
                 await audioContextRef.current.resume();
            }
            const base64Audio = await generateSpeech(text);
            const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                audioContextRef.current,
                24000,
                1
            );
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
        } catch (e) {
            console.error("Speech generation/playback failed:", e);
        }
    };

    const handleSubmit = async (e?: React.FormEvent, prompt?: string) => {
        e?.preventDefault();
        const finalQuery = prompt || query;
        if (!finalQuery.trim()) return;

        setIsLoading(true);
        setError(null);
        setSuggestions(null);

        try {
            const response = await fetchInquireSuggestions(finalQuery, fileContent);
            setSuggestions(response);
            const summary = response.problemStatement || `Here are some suggestions for your report on ${response.reportName || finalQuery}.`;
            speak(summary);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
            speak(`I'm sorry, an error occurred: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFileContent(e.target?.result as string);
                setFileName(file.name);
            };
            reader.onerror = () => {
                setError("Failed to read file.");
            }
            reader.readAsText(file);
        }
    };

    const handleMicClick = () => {
        if (!recognitionRef.current) {
            setError("Speech recognition is not supported or enabled in your browser.");
            return;
        }
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            audioContextRef.current?.resume();
            setQuery('');
            setSuggestions(null);
            setError(null);
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const renderSuggestions = () => (
        <div className="mt-4 pt-4 border-t border-nexus-border-medium animate-fadeIn">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-bold text-nexus-text-primary">AI Suggestions</h3>
                <button onClick={() => onApplySuggestions(suggestions!)} className="text-xs font-bold bg-nexus-accent-gold text-black px-2 py-1 rounded hover:bg-nexus-accent-gold-dark transition-colors">Apply All</button>
            </div>
            {Object.entries(suggestions!).map(([key, value]) => (
                value && <Suggestion 
                    key={key}
                    title={`Suggested ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`}
                    value={String(value)}
                    onApply={() => onApplySuggestions({ [key]: value })}
                />
            ))}
        </div>
    );
    

    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="flex-shrink-0 p-4 border-b border-nexus-border-medium bg-white/50">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ChatBubbleLeftRightIcon className="w-8 h-8 text-nexus-accent-gold" />
                        <div>
                            <h2 className="text-xl font-bold text-nexus-text-primary tracking-tight">Nexus Inquire</h2>
                            <p className="text-sm text-nexus-text-secondary">AI Assistant for Report Generation</p>
                        </div>
                    </div>
                     <button onClick={() => setIsSpeechEnabled(!isSpeechEnabled)} title={isSpeechEnabled ? "Disable Speech" : "Enable Speech"} className={`p-2 rounded-full transition-colors ${isSpeechEnabled ? 'bg-nexus-accent-cyan/20 text-nexus-accent-cyan' : 'bg-nexus-surface-700 text-nexus-text-secondary'}`}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /><path d="M5.5 13a.5.5 0 01.5.5v1a3.5 3.5 0 007 0v-1a.5.5 0 011 0v1a4.5 4.5 0 01-4.5 4.95V19h-1v-1.55A4.5 4.5 0 014.5 14v-1a.5.5 0 01.5-.5z" /></svg>
                    </button>
                </div>
            </header>

            <div className="flex-grow overflow-y-auto p-4">
                <div className="text-sm text-nexus-text-secondary p-3 bg-white rounded-lg border border-nexus-border-subtle mb-4">
                    <p>
                        <strong>Nexus Inquire</strong> is your AI co-pilot. Use natural language to describe your objective, and Inquire will translate it into a structured query, suggesting parameters for your intelligence blueprint. You can also save, load, and manage your report configurations using the <strong>Saved Blueprints</strong> manager below.
                    </p>
                </div>

                 <p className="text-center mb-4 text-lg text-nexus-text-secondary">{greeting}</p>
                 
                 <div>
                    <form onSubmit={handleSubmit} className="relative">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Describe your objective or type a question..."}
                            className="w-full p-3 pr-20 bg-white border border-nexus-border-medium rounded-lg text-md text-nexus-text-primary placeholder:text-nexus-text-muted focus:outline-none focus:ring-2 focus:ring-nexus-accent-gold shadow-sm resize-none"
                            rows={4}
                            disabled={isLoading || isListening}
                            autoFocus
                        />
                         <div className="absolute top-2 right-2 flex items-center gap-1">
                            <button type="button" onClick={handleMicClick} title="Use Voice Input" className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-transparent text-nexus-text-secondary hover:text-nexus-text-primary'}`}>
                                <MegaphoneIcon className="w-6 h-6" />
                            </button>
                         </div>
                    </form>

                    <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex-grow">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt,.md" className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="text-xs flex items-center gap-1 text-nexus-text-secondary hover:text-nexus-text-primary transition-colors truncate" title={fileName || 'Upload Context (.txt, .md)'}>
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                <span className="truncate">{fileName || 'Upload Context (.txt, .md)'}</span>
                            </button>
                        </div>
                        {fileName && <button onClick={() => { setFileName(null); setFileContent(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="text-xs text-red-400 flex-shrink-0">&times;</button>}
                        <button onClick={(e) => handleSubmit(e)} disabled={isLoading || !query.trim()} className="bg-gradient-to-r from-nexus-accent-gold to-nexus-accent-gold-dark text-black font-bold py-2 px-4 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {isLoading ? <Spinner /> : 'Analyze'}
                        </button>
                    </div>

                    {isLoading && (
                         <div className="text-center p-4">
                            <NexusLogo className="w-8 h-8 text-nexus-accent-gold animate-pulse mx-auto" />
                            <p className="text-sm text-nexus-text-secondary mt-2">Analyzing your objective...</p>
                        </div>
                    )}

                    {error && (
                         <div className="mt-4 p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg">
                            <strong>Assistant Error:</strong> {error}
                         </div>
                     )}

                    {suggestions && !isLoading && renderSuggestions()}
                </div>

                 {params.userCountry && (
                    <div className="mt-6">
                        <EconomicSnapshot country={params.userCountry} />
                    </div>
                 )}

                 <SavedWorkManager
                    currentParams={params}
                    savedReports={savedReports}
                    onSave={onSaveReport}
                    onLoad={onLoadReport}
                    onDelete={onDeleteReport}
                 />
            </div>
        </div>
    );
};