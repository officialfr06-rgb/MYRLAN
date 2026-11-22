import React, { useState } from 'react';
import { X, Send, MessageCircle, ShieldCheck, User } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const CustomerSupportChat: React.FC = () => {
  const { chatMessages, sendChatMessage, isChatOpen, setIsChatOpen } = useShop();
  const [inputText, setInputText] = useState('');

  if (!isChatOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText, 'user');
    setInputText('');
  };

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:bottom-6 sm:right-6 z-50 sm:w-full sm:max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[min(520px,calc(100dvh-1.5rem))] animate-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div className="p-4 bg-blue-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center font-bold text-amber-300">
              👩‍⚕️
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full ring-2 ring-blue-900"></span>
          </div>
          <div>
            <h3 className="font-bold text-sm">Claire • Pharmacienne Conseil</h3>
            <p className="text-[10px] text-blue-300">En ligne • Répond en quelques secondes</p>
          </div>
        </div>
        <button
          onClick={() => setIsChatOpen(false)}
          className="p-1.5 text-blue-200 hover:text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        <div className="text-center py-2">
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-200/60 px-3 py-1 rounded-full">
            Échange sécurisé &amp; confidentiel
          </span>
        </div>

        {chatMessages.map(msg => (
          <div 
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-br-xs' 
                : 'bg-white text-gray-800 border border-gray-200/80 shadow-xs rounded-bl-xs'
            }`}>
              <div className="font-bold mb-0.5 text-[10px] opacity-80">
                {msg.sender === 'user' ? 'Vous' : 'Claire (Pharmacienne)'}
              </div>
              <p>{msg.text}</p>
              <div className="text-[9px] text-right mt-1 opacity-70">
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          placeholder="Posez votre question à notre pharmacien..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
