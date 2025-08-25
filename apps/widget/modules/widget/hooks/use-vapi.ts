import Vapi from '@vapi-ai/web';
import { useEffect, useState } from 'react';

interface TranscriptMessage{
    role : 'user' | 'assistant';
    text: string;
}

export const useVapi = () => {
    const [vapi, setVapi] = useState<Vapi | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);

    useEffect(() => {

        // only for testing the Vapi API, otherwise customers will provide their own API keys

        const vapiInstance = new Vapi("a583229c-90ec-4962-9272-66c33c0a73b2");
        setVapi(vapiInstance);

        vapiInstance.on('call-start', () => {
            setIsConnected(true);
            setIsConnecting(false);
            setTranscript([]);
        });

        vapiInstance.on('call-end', () => {
            setIsConnected(false);
            setIsConnecting(false);
            setIsSpeaking(false);
        });

        vapiInstance.on('speech-start', () => {
            setIsSpeaking(true);
        }); 

        vapiInstance.on('speech-end', () => {
            setIsSpeaking(false);
        });

        vapiInstance.on('error', (error) => {
            console.log(error,"VAPI-ERROR");
            setIsConnecting(false);
        });

        vapiInstance.on('message', (message) =>{
            if(message.type  === "tarnscript" && message.transcriptType === "final"){
                setTranscript((prev) => [
                    ...prev,
                    {
                        role : message.role === "user" ? "user" : "assistant",
                        text : message.transcript,
                    }
                ]);
            }
        });

        return () => {
            vapiInstance?.stop();
        };

    }, []);

    const startCall = () => {
        setIsConnecting(true);

        // only for testing the Vapi API, otherwise customers will provide their own Assistant ID'

        if(vapi){
        vapi.start("8eda2810-f1bf-425f-8e70-b882320388b2");
        }
        
    };

    const endCall = () => {
        vapi?.stop();
    }

    return{
        isSpeaking,
        isConnecting,
        isConnected,
        transcript,
        startCall,
        endCall,
    }
};