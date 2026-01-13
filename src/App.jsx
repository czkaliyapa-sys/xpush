import styles from "./style";
import { useEffect } from "react";
import HomePage from "./HomePage";





const App = () => {


// Nav, footer, cookie consent, and ChatBot are provided by Layout

  // Route-level SEO for Home page
  useEffect(() => {
    const title = 'Xtrapush Gadgets : A little push to get you there';
    const description = 'Explore and shop phones, tablets, computers, and accessories. Enjoy warranty, flexible finance, and trade‑in options at Xtrapush Gadgets.';
    const keywords = 'Xtrapush Gadgets, Xtrapush, gadgets, phones, smartphones, tablets, computers, laptops, PCs, accessories, chargers, cases, headphones, earbuds, smartwatches, wearables, warranty, finance, trade-in';
    const canonicalHref = 'https://itsxtrapush.com/';

    document.title = title;

    const setNamedMeta = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setPropertyMeta = (prop, content) => {
      let tag = document.querySelector(`meta[property="${prop}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', prop);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Update description and keywords
    setNamedMeta('description', description);
    setNamedMeta('keywords', keywords);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);

    // Open Graph
    setPropertyMeta('og:title', 'Xtrapush Gadgets : A little push to get you there');
    setPropertyMeta('og:description', description);
    setPropertyMeta('og:url', canonicalHref);

    // Twitter
    setNamedMeta('twitter:title', 'Xtrapush Gadgets : A little push to get you there');
    setNamedMeta('twitter:description', description);
  }, []);

  return (
    <div className="deep bg-primary w-full overflow-hidden">
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <HomePage />
        </div>
      </div>
    </div>
  );

};

export default App;