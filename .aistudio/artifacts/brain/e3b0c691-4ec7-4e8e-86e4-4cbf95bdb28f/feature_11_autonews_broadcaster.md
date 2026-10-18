# Feature 11: AutoNews 13-Newspaper Feeds & Background Scheduler (`/news`)

## 1. Overview & Purpose
Keeping teenagers informed with credible, balanced global journalism helps counter misinformation and creates positive conversational topics.
The **AutoNews Broadcaster** (`autoNewsBotService.ts`, `newsService.ts`) automatically fetches, curates, and delivers world news articles from **13 internationally renowned newspaper publications** on an automated background schedule or on-demand slash command.

---

## 2. Exactly 13 Famous Newspaper Feeds

AegisMod specifically aggregates headlines from 13 premier verified sources:
1. **BBC News**
2. **The New York Times**
3. **The Wall Street Journal**
4. **The Guardian**
5. **The Washington Post**
6. **Reuters**
7. **CNN**
8. **The Economist**
9. **Financial Times**
10. **Bloomberg**
11. **Associated Press (AP)**
12. **NPR**
13. **TIME Magazine**

---

## 3. Interactive Multi-Page Pagination

The 13 articles are formatted into 3 rich embed pages with interactive Discord buttons:
- **Page 1:** Articles 1 – 5
- **Page 2:** Articles 6 – 10
- **Page 3:** Articles 11 – 13
- **Interactive ActionRow Controls:**
  - `[ ◀ Previous ]` (Navigates back)
  - `[ Page 1/3 (5 Articles) ]` (Disabled status indicator)
  - `[ Next ▶ ]` (Navigates forward)
  - `[ 🔄 Refresh Feeds ]` (Fetches fresh articles immediately)

---

## 4. Background Auto-Broadcaster & Persistence

### Scheduler Lifecycle
- **Interval:** Configurable in hours (default: every 4 hours; range 1–24 hours).
- **Target Channel:** Configurable via `/news config channel:#world-news interval_hours:4 enabled:true` (or `/news configure`).
- **Persistent Disk Configuration (`auto_news_config.json`):**
  ```json
  {
    "enabled": true,
    "channelName": "world-news",
    "intervalHours": 4,
    "lastBroadcast": "2026-10-18T05:00:00Z",
    "totalBroadcasts": 42
  }
  ```
- **Self-Healing:** Upon bot restart or host reboot, the scheduler immediately reads `auto_news_config.json`, calculates remaining interval time, and restarts the broadcast timer seamlessly.
