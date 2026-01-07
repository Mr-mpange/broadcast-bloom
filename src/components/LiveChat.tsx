import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  message_type: string;
  created_at: string;
  user_id: string | null;
}

interface ChatRoom {
  id: string;
  name: string;
  show_id: string | null;
  is_active: boolean;
}

interface LiveChatProps {
  showId?: string;
  className?: string;
}

const LiveChat = ({ showId, className = "" }: LiveChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showId) {
      fetchChatRoom();
    }
  }, [showId]);

  useEffect(() => {
    if (chatRoom) {
      fetchMessages();
      subscribeToMessages();
      subscribeToPresence();
    }
  }, [chatRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatRoom = async () => {
    if (!showId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('show_id', showId)
      .eq('is_active', true)
      .single();

    if (!error && data) {
      setChatRoom(data);
    } else if (error && error.code === 'PGRST116') {
      // No chat room exists, create one
      await createChatRoom();
    }
    setLoading(false);
  };

  const createChatRoom = async () => {
    if (!showId) return;

    const { data: showData } = await supabase
      .from('shows')
      .select('name')
      .eq('id', showId)
      .single();

    if (showData) {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          show_id: showId,
          name: `${showData.name} Chat`,
          description: `Chat room for ${showData.name} listeners`,
          is_active: true
        })
        .select()
        .single();

      if (!error && data) {
        setChatRoom(data);
      }
    }
  };

  const fetchMessages = async () => {
    if (!chatRoom) return;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', chatRoom.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) {
      setMessages(data);
    }
  };

  const subscribeToMessages = () => {
    if (!chatRoom) return;

    const channel = supabase
      .channel(`chat_room_${chatRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${chatRoom.id}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          if (!newMessage.is_deleted) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${chatRoom.id}`
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            ).filter(msg => !msg.is_deleted)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToPresence = () => {
    if (!chatRoom) return;

    const userId = user?.id || `anonymous_${Math.random().toString(36).substr(2, 9)}`;
    const username = user?.user_metadata?.display_name || 'Anonymous Listener';

    const channel = supabase
      .channel(`presence_${chatRoom.id}`, {
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
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => prev + newPresences.length);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
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
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatRoom || sending) return;

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to send messages in the chat.",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: chatRoom.id,
          user_id: user.id,
          username: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous',
          message: newMessage.trim(),
          message_type: 'text'
        });

      if (error) {
        console.error('Chat message error:', error);
        toast({
          title: "Failed to send message",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setNewMessage("");
        toast({
          title: "Message sent!",
          description: "Your message has been posted to the chat."
        });
      }
    } catch (err: any) {
      console.error('Unexpected chat error:', err);
      toast({
        title: "Failed to send message",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
    
    setSending(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Card className={`glass-panel border-border/50 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">Loading chat...</div>
        </CardContent>
      </Card>
    );
  }

  if (!chatRoom) {
    return (
      <Card className={`glass-panel border-border/50 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            Chat not available for this show
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-panel border-border/50 flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <MessageCircle className="h-5 w-5 text-primary" />
            Live Chat
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Users size={12} />
            {onlineUsers}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-3 pb-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="group">
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
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(message.created_at)}
                        </span>
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
        
        {user ? (
          <div className="p-4 border-t border-border/50">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
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
          </div>
        ) : (
          <div className="p-4 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Join the conversation! Sign in to participate in the chat.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/auth">Sign In to Chat</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveChat;