import { useState, useCallback } from "react";

// ── Persistent opportunity store (localStorage) ───────────────────────────────
// Keyed by business ID so opportunities for multiple businesses coexist cleanly.
// Structure: { [businessId]: opportunityData }

const STORE_KEY = "vendor_pending_opportunities";

const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeStore = (store) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {}
};

/** Persist an opportunity for every business ID in its businesses array. */
export const saveOpportunityToStore = (data) => {
  const businesses = data?.txn_info?.businesses ?? [];
  if (!businesses.length) return;
  const store = readStore();
  businesses.forEach((biz) => { store[String(biz.id)] = data; });
  writeStore(store);
};

/** Retrieve the pending opportunity for a specific business, or null. */
export const getOpportunityForBusiness = (businessId) => {
  if (!businessId) return null;
  return readStore()[String(businessId)] ?? null;
};

/** Remove the stored opportunity for every business ID in the data. */
export const clearOpportunityFromStore = (data) => {
  const businesses = data?.txn_info?.businesses ?? [];
  if (!businesses.length) return;
  const store = readStore();
  businesses.forEach((biz) => { delete store[String(biz.id)]; });
  writeStore(store);
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTransactionOpportunity() {
  const [opportunityData, setOpportunityData] = useState(null);

  /** Open the modal with the given data (does NOT write to localStorage). */
  const open = useCallback((data) => {
    setOpportunityData(data);
  }, []);

  /**
   * Close the modal.
   * Also removes the opportunity from localStorage so it is not re-shown
   * after the vendor has acted on it (ignore / accept / expired).
   */
  const close = useCallback(() => {
    setOpportunityData((prev) => {
      if (prev) clearOpportunityFromStore(prev);
      return null;
    });
  }, []);

  return {
    isOpen: !!opportunityData,
    opportunityData,
    open,
    close,
  };
}
