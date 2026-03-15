import { useState, useCallback } from "react";


export function useTransactionOpportunity() {
  const [opportunityData, setOpportunityData] = useState(null);

  const open = useCallback((data) => {
    setOpportunityData(data);
  }, []);

  const close = useCallback(() => {
    setOpportunityData(null);
  }, []);

  return {
    isOpen: !!opportunityData,
    opportunityData,
    open,
    close,
  };
}