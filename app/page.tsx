'use client';

import { useChat } from '@ai-sdk/react';
import { isToolUIPart, getToolName, type UIMessage } from 'ai';
import { useState } from 'react';

type ToolUIPart = Extract<UIMessage['parts'][number], { toolCallId: string }>;

export default function Page() {
  const { messages, sendMessage, status, stop } = useChat();
  const [input, setInput] = useState('');

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800">
      <header className="px-6 py-3 border-b border-slate-200 bg-white">
        <h1 className="font-semibold">Vercel AI SDK · Agentic Chatbot</h1>
        <p className="text-xs text-slate-400">
          Solda sohbet, sağda ajan akışı. Örn: &quot;İstanbul ve İzmir&apos;i
          karşılaştır&quot;
        </p>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* ───────── SOL: Sohbet ───────── */}
        <section className="flex flex-col flex-1 min-w-0 border-r border-slate-200">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-center text-slate-400 mt-10 text-sm">
                Yapay zekaya bir şeyler sor 👋
              </p>
            )}

            {messages.map((m) =>
              m.role === 'user' ? (
                <UserBubble key={m.id} message={m} />
              ) : (
                <AssistantBubble key={m.id} message={m} />
              ),
            )}

            {status === 'submitted' && (
              <div className="text-xs text-slate-400 animate-pulse">
                Asistan düşünüyor…
              </div>
            )}
          </div>

          {/* Giriş + Gönder/Durdur */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 p-4 border-t border-slate-200 bg-white"
          >
            <input
              className="flex-1 p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
              value={input}
              placeholder="Yapay zekaya bir şeyler sor…"
              onChange={(e) => setInput(e.target.value)}
            />
            {isLoading ? (
              <button
                type="button"
                onClick={() => stop()}
                className="bg-red-500 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-red-600 transition-all flex items-center gap-2"
              >
                <span className="inline-block w-3 h-3 bg-white rounded-[2px]" />
                Durdur
              </button>
            ) : (
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                disabled={!input.trim()}
              >
                Gönder
              </button>
            )}
          </form>
        </section>

        {/* ───────── SAĞ: Ajan Akışı ───────── */}
        <aside className="w-full md:w-[400px] shrink-0 bg-slate-100/60 overflow-y-auto">
          <div className="px-4 py-3 border-b border-slate-200 sticky top-0 bg-slate-100/90 backdrop-blur">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              🛠️ Ajan Akışı
            </h2>
            <p className="text-[11px] text-slate-400">
              Araç çağrıları ve adımlar
            </p>
          </div>
          <AgentPanel messages={messages} loading={isLoading} />
        </aside>
      </div>
    </div>
  );
}

/* ───────── SOL taraf: kullanıcı baloncuğu ───────── */
function UserBubble({ message }: { message: UIMessage }) {
  return (
    <div className="flex flex-col p-3 rounded-lg max-w-[85%] bg-blue-600 text-white ml-auto">
      <span className="text-xs font-semibold mb-1 opacity-75">Sen</span>
      <p className="whitespace-pre-wrap text-sm">{textOf(message)}</p>
    </div>
  );
}

/* ───────── SOL taraf: asistan baloncuğu (metin + SDK notu) ───────── */
function AssistantBubble({ message }: { message: UIMessage }) {
  const text = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join('');

  return (
    <div className="flex flex-col p-3 rounded-lg max-w-[85%] bg-white border border-slate-200 mr-auto">
      <span className="text-xs font-semibold mb-1 opacity-75">Asistan</span>
      {text ? (
        <p className="whitespace-pre-wrap text-sm">{text}</p>
      ) : (
        <p className="text-xs text-slate-400 italic">
          (araçlar çalışıyor — sağ paneldeki akışa bakın)
        </p>
      )}
      <FeatureNote message={message} />
    </div>
  );
}

/* ───────── Her yanıtın altındaki "hangi SDK özelliği" notu ───────── */
function FeatureNote({ message }: { message: UIMessage }) {
  const hasTool = message.parts.some(isToolUIPart);
  const stepCount = message.parts.filter((p) => p.type === 'step-start').length;
  const hasReasoning = message.parts.some((p) => p.type === 'reasoning');

  const feats = ['streamText', 'useChat (streaming)'];
  if (hasTool) feats.push('Tool Calling + zod');
  if (stepCount > 1) feats.push('Multi-step · stopWhen/stepCountIs');
  if (hasReasoning) feats.push('Reasoning');

  return (
    <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] leading-relaxed text-slate-400">
      <span className="font-semibold text-slate-500">⚡ Vercel AI SDK:</span>{' '}
      {feats.join(' · ')}
    </div>
  );
}

