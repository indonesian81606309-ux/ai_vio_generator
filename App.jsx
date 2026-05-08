import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ======================== KONSTANTA ========================
const VIO_VERSIONS = [
  { id: "K1", label: "K1", desc: "Chat & Q&A", color: "#00f5a0", system: "Respons singkat, ramah, dan cepat. Fokus jawab pertanyaan umum." },
  { id: "K1.5", label: "K1.5", desc: "Coding & Sekolah", color: "#00d4ff", system: "Bantu coding (HTML/CSS/JS) dan pelajaran sekolah. Beri contoh kode." },
  { id: "K2", label: "K2", desc: "Developer & Game", color: "#a78bfa", system: "Solusi teknis untuk aplikasi & game. Efisien dan smart." },
  { id: "K2.5", label: "K2.5", desc: "Bisnis + Dev", color: "#fb923c", system: "Strategi bisnis digital + technical roadmap. Tajam dan aplikatif." },
  { id: "K3", label: "K3", desc: "Super Assistant", color: "#f43f5e", system: "AI paling canggih. Solusi futuristik untuk semua masalah." },
];

const MODES = ["Chat", "Coding", "Game", "Bisnis", "Sekolah"];

// ======================== AI LOKAL (FALLBACK) ========================
// Memori percakapan sederhana (per session)
let conversationMemory = [];

const addToMemory = (role, content) => {
  conversationMemory.push({ role, content });
  if (conversationMemory.length > 10) conversationMemory.shift();
};

const getRecentContext = () => {
  return conversationMemory.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join("\n");
};

// Fungsi AI lokal cerdas (tanpa API)
const getLocalAIResponse = async (userMessage, version, mode) => {
  // Simulasi delay natural
  await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));

  const lower = userMessage.toLowerCase();
  const context = getRecentContext();

  // Deteksi matematika
  const mathMatch = lower.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
  if (mathMatch) {
    const a = parseFloat(mathMatch[1]), b = parseFloat(mathMatch[3]);
    const op = mathMatch[2];
    let result;
    if (op === "+") result = a + b;
    else if (op === "-") result = a - b;
    else if (op === "*") result = a * b;
    else if (op === "/") result = b !== 0 ? a / b : "error (bagi nol)";
    return `🧮 Hasil: ${a} ${op} ${b} = ${result}`;
  }

  // Mode-based response
  if (mode === "Coding") {
    if (lower.includes("html") || lower.includes("css"))
      return `💻 [${version.id}] Contoh HTML/CSS:\n<div class="card">\n  <h1>Hello VIO</h1>\n</div>`;
    if (lower.includes("javascript") || lower.includes("js"))
      return `🔧 [${version.id}] JavaScript: fungsi map, filter, reduce. Contoh:\n\`\`\`js\nconst doubled = arr.map(x => x * 2);\n\`\`\``;
    return `🎯 [${version.id} · Coding Mode] Siap bantu coding! Sebutkan bahasa atau masalah spesifik.`;
  }
  if (mode === "Game") {
    if (lower.includes("rpg")) return `🎮 Ide game RPG: sistem turn-based, leveling karakter. Mau saya buatkan struktur kode?`;
    return `🕹️ [Game Mode] Bisa bikin game tebak angka, platformer, atau snake. Coba tanya "buat game tebak angka".`;
  }
  if (mode === "Bisnis") {
    if (lower.includes("startup") || lower.includes("ide")) return `🚀 Ide startup: validasi masalah, MVP, iterasi. Butuh template PRD?`;
    return `💼 [Bisnis Mode] Strategi marketing, analisa kompetitor, proyeksi keuangan. Ceritakan ide Anda.`;
  }
  if (mode === "Sekolah") {
    if (lower.includes("matematika")) return `📐 Rumus luas persegi: sisi × sisi. Contoh soal?`;
    return `📚 [Sekolah Mode] Bantu pelajaran: Matematika, IPA, Inggris, Pemrograman dasar. Tanyakan saja.`;
  }
  // Default Chat mode
  if (lower.includes("halo") || lower.includes("hai")) return `Halo! Saya ${version.id}, mode ${mode}. Ada yang bisa dibantu?`;
  if (lower.includes("terima kasih")) return `Sama-sama! Senang bisa membantu 😊`;
  return `💬 [${version.id}] ${userMessage.substring(0, 60)}... Berdasarkan versiku, saran saya adalah eksplorasi lebih lanjut. Ada yang mau ditanyakan lagi?`;
};

