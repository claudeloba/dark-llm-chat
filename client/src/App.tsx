
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { 
  Conversation, 
  ChatMode, 
  Participant, 
  CreateParticipantInput,
  Message,
  CreateMessageInput,
  AiModel,
  ParticipantRole
} from '../../server/src/schema';

// Animation keyframes for the previews
const animationStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideInLeft {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
  .animate-pulse { animation: pulse 2s infinite; }
  .animate-spin { animation: spin 1s linear infinite; }
  .animate-slide-in-left { animation: slideInLeft 0.3s ease-out; }
  .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
`;

// Animated Preview Components
function SmartAnswerPreview() {
  const [showAnswer, setShowAnswer] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowAnswer(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg min-h-[120px]">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
          U
        </div>
        <div className="bg-blue-600 text-white px-3 py-2 rounded-2xl rounded-tl-md text-sm">
          What is the capital of France?
        </div>
      </div>
      {showAnswer && (
        <div className="flex items-start space-x-3 animate-slide-in-left">
          <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-white text-sm">
            AI
          </div>
          <div className="bg-zinc-700 text-white px-3 py-2 rounded-2xl rounded-tl-md text-sm">
            The capital of France is Paris.
          </div>
        </div>
      )}
    </div>
  );
}

function GroupChatPreview() {
  const [messages, setMessages] = useState<Array<{id: number, sender: string, text: string, isUser: boolean}>>([
    { id: 1, sender: 'You', text: 'Hey team, what do you think about this?', isUser: true }
  ]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setMessages(prev => [...prev, 
        { id: 2, sender: 'ChatGPT', text: 'I think it\'s a great idea!', isUser: false }
      ]), 1500),
      setTimeout(() => setMessages(prev => [...prev, 
        { id: 3, sender: 'Gemini', text: 'I agree with ChatGPT.', isUser: false }
      ]), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="space-y-2 p-4 bg-zinc-900/50 rounded-lg min-h-[120px]">
      {messages.map((msg: typeof messages[0]) => (
        <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-slide-in-${msg.isUser ? 'right' : 'left'}`}>
          <div className={`px-3 py-2 rounded-2xl text-sm max-w-[80%] ${
            msg.isUser 
              ? 'bg-blue-600 text-white rounded-br-md' 
              : 'bg-zinc-700 text-white rounded-bl-md'
          }`}>
            {!msg.isUser && <div className="text-xs text-zinc-400 mb-1">{msg.sender}</div>}
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function AutoPilotPreview() {
  const [isThinking, setIsThinking] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsThinking(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-zinc-900/50 rounded-lg min-h-[120px]">
      <div className="text-center space-y-3">
        {isThinking && (
          <>
            <div className="w-12 h-12 border-4 border-zinc-600 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div className="text-sm text-zinc-400 animate-pulse">Thinking...</div>
            <div className="text-xs text-zinc-500">Coordinating multiple AI agents</div>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  // Main app state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [currentMode, setCurrentMode] = useState<ChatMode | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // UI state
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  // Form state for new participant
  const [newParticipant, setNewParticipant] = useState<CreateParticipantInput>({
    conversation_id: 0,
    name: '',
    description: null,
    role: 'assistant',
    avatar_url: null,
    ai_model: 'chatgpt',
    is_active: true
  });

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    try {
      const result = await trpc.getConversations.query();
      setConversations(result);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load conversation data when selected
  const loadConversationData = useCallback(async (conversation: Conversation) => {
    if (!conversation) return;
    
    try {
      setIsLoading(true);
      
      // Load messages
      const messagesResult = await trpc.getMessages.query({ 
        conversation_id: conversation.id 
      });
      setMessages(messagesResult);
      
      // Load participants for group chat mode
      if (conversation.mode === 'group_chat') {
        const participantsResult = await trpc.getParticipants.query({ 
          conversation_id: conversation.id 
        });
        setParticipants(participantsResult);
      }
    } catch (error) {
      console.error('Failed to load conversation data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new conversation
  const createNewConversation = async (mode: ChatMode) => {
    try {
      setIsLoading(true);
      const title = mode === 'smart_answer' ? 'Smart Answer' : 
                   mode === 'group_chat' ? 'Group Chat' : 'AutoPilot';
      
      const newConv = await trpc.createConversation.mutate({ title, mode });
      setConversations((prev: Conversation[]) => [newConv, ...prev]);
      setSelectedConversation(newConv);
      setCurrentMode(mode);
      
      // Reset state
      setMessages([]);
      setParticipants([]);
      
      await loadConversationData(newConv);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Select existing conversation
  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setCurrentMode(conversation.mode);
    await loadConversationData(conversation);
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      const messageInput: CreateMessageInput = {
        conversation_id: selectedConversation.id,
        role: 'user',
        content: newMessage.trim()
      };
      
      const message = await trpc.createMessage.mutate(messageInput);
      setMessages((prev: Message[]) => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Add participant
  const addParticipant = async () => {
    if (!selectedConversation || !newParticipant.name) return;
    
    try {
      const participantInput = {
        ...newParticipant,
        conversation_id: selectedConversation.id
      };
      
      const participant = await trpc.createParticipant.mutate(participantInput);
      setParticipants((prev: Participant[]) => [...prev, participant]);
      setParticipantDialogOpen(false);
      setNewParticipant({
        conversation_id: 0,
        name: '',
        description: null,
        role: 'assistant',
        avatar_url: null,
        ai_model: 'chatgpt',
        is_active: true
      });
    } catch (error) {
      console.error('Failed to add participant:', error);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      <div className="flex h-screen bg-zinc-950 text-white">
        {/* Left Sidebar */}
        <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col">
          <div className="p-4 border-b border-zinc-800">
            <Button 
              onClick={() => {
                setSelectedConversation(null);
                setCurrentMode(null);
                setMessages([]);
                setParticipants([]);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200"
            >
              + New Chat
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {conversations.map((conv: Conversation) => (
                <Button
                  key={conv.id}
                  variant={selectedConversation?.id === conv.id ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left p-3 h-auto rounded-xl transition-all duration-200 ${
                    selectedConversation?.id === conv.id 
                      ? 'bg-zinc-800 text-white' 
                      : 'hover:bg-zinc-800/50 text-zinc-300'
                  }`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="flex flex-col items-start space-y-1">
                    <div className="font-medium truncate w-full">{conv.title}</div>
                    <div className="text-xs text-zinc-500">
                      <Badge variant="outline" className="text-xs">
                        {conv.mode.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {!selectedConversation ? (
            // Start Page
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-6xl w-full">
                <div className="text-center mb-12 animate-fade-in-up">
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-4">
                    Welcome to AutoGen Chat
                  </h1>
                  <p className="text-xl text-zinc-400">Choose your conversation mode to get started</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                  <Card 
                    className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700 hover:border-blue-500 transition-all duration-300 cursor-pointer group transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 rounded-2xl animate-fade-in-up"
                    onClick={() => createNewConversation('smart_answer')}
                  >
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                        🧠 Smart Answer
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        Single-turn Q&A with conversational memory
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SmartAnswerPreview />
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700 hover:border-green-500 transition-all duration-300 cursor-pointer group transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/20 rounded-2xl animate-fade-in-up"
                    onClick={() => createNewConversation('group_chat')}
                  >
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">
                        💬 Group Chat
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        iMessage-like layout for group conversations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <GroupChatPreview />
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700 hover:border-purple-500 transition-all duration-300 cursor-pointer group transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 rounded-2xl animate-fade-in-up"
                    onClick={() => createNewConversation('autopilot')}
                  >
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                        🚀 AutoPilot
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        Complete tasks using multiple AI agents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AutoPilotPreview />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            // Chat Interface
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-semibold">{selectedConversation.title}</h2>
                    <Badge variant="outline" className="text-xs">
                      {currentMode?.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {currentMode === 'group_chat' && (
                    <div className="flex items-center space-x-2">
                      <Dialog open={participantDialogOpen} onOpenChange={setParticipantDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-lg">
                            Add Participant
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-700 rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">Add New Participant</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                              Add a new AI participant to the group chat
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="name" className="text-white">Name</Label>
                              <Input
                                id="name"
                                value={newParticipant.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setNewParticipant((prev: CreateParticipantInput) => ({ ...prev, name: e.target.value }))
                                }
                                placeholder="Enter participant name"
                                className="bg-zinc-800 border-zinc-700 text-white rounded-lg"
                              />
                            </div>
                            <div>
                              <Label htmlFor="description" className="text-white">Description</Label>
                              <Textarea
                                id="description"
                                value={newParticipant.description || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                  setNewParticipant((prev: CreateParticipantInput) => ({ 
                                    ...prev, 
                                    description: e.target.value || null 
                                  }))
                                }
                                placeholder="Brief description of the participant"
                                className="bg-zinc-800 border-zinc-700 text-white rounded-lg"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="role" className="text-white">Role</Label>
                                <Select
                                  value={newParticipant.role}
                                  onValueChange={(value: ParticipantRole) =>
                                    setNewParticipant((prev: CreateParticipantInput) => ({ ...prev, role: value }))
                                  }
                                >
                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white rounded-lg">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="assistant">Assistant</SelectItem>
                                    <SelectItem value="expert">Expert</SelectItem>
                                    <SelectItem value="analyst">Analyst</SelectItem>
                                    <SelectItem value="moderator">Moderator</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="ai_model" className="text-white">AI Model</Label>
                                <Select
                                  value={newParticipant.ai_model || 'chatgpt'}
                                  onValueChange={(value: AiModel) =>
                                    setNewParticipant((prev: CreateParticipantInput) => ({ ...prev, ai_model: value }))
                                  }
                                >
                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white rounded-lg">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="chatgpt">ChatGPT</SelectItem>
                                    <SelectItem value="gemini">Gemini</SelectItem>
                                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                                    <SelectItem value="grok">Grok</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <Button 
                              onClick={addParticipant} 
                              className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg"
                            >
                              Add Participant
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-lg">
                            Participants ({participants.length})
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="bg-zinc-900 border-zinc-700 w-80">
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Group Participants</h3>
                            <Separator className="bg-zinc-700" />
                            <ScrollArea className="h-[calc(100vh-120px)]">
                              <div className="space-y-3">
                                {participants.map((participant: Participant) => (
                                  <div key={participant.id} className="flex items-start space-x-3 p-3 bg-zinc-800 rounded-xl">
                                    <Avatar className="w-10 h-10">
                                      <AvatarImage src={participant.avatar_url || undefined} />
                                      <AvatarFallback className="bg-zinc-700 text-white">
                                        {participant.name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <h4 className="font-medium text-white truncate">{participant.name}</h4>
                                        <Badge variant="outline" className="text-xs">
                                          {participant.ai_model}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-zinc-400 mt-1">{participant.description}</p>
                                      <div className="flex items-center space-x-2 mt-2">
                                        <Badge variant="secondary" className="text-xs">
                                          {participant.role}
                                        </Badge>
                                        {participant.is_active && (
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {messages.length === 0 ? (
                      <div className="text-center text-zinc-500 mt-8">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message: Message) => (
                        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-3 transition-all duration-200 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-zinc-800 text-white rounded-bl-md'
                          }`}>
                            {message.role !== 'user' && message.participant_id && (
                              <div className="text-xs text-zinc-400 mb-1">
                                {participants.find((p: Participant) => p.id === message.participant_id)?.name || 'AI'}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <div className="text-xs text-zinc-400 mt-2">
                              {message.created_at.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-900">
                <div className="max-w-4xl mx-auto">
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-zinc-800 border-zinc-700 text-white rounded-xl"
                      onKeyPress={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          sendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isLoading}
                      className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
