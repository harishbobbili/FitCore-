"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Trash2, BrainCircuit, RefreshCw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore, ChatMessage } from "@/store/useChatStore";
import NeonButton from "@/components/ui/NeonButton";
import { cn } from "@/lib/utils";

const QUICK_REPLIES = [
  "What should I eat post-workout?",
  "Is my deficit too aggressive?",
  "Suggest an abs finisher"
];

export default function ChatbotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorOccurred, setErrorOccurred] = useState(false);
  
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const clearHistory = useChatStore((state) => state.clearHistory);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAssistantMsgRef = useRef<string>("");
  const [streamingText, setStreamingText] = useState("");

  // Scroll to bottom whenever messages or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    
    setErrorOccurred(false);
    // 1. Add user message
    const userMsg: ChatMessage = { role: "user", content: text };
    addMessage(userMsg);
    setInputValue("");
    setIsStreaming(true);
    setStreamingText("");
    currentAssistantMsgRef.current = "";

    try {
      // Get all previous messages + current user message
      const conversationHistory = [...messages, userMsg];
      
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationHistory })
      });

      if (!response.ok) {
        throw new Error("Failed to connect to AI Coach");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("ReadableStream not supported");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Split by double newline to handle SSE chunks
        const parts = buffer.split("\n\n");
        // Keep the last part in buffer if it's incomplete
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith("data: ")) {
              const dataStr = cleanLine.substring(6).trim();
              if (dataStr === "[DONE]") {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                const textPart = parsed.delta?.text || "";
                if (textPart) {
                  currentAssistantMsgRef.current += textPart;
                  setStreamingText(currentAssistantMsgRef.current);
                }
              } catch {
                // Incomplete JSON chunk, skip
              }
            }
          }
        }
      }

      // Finish streaming, commit to store
      if (currentAssistantMsgRef.current) {
        addMessage({ role: "assistant", content: currentAssistantMsgRef.current });
      }
      setStreamingText("");

    } catch (err) {
      console.error("Chat error:", err);
      setErrorOccurred(true);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  return (
    <>
      {/* FLOATING TRIGGER BUBBLE */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-brandPurple to-brandCyan flex items-center justify-center text-white shadow-[0_0_20px_rgba(108,99,255,0.4)] hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] cursor-pointer group transition-all"
        >
          <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neonCyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-neonCyan"></span>
          </span>
        </motion.button>
      </div>

      {/* CHAT DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
            {/* Backdrop (dismissible) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-brandBg/95 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col pointer-events-auto backdrop-blur-xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 bg-brandCard/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-neonPurple/10 text-neonPurple">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                      FitCore AI Coach <Sparkles className="w-3.5 h-3.5 text-neonCyan animate-pulse" />
                    </h3>
                    <p className="text-[10px] text-white/40 font-medium">In-memory Session Chat</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={clearHistory}
                    title="Clear history"
                    className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/10 text-white/40 hover:text-rose-400 border border-transparent hover:border-rose-500/20 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white cursor-pointer transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed border",
                      msg.role === "user"
                        ? "self-end bg-gradient-to-tr from-brandPurple/20 to-brandPurple/10 border-brandPurple/30 text-white"
                        : "self-start bg-white/[0.02] border-white/5 text-white/95"
                    )}
                  >
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-white/30 mb-1">
                      {msg.role === "user" ? "You" : "FitCore AI Coach"}
                    </span>
                    <p>{msg.content}</p>
                  </div>
                ))}

                {/* Streaming Assistant message */}
                {isStreaming && streamingText && (
                  <div className="self-start max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed bg-white/[0.02] border border-white/5 text-white/95">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-white/30 mb-1">
                      FitCore AI Coach
                    </span>
                    <p>{streamingText}</p>
                  </div>
                )}

                {/* Loading Shimmer State */}
                {isStreaming && !streamingText && (
                  <div className="self-start max-w-[85%] rounded-2xl p-3.5 text-xs bg-white/[0.02] border border-white/5 text-white/40 flex flex-col gap-2 w-2/3">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-white/30">
                      Coach is typing...
                    </span>
                    {/* Animated Shimmer */}
                    <div className="h-3 bg-white/5 rounded w-full relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_1.5s_infinite]" />
                    </div>
                    <div className="h-3 bg-white/5 rounded w-5/6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_1.5s_infinite]" />
                    </div>
                  </div>
                )}

                {/* Error & Retry state */}
                {errorOccurred && (
                  <div className="self-start max-w-[85%] rounded-2xl p-4 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex flex-col gap-2">
                    <span>Failed to stream response. Please check your connection.</span>
                    <NeonButton
                      variant="ghost"
                      onClick={() => {
                        // Find last user message to retry
                        const userMsgs = messages.filter(m => m.role === "user");
                        if (userMsgs.length > 0) {
                          handleSendMessage(userMsgs[userMsgs.length - 1].content);
                        }
                      }}
                      className="py-1 px-3 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-[10px] w-fit flex items-center gap-1.5 self-end"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry Call
                    </NeonButton>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies & Inputs */}
              <div className="p-4 border-t border-white/5 bg-brandCard/20 flex flex-col gap-3 shrink-0">
                {/* Quick reply chips */}
                {!isStreaming && (
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => handleQuickReply(reply)}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/5 hover:border-white/15 text-white/50 hover:text-white/80 cursor-pointer transition-all"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* Inputs Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(inputValue);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about diet, compound overloading..."
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neonPurple/50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isStreaming || !inputValue.trim()}
                    className="p-2.5 rounded-xl bg-gradient-to-tr from-brandPurple to-brandCyan text-white hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition-opacity cursor-pointer flex items-center justify-center shadow-glass"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
