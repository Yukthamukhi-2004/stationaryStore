/**
 * Creates a test factory that returns a mock Supabase query builder.
 * Each factory call creates an independent builder with its own closure,
 * so concurrent queries (e.g. via Promise.all) work correctly.
 *
 * Supports: .select(), .eq(), .lte(), .order(), .single(), .insert(),
 *           .update(), .delete(), .then(), .catch()
 *
 * Usage:
 *   const mockBuilder = createQueryBuilderFactory();
 *   mockSupabase.from.mockImplementation(() => mockBuilder(data, error));
 */
function createQueryBuilderFactory() {
  return function (data, error = null) {
    let filters = [];
    let orderField = null;
    let orderAsc = true;
    let isSingle = false;

    const builder = {
      select() { return builder; },
      range(start, end) {
        return builder;
      },
      eq(field, value) {
        filters.push({ type: "eq", field, value });
        return builder;
      },
      lte(field, value) {
        filters.push({ type: "lte", field, value });
        return builder;
      },
      order(field, opts) {
        orderField = field;
        orderAsc = opts?.ascending !== false;
        return builder;
      },
      single() {
        isSingle = true;
        return builder;
      },
      insert() { return builder; },
      update() { return builder; },
      delete() { return builder; },
      then(resolve) {
        let result;

        if (error) {
          result = { data: null, error };
        } else if (isSingle) {
          result = { data: data || null, error: null };
        } else {
          let arr = Array.isArray(data)
            ? [...data]
            : data
              ? [data]
              : [];

          for (const filter of filters) {
            if (filter.type === "lte") {
              arr = arr.filter(
                (item) =>
                  item[filter.field] !== null &&
                  item[filter.field] !== undefined &&
                  item[filter.field] <= filter.value,
              );
            } else if (filter.type === "eq") {
              arr = arr.filter(
                (item) => String(item[filter.field]) === String(filter.value),
              );
            }
          }

          if (orderField && arr.length > 0) {
            arr.sort((a, b) => {
              const aVal = a[orderField] ?? 0;
              const bVal = b[orderField] ?? 0;
              return orderAsc ? aVal - bVal : bVal - aVal;
            });
          }

          result = { data: arr, error: null };
        }

        return Promise.resolve(result).then(resolve);
      },
      catch() { return builder; },
    };

    return builder;
  };
}

module.exports = { createQueryBuilderFactory };
