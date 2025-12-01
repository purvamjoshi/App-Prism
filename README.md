# App-Prism 🚀

**App-Prism** is a powerful **Review Intelligence Platform** designed to help developers and product managers extract actionable insights from Google Play Store reviews.

![App Prism Screenshot](./app-prism-ss.png)

## ✨ Features

-   **🔍 App Analysis**: Enter any Google Play App ID (e.g., `com.nextbillion.groww`) to fetch and analyze reviews.
-   **🤖 AI-Powered Insights**: Uses **Google Gemini 2.0 Flash** to generate a "Weekly Pulse" report, identifying:
    -   Top 5 Themes (with sentiment breakdown).
    -   Key User Quotes.
    -   Actionable Next Steps.
-   **📊 Visual Data**: Interactive charts showing daily rating trends and sentiment distribution.
-   **🔐 Secure Authentication**: Google Login integration via **NextAuth.js**.
-   **💾 History**: Persists search history and analysis results using **Supabase** (PostgreSQL).
-   **📧 Email Reports**: Send analysis drafts directly to your inbox using **Loops.so**.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Database**: [Supabase](https://supabase.com/) (PostgreSQL) & [Prisma ORM](https://www.prisma.io/)
-   **AI Model**: [Google Gemini API](https://ai.google.dev/) (`gemini-2.0-flash-lite-preview-02-05`)
-   **Auth**: [Auth.js](https://authjs.dev/) (Google Provider)
-   **Scraper**: `google-play-scraper`

## 🚀 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/app-prism.git
    cd app-prism
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**:
    Create a `.env` file with the following:
    ```env
    DATABASE_URL="postgresql://..."
    AUTH_SECRET="..."
    AUTH_GOOGLE_ID="..."
    AUTH_GOOGLE_SECRET="..."
    GEMINI_API_KEY="..."
    LOOPS_API_KEY="..."
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📄 License

This project is licensed under the MIT License.
