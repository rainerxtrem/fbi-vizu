export const THEME_KEY = "fbi-theme";

/**
 * Runs in <head> before first paint so the correct theme class is on <html>
 * with no flash. Kept tiny and dependency-free.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t;}catch(e){}})();`;
