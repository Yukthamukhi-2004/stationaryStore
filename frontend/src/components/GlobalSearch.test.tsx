import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GlobalSearch from "./GlobalSearch";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Strip animation props — return children directly so inner content renders
vi.mock("framer-motion", () => {
  function passThrough(props: Record<string, unknown>) {
    return props.children ?? null;
  }
  return {
    motion: {
      div: passThrough,
      nav: passThrough,
      span: ({ children }: Record<string, unknown>) => children ?? null,
      img: () => null,
      p: passThrough,
      h2: passThrough,
      h3: passThrough,
    },
    AnimatePresence: ({ children }: { children: unknown }) => children ?? null,
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup() {
  const user = userEvent.setup();
  render(<GlobalSearch />);
  return { user };
}

async function typeQuery(
  user: ReturnType<typeof userEvent.setup>,
  text: string,
) {
  const input = screen.getByRole("combobox", { name: /search products/i });
  await user.clear(input);
  if (text) {
    await user.type(input, text);
  }
  return input;
}

function getSuggestions() {
  return screen.queryAllByRole("option");
}

function getSeeMore() {
  return screen.queryByRole("button", { name: /see more/i });
}

function getSeeLess() {
  return screen.queryByRole("button", { name: /see less/i });
}

beforeEach(() => {
  mockNavigate.mockReset();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GlobalSearch — initial render", () => {
  it("renders the search input with correct placeholder and role", () => {
    render(<GlobalSearch />);
    const input = screen.getByRole("combobox", { name: /search products/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Search products…");
  });

  it("does not show suggestion items on initial render", () => {
    render(<GlobalSearch />);
    expect(getSuggestions()).toHaveLength(0);
  });

  it("does not show the clear button when input is empty", () => {
    render(<GlobalSearch />);
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });
});

describe("GlobalSearch — input threshold (1+ characters)", () => {
  it("shows no suggestions when input is empty", async () => {
    const { user } = setup();
    await typeQuery(user, "");
    await new Promise((r) => setTimeout(r, 50));
    expect(getSuggestions()).toHaveLength(0);
  });

  it("shows suggestions after typing just 1 matching character", async () => {
    const { user } = setup();
    await typeQuery(user, "b");
    await waitFor(() => {
      expect(getSuggestions().length).toBeGreaterThan(0);
    });
  });

  it("shows no suggestions when typing 1+ characters with no match", async () => {
    const { user } = setup();
    await typeQuery(user, "Zz");
    await new Promise((r) => setTimeout(r, 400));
    expect(getSuggestions()).toHaveLength(0);
  });

  it("resets suggestions when input is cleared", async () => {
    const { user } = setup();
    await typeQuery(user, "n");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    await typeQuery(user, "");
    await waitFor(() => expect(getSuggestions()).toHaveLength(0));
  });
});

describe("GlobalSearch — product filtering", () => {
  it("filters products by name (case insensitive)", async () => {
    const { user } = setup();
    await typeQuery(user, "pencil");

    await waitFor(() => {
      const suggestions = getSuggestions();
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach((s) => {
        expect(s.textContent?.toLowerCase()).toContain("pencil");
      });
    });
  });

  it("filters products by category name", async () => {
    const { user } = setup();
    await typeQuery(user, "notebooks");

    await waitFor(() => {
      const suggestions = getSuggestions();
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach((s) => {
        expect(s.textContent).toContain("Notebooks");
      });
    });
  });

  it("shows at most 4 items initially when there are many matches", async () => {
    const { user } = setup();
    // "book" matches many products across categories
    await typeQuery(user, "book");

    await waitFor(() => {
      const suggestions = getSuggestions();
      expect(suggestions.length).toBeLessThanOrEqual(4);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  it("shows to 4 or fewer when there are few matches", async () => {
    const { user } = setup();
    // "crayons" matches only 1 product
    await typeQuery(user, "crayons");

    await waitFor(() => {
      const suggestions = getSuggestions();
      expect(suggestions.length).toBeLessThanOrEqual(4);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  it("shows product name, category, and price in each suggestion", async () => {
    const { user } = setup();
    await typeQuery(user, "marker");

    await waitFor(() => {
      const suggestions = getSuggestions();
      expect(suggestions.length).toBeGreaterThan(0);
      const first = suggestions[0];
      expect(first.textContent).toContain("Marker");
      expect(first.textContent).toContain("₹30");
      expect(first.textContent).toContain("Accessories");
    });
  });
});

describe("GlobalSearch — see more / expand", () => {
  it("shows 'See more' button when there are more than 4 matches", async () => {
    const { user } = setup();
    await typeQuery(user, "book");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    expect(getSeeMore()).toBeInTheDocument();
    expect(getSeeMore()?.textContent).toMatch(/remaining/i);
  });

  it("does not show 'See more' button when 4 or fewer matches", async () => {
    const { user } = setup();
    await typeQuery(user, "crayons");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    expect(getSeeMore()).not.toBeInTheDocument();
  });

  it("shows more items after clicking 'See more'", async () => {
    const { user } = setup();
    await typeQuery(user, "book");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    const initialCount = getSuggestions().length;
    expect(initialCount).toBeLessThanOrEqual(4);

    await user.click(getSeeMore()!);

    // Now more items should appear
    await waitFor(() => {
      expect(getSuggestions().length).toBeGreaterThan(initialCount);
    });
  });

  it("shows 'See less' button after expanding", async () => {
    const { user } = setup();
    await typeQuery(user, "book");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    await user.click(getSeeMore()!);

    await waitFor(() => {
      expect(getSeeLess()).toBeInTheDocument();
      expect(getSeeLess()?.textContent).toMatch(/see less/i);
    });
  });

  it("collapses back to 4 items when 'See less' is clicked", async () => {
    const { user } = setup();
    await typeQuery(user, "book");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));
    await user.click(getSeeMore()!);
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(4));

    await user.click(getSeeLess()!);

    await waitFor(() => {
      expect(getSuggestions().length).toBeLessThanOrEqual(4);
    });
  });

  it("resets to collapsed state when query changes", async () => {
    const { user } = setup();
    await typeQuery(user, "book");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));
    await user.click(getSeeMore()!);
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(4));

    await typeQuery(user, "pencil");
    await waitFor(() => {
      expect(getSuggestions().length).toBeLessThanOrEqual(4);
    });
  });
});

describe("GlobalSearch — navigation", () => {
  it("navigates to the correct category route when a suggestion is clicked", async () => {
    const { user } = setup();
    await typeQuery(user, "novels");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    await user.click(getSuggestions()[0]);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/shopping/books");
  });

  it("navigates to accessories route for an accessory product", async () => {
    const { user } = setup();
    await typeQuery(user, "geometry");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    await user.click(getSuggestions()[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/shopping/accessories");
  });

  it("does not navigate on initial render", () => {
    render(<GlobalSearch />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("GlobalSearch — clear button", () => {
  it("shows the clear button when input has text", async () => {
    const { user } = setup();
    await typeQuery(user, "test");
    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  it("clears the input and hides suggestions when clear is clicked", async () => {
    const { user } = setup();
    await typeQuery(user, "note");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    await user.click(screen.getByLabelText("Clear search"));

    const input = screen.getByRole("combobox", {
      name: /search products/i,
    }) as HTMLInputElement;
    expect(input.value).toBe("");
    await waitFor(() => expect(getSuggestions()).toHaveLength(0));
  });
});

describe("GlobalSearch — keyboard navigation", () => {
  it("highlights the first item on ArrowDown when starting from no selection", async () => {
    const { user } = setup();
    await typeQuery(user, "book");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    const input = screen.getByRole("combobox");
    await user.type(input, "{ArrowDown}");

    expect(getSuggestions()[0]).toHaveAttribute("aria-selected", "true");
  });

  it("highlights the first item on ArrowUp when no item is selected", async () => {
    const { user } = setup();
    await typeQuery(user, "book");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    const input = screen.getByRole("combobox");
    await user.type(input, "{ArrowUp}");

    expect(getSuggestions()[0]).toHaveAttribute("aria-selected", "true");
  });

  it("highlights the fourth visible item after pressing ArrowDown 4 times", async () => {
    const { user } = setup();
    // "book" returns >4 matches but only 4 are visible
    await typeQuery(user, "book");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    const input = screen.getByRole("combobox");
    // Press ArrowDown 4 times: -1 → 0 → 1 → 2 → 3
    for (let i = 0; i < 4; i++) {
      await user.type(input, "{ArrowDown}");
    }

    // Fourth visible item (index 3) should be highlighted
    expect(getSuggestions()[3]).toHaveAttribute("aria-selected", "true");
  });

  it("selects the highlighted item on Enter", async () => {
    const { user } = setup();
    await typeQuery(user, "single ruled");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    const input = screen.getByRole("combobox");
    await user.type(input, "{ArrowDown}");
    await user.type(input, "{Enter}");

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/shopping/notebooks");
  });

  it("removes suggestions on Escape", async () => {
    const { user } = setup();
    await typeQuery(user, "book");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    const input = screen.getByRole("combobox");
    await user.type(input, "{Escape}");

    await waitFor(() => expect(getSuggestions()).toHaveLength(0));
  });

  it("does nothing on Enter when no item is highlighted", async () => {
    const { user } = setup();
    await typeQuery(user, "book");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    const input = screen.getByRole("combobox");
    await user.type(input, "{Enter}");

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("GlobalSearch — close on outside click", () => {
  it("closes the dropdown when clicking outside the component", async () => {
    const { user } = setup();
    await typeQuery(user, "book");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    await user.click(document.body);

    await waitFor(() => expect(getSuggestions()).toHaveLength(0));
  });
});

describe("GlobalSearch — aria attributes", () => {
  it("sets aria-expanded on the input when dropdown is open", async () => {
    const { user } = setup();
    const input = screen.getByRole("combobox", { name: /search products/i });
    expect(input).toHaveAttribute("aria-expanded", "false");

    await typeQuery(user, "crayons");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("sets aria-activedescendant on the input when an item is highlighted", async () => {
    const { user } = setup();
    await typeQuery(user, "book");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    const input = screen.getByRole("combobox");
    expect(input).not.toHaveAttribute("aria-activedescendant");

    await user.type(input, "{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", "search-option-0");
  });

  it("assigns role=option and id to each suggestion", async () => {
    const { user } = setup();
    await typeQuery(user, "pencil");
    await waitFor(() => expect(getSuggestions().length).toBeGreaterThan(0));

    getSuggestions().forEach((option, idx) => {
      expect(option).toHaveAttribute("role", "option");
      expect(option).toHaveAttribute("id", `search-option-${idx}`);
    });
  });
});
