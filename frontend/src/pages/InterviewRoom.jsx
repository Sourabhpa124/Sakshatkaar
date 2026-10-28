// src/pages/InterviewRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export default function InterviewRoom() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const topic = location.state?.topic || "Full Stack Development";
    const difficulty = location.state?.difficulty || "Intermediate";
    const duration = location.state?.duration || 5;
    
    const [sessionStarted, setSessionStarted] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fatalError, setFatalError] = useState(null);
    
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const timerRef = useRef(null);
    const chatEndRef = useRef(null);

    const { isListening, transcript, startListening, stopListening, setTranscript, resetTranscript } = useSpeechToText();
    const { speak, stopSpeaking } = useTextToSpeech();

    useEffect(() => {
        if (sessionStarted && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (timeLeft <= 0 && sessionStarted) {
            clearInterval(timerRef.current);
            executeDialogueTurn(true);
        }
        return () => clearInterval(timerRef.current);
    }, [sessionStarted, timeLeft]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversationHistory, isProcessing]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const initiateSession = () => {
        setSessionStarted(true);
        const openingStatement = `Hello. We have ${duration} minutes scheduled for this ${difficulty} level technical interview regarding ${topic}. Let's begin. ${location.state?.questionPrompt || "Tell me about your experience."}`;
        
        const initialLog = [{ role: "interviewer", content: openingStatement }];
        setConversationHistory(initialLog);
        speak(openingStatement);
    };

    const executeDialogueTurn = async (forceConclusion = false) => {
        if (!transcript.trim() && !forceConclusion) return;
        
        setIsProcessing(true);
        setFatalError(null);
        stopSpeaking();
        
        const updatedHistory = [...conversationHistory];
        
        if (!forceConclusion) {
            updatedHistory.push({ role: "candidate", content: transcript });
            setConversationHistory(updatedHistory);
            resetTranscript();
        }

        try {
            const response = await axiosClient.post('/interview-turn', {
                topic, difficulty, duration, conversationHistory: updatedHistory, isFinalTurn: forceConclusion || timeLeft <= 0
            });

            const aiText = response.data.response;
            setConversationHistory(prev => [...prev, { role: "interviewer", content: aiText }]);
            speak(aiText);

            if (forceConclusion || timeLeft <= 0) {
                setIsProcessing(true);
                try {
                    await axiosClient.post('/submit-session', {
                        topic, difficulty, duration, conversationHistory: updatedHistory
                    });
                    navigate('/dashboard'); 
                } catch (err) {
                    setFatalError("Critical Failure: Unable to commit session telemetry to persistent storage.");
                    setIsProcessing(false); 
                }
                return; 
            }
        } catch (error) {
            setFatalError("Dialogue Engine Error: Inference timeout.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-screen bg-slate-900 flex flex-col font-sans text-slate-100">
            <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center shrink-0 shadow-md">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-tight">Active Evaluation</h1>
                        <p className="text-xs text-blue-400 font-medium">{topic} • {difficulty}</p>
                    </div>
                </div>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border font-mono text-xl font-bold shadow-inner ${timeLeft < 60 ? 'bg-red-900/50 border-red-500/50 text-red-400 animate-pulse' : 'bg-slate-900 border-slate-700 text-emerald-400'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{formatTime(timeLeft)}</span>
                </div>
            </header>

            {!sessionStarted ? (
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">System Readiness Check</h2>
                        <p className="text-slate-400 text-sm mb-8">Ensure your audio input peripherals are active. This is a strictly timed {duration}-minute sequence.</p>
                        <button onClick={initiateSession} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all transform hover:-translate-y-0.5">
                            Initialize Sequence
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 md:p-6 overflow-hidden">
                    {fatalError && (
                        <div className="shrink-0 mb-4 p-4 rounded-xl bg-red-900/50 border border-red-500 text-red-200 text-sm flex items-start shadow-lg">
                            <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <span className="font-medium">{fatalError}</span>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar pb-4">
                        {conversationHistory.map((msg, index) => (
                            <div key={index} className={`flex w-full ${msg.role === 'interviewer' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-5 shadow-sm ${msg.role === 'interviewer' ? 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm' : 'bg-blue-600 text-white rounded-tr-sm shadow-blue-900/20'}`}>
                                    <div className="flex items-center space-x-2 mb-2">
                                        {msg.role === 'interviewer' ? (
                                            <>
                                                <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">AI</div>
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Senior Manager</span>
                                            </>
                                        ) : (
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Candidate</span>
                                        )}
                                    </div>
                                    <p className="text-[0.95rem] leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {isProcessing && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm p-5 shadow-sm flex items-center space-x-3">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <span className="text-sm text-slate-400 font-medium italic">Synthesizing telemetry...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="shrink-0 pt-4 mt-2 border-t border-slate-800">
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-2 shadow-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                            <textarea 
                                value={transcript} 
                                onChange={(e) => setTranscript(e.target.value)} 
                                placeholder="Transcription pipeline active..." 
                                rows={2} 
                                className="w-full bg-transparent text-slate-200 p-3 outline-none resize-none placeholder-slate-500 text-sm"
                                disabled={isProcessing}
                            />
                            <div className="flex justify-between items-center mt-2 px-2 pb-2">
                                <button 
                                    onClick={isListening ? stopListening : startListening} 
                                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${isListening ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/50' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'}`}
                                >
                                    {isListening ? (
                                        <><span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span> Terminate Rec</>
                                    ) : (
                                        <><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg> Activate Mic</>
                                    )}
                                </button>
                                
                                <button 
                                    onClick={() => executeDialogueTurn(false)} 
                                    disabled={isProcessing || !transcript.trim()} 
                                    className={`inline-flex items-center px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-all ${isProcessing || !transcript.trim() ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.5)]'}`}
                                >
                                    Dispatch Payload
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}