import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Send,
  Sparkles,
  ChevronRight,
  MessageSquare,
  X,
  Container,
  Receipt,
  Wallet,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "general" | "containers" | "bills" | "pda";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CategoryConfig {
  label: string;
  icon: React.ElementType;
  greeting: string;
  quickQueries: { label: string; query: string }[];
}

const CATEGORIES: Record<Category, CategoryConfig> = {
  general: {
    label: "General",
    icon: Globe,
    greeting:
      "Hello! I'm your cTrack Assistant. I have a full overview of your yard status, containers, billing, and PDA. What would you like to know?",
    quickQueries: [
      {
        label: "Full Account Summary",
        query: "Give me a complete summary of my account status",
      },
      { label: "Payment Help", query: "Help me understand my payment options" },
    ],
  },
  containers: {
    label: "Containers",
    icon: Container,
    greeting:
      "I'm ready to answer any questions about your containers and cargo requests — statuses, gate movements, stuffing/destuffing, and more.",
    quickQueries: [
      {
        label: "Container Statuses",
        query: "List all my containers and their current statuses",
      },
      {
        label: "Active Requests",
        query: "Show me all my active stuffing and destuffing requests",
      },
    ],
  },
  bills: {
    label: "Bills",
    icon: Receipt,
    greeting:
      "I have full access to your billing records. Ask me about overdue bills, payment history, line item charges, or total outstanding amounts.",
    quickQueries: [
      { label: "Overdue Bills", query: "Which of my bills are overdue?" },
      {
        label: "Unpaid Summary",
        query: "What is my total unpaid bill amount?",
      },
    ],
  },
  pda: {
    label: "PDA Wallet",
    icon: Wallet,
    greeting:
      "I have full access to your PDA wallet. Ask me about your balance, recent recharges, deductions, or any specific transaction.",
    quickQueries: [
      { label: "Current Balance", query: "What is my current PDA balance?" },
      {
        label: "Recent Transactions",
        query: "Show me my last 10 PDA transactions",
      },
    ],
  },
};

const makeGreeting = (category: Category) => ({
  id: "greeting",
  role: "assistant" as const,
  content: CATEGORIES[category].greeting,
});

export const CustomerAIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<Category>("general");
  const [messages, setMessages] = useState<Message[]>([
    makeGreeting("general"),
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleCategoryChange = (newCat: Category) => {
    if (newCat === category) return;
    setCategory(newCat);
    setMessages([makeGreeting(newCat)]);
    setInput("");
  };

  const sendMessage = async (text: string, overrideCategory?: Category) => {
    if (!text.trim() || isLoading) return;

    const activeCategory = overrideCategory || category;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const botId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: botId, role: "assistant", content: "" },
    ]);

    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${baseUrl}/support/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          category: activeCategory,
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("0:")) {
            try {
              const content = JSON.parse(trimmedLine.slice(2).trim());
              fullContent += content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botId ? { ...m, content: fullContent } : m,
                ),
              );
            } catch (e) {
              console.error("Failed to parse AI data line:", trimmedLine, e);
            }
          } else if (trimmedLine.startsWith("3:")) {
            try {
              const errorData = JSON.parse(trimmedLine.slice(2).trim());
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botId
                    ? {
                        ...m,
                        content: `⚠ ${errorData.message || "The service is currently unavailable."}`,
                      }
                    : m,
                ),
              );
            } catch {
              /* skip malformed error */
            }
          }
        }
      }

      if (buffer.trim().startsWith("0:")) {
        try {
          const parsed = JSON.parse(buffer.slice(2).trim());
          fullContent += parsed;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId ? { ...m, content: fullContent } : m,
            ),
          );
        } catch {
          /* final fragment ignored */
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? {
                ...m,
                content: "Sorry, I encountered an error. Please try again.",
              }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const CategoryPill = ({ cat }: { cat: Category }) => {
    const { label, icon: Icon } = CATEGORIES[cat];
    const isActive = category === cat;
    return (
      <button
        onClick={() => handleCategoryChange(cat)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border",
          isActive
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="h-3 w-3" />
        {label}
      </button>
    );
  };

  const QuickInquiry = ({ label, query }: { label: string; query: string }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(true);
        sendMessage(query);
      }}
      className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary transition-colors text-left w-full group"
    >
      <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20">
        <MessageSquare className="h-3.5 w-3.5" />
      </div>
      <span className="text-[11px] font-medium">{label}</span>
      <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
    </button>
  );

  // ── Collapsed card ──────────────────────────────────
  if (!isOpen) {
    const { quickQueries } = CATEGORIES[category];
    return (
      <Card
        className="overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all group shadow-sm hover:shadow-md cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-card">
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
            Powered by Groq AI — Select a category and get instant insights on
            your containers, bills, or PDA.
          </p>
          {/* Category pills in collapsed view */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(CATEGORIES) as Category[]).map((cat) => (
              <CategoryPill key={cat} cat={cat} />
            ))}
          </div>
          <div className="grid gap-2">
            {quickQueries.map((q) => (
              <QuickInquiry key={q.label} label={q.label} query={q.query} />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs font-bold gap-2 text-primary hover:bg-primary/5"
          >
            Open Chat Interface <MessageSquare className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Open chat ───────────────────────────────────────
  return (
    <Card className="flex flex-col h-[480px] border-primary/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <CardHeader className="pb-2 border-b bg-primary text-primary-foreground shrink-0 rounded-t-xl">
        <CardTitle className="text-base font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            cTrack AI Assistant
            <span className="text-[10px] font-normal opacity-70 bg-white/20 px-1.5 py-0.5 rounded-full">
              Groq
            </span>
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
        {/* Category selector pills */}
        <div className="flex gap-1.5 flex-wrap pt-1">
          {(Object.keys(CATEGORIES) as Category[]).map((cat) => (
            <CategoryPill key={cat} cat={cat} />
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-muted/30">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-2xl p-3 text-xs shadow-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                  : "bg-card text-foreground mr-auto border rounded-tl-none whitespace-pre-wrap",
              )}
            >
              {m.content ||
                (m.role === "assistant" && isLoading && (
                  <span className="flex gap-1">
                    <span className="animate-bounce inline-block w-1 h-1 bg-muted-foreground rounded-full"></span>
                    <span className="animate-bounce [animation-delay:0.2s] inline-block w-1 h-1 bg-muted-foreground rounded-full"></span>
                    <span className="animate-bounce [animation-delay:0.4s] inline-block w-1 h-1 bg-muted-foreground rounded-full"></span>
                  </span>
                ))}
            </div>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-card border-t shrink-0"
        >
          <div className="flex gap-2">
            <Input
              placeholder={`Ask about ${CATEGORIES[category].label.toLowerCase()}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="text-xs h-9"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