// ======================== KOMPONEN UTAMA ========================
const GlowText = ({ children, color }) => (
  <span style={{ color, textShadow: `0 0 20px ${color}80, 0 0 40px ${color}40` }}>
    {children}
  </span>
);

const TypingDots = ({ color }) => (
  <div style={{ display: "flex", gap: "5px", alignItems: "center", padding: "4px 0" }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: "50%",
        background: color,
        animation: `typingPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        boxShadow: `0 0 8px ${color}`
      }} />
    ))}
  </div>
);

const MessageBubble = ({ msg, color }) => {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 16,
      animation: "fadeSlideIn 0.3s ease-out"
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%", marginRight: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${color}30, ${color}10)`,
          border: `1px solid ${color}60`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color,
          boxShadow: `0 0 12px ${color}40`,
          fontFamily: "'Orbitron', monospace"
        }}>V</div>
      )}
      <div style={{
        maxWidth: "72%",
        padding: "12px 16px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? `linear-gradient(135deg, ${color}25, ${color}15)` : "rgba(255,255,255,0.04)",
        border: isUser ? `1px solid ${color}50` : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isUser ? `0 4px 20px ${color}20` : "none",
        color: "#e2e8f0",
        fontSize: 14,
        lineHeight: 1.6,
        fontFamily: "'DM Sans', sans-serif",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
      }}>
        {msg.content}
      </div>
    </div>
  );
};

