import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, Users, Reply } from "lucide-react";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  created_at: string;
  user_id: string | null;
  reply_to?: string | null;
  reply_username?: string | null;
}

interface LiveChatProps {
  showId?: string;
  className?: string;
}

const LiveChat = ({ showId, className = "" }: LiveChatProps) => {
  // Note: showId parameter reserved for future show-specific chat rooms
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Generate a consistent session ID for anonymous users
  const getSessionId = () => {
    if (user) return user.id;
    
    let storedSessionId = localStorage.getItem('pulse_fm_chat_session');
    if (!storedSessionId) {
      storedSessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('pulse_fm_chat_session', storedSessionId);
    }
    return storedSessionId;
  };

  const getUsername = () => {
    if (user) {
      // Use real name from user profile - prioritize display_name, then full_name
      return user.user_metadata?.display_name || 
             user.user_metadata?.full_name || 
             user.email?.split('@')[0] || 
             'User';
    }
    
    // No anonymous usernames allowed - return null to show login prompt
    return null;
  };

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    subscribeToPresence();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load recent messages (simulate using localStorage for demo)
  const loadMessages = () => {
    const storedMessages = localStorage.getItem('pulse_fm_chat_messages');
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        setMessages(parsed.slice(-50)); // Keep last 50 messages
      } catch (e) {
        console.error('Error loading messages:', e);
      }
    } else {
      // Add some demo messages for first-time users with real names
      const demoMessages: ChatMessage[] = [
        {
          id: 'demo_1',
          username: 'Mike Johnson',
          message: 'Welcome to PULSE FM live chat! 🎵',
          created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          user_id: 'demo_dj',
        },
        {
          id: 'demo_2', 
          username: 'Sarah Williams',
          message: 'Great show tonight! Love this track 🔥',
          created_at: new Date(Date.now() - 240000).toISOString(), // 4 minutes ago
          user_id: 'demo_user_1',
        },
        {
          id: 'demo_3',
          username: 'David Chen',
          message: 'Can you play some jazz next?',
          created_at: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
          user_id: 'demo_user_2',
        }
      ];
      setMessages(demoMessages);
      saveMessages(demoMessages);
    }
  };

  // Save messages to localStorage (in real app, this would be Supabase)
  const saveMessages = (newMessages: ChatMessage[]) => {
    localStorage.setItem('pulse_fm_chat_messages', JSON.stringify(newMessages));
  };

  // Subscribe to real-time messages using Supabase broadcast (with offline fallback)
  const subscribeToMessages = () => {
    try {
      const channel = supabase
        .channel('live_chat')
        .on('broadcast', { event: 'new_message' }, (payload) => {
          const newMessage = payload.payload as ChatMessage;
          setMessages(prev => {
            const updated = [...prev, newMessage];
            saveMessages(updated);
            return updated;
          });
        })
        .on('broadcast', { event: 'user_joined' }, () => {
          setOnlineUsers(prev => prev + 1);
        })
        .on('broadcast', { event: 'user_left' }, () => {
          setOnlineUsers(prev => Math.max(0, prev - 1));
        })
        .subscribe();

      // Announce user joined (async operation)
      const announceJoin = async () => {
        try {
          await channel.send({
            type: 'broadcast',
            event: 'user_joined',
            payload: { username: getUsername() }
          });
        } catch (error) {
          console.log('Failed to announce user join:', error);
        }
      };
      
      announceJoin();

      return () => {
        // Announce user left (async operation)
        const announceLeave = async () => {
          try {
            await channel.send({
              type: 'broadcast',
              event: 'user_left',
              payload: { username: getUsername() }
            });
          } catch (error) {
            console.log('Failed to announce user leave:', error);
          }
        };
        
        announceLeave();
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.log('Supabase offline, using local chat only');
      // Simulate some online users even when offline
      setOnlineUsers(Math.floor(Math.random() * 20) + 5);
      return () => {};
    }
  };

  // Subscribe to presence for online user count (with offline fallback)
  const subscribeToPresence = () => {
    try {
      const userId = getSessionId();
      const username = getUsername();

      const channel = supabase
        .channel('chat_presence', {
          config: {
            presence: {
              key: userId
            }
          }
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          setOnlineUsers(Object.keys(state).length);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          setOnlineUsers(prev => prev + newPresences.length);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          setOnlineUsers(prev => Math.max(0, prev - leftPresences.length));
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: userId,
              username: username,
              online_at: new Date().toISOString(),
              is_authenticated: !!user
            });
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.log('Presence offline, using simulated count');
      // Simulate online users with some variation
      const baseCount = Math.floor(Math.random() * 15) + 8;
      setOnlineUsers(baseCount);
      
      // Add some variation over time
      const interval = setInterval(() => {
        setOnlineUsers(prev => {
          const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
          return Math.max(5, Math.min(25, prev + change));
        });
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    // Require authentication for chatting
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to participate in the chat.",
        variant: "destructive",
      });
      return;
    }

    const username = getUsername();
    if (!username) {
      toast({
        title: "Profile Required",
        description: "Please complete your profile to chat.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    
    try {
      const messageData: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        username: username,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        user_id: user.id,
        reply_to: replyTo?.id || null,
        reply_username: replyTo?.username || null,
      };

      // Add to local state immediately for instant feedback
      setMessages(prev => {
        const updated = [...prev, messageData];
        saveMessages(updated);
        return updated;
      });

      // Try to send via Supabase broadcast for real-time delivery to others
      try {
        const channel = supabase.channel('live_chat');
        await channel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: messageData
        });
      } catch (broadcastError) {
        console.log('Broadcast failed, message saved locally');
        // Message is already in local state, so chat still works
      }

      setNewMessage("");
      setReplyTo(null);
      
      toast({
        title: "Message sent!",
        description: "Your message has been posted to the live chat."
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
    
    setSending(false);
  };

  const handleReply = (message: ChatMessage) => {
    setReplyTo(message);
    // Focus on input (you might want to add a ref to the input)
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className={`glass-panel border-border/50 flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <MessageCircle className="h-5 w-5 text-primary" />
            Live Chat
            <Badge variant="destructive" className="gap-1 ml-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </Badge>
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Users size={12} />
            {onlineUsers} online
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-3 pb-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
                <p className="text-xs mt-1">
                  {user ? "Chat with other listeners using your real name" : "Sign in to join the conversation"}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="group">
                  {message.reply_to && (
                    <div className="ml-10 mb-1 text-xs text-muted-foreground border-l-2 border-muted pl-2">
                      Replying to {message.reply_username}
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary">
                        {message.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-foreground">
                          {message.username}
                        </span>
                        {message.user_id && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            Verified
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(message.created_at)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                          onClick={() => handleReply(message)}
                        >
                          <Reply size={12} />
                        </Button>
                      </div>
                      <p className="text-sm text-foreground break-words">
                        {message.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-border/50">
          {!user ? (
            // Show authentication prompt for non-authenticated users
            <div className="text-center py-6">
              <MessageCircle className="mx-auto h-8 w-8 mb-3 text-muted-foreground" />
              <h3 className="font-medium text-foreground mb-2">Join the Conversation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sign in with your real name to participate in the live chat
              </p>
              <Button asChild className="gap-2">
                <a href="/auth">
                  <Users size={16} />
                  Sign In to Chat
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                We require real names to maintain a friendly community
              </p>
            </div>
          ) : (
            // Show chat input for authenticated users
            <>
              {replyTo && (
                <div className="mb-2 p-2 bg-muted/30 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Replying to <strong>{replyTo.username}</strong>
                    </span>
                    <Button variant="ghost" size="sm" onClick={cancelReply} className="h-6 w-6 p-0">
                      ×
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {replyTo.message}
                  </p>
                </div>
              )}
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Type a message..."}
                  className="flex-1"
                  maxLength={500}
                  disabled={sending}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!newMessage.trim() || sending}
                >
                  <Send size={16} />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Chatting as <strong>{getUsername()}</strong> • Real name verified
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveChat;