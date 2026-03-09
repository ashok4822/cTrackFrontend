import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Bot,
    Send,
    Sparkles,
    ChevronRight,
    MessageSquare,
    BarChart3,
    HelpCircle,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface CustomerAIChatbotProps {
    kpiData: any;
}

export const CustomerAIChatbot: React.FC<CustomerAIChatbotProps> = ({ kpiData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm your cTrack Assistant powered by Groq AI. I can help you with yard operations, bill analysis, and general support. How can I assist you today?"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        // Placeholder for streaming bot response
        const botId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botId, role: 'assistant', content: '' }]);

        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
            const token = localStorage.getItem("accessToken");

            const response = await fetch(`${baseUrl}/support/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
                body: JSON.stringify({
                    messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    kpiData
                })
            });

            if (!response.ok) throw new Error('AI request failed');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error('No reader');

            let fullContent = '';
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                console.log('--- Incoming Stream Buffer ---', buffer);
                const lines = buffer.split(/\r?\n/);

                // Keep the last (potentially partial) line in the buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('0:')) {
                        try {
                            const content = JSON.parse(trimmedLine.slice(2).trim());
                            console.log('--- Parsed Chunk Content ---', content);
                            fullContent += content;
                            setMessages(prev =>
                                prev.map(m => m.id === botId ? { ...m, content: fullContent } : m)
                            );
                        } catch (e) {
                            console.error('Failed to parse AI data line:', trimmedLine, e);
                        }
                    } else if (trimmedLine.startsWith('3:')) {
                        // Protocol error signal
                        try {
                            const errorData = JSON.parse(trimmedLine.slice(2).trim());
                            console.error('AI Stream Error Chunk:', errorData);
                            setMessages(prev =>
                                prev.map(m => m.id === botId ? { ...m, content: `AI Error: ${errorData.message || 'The service is currently unavailable.'}` } : m)
                            );
                        } catch { /* skip malformed error */ }
                    } else if (trimmedLine) {
                        console.log('--- Received system/info line ---', trimmedLine);
                    }
                }
            }

            // Handle any remaining content in buffer if it contains a valid signal
            if (buffer.trim().startsWith('0:')) {
                try {
                    const parsed = JSON.parse(buffer.slice(2).trim());
                    fullContent += parsed;
                    setMessages(prev =>
                        prev.map(m => m.id === botId ? { ...m, content: fullContent } : m)
                    );
                } catch (e) { /* final fragment ignored if invalid */ }
            }
        } catch (error) {
            setMessages(prev =>
                prev.map(m => m.id === botId ? { ...m, content: 'Sorry, I encountered an error. Please try again.' } : m)
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const QuickInquiry = ({ icon: Icon, label, query }: { icon: any, label: string, query: string }) => (
        <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(true); sendMessage(query); }}
            className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary transition-colors text-left w-full group"
        >
            <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20">
                <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-medium">{label}</span>
            <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
        </button>
    );

    if (!isOpen) {
        return (
            <Card className="overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all group shadow-sm hover:shadow-md cursor-pointer" onClick={() => setIsOpen(true)}>
                <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-white">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Bot className="h-5 w-5 text-primary" />
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            </div>
                            cTrack AI Assistant
                        </div>
                        <Sparkles className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Powered by Groq AI — Get instant insights on your yard status, billing, and operations.
                    </p>
                    <div className="grid gap-2">
                        <QuickInquiry icon={BarChart3} label="Analyze Yard Status" query="Give me a complete summary of my yard status" />
                        <QuickInquiry icon={HelpCircle} label="Payment Support" query="Help me with my unpaid bills and payment options" />
                    </div>
                    <Button variant="ghost" size="sm" className="w-full text-xs font-bold gap-2 text-primary hover:bg-primary/5">
                        Open Chat Interface <MessageSquare className="h-3 w-3" />
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col h-[400px] border-primary/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader className="pb-3 border-b bg-primary text-primary-foreground shrink-0 rounded-t-xl">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        cTrack AI Assistant
                        <span className="text-[10px] font-normal opacity-70 bg-white/20 px-1.5 py-0.5 rounded-full">Groq</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={cn(
                                "max-w-[85%] rounded-2xl p-3 text-xs shadow-sm",
                                m.role === 'user'
                                    ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                                    : "bg-white text-foreground mr-auto border rounded-tl-none whitespace-pre-wrap"
                            )}
                        >
                            {m.content || (m.role === 'assistant' && isLoading && (
                                <span className="flex gap-1">
                                    <span className="animate-bounce inline-block w-1 h-1 bg-muted-foreground rounded-full"></span>
                                    <span className="animate-bounce [animation-delay:0.2s] inline-block w-1 h-1 bg-muted-foreground rounded-full"></span>
                                    <span className="animate-bounce [animation-delay:0.4s] inline-block w-1 h-1 bg-muted-foreground rounded-full"></span>
                                </span>
                            ))}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="p-3 bg-white border-t shrink-0">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ask anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="text-xs h-9"
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={isLoading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};
