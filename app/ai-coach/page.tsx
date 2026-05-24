"use client";

import React, { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { Bot, Send, User } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useDailyLog } from "@/hooks/useDailyLog";

export default function AICoachPage() {
  const breadcrumbs = [{ label: "AI Coach" }];
  const [input, setInput] = useState("");
  const { profile } = useProfile();
  const { log } = useDailyLog();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        `Hello! I am your FitCore AI Coach. Based on your live profile (${profile?.height_cm ?? "--"}cm, ${profile?.weight_kg ?? "--"}kg), I'm monitoring your target calories, protein, and daily trend. How is your energy today?`,
    },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            `Got it! Your current log shows ${log?.steps ?? 0} steps, ${log?.water_ml ?? 0}ml of water, and a live weight trend of ${profile?.weight_kg ?? "--"}kg. Keep protein high, stay within your target calories, and let me know if you want me to adjust your macros or workout volume.`,
        },
      ]);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Fitness Coach"
        subtitle="Your personalized AI nutritionist and coach, customized for intermediate body re-composition."
        breadcrumbs={breadcrumbs}
      />

      <GlassCard className="max-w-3xl w-full mx-auto flex flex-col h-[500px]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/5 mb-4">
          <div className="w-10 h-10 rounded-full bg-neonPurple/15 flex items-center justify-center text-neonPurple">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">FitCore Coach</h3>
            <span className="text-xs text-white/40">Powered by advanced generative models</span>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === "user" ? "self-end flex-row-reverse" : "self-start"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  msg.role === "user"
                    ? "bg-neonCyan/15 text-neonCyan"
                    : "bg-neonPurple/15 text-neonPurple"
                }`}
              >
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-neonCyan/10 text-white border border-neonCyan/10 rounded-tr-none"
                    : "bg-white/[0.02] text-white/90 border border-white/5 rounded-tl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="flex gap-2 pt-4 border-t border-white/5">
          <input
            type="text"
            placeholder="Ask your coach anything (e.g. 'Can I swap carbs for fats today?')"
            className="flex-1 bg-white/[0.02] border border-white/5 focus:border-neonPurple/50 rounded-xl px-4 py-2 text-sm text-white focus:outline-none transition-colors"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <NeonButton variant="gradient" className="px-4 py-2" onClick={handleSend}>
            <Send className="w-4 h-4" />
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}
