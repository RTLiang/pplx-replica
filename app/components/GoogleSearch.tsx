"use client"

import { useEffect } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleSearch() {
  useEffect(() => {
    // Load the Google Custom Search script
    const script = document.createElement('script');
    script.src = "https://cse.google.com/cse.js?cx=34a5fad51cb1a4477";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove the script when component unmounts
      const scripts = document.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src.includes('cse.google.com')) {
          scripts[i].remove();
          break;
        }
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div className="gcse-searchresults-only"></div>
    </div>
  );
}
