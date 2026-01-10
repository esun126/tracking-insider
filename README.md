# 📈 Insider Trading Tracker

A modern web application to track SEC Form 4 insider trading filings for US publicly traded companies.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss)

## ✨ Features

- 🔍 **Company Search** - Search by ticker symbol or company name
- 📊 **Trading Summary** - View buy/sell sentiment, net flow, and transaction counts
- 📋 **Transaction Table** - Sortable, filterable list of all insider transactions
- 👥 **Insider Breakdown** - Group transactions by insider with detailed history
- 🎨 **Modern UI** - Beautiful dark theme with smooth animations
- ⚡ **Real-time Data** - Fresh data from SEC EDGAR and OpenInsider

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tracking-insider.git
cd tracking-insider

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **HTML Parsing**: Cheerio

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── search/          # Company search API
│   │   └── insider/[ticker] # Insider trading data API
│   ├── page.tsx             # Main page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── SearchBar.tsx        # Search with autocomplete
│   ├── SummaryCards.tsx     # Trading summary cards
│   ├── TransactionTable.tsx # Transaction list table
│   └── InsiderBreakdown.tsx # Insider grouped view
├── lib/
│   ├── sec-api.ts           # SEC/OpenInsider data fetching
│   └── utils.ts             # Formatting utilities
└── types/
    └── index.ts             # TypeScript type definitions
```

## 📊 Data Sources

- **SEC EDGAR** - Official SEC database for company CIK mapping
- **OpenInsider** - Parsed Form 4 filing data

## 🔧 API Endpoints

### Search Companies
```
GET /api/search?q={query}
```

### Get Insider Trading Data
```
GET /api/insider/{ticker}?days={90}
```

## 📝 Understanding Insider Transactions

| Code | Type | Signal |
|------|------|--------|
| P | Purchase | Bullish - insider buying with own money |
| S | Sale | Potentially bearish (context matters) |
| A | Grant/Award | Neutral - compensation related |
| M | Option Exercise | Neutral - often paired with sale |
| F | Tax Payment | Neutral - mandatory tax withholding |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## ⚠️ Disclaimer

This tool is for informational purposes only. Insider trading data should not be used as the sole basis for investment decisions. Always do your own research and consult with financial professionals.

---

Built with ❤️ using Next.js and TypeScript
