import { lazy, useState, createElement } from "react";

// CR-238: like React.lazy, plus .preload(). Once preloaded the page renders synchronously
// (no Suspense), so index.js can await the chunk and commit the full page in one pass.
export function lazyRoute(loader) {
  let mod = null, promise = null;
  const load = () => promise || (promise = loader().then((m) => { mod = m.default; return m; }));
  const Lazy = lazy(load);
  function Route(props) {
    const [Impl] = useState(() => mod || Lazy);
    return createElement(Impl, props);
  }
  Route.preload = load;
  return Route;
}
