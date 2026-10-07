import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getCanonicalInitialUrl } from "./lib/opaque-routes";

// Convert old direct and hash-based page URLs to the /index/... routes.
// Keep the public root invitation link exactly as
// /?invite=CODE so it can open the registration form.
(function normalizeInitialAppUrl() {
  const { pathname, search, hash } = window.location;
  const canonicalUrl = getCanonicalInitialUrl(window.location);
  if (canonicalUrl && canonicalUrl !== `${pathname}${search}${hash}`) {
    window.history.replaceState(null, "", canonicalUrl);
  }
})();

document.addEventListener("contextmenu", (e) => {
  if ((e.target as HTMLElement).tagName === "IMG") {
    e.preventDefault();
  }
});

document.addEventListener("dragstart", (e) => {
  if ((e.target as HTMLElement).tagName === "IMG") {
    e.preventDefault();
  }
});

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
