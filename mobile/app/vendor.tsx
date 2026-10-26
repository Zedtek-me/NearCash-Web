import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "@apollo/client";
import * as Location from "expo-location";
import { useAuth } from "../src/auth/AuthContext";
import { useNotificationSocket } from "../src/notifications/SocketProvider";
import { ACCEPT_TRANSACTION_OPPORTUNITY, GET_ANALYTICS, GET_CLIENTS, GET_SUB_BUSINESSES, GET_TRANSACTIONS, INITIATE_VENDOR_TO_VENDOR_TRANSACTION, UPDATE_TRANSACTION_STATUS } from "../src/api/operations";
import { Button, Card, Field, Heading, Message, Screen, colors } from "../src/ui";
import { DatePickerField, FilterChips, FilterPanel, Pagination } from "../src/dashboard/FilterControls";
import { ProfileMenu } from "../src/dashboard/ProfileMenu";

type Business = { id: string; name: string; currency?: string; businessType?: string; availableLiquidity?: number; address?: string; isPrimary?: boolean };
type Transaction = { id: string; amount?: number; currency?: string; status?: string; txnType?: string; client?: { fullName?: string; id?: string }; vendor?: { fullName?: string }; business?: { name?: string } };
type Analytics = { totalTransactions?: number; totalChargesPlusExtra?: number; fulfilledTransactions?: number; percentageReductionFromPastMonth?: number };

const money = (value?: number) => Number(value || 0).toLocaleString("en-NG");

