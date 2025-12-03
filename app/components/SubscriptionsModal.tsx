import { X, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Subscription {
    id: string;
    appId: string;
    appTitle: string | null;
    createdAt: string;
}

interface SubscriptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SubscriptionsModal({ isOpen, onClose }: SubscriptionsModalProps) {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchSubscriptions();
        }
    }, [isOpen]);

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/user/subscriptions");
            if (res.ok) {
                const data = await res.json();
                setSubscriptions(data);
            }
        } catch (error) {
            console.error("Failed to fetch subscriptions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsubscribe = async (appId: string) => {
        setDeletingId(appId);
        try {
            const res = await fetch("/api/user/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "unsubscribe", appId }),
            });

            if (res.ok) {
                setSubscriptions(prev => prev.filter(sub => sub.appId !== appId));
            }
        } catch (error) {
            console.error("Failed to unsubscribe", error);
        } finally {
            setDeletingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">My Subscriptions</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 min-h-[200px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand)]" />
                        </div>
                    ) : subscriptions.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <p>You haven't subscribed to any apps yet.</p>
                        </div>
                    ) : (
                        subscriptions.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="font-medium text-gray-900">{sub.appTitle || sub.appId}</p>
                                    <p className="text-xs text-gray-500">{sub.appId}</p>
                                </div>
                                <button
                                    onClick={() => handleUnsubscribe(sub.appId)}
                                    disabled={deletingId === sub.appId}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Unsubscribe"
                                >
                                    {deletingId === sub.appId ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
