// frontend/src/hooks/useTextToSpeech.js
import { useRef, useCallback } from 'react';

export const useTextToSpeech = () => {
    const synthRef = useRef(window.speechSynthesis);

    const speak = useCallback((text) => {
        if (!synthRef.current) {
            console.error("Speech Synthesis API is not supported in this browser environment.");
            return;
        }

        // Terminate any active audio streams before initiating a new payload
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0; 
        utterance.pitch = 1.0;
        
        // Optimize for a professional English voice if available in the client OS
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(voice => voice.lang.includes('en-US') || voice.lang.includes('en-GB'));
        if (preferredVoice) utterance.voice = preferredVoice;

        synthRef.current.speak(utterance);
    }, []);

    const stopSpeaking = useCallback(() => {
        if (synthRef.current) synthRef.current.cancel();
    }, []);

    return { speak, stopSpeaking };
};