/* ───────── SAĞ taraf: ajan akış paneli ───────── */
function AgentPanel({
  messages,
  loading,
}: {
  messages: UIMessage[];
  loading: boolean;
}) {
  if (messages.length === 0) {
    return (
      <div className="p-4 text-xs text-slate-400">
        Ajan boşta. Bir soru sorun — yanıt üretilirken ajanın o anki adımları
        burada canlı akacak.
      </div>
    );
  }

  // SADECE aktif/son turu göster — eski turlar burada birikmez
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const lastMsg = messages[messages.length - 1];
  const currentAssistant = lastMsg?.role === 'assistant' ? lastMsg : null;
  const question = lastUser ? textOf(lastUser) : '';

  return (
    <div className="p-3 space-y-3">
      {/* Canlı durum */}
      <div className="flex items-center gap-2 text-xs font-medium">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            loading ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
          }`}
        />
        <span className={loading ? 'text-emerald-600' : 'text-slate-400'}>
          {loading ? 'Ajan çalışıyor…' : 'Hazır'}
        </span>
      </div>

      {/* İstek (request) */}
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">
          İstek (request)
        </p>
        <p className="text-xs text-slate-700">{question || '—'}</p>
      </div>

      {/* Canlı döngü akışı */}
      {currentAssistant ? (
        <ActivityFeed parts={currentAssistant.parts} loading={loading} />
      ) : (
        <div className="text-xs text-slate-400 animate-pulse pl-1">
          🤔 Ajan isteği değerlendiriyor…
        </div>
      )}
    </div>
  );
}

/* ───────── Canlı döngü akışı (sadece aktif tur) ───────── */
function ActivityFeed({
  parts,
  loading,
}: {
  parts: UIMessage['parts'];
  loading: boolean;
}) {
  let step = 0;
  const rows: React.ReactNode[] = [];

  parts.forEach((part, i) => {
    if (part.type === 'step-start') {
      step += 1;
      rows.push(
        <Row key={`s-${i}`} dot="bg-slate-400">
          <span className="text-slate-500">
            🔁 Adım {step} başladı{' '}
            <span className="text-slate-400">(model düşünüyor)</span>
          </span>
        </Row>,
      );
    } else if (isToolUIPart(part)) {
      rows.push(<ToolActivity key={part.toolCallId} part={part} />);
    } else if (part.type === 'reasoning') {
      rows.push(
        <Row key={`r-${i}`} dot="bg-violet-400">
          <details className="text-xs">
            <summary className="cursor-pointer text-violet-500">
              💭 Düşünme süreci
            </summary>
            <p className="whitespace-pre-wrap text-slate-500 mt-1">
              {part.text}
            </p>
          </details>
        </Row>,
      );
    } else if (part.type === 'text') {
      rows.push(
        <Row key={`t-${i}`} dot="bg-blue-400">
          <span className="text-slate-500">
            {loading ? '✍️ Yanıt yazılıyor…' : '✍️ Yanıt üretildi'}
          </span>
        </Row>,
      );
    }
  });

  if (rows.length === 0) {
    return (
      <div className="text-xs text-slate-400 pl-1 animate-pulse">
        Ajan henüz bir işlem başlatmadı…
      </div>
    );
  }

  return (
    <div className="relative ml-1 pl-4 border-l-2 border-slate-200 space-y-2">
      {rows}
    </div>
  );
}

/* ───────── Akıştaki tek satır (zaman çizelgesi noktası) ───────── */
function Row({
  children,
  dot,
}: {
  children: React.ReactNode;
  dot: string;
}) {
  return (
    <div className="relative text-xs">
      <span
        className={`absolute -left-[21px] top-1 w-2 h-2 rounded-full ring-2 ring-white ${dot}`}
      />
      {children}
    </div>
  );
}

/* ───────── Tek araç çağrısı: req → / res ← ───────── */
function ToolActivity({ part }: { part: ToolUIPart }) {
  const name = getToolName(part);
  const running = part.state === 'input-streaming' || part.state === 'input-available';
  const done = part.state === 'output-available';
  const error = part.state === 'output-error';

  const label = running
    ? 'şu an koşuyor…'
    : done
      ? 'tamamlandı'
      : error
        ? 'hata'
        : part.state;

  return (
    <Row dot={running ? 'bg-amber-400 animate-pulse' : done ? 'bg-emerald-500' : 'bg-red-400'}>
      <div className="rounded-lg border border-slate-200 bg-white p-2 space-y-1">
        <div className="flex items-center gap-2">
          <span>{running ? '🔧' : done ? '✅' : error ? '❌' : '•'}</span>
          <span className="font-mono text-blue-700">{name}</span>
          <span className={`text-[11px] ${running ? 'text-amber-600' : 'text-slate-400'}`}>
            — {label}
          </span>
        </div>

        {'input' in part && part.input != null && (
          <div className="font-mono text-[11px] leading-relaxed break-all">
            <span className="text-slate-400">req →</span>{' '}
            <span className="text-slate-700">{JSON.stringify(part.input)}</span>
          </div>
        )}

        {done && (
          <div className="font-mono text-[11px] leading-relaxed break-all">
            <span className="text-slate-400">res ←</span>{' '}
            <span className="text-emerald-700">{JSON.stringify(part.output)}</span>
          </div>
        )}

        {error && (
          <p className="text-[11px] text-red-500">{part.errorText}</p>
        )}
      </div>
    </Row>
  );
}

/* ───────── yardımcı: bir mesajın düz metni ───────── */
function textOf(message: UIMessage): string {
  return message.parts
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join('');
}