export default function VendorHome() {
  const { user } = useAuth();
  const displayName = user?.firstName || user?.username || "there";
  const accountType = (user?.userType || "vendor").toLowerCase();
  const socket = useNotificationSocket();
  const [business, setBusiness] = useState<Business | null>(null);
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState("BANK_TRANSFER");
  const [error, setError] = useState("");
  const [offerBusinessId, setOfferBusinessId] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerRate, setOfferRate] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [txnTypeFilter, setTxnTypeFilter] = useState("");
  const [requestTypeFilter, setRequestTypeFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showBusinessChooser, setShowBusinessChooser] = useState(false);
  const [showTransactionFilters, setShowTransactionFilters] = useState(false);

  const businessesQuery = useQuery(GET_SUB_BUSINESSES, { variables: { ownerId: user?.id, pageCount: 50, pageNumber: 1 }, skip: !user?.id, fetchPolicy: "network-only" });
  const businesses: Business[] = businessesQuery.data?.businesses?.businesses ?? [];
  useEffect(() => { if (!business && businesses.length) setBusiness(businesses.find((item) => item.isPrimary) ?? businesses[0]); }, [business, businesses]);

  const transactions = useQuery(GET_TRANSACTIONS, { variables: { businessId: business?.id, clientId: clientFilter || undefined, status: statusFilter || undefined, txnType: txnTypeFilter || undefined, requestType: requestTypeFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, pageCount: 10, pageNumber }, skip: !business?.id, fetchPolicy: "network-only" });
  const clientOptionsQuery = useQuery(GET_CLIENTS, { variables: { vendorId: user?.id || "", businessId: business?.id || "", pageCount: 100, pageNumber: 1 }, skip: !user?.id || !business?.id });
  const analytics = useQuery(GET_ANALYTICS, { variables: { userType: String(user?.userType || "VENDOR").toLowerCase(), businessId: business?.id }, skip: !business?.id });
  const [source, sourceState] = useMutation(INITIATE_VENDOR_TO_VENDOR_TRANSACTION);
  const [updateStatus, statusState] = useMutation(UPDATE_TRANSACTION_STATUS);
  const [acceptOpportunity, acceptState] = useMutation(ACCEPT_TRANSACTION_OPPORTUNITY);
  const opportunityBusinesses: Business[] = socket.opportunity?.txn_info?.businesses ?? [];
  const isV2VOpportunity = socket.opportunity?.message_type === "Liquidity Request!";
  const isFxOpportunity = socket.opportunity?.message_type === "New FX Transaction Interest";
  const metrics: Analytics = analytics.data?.analytics;
  const transactionList: Transaction[] = transactions.data?.transactions?.transactions ?? [];
  const transactionPages = transactions.data?.transactions?.pagination?.totalPages ?? 1;
  const clients: Array<{ id: string; fullName?: string; email?: string }> = clientOptionsQuery.data?.clients ?? [];

  useEffect(() => {
    setOfferBusinessId(opportunityBusinesses.length === 1 ? String(opportunityBusinesses[0].id) : "");
    setOfferAmount(""); setOfferRate("");
  }, [socket.opportunity]);

  const requestLiquidity = async () => {
    if (!business || Number(amount) <= 0) { setError("Choose a business and enter a valid amount."); return; }
    setError("");
    try {
      const result = await source({ variables: { data: { amount: Number(amount), txnType: business.businessType || "LOCAL", currencyCode: business.currency || "NGN", businessId: business.id, transferMode: payment } } });
      Alert.alert("Request sent", result.data?.initiateVendorToVendorTransaction?.message || "Liquidity sourcing request created.");
      setAmount(""); await transactions.refetch();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not source liquidity"); }
  };

  const changeStatus = async (txnId: string, status: string) => {
    setError("");
    try { await updateStatus({ variables: { txnId, status } }); await transactions.refetch(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update transaction"); }
  };

  const shareLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") { setError("Location permission is needed to share your live vendor location."); return; }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    socket.send({ message_type: "vendor_location_update", vendor_id: user?.id, location: { latitude: position.coords.latitude, longitude: position.coords.longitude }, business_id: business?.id });
  };

  const acceptOffer = async () => {
    const offer = socket.opportunity;
    if (!offer || !offerBusinessId) return;
    const txn = offer.txn_info || {};
    const variables: Record<string, unknown> = { txnId: String(txn.txn_id || ""), txnRef: txn.txn_ref, businessId: offerBusinessId };
    if (isV2VOpportunity) {
      if (!offerAmount || Number(offerAmount) <= 0) { setError("Enter a valid fee proposal."); return; }
      variables.proposedAmount = Number(offerAmount); variables.isVendorToVendor = true;
    }
    if (isFxOpportunity) {
      if (!offerRate || Number(offerRate) <= 0) { setError("Enter a valid FX rate proposal."); return; }
      variables.proposedRate = Number(offerRate);
    }
    setError("");
    try {
      const result = await acceptOpportunity({ variables });
      const message = result.data?.acceptTransactionOpportunity?.message;
      if (message !== "opportunity_ack") throw new Error(message || "The opportunity could not be accepted.");
      socket.clearOpportunity(); await transactions.refetch();
      Alert.alert("Opportunity accepted", "The request is now linked to your business.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not accept opportunity"); }
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <View style={styles.welcome}><Heading subtitle={accountType}>{`Welcome ${displayName}`}</Heading></View>
        <ProfileMenu />
      </View>
      <View style={styles.quickActions}>
        <View style={styles.quickAction}><Button title="Transaction policies" compact secondary onPress={() => router.push("/policies")} /></View>
        <View style={styles.quickAction}><Button title="Identity & settlement" compact secondary onPress={() => router.push("/kyc")} /></View>
      </View>
      <Message error>{error || businessesQuery.error?.message || analytics.error?.message}</Message>

      {business ? <>
        <FilterPanel title="Business" summary={business.name} expanded={showBusinessChooser} onToggle={() => setShowBusinessChooser((value) => !value)}>
          <FilterChips label="Choose business" value={business.id} options={businesses.map((item) => ({ label: item.name, value: item.id }))} onChange={(id) => { const chosen = businesses.find((item) => item.id === id); if (chosen) { setBusiness(chosen); setPageNumber(1); setClientFilter(""); } }} />
        </FilterPanel>
        <View style={styles.businessHeading}>
          <View style={{ flex: 1 }}><Text style={styles.eyebrow}>ACTIVE BUSINESS</Text><Text style={styles.activeBusiness}>{business.name}</Text></View>
          <Pressable onPress={() => void shareLocation()} style={styles.locationAction}><Text style={styles.locationActionText}>Share location</Text></Pressable>
        </View>

        <View style={styles.metrics}>
          <Metric title="Total transactions" value={`${metrics?.totalTransactions ?? 0}`} tone="indigo" />
          <Metric title="Total profit + charges" value={`₦${money(metrics?.totalChargesPlusExtra)}`} tone="dark" foot={`${metrics?.percentageReductionFromPastMonth ?? 0}% from last month`} />
          <Metric title="Fulfilled transactions" value={`${metrics?.fulfilledTransactions ?? 0}`} foot={`${metrics?.percentageReductionFromPastMonth ?? 0}% from last month`} />
          <Pressable style={styles.createBusiness} onPress={() => router.push("/create-business")}><Text style={styles.createPlus}>＋</Text><Text style={styles.createBusinessText}>Create sub business</Text></Pressable>
        </View>

        {socket.opportunity ? <Card>
          <Text style={styles.sectionTitle}>{isV2VOpportunity ? "Vendor liquidity request" : isFxOpportunity ? "New FX request" : "New cash request"}</Text>
          <Text style={styles.helper}>{socket.opportunity.txn_info?.amount} {socket.opportunity.txn_info?.destination_curr || "NGN"} · {socket.opportunity.txn_info?.client_name || "Nearby customer"}</Text>
          <Text style={styles.fieldLabel}>Choose a business for this request</Text>
          {opportunityBusinesses.map((item) => <Pressable key={item.id} onPress={() => setOfferBusinessId(String(item.id))} style={[styles.choiceRow, offerBusinessId === String(item.id) && styles.choiceSelected]}><Text style={styles.businessName}>{item.name}</Text><Text style={styles.choiceMark}>{offerBusinessId === String(item.id) ? "✓" : "○"}</Text></Pressable>)}
          {isV2VOpportunity ? <Field label="Your fee proposal" value={offerAmount} onChangeText={setOfferAmount} keyboardType="decimal-pad" /> : null}
          {isFxOpportunity ? <Field label="Your exchange rate proposal" value={offerRate} onChangeText={setOfferRate} keyboardType="decimal-pad" /> : null}
          <Button title="Accept opportunity" onPress={() => void acceptOffer()} busy={acceptState.loading} disabled={!offerBusinessId} />
          <Button title="Dismiss" secondary onPress={socket.clearOpportunity} />
        </Card> : null}

        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Transaction history</Text><Text style={styles.helper}>Activity for {business.name}.</Text></View><Text style={styles.count}>{transactionList.length}</Text></View>
        <Card>
          <FilterPanel title="Transaction filters" summary={[statusFilter, txnTypeFilter, requestTypeFilter, clientFilter ? "Client selected" : "", dateFrom || dateTo ? "Date range" : ""].filter(Boolean).map((value) => value.replaceAll("_", " ")).join(" · ") || "No filters applied"} expanded={showTransactionFilters} onToggle={() => setShowTransactionFilters((value) => !value)}>
          <FilterChips label="Status" value={statusFilter} options={[{ label: "All", value: "" }, { label: "Initiated", value: "INITIATED" }, { label: "In progress", value: "IN_PROGRESS" }, { label: "Fulfilled", value: "FULFILLED" }, { label: "Declined", value: "DECLINED" }, { label: "Cancelled", value: "CANCELLED" }]} onChange={(value) => { setStatusFilter(value); setPageNumber(1); }} />
          <FilterChips label="Transaction type" value={txnTypeFilter} options={[{ label: "All", value: "" }, { label: "Local", value: "LOCAL" }, { label: "FX", value: "FX" }]} onChange={(value) => { setTxnTypeFilter(value); setPageNumber(1); }} />
          <FilterChips label="Request direction" value={requestTypeFilter} options={[{ label: "All", value: "" }, { label: "Incoming", value: "incoming" }, { label: "Outgoing", value: "outgoing" }]} onChange={(value) => { setRequestTypeFilter(value); setPageNumber(1); }} />
          <FilterChips label="Client" value={clientFilter} options={[{ label: "All clients", value: "" }, ...clients.map((client) => ({ label: client.fullName || client.email || "Client", value: client.id }))]} onChange={(value) => { setClientFilter(value); setPageNumber(1); }} />
          <View style={styles.dateFilters}>
            <DatePickerField label="From date" value={dateFromInput} onChange={setDateFromInput} />
            <DatePickerField label="To date" value={dateToInput} onChange={setDateToInput} />
          </View>
          <View style={styles.dateActions}>
            <Pressable onPress={() => { setDateFrom(dateFromInput); setDateTo(dateToInput); setPageNumber(1); }} style={styles.smallAction}><Text style={styles.smallActionText}>Apply dates</Text></Pressable>
            <Pressable onPress={() => { setDateFromInput(""); setDateToInput(""); setDateFrom(""); setDateTo(""); setPageNumber(1); }} style={styles.smallAction}><Text style={styles.smallActionText}>Clear dates</Text></Pressable>
          </View>
          </FilterPanel>
          {transactions.loading ? <Text style={styles.helper}>Loading transactions…</Text> : transactionList.length ? transactionList.map((txn) => <Pressable key={txn.id} onPress={() => router.push(`/transaction/${txn.id}`)} style={styles.transactionRow}>
            <View style={styles.transactionMain}><Text style={styles.transactionAmount}>{txn.currency === "NGN" || !txn.currency ? "₦" : `${txn.currency} `}{money(Number(txn.amount))}</Text><Text style={styles.helper}>{txn.client?.fullName || txn.vendor?.fullName || txn.business?.name || "NearCash transaction"} · {txn.txnType || "CASH"}</Text></View>
            <View style={styles.transactionStatus}><Text style={styles.statusText}>{(txn.status || "Pending").replaceAll("_", " ")}</Text>{txn.status === "INITIATED" ? <Text onPress={() => void changeStatus(txn.id, "IN_PROGRESS")} style={styles.acceptLink}>{statusState.loading ? "Updating…" : "Accept"}</Text> : null}</View>
          </Pressable>) : <Text style={styles.empty}>All transactions initiated to this business will appear here.</Text>}
          <Pagination page={pageNumber} totalPages={transactionPages} loading={transactions.loading} onPrevious={() => setPageNumber((page) => Math.max(1, page - 1))} onNext={() => setPageNumber((page) => Math.min(transactionPages, page + 1))} />
        </Card>
      </> : null}

      <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Sub business list</Text><Text style={styles.helper}>Select a business to view its activity.</Text></View><Pressable onPress={() => router.push("/create-business")}><Text style={styles.link}>＋ Add</Text></Pressable></View>
      <Card>
        {businessesQuery.loading ? <Text style={styles.helper}>Loading businesses…</Text> : businesses.length ? businesses.map((item) => <Pressable key={item.id} onPress={() => { setBusiness(item); setPageNumber(1); setClientFilter(""); }} style={styles.businessRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</Text></View>
          <View style={styles.businessDetails}><View style={styles.businessTitleRow}><Text numberOfLines={1} style={styles.businessName}>{item.name}</Text>{item.id === business?.id ? <Text style={styles.currentBadge}>Current</Text> : null}</View><Text numberOfLines={1} style={styles.helper}>{item.address || `${item.currency || "NGN"} · ${item.businessType || "Cash"}`}</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>) : <>
          <Text style={styles.empty}>Your vendor account needs a business profile before it can receive local cash requests.</Text>
          <Button title="Create a business profile" onPress={() => router.push("/create-business")} />
        </>}
      </Card>

      {business ? <Card>
        <View><Text style={styles.sectionTitle}>Source liquidity</Text><Text style={styles.helper}>Find cash from other vendors for {business.name}.</Text></View>
        <Field label={`Amount (${business.currency || "NGN"})`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
        <View style={styles.paymentRow}><Button title="Bank transfer" secondary={payment !== "BANK_TRANSFER"} onPress={() => setPayment("BANK_TRANSFER")} /><Button title="Card" secondary={payment !== "CARD"} onPress={() => setPayment("CARD")} /></View>
        <Button title="Find vendor liquidity" onPress={() => void requestLiquidity()} busy={sourceState.loading} />
      </Card> : null}
    </Screen>
  );
}

function Metric({ title, value, tone, foot }: { title: string; value: string; tone?: "indigo" | "dark"; foot?: string }) {
  const strong = Boolean(tone);
  return <View style={[styles.metric, tone === "indigo" && styles.metricIndigo, tone === "dark" && styles.metricDark]}><Text style={[styles.metricTitle, strong && styles.lightText]}>{title}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, strong && styles.lightText]}>{value}</Text>{foot ? <Text style={[styles.metricFoot, tone === "dark" && styles.darkFoot]}>{foot}</Text> : null}</View>;
}

const styles: Record<string, any> = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }, welcome: { flex: 1, minWidth: 0 }, link: { color: colors.link, fontSize: 14, fontWeight: "700", paddingTop: 6 }, quickActions: { flexDirection: "row", gap: 8 }, quickAction: { flex: 1, minWidth: 0 },
  businessHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15 }, eyebrow: { fontSize: 10, fontWeight: "800", color: colors.muted, letterSpacing: 1 }, activeBusiness: { color: colors.ink, fontWeight: "700", fontSize: 17, marginTop: 3 }, locationAction: { borderColor: "#C7D2FE", borderWidth: 1, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 11 }, locationActionText: { color: "#4F46E5", fontSize: 12, fontWeight: "700" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, metric: { flexGrow: 1, flexBasis: "42%", minWidth: 130, minHeight: 116, justifyContent: "space-between", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15 }, metricIndigo: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" }, metricDark: { backgroundColor: "#111827", borderColor: "#111827" }, metricTitle: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: "600" }, metricValue: { color: colors.ink, fontSize: 21, fontWeight: "800", marginTop: 10 }, lightText: { color: colors.white }, metricFoot: { color: colors.muted, fontSize: 10, marginTop: 4 }, darkFoot: { color: "#D1D5DB" }, createBusiness: { flexGrow: 1, flexBasis: "42%", minWidth: 130, minHeight: 116, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15, justifyContent: "center", alignItems: "center", gap: 7 }, createPlus: { fontSize: 25, lineHeight: 28, color: colors.ink }, createBusinessText: { color: colors.ink, textAlign: "center", fontWeight: "700", fontSize: 13 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }, sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: "700" }, helper: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 }, count: { color: colors.link, fontSize: 13, fontWeight: "700", backgroundColor: "#EEF2FF", borderRadius: 20, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 5 },
  fieldLabel: { color: colors.ink, fontWeight: "600", fontSize: 14 }, choiceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.line, borderRadius: 11, padding: 12 }, choiceSelected: { borderColor: colors.link, backgroundColor: "#EEF2FF" }, choiceMark: { fontSize: 16, color: colors.link, fontWeight: "700" },
  transactionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }, transactionMain: { flex: 1, gap: 3 }, transactionAmount: { color: colors.ink, fontSize: 16, fontWeight: "700" }, transactionStatus: { alignItems: "flex-end", gap: 6 }, statusText: { color: colors.link, fontSize: 11, textTransform: "capitalize", backgroundColor: "#EEF2FF", overflow: "hidden", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 }, acceptLink: { color: colors.link, fontSize: 12, fontWeight: "700", padding: 4 }, empty: { color: colors.muted, fontSize: 14, paddingVertical: 10, lineHeight: 20 }, dateFilters: { flexDirection: "row", gap: 8 }, dateActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end" }, smallAction: { paddingHorizontal: 11, paddingVertical: 7, backgroundColor: "#F3F4F6", borderRadius: 9 }, smallActionText: { color: colors.ink, fontSize: 12, fontWeight: "600" },
  businessRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }, avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#4F46E5" }, avatarText: { color: colors.white, fontSize: 13, fontWeight: "700" }, businessDetails: { flex: 1, gap: 3 }, businessTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 }, businessName: { flexShrink: 1, color: colors.ink, fontSize: 14, fontWeight: "700" }, currentBadge: { color: "#4338CA", backgroundColor: "#EEF2FF", borderRadius: 10, overflow: "hidden", fontSize: 10, fontWeight: "700", paddingHorizontal: 7, paddingVertical: 3 }, chevron: { color: colors.muted, fontSize: 25 }, paymentRow: { flexDirection: "row", gap: 8 },
});
