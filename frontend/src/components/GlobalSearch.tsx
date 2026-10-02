import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, mapBackendProduct, type Product } from "../lib/api";
import type { ProductItem } from "../data/products";

const categoryRoutes: Record<string, string> = {
  notebooks: "/shopping/notebooks",
  accessories: "/shopping/accessories",
  books: "/shopping/books",
  "art-materials": "/shopping/art-materials",
};

const categorySlugs: Record<string, string> = {
  notebooks: "notebooks",
  books: "books",
  accessories: "accessories",
  pens: "accessories",
  "office supplies": "accessories",
  "school essentials": "accessories",
  "art supplies": "art-materials",
  "art materials": "art-materials",
};

const INITIAL_VISIBLE = 4;
const MIN_QUERY_LENGTH = 1;

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    (ProductItem & { categoryLabel: string })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounced search against live products and category data.
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const [nameMatches, categories] = await Promise.all([
            api.searchProducts(q),
            api.getCategories(),
          ]);
          const matchingCategories = categories.filter((category) =>
            category.name.toLowerCase().includes(q.toLowerCase()),
          );
          const categoryMatches = await Promise.all(
            matchingCategories.map((category) =>
              api.getProductsByCategory(category.id),
            ),
          );

          if (cancelled) return;

          const productsById = new Map<number, Product>();
          for (const product of nameMatches)
            productsById.set(product.id, product);
          for (const product of categoryMatches.flat()) {
            productsById.set(product.id, product);
          }

          const categoryNames = new Map(
            categories.map((category) => [category.id, category.name]),
          );
          const matches = Array.from(productsById.values()).map((product) => {
            const categoryLabel =
              categoryNames.get(product.category_id ?? -1) ?? "Other";
            const category = categorySlugs[categoryLabel.toLowerCase()] ?? "";
            return {
              ...mapBackendProduct(product, category),
              categoryLabel,
            };
          });

          setSuggestions(matches);
          setOpen(true);
        } catch {
          if (cancelled) return;
          setSuggestions([]);
          setSearchError("Search failed. Try again.");
          setOpen(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, retryToken]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visibleSuggestions = expanded
    ? suggestions
    : suggestions.slice(0, INITIAL_VISIBLE);

  const remainingCount = Math.max(0, suggestions.length - INITIAL_VISIBLE);

  const select = useCallback(
    (product: ProductItem & { categoryLabel: string }) => {
      setOpen(false);
      setQuery("");
      setSuggestions([]);
      setExpanded(false);
      const route = categoryRoutes[product.category];
      if (route) navigate(route);
    },
    [navigate],
  );

  const handleToggleExpand = () => {
    if (expanded) {
      setExpanded(false);
    } else {
      setExpanded(true);
      setTimeout(() => {
        listRef.current?.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }, 50);
    }
  };

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    if (nextQuery.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setSearchError(null);
      setOpen(false);
      setExpanded(false);
      setHighlightIdx(-1);
      return;
    }

    setLoading(true);
    setSearchError(null);
    setSuggestions([]);
    setOpen(true);
    setExpanded(false);
    setHighlightIdx(-1);
  };

  const handleRetry = () => {
    setLoading(true);
    setSearchError(null);
    setSuggestions([]);
    setExpanded(false);
    setHighlightIdx(-1);
    setRetryToken((token) => token + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || loading || searchError || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < suggestions.length) {
          select(suggestions[highlightIdx]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setExpanded(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className="global-search" ref={containerRef}>
      <div className="global-search-input-wrap">
        <span className="global-search-icon">🔍</span>{" "}
        <input
          ref={inputRef}
          type="text"
          className="global-search-input"
          placeholder="Search products…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-activedescendant={
            highlightIdx >= 0 ? `search-option-${highlightIdx}` : undefined
          }
          role="combobox"
          aria-expanded={open}
          autoComplete="off"
        />
        {query && (
          <button
            className="global-search-clear"
            onClick={() => {
              handleQueryChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && query.trim().length >= MIN_QUERY_LENGTH && (
          <motion.div
            className="global-search-dropdown"
            id="search-suggestions"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {loading ? (
              <div className="global-search-state" role="status">
                Searching products...
              </div>
            ) : searchError ? (
              <div
                className="global-search-state global-search-state--error"
                role="alert"
              >
                <span>{searchError}</span>
                <button
                  className="global-search-retry"
                  type="button"
                  onClick={handleRetry}
                >
                  Retry
                </button>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="global-search-state" role="status">
                No products found.
              </div>
            ) : (
              <>
                <div className="global-search-dropdown-header">
                  {expanded
                    ? `All suggestions (${suggestions.length})`
                    : `Suggestions (${suggestions.length})`}
                </div>
                <div
                  className={`global-search-list ${expanded ? "expanded" : ""}`}
                  ref={listRef}
                  role="listbox"
                >
                  {visibleSuggestions.map((product, idx) => (
                    <button
                      key={product.id}
                      id={`search-option-${idx}`}
                      role="option"
                      aria-selected={idx === highlightIdx}
                      className={`global-search-item ${idx === highlightIdx ? "highlighted" : ""} ${expanded ? "compact" : ""}`}
                      onClick={() => select(product)}
                      onMouseEnter={() => setHighlightIdx(idx)}
                    >
                      <span className="gsi-image">
                        <img src={product.image} alt={product.name} />
                      </span>
                      <span className="gsi-info">
                        <span className="gsi-name">{product.name}</span>
                        <span className="gsi-meta">
                          <span className="gsi-category">
                            {product.categoryLabel}
                          </span>
                          <span className="gsi-price">
                            ₹{product.price.toFixed(2)}
                          </span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                {remainingCount > 0 && (
                  <button
                    className="global-search-see-more"
                    onClick={handleToggleExpand}
                    type="button"
                  >
                    {expanded
                      ? `See less ↑`
                      : `See more (${remainingCount} remaining) ↓`}
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
