import { Instagram, Linkedin } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
            <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-gray-600 font-medium flex items-center gap-2">
                    <span role="img" aria-label="sparkles">✨</span>
                    vibe coded by <span className="text-gray-900 font-bold">Purvam Joshi</span>
                </p>
                <div className="flex items-center gap-6">
                    <a
                        href="https://www.instagram.com/purvamjoshi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[#E1306C] transition-colors"
                        aria-label="Instagram"
                    >
                        <Instagram className="w-5 h-5" />
                    </a>
                    <a
                        href="https://www.linkedin.com/in/purvamjoshi/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[#0077b5] transition-colors"
                        aria-label="LinkedIn"
                    >
                        <Linkedin className="w-5 h-5" />
                    </a>
                </div>
            </div>
        </footer>
    );
}
