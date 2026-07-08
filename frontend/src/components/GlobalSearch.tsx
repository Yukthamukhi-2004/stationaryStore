import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  notebookProducts,
  accessoriesProducts,
  booksProducts,
  artMaterialsProducts,
  type ProductItem,
} from "../data/products";

const allProducts: (ProductItem & { categoryLabel: string })[] = [
  ...notebookProducts.map((p) => ({ ...p, categoryLabel: "Notebooks" })),
  ...accessoriesProducts.map((p) => ({ ...p, categoryLabel: "Accessories" })),
  ...booksProducts.map((p) => ({ ...p, categoryLabel: "Books" })),
  ...artMaterialsProducts.map((p) => ({
    ...p,
    categoryLabel: "Art Materials",
  })),
];

const categoryRoutes: Record<string, string> = {
  notebooks: "/shopping/notebooks",
  accessories: "/shopping/accessories",
  books: "/shopping/books",
  "art-materials": "/shopping/art-materials",
};

const INITIAL_VISIBLE = 4;
const MIN_QUERY_LENGTH = 1;

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    (ProductItem & { categoryLabel: string })[]
  >([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounced filtering
  useEffect(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      setExpanded(false);
      setHighlightIdx(-1);
      return;
    }

    const q = query.trim().toLowerCase();
    const timer = setTimeout(() => {
      const matches = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q),
      );
      setSuggestions(matches);
      setOpen(matches.length > 0);
      setExpanded(false);
      setHighlightIdx(-1);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

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

  const remainingCount = suggestions.length - INITIAL_VISIBLE;

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

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
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
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
              setQuery("");
              setSuggestions([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            className="global-search-dropdown"
            id="search-suggestions"
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="global-search-dropdown-header">
              {expanded
                ? `All suggestions (${suggestions.length})`
                : `Suggestions (${suggestions.length})`}
            </div>
            <div
              className={`global-search-list ${expanded ? "expanded" : ""}`}
              ref={listRef}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
