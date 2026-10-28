// src/pages/InterviewSetup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function InterviewSetup() {
    const [topic, setTopic] = useState('MERN Stack');
    const [difficulty, setDifficulty] = useState('Intermediate');
    const [duration, setDuration] = useState(15);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const initializeSession = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        setError(null);

        try {
            const response = await axiosClient.post('/generate-question', { topic, difficulty });
            navigate('/interview', { 
                state: { 
                    questionPrompt: response.data.question,
                    topic,
                    difficulty,
                    duration: parseInt(duration)
                } 
            });
        } catch (err) {
            setError("Pipeline failure: Unable to provision interview prompt.");
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-20 px-4 font-sans text-slate-800">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Configure Parameters
                    </h2>
                    <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
                </div>
                
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-start">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={initializeSession} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Technical Domain</label>
                            <div className="relative">
                                <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-slate-800 outline-none cursor-pointer">
                                    <option value="MERN Stack">MERN Stack</option>
                                    <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                                    <option value="Python & Machine Learning">Python & Machine Learning</option>
                                    <option value="System Design">System Design</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Target Difficulty</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Entry-Level', 'Intermediate', 'Senior'].map((level) => (
                                    <button 
                                        type="button"
                                        key={level}
                                        onClick={() => setDifficulty(level)}
                                        className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all ${difficulty === level ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        {level.replace('-Level', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Session Duration</label>
                            <div className="relative">
                                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-slate-800 outline-none cursor-pointer">
                                    <option value="5">5 Minutes (Rapid Screen)</option>
                                    <option value="10">10 Minutes (Standard)</option>
                                    <option value="15">15 Minutes (Extended)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button type="submit" disabled={isGenerating} className={`w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-white font-bold shadow-lg transition-all ${isGenerating ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-emerald-200'}`}>
                                {isGenerating ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Synthesizing Instance...
                                    </>
                                ) : (
                                    <>
                                        Deploy Instance
                                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}