/**
 * News Sources Configuration for the 13 World-Famous Newspapers:
 * 1. BBC (United Kingdom)
 * 2. The New York Times (United States)
 * 3. The Wall Street Journal (United States)
 * 4. The Guardian (United Kingdom)
 * 5. The Washington Post (United States)
 * 6. The Times of India (India)
 * 7. The Yomiuri Shimbun (Japan)
 * 8. Le Monde (France)
 * 9. Financial Times (United Kingdom / Global)
 * 10. The Asahi Shimbun (Japan)
 * 11. El País (Spain)
 * 12. Daily Mail (United Kingdom)
 * 13. The Daily Telegraph (United Kingdom)
 */

import { NewsSourceConfig } from "../types/news";

export const FAMOUS_NEWS_SOURCES: NewsSourceConfig[] = [
  {
    id: "bbc",
    name: "BBC",
    country: "United Kingdom",
    flag: "🇬🇧",
    primaryLanguage: "English",
    website: "https://www.bbc.com/news",
    brandColor: "#bb1919",
    directRssUrl: "https://feeds.bbci.co.uk/news/rss.xml",
    googleNewsQuery: "site:bbc.com/news",
    defaultCategory: "World",
    fallbackHeadline: {
      title: "Global Diplomatic Summits Address Climate and Energy Infrastructure",
      description: "International leaders convene to coordinate sustainable infrastructure development and cross-border clean energy financing.",
      link: "https://www.bbc.com/news",
    },
  },
  {
    id: "nyt",
    name: "The New York Times",
    country: "United States",
    flag: "🇺🇸",
    primaryLanguage: "English",
    website: "https://www.nytimes.com",
    brandColor: "#121212",
    directRssUrl: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    googleNewsQuery: "site:nytimes.com",
    defaultCategory: "International",
    fallbackHeadline: {
      title: "Global Economic Shifts Prompt Central Banks to Reassess Fiscal Projections",
      description: "Economists evaluate labor market resilience and technological adoption trends across major global trade corridors.",
      link: "https://www.nytimes.com",
    },
  },
  {
    id: "wsj",
    name: "The Wall Street Journal",
    country: "United States",
    flag: "🇺🇸",
    primaryLanguage: "English",
    website: "https://www.wsj.com",
    brandColor: "#0080c6",
    directRssUrl: "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
    googleNewsQuery: "site:wsj.com",
    defaultCategory: "Markets & Business",
    fallbackHeadline: {
      title: "Capital Markets Rally as Enterprise Tech Investments Expand",
      description: "Venture allocation in high-efficiency infrastructure and compute hardware surges amidst steady manufacturing reports.",
      link: "https://www.wsj.com",
    },
  },
  {
    id: "guardian",
    name: "The Guardian",
    country: "United Kingdom",
    flag: "🇬🇧",
    primaryLanguage: "English",
    website: "https://www.theguardian.com",
    brandColor: "#052962",
    directRssUrl: "https://www.theguardian.com/world/rss",
    googleNewsQuery: "site:theguardian.com/world",
    defaultCategory: "Environment & Society",
    fallbackHeadline: {
      title: "Renewable Energy Capacity Surpasses Forecasts in New European Union Milestone",
      description: "Solar and offshore wind installations generated record power shares across mainland grids this past quarter.",
      link: "https://www.theguardian.com/world",
    },
  },
  {
    id: "wapo",
    name: "The Washington Post",
    country: "United States",
    flag: "🇺🇸",
    primaryLanguage: "English",
    website: "https://www.washingtonpost.com",
    brandColor: "#2a2a2a",
    directRssUrl: "https://feeds.washingtonpost.com/rss/world",
    googleNewsQuery: "The Washington Post site:washingtonpost.com",
    defaultCategory: "Politics & Policy",
    fallbackHeadline: {
      title: "Bipartisan Technology Working Group Proposes Modern Digital Privacy Framework",
      description: "Legislators outline standards for data sovereignty, cryptographic verification, and consumer AI transparency.",
      link: "https://www.washingtonpost.com",
    },
  },
  {
    id: "toi",
    name: "The Times of India",
    country: "India",
    flag: "🇮🇳",
    primaryLanguage: "English",
    website: "https://timesofindia.indiatimes.com",
    brandColor: "#e2211c",
    directRssUrl: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
    googleNewsQuery: "site:timesofindia.indiatimes.com",
    defaultCategory: "Asia & Tech",
    fallbackHeadline: {
      title: "India Tech Hubs Expand Semiconductor Manufacturing and R&D Corridors",
      description: "State initiatives accelerate domestic chip packaging and hardware supply chains in Bengaluru and Hyderabad.",
      link: "https://timesofindia.indiatimes.com",
    },
  },
  {
    id: "yomiuri",
    name: "The Yomiuri Shimbun",
    country: "Japan",
    flag: "🇯🇵",
    primaryLanguage: "Japanese / English",
    website: "https://japannews.yomiuri.co.jp",
    brandColor: "#c8102e",
    directRssUrl: null, // Scraped via Google News RSS for English edition
    googleNewsQuery: "The Yomiuri Shimbun site:japannews.yomiuri.co.jp OR site:yomiuri.co.jp",
    defaultCategory: "Asia-Pacific",
    fallbackHeadline: {
      title: "Japan Aerospace and Tech Consortium Unveils Next-Generation Satellite Constellation",
      description: "Advanced observation satellites enhance disaster prevention networks and marine navigation safety across East Asia.",
      link: "https://japannews.yomiuri.co.jp",
    },
  },
  {
    id: "lemonde",
    name: "Le Monde",
    country: "France",
    flag: "🇫🇷",
    primaryLanguage: "French / English",
    website: "https://www.lemonde.fr/en",
    brandColor: "#1d2434",
    directRssUrl: "https://www.lemonde.fr/en/rss/une.xml",
    googleNewsQuery: "Le Monde site:lemonde.fr/en",
    defaultCategory: "European Affairs",
    fallbackHeadline: {
      title: "European Cultural Heritage Funds Channel Investment into Digital Historic Preservation",
      description: "Museums and archives across France adopt high-definition 3D photogrammetry to safeguard monuments.",
      link: "https://www.lemonde.fr/en",
    },
  },
  {
    id: "ft",
    name: "Financial Times",
    country: "United Kingdom",
    flag: "🇬🇧",
    primaryLanguage: "English",
    website: "https://www.ft.com",
    brandColor: "#fcd1b6",
    directRssUrl: "https://www.ft.com/news-feed?format=rss",
    googleNewsQuery: "Financial Times site:ft.com",
    defaultCategory: "Global Finance",
    fallbackHeadline: {
      title: "Sovereign Wealth Funds Increase Strategic Exposure to High-Efficiency Infrastructure",
      description: "Long-term institutional allocations shift towards resilient supply networks and grid modernization ventures.",
      link: "https://www.ft.com",
    },
  },
  {
    id: "asahi",
    name: "The Asahi Shimbun",
    country: "Japan",
    flag: "🇯🇵",
    primaryLanguage: "Japanese / English",
    website: "https://www.asahi.com/ajw",
    brandColor: "#b22222",
    directRssUrl: null,
    googleNewsQuery: "The Asahi Shimbun site:asahi.com/ajw OR site:asahi.com",
    defaultCategory: "Society & Science",
    fallbackHeadline: {
      title: "Japanese Universities Pioneer Biodegradable Polymers for Ocean Conservation",
      description: "Innovative marine materials break down naturally into non-toxic minerals within months of saltwater immersion.",
      link: "https://www.asahi.com/ajw",
    },
  },
  {
    id: "elpais",
    name: "El País",
    country: "Spain",
    flag: "🇪🇸",
    primaryLanguage: "Spanish",
    website: "https://elpais.com",
    brandColor: "#135ca6",
    directRssUrl: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada",
    googleNewsQuery: "El País site:elpais.com",
    defaultCategory: "Ibero-America",
    fallbackHeadline: {
      title: "Spain Expands High-Speed Rail Modernization and Trans-Pyrenean Transit Links",
      description: "Infrastructure investments bolster zero-emission passenger travel between major metropolitan centers.",
      link: "https://elpais.com",
    },
  },
  {
    id: "dailymail",
    name: "Daily Mail",
    country: "United Kingdom",
    flag: "🇬🇧",
    primaryLanguage: "English",
    website: "https://www.dailymail.co.uk",
    brandColor: "#004db3",
    directRssUrl: "https://www.dailymail.co.uk/articles.rss",
    googleNewsQuery: "Daily Mail site:dailymail.co.uk",
    defaultCategory: "Popular Culture & Science",
    fallbackHeadline: {
      title: "Archeologists Unearth Rare Roman Artifacts During Coastal Infrastructure Works",
      description: "Remarkably preserved mosaics and ancient trading tools shed light on historical maritime merchant routes.",
      link: "https://www.dailymail.co.uk",
    },
  },
  {
    id: "telegraph",
    name: "The Daily Telegraph",
    country: "United Kingdom",
    flag: "🇬🇧",
    primaryLanguage: "English",
    website: "https://www.telegraph.co.uk",
    brandColor: "#0f2d59",
    directRssUrl: "https://www.telegraph.co.uk/news/rss.xml",
    googleNewsQuery: "The Daily Telegraph site:telegraph.co.uk",
    defaultCategory: "Insight & World",
    fallbackHeadline: {
      title: "UK Aerospace Innovators Complete Successful Test of Hybrid-Electric Commercial Engine",
      description: "Aviation engineers validate significant fuel efficiency gains on regional flight test corridors.",
      link: "https://www.telegraph.co.uk",
    },
  },
];
