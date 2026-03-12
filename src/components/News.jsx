import { ExternalLink, Clock } from 'lucide-react';
import { useNews } from '../hooks/useNews';
import { timeAgo } from '../utils';

export function NewsCard({ article }) {
  return (
    <div className="bg-bg-card/60 border border-border rounded-xl p-4 hover:border-border-light transition-colors group">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-text-primary line-clamp-2 mb-1.5 group-hover:text-accent transition-colors">
            {article.headline}
          </h4>
          <p className="text-xs text-text-muted line-clamp-2 mb-2">{article.summary}</p>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="font-medium text-accent/70">{article.source}</span>
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <span>{timeAgo(article.datetime)}</span>
            </div>
          </div>
        </div>
        {article.image && (
          <img
            src={article.image}
            alt=""
            className="w-16 h-16 rounded-lg object-cover shrink-0"
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}
      </div>
    </div>
  );
}

export function NewsFeed() {
  const { data: news, loading } = useNews(null);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Market News</h1>
          <p className="text-text-muted text-sm mt-1">Latest financial headlines</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {news.map((article, i) => (
            <NewsCard key={article.id || i} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
