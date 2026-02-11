window.Router = (() => {
  const parse = () => {
    const raw = location.hash.replace(/^#/, '') || '/login';
    const [path, queryStr] = raw.split('?');
    const query = Object.fromEntries(new URLSearchParams(queryStr || '').entries());
    return { path, query };
  };

  const go = (path, query = {}) => {
    const qs = new URLSearchParams(query).toString();
    location.hash = `${path}${qs ? `?${qs}` : ''}`;
  };

  const onChange = (cb) => {
    window.addEventListener('hashchange', () => cb(parse()));
    cb(parse());
  };

  return { parse, go, onChange };
})();
