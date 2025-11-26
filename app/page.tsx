"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Search, Send, Star, History, LogOut, Loader2 } from "lucide-react";

interface AnalysisResult {
  themes: string[];
  quotes: { text: string; rating: number; time: string }[];
  action_items: string[];
}

interface HistoryItem {
  appId: string;
  timestamp: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [appId, setAppId] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [emailSending, setEmailSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetchHistory();
    }
  }, [session]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/user/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!appId) return;

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysis(data);
      fetchHistory(); // Refresh history
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!analysis) return;
    setEmailSending(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, appId }),
      });
      if (!res.ok) throw new Error("Failed to send email");
      alert("Weekly Pulse sent to your inbox!");
    } catch (err) {
      alert("Failed to send email. Please try again.");
    } finally {
      setEmailSending(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand)]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 bg-[var(--color-brand)] rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-200">
            <Search className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            App-Prism
          </h1>
          <p className="text-gray-500 text-lg">
            Unlock review intelligence for any Google Play app.
            <br />
            Sign in to start your weekly pulse.
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full py-3 px-6 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
          >
            <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <div className="w-8 h-8 bg-[var(--color-brand)] rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            App-Prism
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              {session.user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Search Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <form onSubmit={handleAnalyze} className="flex gap-4">
            <input
              type="text"
              placeholder="Enter Google Play App ID (e.g., com.nextbillion.groww)"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !appId}
              className="px-6 py-3 bg-[var(--color-brand)] text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Analyze
            </button>
          </form>

          {/* Recent History */}
          {history.length > 0 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
              <History className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500 flex-shrink-0">Recent:</span>
              {history.map((item) => (
                <button
                  key={item.timestamp} // timestamp as key might not be unique enough but ok for now
                  onClick={() => {
                    setAppId(item.appId);
                    // Optional: auto-trigger analyze
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 whitespace-nowrap transition-colors"
                >
                  {item.appId}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Dashboard */}
        {analysis && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Weekly Pulse: {appId}</h2>
              <button
                onClick={handleEmail}
                disabled={emailSending}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
              >
                {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Email Report
              </button>
            </div>

            {/* Themes */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {analysis.themes.map((theme, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-[var(--color-brand)] font-bold text-lg mb-1">#{i + 1}</div>
                  <div className="text-gray-800 font-medium leading-tight">{theme}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quotes */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  User Voices
                </h3>
                <div className="space-y-4">
                  {analysis.quotes.map((quote, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border-l-4 border-[var(--color-brand)]">
                      <p className="text-gray-700 italic mb-2">"{quote.text}"</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <span>{quote.rating}</span>
                          <Star className="w-3 h-3 fill-gray-400 text-gray-400" />
                        </div>
                        <span>{quote.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Action Items</h3>
                <div className="space-y-3">
                  {analysis.action_items.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-[var(--color-brand)] flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        {i + 1}
                      </div>
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
