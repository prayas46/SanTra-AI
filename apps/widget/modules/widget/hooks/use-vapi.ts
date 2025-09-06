import Vapi from '@vapi-ai/web';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { vapiSecretsAtom, widgetSettingsAtom } from '../atoms/widget-atoms';

interface TranscriptMessage{
    role : 'user' | 'assistant';
    text: string;
}

export const useVapi = () => {
    const vapiSecrets = useAtomValue(vapiSecretsAtom)
    const widgetSettings = useAtomValue(widgetSettingsAtom)


    const [vapi, setVapi] = useState<Vapi | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);

    useEffect(() => {
        // to be done after error resolving --- > ONLY THE COMMENTED OUT PART
        if (!vapiSecrets) {
            return ;
        }

        // only for testing the Vapi API, otherwise customers will provide their own API keys

        const vapiInstance = new Vapi(vapiSecrets.publicApiKey); // <---- vapiSecrets.publicApiKey ----> to be put here
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
            if(message.type === "transcript" && message.transcriptType === "final"){
                setTranscript((prev: TranscriptMessage[]) => [
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
        // to be done after error resolving --- > ONLY THE COMMENTED OUT PART
        if (!vapiSecrets || !widgetSettings?.vapiSettings?.assistantId) {
            return;
        }
        setIsConnecting(true);

        // only for testing the Vapi API, otherwise customers will provide their own Assistant ID'

        if(vapi){
            vapi.start(widgetSettings.vapiSettings.assistantId); // <---- widgetSettings.vapiSettings.assistantId ----> to be put here
        }
        
    };

    const endCall = () => {
        vapi?.stop();
    };

    return{
        isSpeaking,
        isConnecting,
        isConnected,
        transcript,
        startCall,
        endCall,
    }
};