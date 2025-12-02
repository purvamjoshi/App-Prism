"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Search,
    LogOut,
    Loader2,
    BarChart3,
    TrendingUp,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    Mail,
    Send,
    X,
    History,
    Clock,
    ArrowRight,
    Users,
    Lightbulb,
    Sparkles,
    Star
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    Cell,
    AreaChart,
    Area
} from "recharts";

// --- Types ---
interface DailyRating {
    date: string;
    positive: number;
    negative: number;
}

interface Theme {
    name: string;
    sentiment: {
        positive: number;
        negative: number;
    };
}

interface Quote {
    text: string;
    rating: number;
    time: string;
    sentiment: "Positive" | "Negative";
    tag: string;
}

interface PeriodAnalysis {
    summary: string;
    daily_ratings: DailyRating[];
    themes: Theme[];
    quotes: Quote[];
    action_items: string[];
}

interface AnalysisResult {
    last_7_days: PeriodAnalysis;
    last_15_days: PeriodAnalysis;
    appTitle?: string;
}

interface HistoryItem {
    appId: string;
    timestamp: string;
}

// --- Helper Components ---

// 1. SearchHandler: Manages URL sync without aggressive resetting
function SearchHandler({
    setAppId,
    handleAutoAnalyze
}: {
    setAppId: (val: string) => void;
    handleAutoAnalyze: (id: string) => void;
}) {
    const searchParams = useSearchParams();
    const appIdParam = searchParams.get("appId");
    const [processedId, setProcessedId] = useState<string | null>(null);

    useEffect(() => {
        if (appIdParam && appIdParam !== processedId) {
            // Only set input if it's empty to avoid overwriting user typing
            // OR if it's a fresh load (processedId is null)
            setAppId(appIdParam);
            setProcessedId(appIdParam);
            handleAutoAnalyze(appIdParam);
        }
    }, [appIdParam, handleAutoAnalyze, processedId, setAppId]);

    return null;
}

