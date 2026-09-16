import { useEffect } from "react";

const TXN_STATUS_MESSAGES = [
  "Transaction Approved!",
  "Transaction Declined!",
  "Vendor Response Delayed",
  "No Available Vendors",
  "Transfer Confirmed",
  "Transfer Failed",
  "No Nearby FX Vendors",
  "Proposed Rate",
];

/**
 * Listens for transaction-status WebSocket messages that belong to a specific
 * active transaction, and routes them to the provided callback.
 *
 * Used by ClientDashboard to drive the TransactionStatusModal state without
 * duplicating the global NotificationSocket handler.
 *
 * @param {WebSocket|null} socket
 * @param {string|null}    activeTxId  - only process messages for this transaction
 * @param {(type: string, data: object) => void} onMessage
 */
export function useTxnStatusMessages(socket, activeTxId, onMessage) {
  useEffect(() => {
    // TEMP DEBUG — remove once FX banner visibility issue is diagnosed.
    console.log("[FX-DEBUG] useTxnStatusMessages effect run:", { hasSocket: !!socket, activeTxId });
    if (!socket || !activeTxId) return;

    const handler = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      const { message_type, txn_info } = data;
      console.log("[FX-DEBUG] raw WS message:", message_type, txn_info);

      if (!TXN_STATUS_MESSAGES.includes(message_type)) return;

      // Ignore messages for other transactions
      if (txn_info?.transaction_id && txn_info.transaction_id !== activeTxId) return;

      onMessage(message_type, data);
    };

    socket.addEventListener("message", handler);
    return () => socket.removeEventListener("message", handler);
  }, [socket, activeTxId, onMessage]);
}
