import { useState, useRef, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Phone, PhoneOff } from 'lucide-react';
import ChatMessage from './ChatMessage';
import VoiceIndicator from './VoiceIndicator';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const ELEVENLABS_API_KEY = 'sk_b4730d2bbc79c89499773ee6f9dc64bf722019e7f9be96ad';
const AGENT_ID = 'agent_6001k8c100vce8yrhe4dtbzzv3xg';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      toast.success('Connected to Course Guide');
    },
    onDisconnect: () => {
      toast.info('Disconnected from Course Guide');
    },
    onMessage: (message) => {
      console.log('Message received:', message);
      
      // Message structure: { message: string, source: 'user' | 'ai' }
      const content = typeof message.message === 'string' ? message.message : '';
      const role = message.source === 'user' ? 'user' : 'assistant';
      
      if (content.trim()) {
        // Check if this is continuing the current transcript or a new message
        if (role === 'assistant') {
          setCurrentTranscript(prev => prev + content);
        } else {
          setMessages(prev => [...prev, {
            role,
            content,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
      }
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      toast.error('Connection error. Please try again.');
    },
  });

  const startConversation = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }

      const data = await response.json();
      await conversation.startSession({ signedUrl: data.signed_url });
      
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your KIT Mechatronics and Information Technology Course Guide. How can I help you plan your semester?',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation. Please check your microphone permissions.');
    }
  };

  const endConversation = async () => {
    // Save any remaining transcript before ending
    if (currentTranscript) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: currentTranscript,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setCurrentTranscript('');
    }
    await conversation.endSession();
  };

  const sendTextMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Note: Text messages through conversation API would require additional implementation
    toast.info('Text input is available. Voice responses will continue through the conversation.');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  const isConnected = conversation.status === 'connected';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card shadow-sm">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                KIT Course Guide
              </h1>
              <p className="text-sm text-muted-foreground">
                Mechatronics and Information Technology
              </p>
            </div>
            <div className="flex items-center gap-3">
              <VoiceIndicator 
                isActive={isConnected} 
                isSpeaking={conversation.isSpeaking} 
              />
              {!isConnected ? (
                <Button 
                  onClick={startConversation}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Start Session
                </Button>
              ) : (
                <Button 
                  onClick={endConversation}
                  variant="destructive"
                >
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Session
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 container max-w-4xl mx-auto px-4 py-6 overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollRef}>
          {messages.length === 0 && !isConnected && (
            <Card className="p-8 text-center border-dashed">
              <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Ready to Help You Plan</h3>
              <p className="text-muted-foreground">
                Start a voice session to get guidance on your Mechatronics semester planning, 
                course selection, and program requirements.
              </p>
            </Card>
          )}
          
          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))}
          
          {currentTranscript && (
            <ChatMessage
              role="assistant"
              content={currentTranscript + '...'}
              timestamp="Now"
            />
          )}
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card shadow-lg">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
              placeholder="Type a message or use voice..."
              className="flex-1"
              disabled={!isConnected}
            />
            <Button 
              onClick={sendTextMessage}
              disabled={!inputValue.trim() || !isConnected}
              className="bg-accent hover:bg-accent/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {isConnected 
              ? 'Speak naturally or type your questions about course planning' 
              : 'Start a session to begin chatting'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
