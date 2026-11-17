export const isIOS = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isIphoneIpadIpod = /iphone|ipad|ipod/.test(ua);
  const isIpadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isIphoneIpadIpod || isIpadOS;
};

export const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
};

export const isInAppBrowser = () => {
  const ua = navigator.userAgent.toLowerCase();
  return /instagram|fbav|fba|line|twitter|snapchat|linkedin/i.test(ua);
};
