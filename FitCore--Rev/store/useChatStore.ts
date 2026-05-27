import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      role: "assistant",
      content: "Hey there! I am your FitCore AI Coach. Ask me anything about your Indian meal slots, chest/back workouts, abs transformation schedule, or generic recovery tips!",
    },
  ],
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
  clearHistory: () =>
    set({
      messages: [
        {
          role: "assistant",
          content: "Chat history cleared. How can I help you today, champion?",
        },
      ],
    }),
}));

export default useChatStore;