export default function HomeClient() {
    const { data: session, status } = useSession();
    const [appId, setAppId] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<'last_7_days' | 'last_15_days'>('last_7_days');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [emailSending, setEmailSending] = useState(false);
    const [error, setError] = useState("");

    // Loading messages sequence
    const loadingMessages = [
        "Hang on! Scanning all the reviews for you...",
        "Gathering insights...",
        "Generating chart of last 15 days...",
        "Identifying top themes...",
        "Finalizing your report..."
    ];

    useEffect(() => {
        if (session?.user) {
            fetchHistory();
        }
    }, [session]);

    // Effect to cycle through loading messages
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading) {
            let msgIndex = 0;
            setLoadingMessage(loadingMessages[0]);
            interval = setInterval(() => {
                msgIndex = (msgIndex + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[msgIndex]);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [loading]);

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

    const extractAppId = (input: string) => {
        try {
            if (input.includes("play.google.com")) {
                const url = new URL(input);
                return url.searchParams.get("id") || input;
            }
        } catch (e) {
            // invalid url, treat as id
        }
        return input;
    };

    const handleAnalyze = async (e?: React.FormEvent, overrideAppId?: string) => {
        e?.preventDefault();

        const currentInput = overrideAppId || appId;
        if (!currentInput) return;

        // Extract App ID if a full URL is pasted
        let targetAppId = currentInput;
        if (currentInput.includes("play.google.com")) {
            try {
                const url = new URL(currentInput);
                const idParam = url.searchParams.get("id");
                if (idParam) {
                    targetAppId = idParam;
                }
            } catch (e) {
                console.warn("Failed to parse URL, using input as ID");
            }
        }

        // Update appId state if needed
        if (targetAppId !== appId) {
            setAppId(targetAppId);
        }

        // UX: Start "fake" loading immediately to engage user
        setLoading(true);
        setError("");
        setAnalysis(null);

        // If not logged in, show fake progress then login modal
        if (!session) {
            // Wait a bit to show the "Scanning" message
            setTimeout(() => {
                setLoading(false);
                setShowLoginModal(true);
            }, 2000);
            return;
        }

        // If logged in, proceed with actual analysis
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appId: targetAppId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Analysis failed");
            }

            setAnalysis(data);
            fetchHistory();

            if (session?.user?.email) {
                triggerEmail(data, targetAppId);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Wrapper for auto-analyze to be passed to SearchHandler
    const handleAutoAnalyze = useCallback((id: string) => {
        if (session) {
            handleAnalyze(undefined, id);
        }
    }, [session]);

    const triggerEmail = async (analysisData: AnalysisResult, currentAppId: string) => {
        setEmailSending(true);
        try {
            const res = await fetch("/api/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ analysis: analysisData, appId: extractAppId(currentAppId) }),
            });
            if (!res.ok) throw new Error("Failed to send email");
        } catch (err) {
            console.error("Failed to auto-send email", err);
        } finally {
            setEmailSending(false);
        }
    };

    const handleEmail = async () => {
        if (!analysis) return;
        setEmailSending(true);
        try {
            const res = await fetch("/api/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ analysis: analysis, appId: extractAppId(appId) }),
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

    const currentData = analysis ? analysis[selectedPeriod] : null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Suspense fallback={null}>
                <SearchHandler setAppId={setAppId} handleAutoAnalyze={handleAutoAnalyze} />
            </Suspense>

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
                        {session ? (
                            <>
                                <span className="text-sm text-gray-500 hidden sm:block">
                                    {session.user?.email}
                                </span>
                                <button
                                    onClick={() => signOut()}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => signIn("google")}
                                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                {/* Search Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <form onSubmit={(e) => handleAnalyze(e)} className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Enter Google Play Store URL"
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all"
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
                                    key={item.timestamp}
                                    onClick={() => {
                                        setAppId(item.appId);
                                        handleAnalyze(undefined, item.appId);
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

                {/* Loading Skeleton & Progress */}
                {loading && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex items-center justify-center py-8">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-[var(--color-brand)]/20 animate-spin border-t-[var(--color-brand)]"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-[var(--color-brand)] animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-lg font-medium text-gray-700 animate-pulse">{loadingMessage}</p>
                            </div>
                        </div>

                        {/* Skeleton UI */}
                        <div className="opacity-50 pointer-events-none blur-[1px] transition-all duration-500">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-32 mb-8"></div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[300px] mb-8"></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-24"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Dashboard */}
                {!loading && currentData && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Analysis Report</h2>
                                <p className="text-gray-500">Insights for {analysis?.appTitle || appId}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <select
                                        value={selectedPeriod}
                                        onChange={(e) => setSelectedPeriod(e.target.value as 'last_7_days' | 'last_15_days')}
                                        className="appearance-none pl-4 pr-10 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent cursor-pointer"
                                    >
                                        <option value="last_7_days">Last 7 Days</option>
                                        <option value="last_15_days">Last 15 Days</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>

                                <button
                                    onClick={handleEmail}
                                    disabled={emailSending}
                                    className="px-4 py-2 bg-[var(--color-brand)] text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2 font-medium shadow-sm shadow-emerald-200"
                                >
                                    {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Email Report
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Summary</h3>
                            <p className="text-gray-700 leading-relaxed">{currentData.summary}</p>
                        </div>

                        {/* Ratings Graph */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-[var(--color-brand)]" />
                                    Ratings Trend
                                </h3>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={currentData.daily_ratings}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af' }}
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                            }}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        />
                                        <Area type="monotone" dataKey="positive" stroke="#10b981" fillOpacity={1} fill="url(#colorPositive)" name="Positive" />
                                        <Area type="monotone" dataKey="negative" stroke="#ef4444" fillOpacity={1} fill="url(#colorNegative)" name="Negative" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Themes */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-[var(--color-brand)]" />
                                Top Themes
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {currentData.themes.map((theme, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[var(--color-brand)] flex items-center justify-center font-bold mb-3">
                                            {i + 1}
                                        </div>
                                        <div className="text-gray-900 font-medium leading-tight mb-3">{theme.name}</div>

                                        {/* Sentiment Bar */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>{theme.sentiment.positive}% Pos</span>
                                                <span>{theme.sentiment.negative}% Neg</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                                                <div style={{ width: `${theme.sentiment.positive}%` }} className="h-full bg-emerald-500"></div>
                                                <div style={{ width: `${theme.sentiment.negative}%` }} className="h-full bg-red-500"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Quotes */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    User Voices
                                </h3>
                                <div className="space-y-6">
                                    {currentData.quotes.map((quote, i) => (
                                        <div key={i} className="group relative pl-6 pb-2">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full transition-colors ${quote.sentiment === 'Positive' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>

                                            <div className="flex gap-2 mb-2">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${quote.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                    {quote.sentiment}
                                                </span>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                    {quote.tag}
                                                </span>
                                            </div>

                                            <p className="text-gray-700 italic mb-2 text-lg leading-relaxed">"{quote.text}"</p>

                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md text-yellow-700 font-medium">
                                                    <span>{quote.rating}</span>
                                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                                </div>
                                                <span>{new Date(quote.time).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Items */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-amber-500" />
                                    Recommended Actions
                                </h3>
                                <div className="space-y-4">
                                    {currentData.action_items.map((item, i) => (
                                        <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-gray-50 border border-gray-100">
                                            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 font-bold text-sm mt-0.5">
                                                {i + 1}
                                            </div>
                                            <p className="text-gray-800 font-medium leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Sign in Required</h3>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">
                            To analyze apps and generate reports, please sign in with your Google account.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    const cleanAppId = extractAppId(appId);
                                    signIn("google", { callbackUrl: `/?appId=${cleanAppId}` });
                                }}
                                className="w-full py-3 px-6 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                            >
                                <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" alt="Google" />
                                Sign in with Google
                            </button>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
