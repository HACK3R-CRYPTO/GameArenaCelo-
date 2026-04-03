import { useState, useEffect } from 'react';

export function useIsMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    const detected = !!(window.ethereum?.isMiniPay);
    console.log('[MiniPay] detected:', detected, 'window.ethereum:', !!window.ethereum);
    setIsMiniPay(detected);
  }, []);

  return isMiniPay;
}
