import { useState, useEffect } from 'react';

export function useIsMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    setIsMiniPay(!!(window.ethereum?.isMiniPay));
  }, []);

  return isMiniPay;
}
