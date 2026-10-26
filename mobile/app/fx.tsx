import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useMutation, useQuery } from "@apollo/client";
import { useAuth } from "../src/auth/AuthContext";
import { useNotificationSocket } from "../src/notifications/SocketProvider";
import { ACCEPT_PROPOSED_FX_RATE, CREATE_TRANSACTION, GENERATE_VIRTUAL_ACCOUNT, GET_TRANSACTIONS } from "../src/api/operations";
import { Button, Card, Field, Heading, Message, Screen, colors, textStyles } from "../src/ui";

const currencies = ["NGN", "USD", "GBP", "EUR", "CAD", "GHS", "XOF", "KES", "ZAR"];
export default function FxRequest() {
  const { user } = useAuth(); const [sourceCurrency, setSource] = useState("NGN"); const [destinationCurrency, setDestination] = useState("USD"); const [amount, setAmount] = useState(""); const [transferMode, setTransferMode] = useState("BANK_TRANSFER"); const [activeTxn, setActiveTxn] = useState<any>(null); const [error, setError] = useState(""); const [accountInfo, setAccountInfo] = useState<any>(null); const [acceptedRate, setAcceptedRate] = useState<number | null>(null); const [rateOffers, setRateOffers] = useState<any[]>([]); const [noVendors, setNoVendors] = useState(false);
  const socket = useNotificationSocket();
  const [createTxn, createState] = useMutation(CREATE_TRANSACTION); const [acceptRate, acceptState] = useMutation(ACCEPT_PROPOSED_FX_RATE); const [generateAccount] = useMutation(GENERATE_VIRTUAL_ACCOUNT);
  const history = useQuery(GET_TRANSACTIONS, { variables: { clientId: user?.id, txnType: "FX", pageCount: 10, pageNumber: 1 }, skip: !user?.id });
  const activeId = String(activeTxn?.id ?? "");
  const submit = async () => {
    if (!amount || Number(amount) <= 0 || sourceCurrency === destinationCurrency) { setError("Enter a positive amount and choose two different currencies."); return; }
    setError(""); setAccountInfo(null); setAcceptedRate(null); setRateOffers([]); setNoVendors(false); socket.clearLatestEvent();
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") { setError("Location permission is required to find nearby FX vendors."); return; }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = await createTxn({ variables: { transactionData: { amountToWithdraw: Number(amount), clientCurrentCoordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude }, collectionMode: "MEET_UP", transferMode, collectionLocation: "", txnType: "FX", sourceCurrencyCode: sourceCurrency, destinationCurrencyCode: destinationCurrency } } });
      const transaction = result.data?.initiateTransaction?.transaction; if (!transaction?.id) throw new Error("The server did not return a transaction ID.");
      setActiveTxn({ ...transaction, sourceCurrency, tenderedAmount: Number(amount) }); await history.refetch();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create FX request"); }
  };
  const accept = async (proposal: any) => {
    if (!activeId || !proposal?.vendor?.id || !Number(proposal?.proposed_rate)) return;
    setError("");
    try {
      const result = await acceptRate({ variables: { txnId: activeId, rate: Number(proposal.proposed_rate), vendorBusinessId: String(proposal.vendor.id) } });
      const transaction = result.data?.acceptProposedFxRate?.transaction; if (!transaction) throw new Error("Could not accept the quoted rate.");
      setAcceptedRate(Number(proposal.proposed_rate)); setActiveTxn(transaction);
      if (transaction.transferMode === "BANK_TRANSFER") { const accountResult = await generateAccount({ variables: { txnId: String(transaction.id) } }); setAccountInfo(accountResult.data?.generateVirtualAccount?.accountInfo ?? null); }
      Alert.alert("Rate accepted", "The FX vendor's rate was accepted."); await history.refetch();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not accept rate"); }
  };
  useEffect(() => { const info = socket.latestEvent?.txn_info; const eventTxnId = info?.txn_id || info?.transaction_id; if (!activeId || (eventTxnId && String(eventTxnId) !== activeId)) return; if (socket.latestEvent?.message_type === "Proposed Rate") { setRateOffers(info?.proposed_rates ?? []); setNoVendors(false); } if (socket.latestEvent?.message_type === "No Nearby FX Vendors") setNoVendors(true); if (["No Nearby FX Vendors", "Proposed Rate", "Transaction Approved!", "Transaction Declined!", "Transfer Confirmed", "Transfer Failed"].includes(socket.latestEvent?.message_type)) void history.refetch(); }, [socket.latestEvent, activeId]);
  return <Screen><Heading subtitle="Ask nearby FX vendors to quote the currencies and amount you need.">FX exchange request</Heading><Field label="Amount to exchange" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" /><Text style={textStyles.body}>You pay in</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{currencies.map((currency) => <Button key={`src-${currency}`} title={`${sourceCurrency === currency ? "✓ " : ""}${currency}`} secondary={sourceCurrency !== currency} onPress={() => setSource(currency)} />)}</View><Text style={textStyles.body}>You receive</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{currencies.map((currency) => <Button key={`dst-${currency}`} title={`${destinationCurrency === currency ? "✓ " : ""}${currency}`} secondary={destinationCurrency !== currency} onPress={() => setDestination(currency)} />)}</View><Text style={textStyles.body}>Payment method</Text><View style={{ flexDirection: "row", gap: 8 }}><Button title="Bank transfer" secondary={transferMode !== "BANK_TRANSFER"} onPress={() => setTransferMode("BANK_TRANSFER")} /><Button title="Card" secondary={transferMode !== "CARD"} onPress={() => setTransferMode("CARD")} /></View><Message error>{error}</Message><Button title="Find FX vendors" onPress={() => void submit()} busy={createState.loading} />
    {activeTxn ? <Card><Text style={textStyles.section}>Request {activeId}</Text><Text style={textStyles.body}>Pay {activeTxn.tenderedAmount ?? "—"} {activeTxn.sourceCurrency ?? sourceCurrency}; receive {activeTxn.amount ?? "—"} {activeTxn.currency ?? destinationCurrency}</Text><Text style={textStyles.muted}>Status: {activeTxn.status}{socket.connected ? " · Live connection" : " · Reconnecting to updates"}</Text>{acceptedRate ? <Message>Accepted rate: {acceptedRate}</Message> : null}{!acceptedRate ? rateOffers.map((offer: any, i: number) => <Card key={`${offer.vendor?.id}-${i}`}><Text style={textStyles.body}>{offer.vendor?.name || "FX vendor"}</Text><Text style={textStyles.muted}>Rate: {offer.proposed_rate} {destinationCurrency} per {sourceCurrency}</Text><Button title="Accept this rate" onPress={() => void accept(offer)} busy={acceptState.loading} /></Card>) : null}{noVendors ? <Message>No FX vendors are currently available nearby. You can submit another request later.</Message> : null}<Button title="View transaction details" secondary onPress={() => router.push(`/transaction/${activeId}`)} /></Card> : null}
    {accountInfo ? <Card><Text style={textStyles.section}>Transfer details</Text><Text style={textStyles.body}>{accountInfo.accountBankName} · {accountInfo.accountNumber}</Text><Text style={textStyles.body}>{accountInfo.accountName}</Text><Text style={textStyles.muted}>Amount: {accountInfo.amount} {accountInfo.currency}</Text><Text style={textStyles.muted}>Reference: {accountInfo.reference}</Text></Card> : null}
    <Text style={textStyles.section}>Recent FX transactions</Text>{(history.data?.transactions?.transactions ?? []).map((txn: any) => <Pressable key={txn.id} onPress={() => router.push(`/transaction/${txn.id}`)}><Card><Text style={textStyles.body}>{txn.amount} {txn.currency} · {txn.status}</Text><Text style={textStyles.muted}>{txn.business?.name || "FX request"} · {txn.dateCreated ? new Date(txn.dateCreated).toLocaleDateString() : ""}</Text></Card></Pressable>)}
  </Screen>;
}
