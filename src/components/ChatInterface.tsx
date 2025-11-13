import { useState, useRef, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Send, Phone, PhoneOff, BookOpen, MessageSquare, FileText, Calendar, Library } from 'lucide-react';
import ChatMessage from './ChatMessage';
import VoiceIndicator from './VoiceIndicator';
import PDFViewer from './PDFViewer';
import CourseRecommendations from './CourseRecommendations';
import SemesterPlanner from './SemesterPlanner';
import ModuleLibrary from './ModuleLibrary';
import { useCourseRecommendations } from '@/hooks/useCourseRecommendations';
import { useBookmarks } from '@/hooks/useBookmarks';
import { extractCoursesFromMessage, quickDetectCourses } from '@/utils/courseParser';
import { analyzeChatForBookedCourses } from '@/utils/chatAnalyzer';
import { toast } from 'sonner';
import { CourseRecommendation } from './CourseRecommendations';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [pdfPage, setPdfPage] = useState<number>(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { recommendations, addRecommendation, updateRecommendation, removeRecommendation, clearRecommendations } = useCourseRecommendations();
  const { bookmarks, addBookmark, deleteBookmark } = useBookmarks();

  const conversation = useConversation({
    clientTools: {
      add_course_recommendation: (parameters: {
        name: string;
        code?: string;
        credits?: string;
        semester?: string;
        page?: number;
      }) => {
        console.log('📚 Client tool called: add_course_recommendation', parameters);
        addRecommendation(parameters);
        toast.success(`Added ${parameters.name} to recommendations!`);
        return `Successfully added ${parameters.name} to the Recommendations tab`;
      }
    },
    onConnect: () => {
      toast.success('Connected to Course Guide');
    },
    onDisconnect: () => {
      toast.info('Disconnected from Course Guide');
    },
    onMessage: (message) => {
      const content = typeof message.message === 'string' ? message.message : '';
      const role = message.source === 'user' ? 'user' : 'assistant';
      
      if (!content.trim()) return;

        if (role === 'assistant') {
          setCurrentTranscript(prev => prev + content);
        } else {
        setMessages(prev => [...prev, {
              role,
              content,
              timestamp: new Date().toLocaleTimeString()
        }]);
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
          headers: { 'xi-api-key': ELEVENLABS_API_KEY }
        }
      );
      const data = await response.json();
      await conversation.startSession({ signedUrl: data.signed_url });
      
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your KIT Mechatronics and Information Technology Course Guide. How can I help you plan your semester?',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (e) {
      toast.error('Failed to start conversation');
    }
  };

  const endConversation = async () => {
    // Save any remaining transcript before ending
    const finalMessages = [...messages];
    if (currentTranscript.trim()) {
      const finalMessage: Message = {
        role: 'assistant' as const,
        content: currentTranscript.trim(),
        timestamp: new Date().toLocaleTimeString()
      };
      finalMessages.push(finalMessage);
      setMessages(prev => [...prev, finalMessage]);
      setCurrentTranscript('');
    }

    // Analyze conversation for booked courses
    toast.info('Analyzing conversation...');
    
    try {
      console.log('Messages to analyze:', finalMessages);
      const { bookedCourses } = await analyzeChatForBookedCourses(finalMessages);
      
      if (bookedCourses.length > 0) {
        console.log('Found booked courses:', bookedCourses);
        bookedCourses.forEach(course => addRecommendation(course));
        toast.success(`✅ Added ${bookedCourses.length} booked course${bookedCourses.length > 1 ? 's' : ''} to your planner!`);
        setActiveTab('planning');
      } else {
        toast.info('No booked courses detected in conversation.');
      }
    } catch (error) {
      console.error('Error analyzing chat:', error);
      toast.error('Failed to analyze conversation');
    }

    await conversation.endSession();
  };

  // Automatically commit transcript when AI stops speaking and parse for courses
  useEffect(() => {
    if (!conversation.isSpeaking && currentTranscript.trim()) {
      const timer = setTimeout(async () => {
        const fullMessage = currentTranscript.trim();
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: fullMessage,
          timestamp: new Date().toLocaleTimeString()
        }]);
        
        // Check if message might contain course recommendations
        if (quickDetectCourses(fullMessage)) {
          console.log('Parsing message for courses:', fullMessage);
          const courses = await extractCoursesFromMessage(fullMessage);
          
          if (courses.length > 0) {
            console.log('Found courses:', courses);
            courses.forEach(course => addRecommendation(course));
            toast.success(`Added ${courses.length} course${courses.length > 1 ? 's' : ''} to recommendations`);
          }
        }
        
        setCurrentTranscript('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [conversation.isSpeaking, currentTranscript, addRecommendation]);

  const sendTextMessage = () => {
    if (!inputValue.trim()) return;
    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
  };

  const isConnected = conversation.status === 'connected';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  const handleCourseClick = (page: number) => {
    setPdfPage(page);
    setActiveTab('handbook');
  };

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
                KIT Nova · Innovation Space — plan your next semester journey
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

      {/* Main Content Area with Tabs */}
      <div className="flex-1 container max-w-6xl mx-auto px-4 py-6 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="handbook" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Handbook
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Recommendations ({recommendations.length})
            </TabsTrigger>
            <TabsTrigger value="planning" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Semester Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full pr-4" ref={scrollRef}>
              {messages.length === 0 && !isConnected && (
                <Card className="p-8 text-center border-dashed">
                  <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
                <div className="flex gap-3 mb-4 justify-start animate-fade-in">
                  <Card className="max-w-[80%] p-5 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30 relative">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="text-xs font-semibold mb-2 uppercase tracking-wide text-accent flex items-center gap-2">
                          🎓 Course Guide
                          <span className="inline-flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed text-[15px] text-foreground">
                          {currentTranscript}
                          <span className="inline-block w-1 h-4 bg-accent ml-1 animate-pulse"></span>
                        </div>
                        <div className="text-xs opacity-50 mt-3 pt-2 border-t border-border/30">
                          Speaking now...
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="handbook" className="flex-1 overflow-hidden mt-0">
            <PDFViewer 
              targetPage={pdfPage}
              bookmarks={bookmarks}
              onAddBookmark={addBookmark}
              onDeleteBookmark={deleteBookmark}
              onBookmarkClick={(bookmark) => {
                addRecommendation({ ...bookmark, id: Date.now().toString() });
                setPdfPage(bookmark.page || 1);
                setActiveTab('recommendations');
              }}
            />
          </TabsContent>

          <TabsContent value="modules" className="flex-1 overflow-hidden mt-0">
            <ModuleLibrary
              existingCourses={recommendations}
              onAddRecommendation={addRecommendation}
              onCourseClick={handleCourseClick}
            />
          </TabsContent>

          <TabsContent value="recommendations" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full pr-4">
              <CourseRecommendations 
                courses={recommendations}
                onCourseClick={handleCourseClick}
                onDeleteCourse={removeRecommendation}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="planning" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full pr-4">
              <SemesterPlanner
                courses={recommendations}
                onCourseClick={handleCourseClick}
                onUpdateCourse={updateRecommendation}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
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