export default function VioAI() {
  // State utama
  const [activeVersion, setActiveVersion] = useState(VIO_VERSIONS[4]); // K3 default
  const [activeMode, setActiveMode] = useState("Chat");
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("vio_messages");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("vio_api_key") || "");
  const [useApi, setUseApi] = useState(false); // toggle untuk pakai API atau lokal

  const chatRef = useRef(null);
  const inputRef = useRef(null);

  // Simpan messages ke localStorage
  useEffect(() => {
    localStorage.setItem("vio_messages", JSON.stringify(messages));
  }, [messages]);

  // Simpan API key
  useEffect(() => {
    if (apiKey) localStorage.setItem("vio_api_key", apiKey);
  }, [apiKey]);

  // Auto scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Optimasi: fungsi sendMessage pakai useCallback
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let replyText = "";
      if (useApi && apiKey) {
        // Panggil Anthropic API
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            system: `Kamu adalah VIO ${activeVersion.id}. ${activeVersion.system} Mode aktif: ${activeMode}.`,
            messages: messages.concat(userMsg).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
          })
        });
        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        replyText = data.content[0]?.text || "Maaf, tidak ada respons.";
      } else {
        // Gunakan AI lokal
        replyText = await getLocalAIResponse(text, activeVersion, activeMode);
      }
      const assistantMsg = { role: "assistant", content: replyText };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Terjadi kesalahan. Coba lagi nanti." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, useApi, apiKey, activeVersion, activeMode, messages]);

  // Hapus semua chat
  const clearChat = useCallback(() => {
    setMessages([]);
    conversationMemory = []; // reset memory lokal
  }, []);

  const color = activeVersion.color;

  // Memoisasi komponen sidebar agar tidak re-render setiap state berubah
  const sidebar = useMemo(() => (
    <div style={{
      width: sidebarOpen ? 260 : 0,
      minWidth: sidebarOpen ? 260 : 0,
      transition: "all 0.3s ease",
      overflow: "hidden",
      background: "rgba(255,255,255,0.02)",
      borderRight: `1px solid ${color}20`,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      zIndex: 10
    }}>
      <div style={{ width: 260, padding: "24px 20px 16px", display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "0.08em" }}>
            <GlowText color={color}>VIO</GlowText>
          </div>
          <div style={{ fontSize: 10, color: `${color}80`, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            AI Ecosystem
          </div>
        </div>

        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 10 }}>Versi</div>
        {VIO_VERSIONS.map(v => (
          <button key={v.id} onClick={() => { setActiveVersion(v); clearChat(); }}
            style={{
              width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8,
              border: `1px solid ${activeVersion.id === v.id ? v.color + "60" : "transparent"}`,
              background: activeVersion.id === v.id ? `${v.color}18` : "transparent",
              color: activeVersion.id === v.id ? v.color : "rgba(255,255,255,0.5)",
              cursor: "pointer", marginBottom: 4, display: "flex", gap: 10, alignItems: "center"
            }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.color, boxShadow: activeVersion.id === v.id ? `0 0 8px ${v.color}` : "none" }} />
            <div><div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 700 }}>VIO {v.id}</div><div style={{ fontSize: 10, opacity: 0.6 }}>{v.desc}</div></div>
          </button>
        ))}

        <div style={{ marginTop: 20, fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 10 }}>Mode</div>
        {MODES.map(m => (
          <button key={m} onClick={() => setActiveMode(m)}
            style={{
              width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 6,
              border: `1px solid ${activeMode === m ? color + "40" : "transparent"}`,
              background: activeMode === m ? `${color}10` : "transparent",
              color: activeMode === m ? color : "rgba(255,255,255,0.4)",
              cursor: "pointer", marginBottom: 3, fontSize: 12
            }}>
            {m} Mode
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ borderTop: `1px solid ${color}15`, paddingTop: 16 }}>
          <button onClick={clearChat} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${color}30`, background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>
            + New Chat
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={useApi} onChange={e => setUseApi(e.target.checked)} />
            Gunakan API (Anthropic)
          </label>
          {useApi && (
            <input type="password" placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)}
              style={{ width: "100%", marginTop: 8, padding: 6, borderRadius: 6, background: "#1e293b", border: "none", color: "white", fontSize: 11 }} />
          )}
        </div>
      </div>
    </div>
  ), [sidebarOpen, color, activeVersion, activeMode, useApi, apiKey, clearChat]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #070b14; overflow: hidden; height: 100vh; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${color}80; border-radius: 2px; }
        @keyframes typingPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        textarea:focus { outline: none; border-color: ${color}80 !important; box-shadow: 0 0 20px ${color}20 !important; }
      `}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: "#070b14", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(transparent, ${color}20, transparent)`, animation: "scanline 8s linear infinite", pointerEvents: "none", zIndex: 100, opacity: 0.4 }} />
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `linear-gradient(${color}08 1px, transparent 1px), linear-gradient(90deg, ${color}08 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        
        {sidebar}
        
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${color}20`, display: "flex", alignItems: "center", gap: 16, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(10px)" }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color, cursor: "pointer", fontSize: 18, opacity: 0.7 }}>☰</button>
            <div style={{ flex: 1 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 14, fontWeight: 700, color, textShadow: `0 0 12px ${color}60` }}>VIO {activeVersion.id}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, border: `1px solid ${color}40`, color: `${color}90` }}>{activeMode}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${color}15`, color }}>{activeVersion.desc}</span>
            </div></div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00f5a0", boxShadow: "0 0 8px #00f5a0", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, color: "#00f5a060" }}>ONLINE</span>
          </div>

          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", marginTop: "15vh" }}>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 48, fontWeight: 900, color, textShadow: `0 0 40px ${color}60`, marginBottom: 12 }}>VIO {activeVersion.id}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, marginBottom: 32 }}>{activeVersion.desc} — {activeMode} Mode Aktif</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  {["Buat landing page keren", "Buat game simulator", "Ide startup digital", "Jelaskan async/await"].map(s => (
                    <button key={s} onClick={() => setInput(s)} style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${color}30`, background: `${color}08`, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12 }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} color={color} />)}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", marginRight: 10, background: `linear-gradient(135deg, ${color}30, ${color}10)`, border: `1px solid ${color}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color, fontFamily: "'Orbitron', monospace" }}>V</div>
                <div style={{ padding: "12px 16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <TypingDots color={color} />
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: "16px 24px 24px", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(20px)", borderTop: `1px solid ${color}15` }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", background: "rgba(255,255,255,0.03)", border: `1px solid ${color}30`, borderRadius: 14, padding: "12px 16px" }}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={`Tanya VIO ${activeVersion.id}...`} rows={1} style={{ flex: 1, background: "none", border: "none", color: "#e2e8f0", fontSize: 14, resize: "none", outline: "none", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif", maxHeight: 120, overflowY: "auto" }} />
              <button onClick={sendMessage} disabled={loading} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${color}60`, background: `${color}15`, color, cursor: "pointer", fontSize: 16, transition: "all 0.2s", flexShrink: 0, opacity: loading ? 0.4 : 1 }}>↑</button>
            </div>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Enter kirim · Shift+Enter baris baru</div>
          </div>
        </div>
      </div>
    </>
  );
}
