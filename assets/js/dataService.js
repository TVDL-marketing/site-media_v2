window.DataService = (() => {
  let cache = null;

  async function tryFetch(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(path);
    return res.json();
  }

  async function load() {
    if (cache) return cache;
    try {
      const [brands, models, users, contents] = await Promise.all([
        tryFetch('data/brands.json'),
        tryFetch('data/models.json'),
        tryFetch('data/users.json'),
        tryFetch('data/contents.json')
      ]);
      cache = { brands, models, users, contents };
    } catch (e) {
      cache = window.__STATIC_DATA;
    }
    return cache;
  }

  return { load };
})();
