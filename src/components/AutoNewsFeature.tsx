import React, { useState, useEffect } from "react";
import {
  Newspaper,
  Globe2,
  RefreshCw,
  Send,
  Sliders,
  ExternalLink,
  Clock,
  CheckCircle2,
  Bookmark,
  Share2,
  Radio,
  Filter,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NewsArticle, AutoNewsConfig, NewsSourceConfig } from "../types/news";
import { FAMOUS_NEWS_SOURCES } from "../data/newsSources";

export const AutoNewsFeature: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [sources] = useState<NewsSourceConfig[]>(FAMOUS_NEWS_SOURCES);
  const [config, setConfig] = useState<AutoNewsConfig>({
    enabled: true,
    channelId: "124892849204918299",
    channelName: "world-news",
    intervalHours: 6,
    postMode: "ALL_13_DIGEST",
    pingRole: "none",
    lastDispatchedAt: null,
    totalBroadcastsSent: 42,
    featuredSources: FAMOUS_NEWS_SOURCES.map((s) => s.id),
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [filterRegion, setFilterRegion] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"FEED" | "DISCORD_EMBED" | "CONFIG">("FEED");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [embedPage, setEmbedPage] = useState<number>(1);
  const pageSize = 5;

  // Reset to page 1 whenever region filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRegion, searchQuery]);

  // Fetch 13 articles on mount
  useEffect(() => {
    fetchNewsArticles();
  }, []);

  const fetchNewsArticles = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch(`/api/news${forceRefresh ? "?refresh=true" : ""}`);
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
        if (data.config) setConfig(data.config);
        if (!selectedArticle && data.articles.length > 0) {
          setSelectedArticle(data.articles[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load news articles:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleBroadcastNow = async () => {
    setIsBroadcasting(true);
    setBroadcastSuccess(null);
    try {
      const res = await fetch("/api/news/broadcast", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setBroadcastSuccess(
          `Successfully dispatched the 13-newspaper digest to #${config.channelName}!`
        );
        setConfig((prev) => ({
          ...prev,
          lastDispatchedAt: data.dispatchedAt,
          totalBroadcastsSent: data.broadcastsTotal,
        }));
        setTimeout(() => setBroadcastSuccess(null), 5000);
      }
    } catch (err) {
      console.error("Broadcast failed:", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<AutoNewsConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    try {
      await fetch("/api/news/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
    } catch (err) {
      console.error("Failed to save news config:", err);
    }
  };

  // Region filter mapping
  const filteredArticles = articles.filter((article) => {
    if (filterRegion !== "ALL") {
      if (filterRegion === "UK" && article.sourceCountry !== "United Kingdom") return false;
      if (filterRegion === "US" && article.sourceCountry !== "United States") return false;
      if (filterRegion === "ASIA" && !["Japan", "India"].includes(article.sourceCountry)) return false;
      if (filterRegion === "EUROPE" && !["France", "Spain"].includes(article.sourceCountry)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        article.title.toLowerCase().includes(q) ||
        article.description.toLowerCase().includes(q) ||
        article.sourceName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Pagination math (strictly 5 news per page)
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80">
                <Newspaper className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                    Interactive Auto News Feed
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    13 Famous Newspapers
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Picks exactly <strong>one top article</strong> from each prestigious international newspaper:
                  BBC, The New York Times, The Wall Street Journal, The Guardian, The Washington Post,
                  The Times of India, The Yomiuri Shimbun, Le Monde, Financial Times, The Asahi Shimbun,
                  El País, Daily Mail, and The Daily Telegraph.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="refresh-news-btn"
              onClick={() => fetchNewsArticles(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
              <span>{isRefreshing ? "Refreshing Feeds..." : "Refresh All 13 Feeds"}</span>
            </button>

            <button
              id="broadcast-discord-btn"
              onClick={handleBroadcastNow}
              disabled={isBroadcasting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100 transition-colors disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isBroadcasting ? "animate-pulse" : ""}`} />
              <span>{isBroadcasting ? "Broadcasting..." : "Broadcast to Discord"}</span>
            </button>
          </div>
        </div>

        {/* Broadcast Toast Feedback */}
        <AnimatePresence>
          {broadcastSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-medium text-emerald-800"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{broadcastSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl border border-zinc-200/60">
            <button
              id="tab-news-feed"
              onClick={() => setPreviewMode("FEED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                previewMode === "FEED"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              📰 Newspaper Headlines ({articles.length}/13)
            </button>
            <button
              id="tab-news-embed"
              onClick={() => setPreviewMode("DISCORD_EMBED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                previewMode === "DISCORD_EMBED"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              💬 Discord Bot Live Embed
            </button>
            <button
              id="tab-news-config"
              onClick={() => setPreviewMode("CONFIG")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                previewMode === "CONFIG"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              ⚙️ Auto-Dispatch Settings
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Auto-Interval:</span>
            <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-xs font-semibold text-zinc-800 border border-zinc-200">
              Every {config.intervalHours} Hours
            </span>
            <span className="text-xs text-zinc-500 ml-2">Channel:</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-xs font-semibold text-indigo-700 border border-indigo-200">
              #{config.channelName}
            </span>
          </div>
        </div>
      </div>

      {/* Main View Mode Content */}
      {previewMode === "FEED" && (
        <div className="space-y-6">
          {/* Newspaper Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <span className="text-xs font-medium text-zinc-400 mr-2 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Region:
              </span>
              {[
                { key: "ALL", label: "All 13 Sources" },
                { key: "UK", label: "🇬🇧 UK (5)" },
                { key: "US", label: "🇺🇸 US (3)" },
                { key: "ASIA", label: "🌏 Asia (3)" },
                { key: "EUROPE", label: "🇪🇺 Europe (2)" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  id={`filter-region-${filter.key.toLowerCase()}`}
                  onClick={() => setFilterRegion(filter.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    filterRegion === filter.key
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="w-full md:w-72">
              <input
                id="search-news-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search headlines or publishers..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-zinc-50/50"
              />
            </div>
          </div>

          {/* 13 Newspapers Editorial Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 13 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 border border-zinc-200 animate-pulse h-48 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-200"></div>
                    <div className="h-4 bg-zinc-200 rounded w-28"></div>
                  </div>
                  <div className="space-y-2 my-4">
                    <div className="h-4 bg-zinc-200 rounded w-full"></div>
                    <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
                    <div className="h-3 bg-zinc-100 rounded w-5/6"></div>
                  </div>
                  <div className="h-3 bg-zinc-100 rounded w-20"></div>
                </div>
              ))
            ) : filteredArticles.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-zinc-200">
                <Newspaper className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-zinc-700">No headlines match the search criteria</p>
                <p className="text-xs text-zinc-400 mt-1">Try resetting the region filter or search keyword.</p>
              </div>
            ) : (
              paginatedArticles.map((article) => {
                const isSelected = selectedArticle?.sourceId === article.sourceId;
                return (
                  <div
                    key={article.sourceId}
                    id={`article-card-${article.sourceId}`}
                    onClick={() => setSelectedArticle(article)}
                    className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                      isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div>
                      {/* Source Metadata Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{article.sourceFlag}</span>
                          <div>
                            <span className="text-xs font-bold text-zinc-900 block leading-tight">
                              {article.sourceName}
                            </span>
                            <span className="text-[10px] text-zinc-400 block">{article.sourceCountry}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {article.category || "Top Story"}
                        </span>
                      </div>

                      {/* Headline Title */}
                      <h3 className="text-sm font-bold text-zinc-900 line-clamp-2 hover:text-indigo-600 transition-colors">
                        {article.title}
                      </h3>

                      {/* Snippet Description */}
                      <p className="text-xs text-zinc-500 mt-2 line-clamp-3 leading-relaxed">
                        {article.description}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {article.publishedAt}
                      </span>

                      <a
                        href={article.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <span>Full Article</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls Bar (Strictly 5 news per page) */}
          {filteredArticles.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>
                  Showing <strong className="text-zinc-900">{startIndex + 1}</strong> to{" "}
                  <strong className="text-zinc-900">
                    {Math.min(startIndex + pageSize, filteredArticles.length)}
                  </strong>{" "}
                  of <strong className="text-zinc-900">{filteredArticles.length}</strong> news headlines
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-200">
                  5 news per page
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="pagination-prev-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      id={`pagination-page-${pageNum}-btn`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                        safeCurrentPage === pageNum
                          ? "bg-indigo-600 text-white shadow-xs shadow-indigo-200"
                          : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  id="pagination-next-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Interactive Modal / Detail Reader for Selected Article */}
          {selectedArticle && (
            <div className="bg-white rounded-2xl p-6 border border-indigo-100 bg-linear-to-b from-indigo-50/20 to-white">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedArticle.sourceFlag}</span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Featured Daily Article from {selectedArticle.sourceName}
                    </span>
                    <h2 className="text-lg font-bold text-zinc-900">{selectedArticle.title}</h2>
                  </div>
                </div>

                <a
                  href={selectedArticle.link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>Read on {selectedArticle.sourceName}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-3">
                  <p className="text-sm text-zinc-700 leading-relaxed">{selectedArticle.description}</p>
                  <p className="text-xs text-zinc-500 italic">
                    Published: {selectedArticle.publishedAt} • Source: {selectedArticle.sourceCountry} • Editorial Tier: Top 13 Global Publications
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/80 space-y-2.5 text-xs">
                  <div className="font-bold text-zinc-800">Discord Command Preview</div>
                  <p className="text-zinc-600">
                    Server members can inspect this article directly in Discord using:
                  </p>
                  <div className="bg-zinc-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px]">
                    /news source paper:{selectedArticle.sourceId}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Mode: Discord Bot Live Embed Preview */}
      {previewMode === "DISCORD_EMBED" && (
        <div className="bg-zinc-900 rounded-2xl p-6 text-zinc-100 border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">AegisMod</span>
                  <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">BOT</span>
                  <span className="text-zinc-500 text-xs">Today at 12:00 PM</span>
                </div>
                <p className="text-xs text-zinc-400">Automated Dispatch in #{config.channelName}</p>
              </div>
            </div>

            <button
              id="embed-dispatch-btn"
              onClick={handleBroadcastNow}
              disabled={isBroadcasting}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Test Send to Discord</span>
            </button>
          </div>

          {/* Discord Embed Container */}
          <div className="border-l-4 border-indigo-500 bg-zinc-800/80 rounded-r-xl p-5 max-w-4xl shadow-md">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                <span>🌐 WORLD PRESS DIGEST</span>
                <span>•</span>
                <span>13 INTERNATIONAL NEWSPAPERS</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-700/80 text-zinc-300">
                Page {embedPage} of {Math.max(1, Math.ceil(articles.length / 5))} (5 news per page)
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Automated Global Editorial Briefing (1 Article Per Major Paper)
            </h3>
            <p className="text-xs text-zinc-300 mb-5 leading-relaxed">
              Curated daily intelligence report gathering exactly one headline from each of the world's most
              influential editorial newsrooms. Showing <strong>5 news per page</strong> for clean server readability.
            </p>

            {/* List of articles on current embed page (5 items) */}
            {(() => {
              const embedTotalPages = Math.max(1, Math.ceil(articles.length / 5));
              const safeEmbedPage = Math.min(Math.max(1, embedPage), embedTotalPages);
              const embedStart = (safeEmbedPage - 1) * 5;
              const currentEmbedArticles = articles.slice(embedStart, embedStart + 5);

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {currentEmbedArticles.map((art, idx) => (
                      <div
                        key={art.sourceId}
                        className="bg-zinc-900/90 rounded-lg p-3.5 border border-zinc-700/60 hover:border-indigo-500/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                            <span className="font-mono text-zinc-400">#{embedStart + idx + 1}</span>
                            <span>{art.sourceFlag}</span>
                            <span>{art.sourceName}</span>
                            <span className="text-[10px] text-zinc-400 font-normal">({art.sourceCountry})</span>
                          </div>
                          <span className="text-[10px] text-zinc-400">{art.publishedAt}</span>
                        </div>
                        <a
                          href={art.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-white hover:text-indigo-400 hover:underline line-clamp-2 block"
                        >
                          {art.title}
                        </a>
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{art.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Discord Interactive ActionRow (Next, Previous, Refresh) */}
                  <div className="pt-4 border-t border-zinc-700/60 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        id="embed-page-prev-btn"
                        onClick={() => setEmbedPage((p) => Math.max(1, p - 1))}
                        disabled={safeEmbedPage <= 1}
                        className="px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-xs font-semibold text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ◀ Previous (5)
                      </button>
                      <span className="px-3 py-1.5 rounded-md bg-indigo-600/40 border border-indigo-500/40 text-xs font-bold text-indigo-200">
                        Page {safeEmbedPage} / {embedTotalPages}
                      </span>
                      <button
                        id="embed-page-next-btn"
                        onClick={() => setEmbedPage((p) => Math.min(embedTotalPages, p + 1))}
                        disabled={safeEmbedPage >= embedTotalPages}
                        className="px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-xs font-semibold text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next (5) ▶
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id="embed-page-refresh-btn"
                        onClick={() => fetchNewsArticles(true)}
                        disabled={isRefreshing}
                        className="px-3 py-1.5 rounded-md bg-emerald-600/30 border border-emerald-500/50 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                        <span>Refresh Feeds</span>
                      </button>
                      <span className="text-[11px] text-zinc-500">5 news per page</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="mt-4 pt-3 border-t border-zinc-700/60 flex items-center justify-between text-[11px] text-zinc-500">
              <span>AegisMod Global News • Verified Editorial Feeds • 13 Publications</span>
              <span>Updated: Just now</span>
            </div>
          </div>
        </div>
      )}

      {/* View Mode: Auto-Dispatch Config */}
      {previewMode === "CONFIG" && (
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-lg font-bold text-zinc-900">Auto-Dispatch Configuration</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Configure automatic schedule broadcasts of the 13 famous newspapers digest to your Discord channels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Automated Scheduling */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-800 block mb-1">Auto-News Dispatch Status</label>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="toggle-autonews-enabled"
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => handleUpdateConfig({ enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                  <span className="text-xs font-medium text-zinc-700">
                    {config.enabled ? "Active (Automated Postings Enabled)" : "Paused"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-800 block mb-1">Destination Discord Channel</label>
                <input
                  id="input-news-channel"
                  type="text"
                  value={config.channelName}
                  onChange={(e) => handleUpdateConfig({ channelName: e.target.value.replace("#", "") })}
                  placeholder="e.g. world-news"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 font-mono"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  The bot will post embeds to #{config.channelName} on your server.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-800 block mb-1">Broadcast Interval (Hours)</label>
                <select
                  id="select-news-interval"
                  value={config.intervalHours}
                  onChange={(e) => handleUpdateConfig({ intervalHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50"
                >
                  <option value={1}>Every 1 Hour (Fast-breaking updates)</option>
                  <option value={3}>Every 3 Hours</option>
                  <option value={6}>Every 6 Hours (Recommended standard)</option>
                  <option value={12}>Every 12 Hours (Morning & Evening briefings)</option>
                  <option value={24}>Every 24 Hours (Daily press roundup)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-800 block mb-1">Notification Ping Role</label>
                <select
                  id="select-news-ping"
                  value={config.pingRole}
                  onChange={(e) => handleUpdateConfig({ pingRole: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50"
                >
                  <option value="none">No ping (Silent embed)</option>
                  <option value="news_subscribers">@News Subscriber role only</option>
                  <option value="everyone">@everyone (Important headlines only)</option>
                </select>
              </div>
            </div>

            {/* Right Column: Active Publications Status */}
            <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-900">Enforced 13 Famous Newspapers</span>
                <span className="text-xs font-semibold text-indigo-600">100% Policy Bound</span>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                In strict compliance with your specifications, the auto news feature will only pick news from these 13
                esteemed publications:
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {sources.map((s, i) => (
                  <div
                    key={s.id}
                    className="p-2 rounded-lg bg-white border border-zinc-200 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5 font-medium text-zinc-800">
                      <span>{s.flag}</span>
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">#{i + 1}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
                <span>Total Broadcasts Sent: {config.totalBroadcastsSent}</span>
                <span>Last Dispatched: {config.lastDispatchedAt ? new Date(config.lastDispatchedAt).toLocaleTimeString() : "Pending"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
