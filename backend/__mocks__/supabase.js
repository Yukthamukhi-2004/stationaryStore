/**
 * Mock Supabase client for unit tests.
 * Provides chainable query builders that return controlled test data.
 */

const mockState = {
  orders: [],
  products: [],
  payments: [],
  categories: [],
};

// Track which methods were called for assertion
const callTracker = {
  from: [],
  select: [],
  insert: [],
  update: [],
  delete: [],
  eq: [],
  lte: [],
  single: [],
};

function resetMockState() {
  mockState.orders = [];
  mockState.products = [];
  mockState.payments = [];
  mockState.categories = [];
  for (const key of Object.keys(callTracker)) {
    callTracker[key] = [];
  }
}

function resetMockData() {
  mockState.orders = [];
  mockState.products = [];
  mockState.payments = [];
  mockState.categories = [];
}

// ── Chainable Query Builder ──

function createQueryBuilder(table) {
  const builder = {
    _table: table,
    _select: "*",
    _filters: [],
    _orderField: null,
    _orderAsc: true,
    _singleResult: false,
    _insertData: null,
    _updateData: null,

    select(cols) {
      callTracker.select.push(cols);
      this._select = cols || "*";
      return this;
    },

    eq(field, value) {
      callTracker.eq.push({ field, value });
      this._filters.push({ type: "eq", field, value });
      return this;
    },

    lte(field, value) {
      callTracker.lte.push({ field, value });
      this._filters.push({ type: "lte", field, value });
      return this;
    },

    order(field, opts) {
      this._orderField = field;
      this._orderAsc = opts?.ascending !== false;
      return this;
    },

    single() {
      callTracker.single.push(true);
      this._singleResult = true;
      return this;
    },

    insert(data) {
      callTracker.insert.push(data);
      this._insertData = data;
      return this;
    },

    update(data) {
      callTracker.update.push(data);
      this._updateData = data;
      return this;
    },

    async then(resolve, reject) {
      try {
        const result = await this._execute();
        resolve(result);
      } catch (err) {
        reject(err);
      }
      return this;
    },

    async _execute() {
      let data = [...(mockState[this._table] || [])];

      // Apply filters
      for (const filter of this._filters) {
        if (filter.type === "eq") {
          data = data.filter((item) => item[filter.field] === filter.value);
        } else if (filter.type === "lte") {
          data = data.filter(
            (item) => item[filter.field] !== null && item[filter.field] <= filter.value
          );
        }
      }

      // Apply ordering
      if (this._orderField) {
        data.sort((a, b) => {
          const aVal = a[this._orderField] ?? 0;
          const bVal = b[this._orderField] ?? 0;
          return this._orderAsc ? aVal - bVal : bVal - aVal;
        });
      }

      if (this._singleResult) {
        return { data: data[0] || null, error: null };
      }

      return { data, error: null };
    },

    // Handle Promise-like chaining
    catch() {
      return this;
    },
  };

  return builder;
}

// ── Mock Supabase Client ──

const mockSupabase = {
  from(table) {
    callTracker.from.push(table);
    return createQueryBuilder(table);
  },
  auth: {
    getUser() {
      return Promise.resolve({ data: { user: { id: "mock-user-id", email: "admin@test.com" } }, error: null });
    },
    signInWithPassword() {
      return Promise.resolve({ data: { session: { access_token: "mock-token", refresh_token: "mock-refresh" } }, error: null });
    },
    signOut() {
      return Promise.resolve({ error: null });
    },
    setSession() {
      return Promise.resolve({ data: { session: null }, error: null });
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  },
};

module.exports = mockSupabase;
module.exports.resetMockState = resetMockState;
module.exports.resetMockData = resetMockData;
module.exports.mockState = mockState;
module.exports.callTracker = callTracker;
