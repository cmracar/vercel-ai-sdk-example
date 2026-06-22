'use client';

import { useChat } from '@ai-sdk/react';
import { isToolUIPart, getToolName, type UIMessage } from 'ai';
import { useState } from 'react';

export default function ChatComponent() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-screen p-6 justify-between bg-slate-50">
      {/* Mesaj Akış Alanı */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
        {messages.length === 0 && (
          <p className="text-center text-slate-400 mt-10">
            Vercel AI SDK dünyasına hoş geldin! Örn: &quot;İstanbul ve İzmir&apos;i
            hava ve nüfus açısından karşılaştır&quot;
          </p>
        )}

        {messages.map((m) =>
          m.role === 'user' ? (
            <UserBubble key={m.id} message={m} />
          ) : (
            <AssistantTrace key={m.id} message={m} />
          ),
        )}

        {isLoading && (
          <div className="text-left text-xs text-slate-400 animate-pulse">
            Asistan çalışıyor…
          </div>
        )}
      </div>

      {/* Giriş Formu */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
          value={input}
          placeholder="Yapay zekaya bir şeyler sor…"
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
          disabled={isLoading || !input.trim()}
        >
          Gönder
        </button>
      </form>
    </div>
  );
}

/* --- Kullanıcı mesajı: düz baloncuk --- */
function UserBubble({ message }: { message: UIMessage }) {
  const text = message.parts
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join('');
  return (
    <div className="flex flex-col p-3 rounded-lg max-w-[80%] bg-blue-600 text-white ml-auto">
      <span className="text-xs font-semibold mb-1 opacity-75">Sen</span>
      <p className="whitespace-pre-wrap text-sm">{text}</p>
    </div>
  );
}

/* --- Asistan mesajı: agentic adım çizelgesi (step timeline) --- */
function AssistantTrace({ message }: { message: UIMessage }) {
  let step = 0;

  return (
    <div className="flex flex-col p-3 rounded-lg max-w-[90%] bg-slate-100 text-slate-800 mr-auto w-full">
      <span className="text-xs font-semibold mb-2 opacity-75">Asistan</span>

      <div className="flex flex-col gap-2">
        {message.parts.map((part, i) => {
          // 1) Her ajan adımının sınırı → numaralı adım rozeti
          if (part.type === 'step-start') {
            step += 1;
            return step > 1 ? (
              <div key={i} className="flex items-center gap-2 my-1">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 rounded-full px-2 py-0.5">
                  ADIM {step}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            ) : null;
          }

          // 2) Modelin düşünme izi (destekleyen modellerde)
          if (part.type === 'reasoning') {
            return (
              <details key={i} className="text-xs">
                <summary className="cursor-pointer text-slate-400">
                  💭 Düşünme süreci
                </summary>
                <p className="whitespace-pre-wrap text-slate-500 mt-1 pl-4">
                  {part.text}
                </p>
              </details>
            );
          }

          // 3) Araç çağrıları → katlanabilir accordion
          if (isToolUIPart(part)) {
            return <ToolCall key={part.toolCallId} part={part} />;
          }

          // 4) Düz metin → nihai cevap
          if (part.type === 'text') {
            return (
              <p key={i} className="whitespace-pre-wrap text-sm">
                {part.text}
              </p>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

/* --- Tek bir araç çağrısı: durum rozeti + girdi/çıktı accordion --- */
function ToolCall({ part }: { part: Extract<UIMessage['parts'][number], { toolCallId: string }> }) {
  const name = getToolName(part);

  const statusMap: Record<string, { icon: string; label: string; pulse: boolean }> = {
    'input-streaming': { icon: '⏳', label: 'argümanlar hazırlanıyor', pulse: true },
    'input-available': { icon: '🔧', label: 'çalışıyor', pulse: true },
    'output-available': { icon: '✅', label: 'tamamlandı', pulse: false },
    'output-error': { icon: '❌', label: 'hata', pulse: false },
  };
  const status = statusMap[part.state] ?? { icon: '•', label: part.state, pulse: false };

  return (
    <details className="border border-slate-200 rounded-lg bg-white text-xs" open={part.state !== 'output-available'}>
      <summary
        className={`cursor-pointer select-none px-3 py-2 font-medium flex items-center gap-2 ${
          status.pulse ? 'animate-pulse' : ''
        }`}
      >
        <span>{status.icon}</span>
        <span className="font-mono text-blue-700">{name}</span>
        <span className="text-slate-400">— {status.label}</span>
      </summary>

      <div className="px-3 pb-3 pt-1 space-y-2">
        {'input' in part && part.input != null && (
          <div>
            <div className="text-slate-400 mb-1">Girdi</div>
            <pre className="bg-slate-50 rounded p-2 overflow-x-auto text-slate-700">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          </div>
        )}

        {part.state === 'output-available' && (
          <div>
            <div className="text-slate-400 mb-1">Çıktı</div>
            <pre className="bg-emerald-50 rounded p-2 overflow-x-auto text-emerald-800">
              {JSON.stringify(part.output, null, 2)}
            </pre>
          </div>
        )}

        {part.state === 'output-error' && (
          <p className="text-red-500">{part.errorText}</p>
        )}
      </div>
    </details>
  );
}
