import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Pin, Trash2, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SEOHead } from '@/components/SEOHead';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Message {
  id: number;
  userName: string;
  message: string;
  isPinned: boolean;
  createdAt: string;
}

export default function GroupChat() {
  const params = useParams<{ groupId: string }>();
  const groupCode = params.groupId || '';
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [versePickerOpen, setVersePickerOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedVerse, setSelectedVerse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const stored = JSON.parse(localStorage.getItem(`group_${groupCode}`) || '{}');
  const userEntry = (() => { try { const groups = JSON.parse(localStorage.getItem('userGroups') || '[]'); return groups.find((g: any) => g.groupId === groupCode) || null; } catch { return null; } })();
  const userName = userEntry?.userName || stored.userName || '';
  const isLeader = userEntry?.role === 'admin' || stored.isLeader || false;
  const leaderKey = userEntry?.memberKey || stored.memberKey || '';

  const { data: allBooks } = useQuery({ queryKey: ['books'], queryFn: api.books.getAll });

  const selectedBookData = allBooks?.find((b: any) => b.name === selectedBook);

  const { data: verses } = useQuery({
    queryKey: ['verses', selectedBookData?.id, parseInt(selectedChapter)],
    queryFn: () => api.verses.getByBook(selectedBookData!.id, parseInt(selectedChapter)),
    enabled: !!selectedBookData && !!selectedChapter,
  });

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupCode}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch {} finally {
      setLoading(false);
    }
  }, [groupCode]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async (text?: string) => {
    const msg = text || newMessage.trim();
    if (!msg) return;
    setSending(true);
    try {
      const res = await fetch(`/api/groups/${groupCode}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, message: msg }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setNewMessage('');
      fetchMessages();
    } catch (err: any) {
      toast.error(err.message || 'فشل الإرسال');
    } finally {
      setSending(false);
    }
  };

  const pinMessage = async (messageId: number) => {
    try {
      await fetch(`/api/groups/${groupCode}/messages/${messageId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderKey }),
      });
      fetchMessages();
    } catch {
      toast.error('فشل التثبيت');
    }
  };

  const deleteMessage = async (messageId: number) => {
    try {
      await fetch(`/api/groups/${groupCode}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderKey }),
      });
      fetchMessages();
    } catch {
      toast.error('فشل الحذف');
    }
  };

  const sendVerse = () => {
    const verse = verses?.find((v: any) => v.verse === parseInt(selectedVerse));
    if (verse) {
      const text = `📖 ${selectedBook} ${selectedChapter}:${selectedVerse}\n${verse.text}`;
      sendMessage(text);
      setVersePickerOpen(false);
      setSelectedBook('');
      setSelectedChapter('');
      setSelectedVerse('');
    }
  };

  const pinnedMessages = messages.filter(m => m.isPinned);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <SEOHead />
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">شات المجموعة</h1>
        <Badge variant="secondary">{groupCode}</Badge>
        <div className="mr-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/group/${groupCode}`)} data-testid="button-back-group">
            <ArrowRight className="w-4 h-4 ml-1" />
            رجوع
          </Button>
        </div>
      </div>

      {pinnedMessages.length > 0 && (
        <div className="mb-3 space-y-1">
          {pinnedMessages.map(m => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
              <Pin className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="font-semibold text-amber-700 dark:text-amber-400">{m.userName}:</span>
              <span className="text-foreground truncate">{m.message}</span>
            </div>
          ))}
        </div>
      )}

      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto space-y-2 mb-4 px-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">لا توجد رسائل بعد. ابدأ المحادثة!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.userName === userName;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[80%] rounded-xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'} ${m.isPinned ? 'ring-2 ring-amber-400' : ''}`}>
                  {!isMe && <p className="text-xs font-semibold mb-1 opacity-70">{m.userName}</p>}
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-xs opacity-50">
                      {new Date(m.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isLeader && (
                      <div className="flex gap-1">
                        {!m.isPinned && (
                          <button onClick={() => pinMessage(m.id)} className="opacity-50 hover:opacity-100">
                            <Pin className="w-3 h-3" />
                          </button>
                        )}
                        <button onClick={() => deleteMessage(m.id)} className="opacity-50 hover:opacity-100">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setVersePickerOpen(true)} data-testid="button-send-verse">
          <BookOpen className="w-5 h-5" />
        </Button>
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="اكتب رسالة..."
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          className="flex-1"
          data-testid="input-chat-message"
        />
        <Button size="icon" onClick={() => sendMessage()} disabled={sending || !newMessage.trim()} data-testid="button-send-message">
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={versePickerOpen} onOpenChange={setVersePickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إرسال آية</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <select value={selectedBook} onChange={e => { setSelectedBook(e.target.value); setSelectedChapter(''); setSelectedVerse(''); }} className="w-full border rounded-md p-2 bg-background text-foreground" data-testid="select-verse-book">
              <option value="">اختر السفر</option>
              {allBooks?.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
            {selectedBookData && (
              <select value={selectedChapter} onChange={e => { setSelectedChapter(e.target.value); setSelectedVerse(''); }} className="w-full border rounded-md p-2 bg-background text-foreground" data-testid="select-verse-chapter">
                <option value="">اختر الإصحاح</option>
                {Array.from({ length: selectedBookData.chaptersCount }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            )}
            {verses && verses.length > 0 && (
              <select value={selectedVerse} onChange={e => setSelectedVerse(e.target.value)} className="w-full border rounded-md p-2 bg-background text-foreground" data-testid="select-verse-number">
                <option value="">اختر الآية</option>
                {verses.map((v: any) => <option key={v.verse} value={v.verse}>{v.verse}</option>)}
              </select>
            )}
            <Button onClick={sendVerse} disabled={!selectedVerse} className="w-full" data-testid="button-confirm-send-verse">إرسال الآية</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
