import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { router } from "expo-router";
import { useAuth } from "../src/auth/AuthContext";
import { CREATE_TRANSACTION, GET_ANALYTICS, GET_ASSETS, GET_TRANSACTIONS, GET_VENDORS, GET_VENDOR_POLICY_FOR_USER, VENDOR_LIST } from "../src/api/operations";
import { Button, Card, Field, Heading, Message, Screen, colors } from "../src/ui";
import { DatePickerField, FilterChips, FilterPanel, Pagination } from "../src/dashboard/FilterControls";
import { ProfileMenu } from "../src/dashboard/ProfileMenu";

type Vendor = { id: string; name: string; address?: string; distance?: number; isOnline?: boolean; location?: { latitude?: number; longitude?: number }; businessPolicyForCurrentUser?: { cashCollectionMode?: string } };
type Asset = { id: string; range?: string; chargeRate?: number; business?: { name?: string } };
type Transaction = { id: string; amount?: number; currency?: string; status?: string; txnType?: string; business?: { name?: string } };
type Analytics = { totalTransactions?: number; totalTransactionValue?: number; currentMonthTransactionValue?: number };

const money = (value?: number) => Number(value || 0).toLocaleString("en-NG");

export default function ClientHome() {
  const { user } = useAuth();
  const displayName = user?.firstName || user?.username || "there";
  const accountType = (user?.userType || "client").toLowerCase();
  const apollo = useApolloClient();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showVendorFilters, setShowVendorFilters] = useState(false);
  const [showTransactionFilters, setShowTransactionFilters] = useState(false);
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState("BANK_TRANSFER");
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetId, setAssetId] = useState("");
  const [error, setError] = useState("");
  const [vendorType, setVendorType] = useState("");
  const [collectionMode, setCollectionMode] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [txnTypeFilter, setTxnTypeFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [create, createState] = useMutation(CREATE_TRANSACTION);
  const location = useQuery(VENDOR_LIST, { variables: { currentLat: coords?.latitude ?? 0, currentLong: coords?.longitude ?? 0, vendorType: vendorType || undefined, collectionMode: collectionMode || undefined, pageCount: 20, pageNumber: 1 }, skip: !coords });
  const policy = useQuery(GET_VENDOR_POLICY_FOR_USER, { variables: { businessId: selected?.id }, skip: !selected?.id });
  const history = useQuery(GET_TRANSACTIONS, { variables: { clientId: user?.id, vendorId: vendorFilter || undefined, status: statusFilter || undefined, txnType: txnTypeFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, pageCount: 10, pageNumber }, skip: !user?.id, fetchPolicy: "network-only" });
  const vendorOptions = useQuery(GET_VENDORS, { variables: { pageCount: 100, pageNumber: 1 } });
  const analytics = useQuery(GET_ANALYTICS, { variables: { userType: String(user?.userType || "CLIENT").toLowerCase() }, skip: !user?.id });
  const vendors: Vendor[] = location.data?.businessesAroundMe?.businesses ?? [];
  const transactions: Transaction[] = history.data?.transactions?.transactions ?? [];
  const metrics: Analytics = analytics.data?.analytics;
  const transactionPages = history.data?.transactions?.pagination?.totalPages ?? 1;
  const partnerVendors: Array<{ id: string; name?: string; owner?: { fullName?: string; email?: string } }> = vendorOptions.data?.vendors ?? [];
  const resetTransactionPage = () => setPageNumber(1);

  const getLocation = async () => {
    setError("");
    const result = await Location.requestForegroundPermissionsAsync();
    if (result.status !== "granted") {
      setError("Location permission is needed to find nearby vendors. You can also change app permissions in Settings.");
      return;
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
  };

  const requestCash = async () => {
    if (!selected || !coords || !amount || Number(amount) <= 0) { setError("Choose a vendor and enter a valid amount."); return; }
    if (!assetId) { setError("Choose one of the vendor's available cash ranges."); return; }
    setError("");
    try {
      await create({ variables: { transactionData: { assetId, vendorId: selected.id, amountToWithdraw: Number(amount), clientCurrentCoordinates: coords, collectionMode: policy.data?.businessTransactionPolicyForUser?.cashCollectionMode, collectionLocation: "", txnType: "LOCAL", transferMode: payment } } });
      Alert.alert("Request sent", "Your cash request was created.");
      setSelected(null); setAmount(""); setAssetId("");
      await history.refetch();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create request"); }
  };

  const loadVendorAssets = async (vendor: Vendor) => {
    setSelected(vendor); setAssets([]); setAssetId(""); setError("");
    try {
      const result = await apollo.query({ query: GET_ASSETS, variables: { businessId: vendor.id }, fetchPolicy: "network-only" });
      setAssets(result.data?.businessAssets ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load vendor assets"); }
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <View style={styles.welcome}><Heading subtitle={accountType}>{`Welcome ${displayName}`}</Heading></View>
        <ProfileMenu />
      </View>

      <View style={styles.quickActions}>
        <View style={styles.quickAction}><Button title="Request FX" compact secondary onPress={() => router.push("/fx")} /></View>
        <View style={styles.quickAction}><Button title="Identity verification" compact secondary onPress={() => router.push("/kyc")} /></View>
      </View>

      <View style={styles.metrics}>
        <Metric title="Total transactions" value={`${metrics?.totalTransactions ?? 0}`} dark />
        <Metric title="Fulfilled value" value={`₦${money(metrics?.totalTransactionValue)}`} />
        <Metric title="This month" value={`₦${money(metrics?.currentMonthTransactionValue)}`} accent />
      </View>

      <Message error>{error || location.error?.message || analytics.error?.message}</Message>

      <View style={styles.sectionHeading}>
        <View><Text style={styles.sectionTitle}>Nearby vendors</Text><Text style={styles.helper}>Find cash vendors around your current location.</Text></View>
        <Text style={styles.count}>{vendors.length}</Text>
      </View>
      <Card>
        <FilterPanel title="Vendor filters" summary={[vendorType || "All types", collectionMode ? collectionMode.replaceAll("_", " ").toLowerCase() : "Any collection"].join(" · ")} expanded={showVendorFilters} onToggle={() => setShowVendorFilters((value) => !value)}>
          <FilterChips label="Vendor type" value={vendorType} options={[{ label: "All", value: "" }, { label: "Local", value: "LOCAL" }, { label: "FX", value: "FX" }]} onChange={setVendorType} />
          <FilterChips label="Collection mode" value={collectionMode} options={[{ label: "All", value: "" }, { label: "Meet up", value: "MEET_UP" }, { label: "Store walk-in", value: "STORE_WALK_IN" }]} onChange={setCollectionMode} />
        </FilterPanel>
        <Button title={coords ? "Refresh nearby vendors" : "Find vendors near me"} onPress={() => void getLocation()} busy={location.loading} />
        <Text style={styles.helper}>{location.loading ? "Finding vendors…" : !coords ? "Your location is only requested when you tap the button." : vendors.length ? `${vendors.length} vendors found nearby.` : "No nearby vendors returned."}</Text>
        {coords ? <>
          <Button title={showMap ? "Hide map" : "Show map"} secondary onPress={() => setShowMap((visible) => !visible)} />
          {showMap ? <MapView style={styles.map} initialRegion={{ ...coords, latitudeDelta: 0.06, longitudeDelta: 0.06 }} showsUserLocation>
            <Marker coordinate={coords} title="You" pinColor="#111111" />
            {vendors.map((vendor) => {
              const point = vendor.location;
              if (!point || !Number.isFinite(Number(point.latitude)) || !Number.isFinite(Number(point.longitude))) return null;
              return <Marker key={vendor.id} coordinate={{ latitude: Number(point.latitude), longitude: Number(point.longitude) }} title={vendor.name} description={vendor.address} onCalloutPress={() => void loadVendorAssets(vendor)} />;
            })}
          </MapView> : null}
        </> : null}
        {!vendors.length && !location.loading ? <Text style={styles.empty}>Nearby vendors will appear here when your location is available.</Text> : null}
        {vendors.map((vendor) => <Pressable key={vendor.id} onPress={() => void loadVendorAssets(vendor)} style={styles.vendorRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{vendor.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</Text></View>
          <View style={styles.vendorDetails}>
            <Text style={styles.vendorName}>{vendor.name}</Text>
            <Text style={styles.helper}>{vendor.distance != null ? `${vendor.distance} km away` : vendor.address || "Address unavailable"}{vendor.isOnline ? " · Online" : " · Offline"}</Text>
            {vendor.businessPolicyForCurrentUser?.cashCollectionMode ? <Text style={styles.collection}>{vendor.businessPolicyForCurrentUser.cashCollectionMode.replaceAll("_", " ")}</Text> : null}
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>)}
      </Card>

      {selected ? <Card>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Request from {selected.name}</Text><Pressable onPress={() => setSelected(null)}><Text style={styles.signOut}>Close</Text></Pressable></View>
        <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
        <Text style={styles.fieldLabel}>Available cash ranges</Text>
        {assets.length ? assets.map((asset) => <Pressable key={asset.id} onPress={() => setAssetId(asset.id)} style={[styles.assetRow, assetId === asset.id && styles.assetSelected]}>
          <Text style={styles.assetText}>{asset.range || "Cash range"}</Text><Text style={styles.assetFee}>{asset.chargeRate ? `₦${money(asset.chargeRate)} fee` : "View range"}</Text>
        </Pressable>) : <Text style={styles.helper}>Loading available cash ranges…</Text>}
        <Message>{policy.loading ? "Loading vendor collection policy…" : policy.data?.businessTransactionPolicyForUser?.cashCollectionMode ? `Collection: ${policy.data.businessTransactionPolicyForUser.cashCollectionMode.replaceAll("_", " ")}` : "This vendor has not configured a cash collection policy."}</Message>
        <Text style={styles.fieldLabel}>Payment method</Text>
        <View style={styles.paymentRow}><Button title="Bank transfer" secondary={payment !== "BANK_TRANSFER"} onPress={() => setPayment("BANK_TRANSFER")} /><Button title="Card" secondary={payment !== "CARD"} onPress={() => setPayment("CARD")} /></View>
        <Button title="Create cash request" onPress={() => void requestCash()} busy={createState.loading} disabled={!assetId || policy.loading || !policy.data?.businessTransactionPolicyForUser?.cashCollectionMode} />
      </Card> : null}

      <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Transaction history</Text><Text style={styles.helper}>Your recent cash and FX requests.</Text></View></View>
      <Card>
        <FilterPanel title="Transaction filters" summary={[statusFilter, txnTypeFilter, vendorFilter ? "Vendor selected" : "", dateFrom || dateTo ? "Date range" : ""].filter(Boolean).map((value) => value.replaceAll("_", " ")).join(" · ") || "No filters applied"} expanded={showTransactionFilters} onToggle={() => setShowTransactionFilters((value) => !value)}>
        <FilterChips label="Status" value={statusFilter} options={[{ label: "All", value: "" }, { label: "Initiated", value: "INITIATED" }, { label: "In progress", value: "IN_PROGRESS" }, { label: "Fulfilled", value: "FULFILLED" }, { label: "Declined", value: "DECLINED" }, { label: "Cancelled", value: "CANCELLED" }]} onChange={(value) => { setStatusFilter(value); resetTransactionPage(); }} />
        <FilterChips label="Transaction type" value={txnTypeFilter} options={[{ label: "All", value: "" }, { label: "Local", value: "LOCAL" }, { label: "FX", value: "FX" }]} onChange={(value) => { setTxnTypeFilter(value); resetTransactionPage(); }} />
        <FilterChips label="Vendor" value={vendorFilter} options={[{ label: "All vendors", value: "" }, ...partnerVendors.map((vendor) => ({ label: vendor.name || vendor.owner?.fullName || vendor.owner?.email || "Vendor", value: vendor.id }))]} onChange={(value) => { setVendorFilter(value); resetTransactionPage(); }} />
        <View style={styles.dateFilters}>
          <DatePickerField label="From date" value={dateFromInput} onChange={setDateFromInput} />
          <DatePickerField label="To date" value={dateToInput} onChange={setDateToInput} />
        </View>
        <View style={styles.dateActions}>
          <Pressable onPress={() => { setDateFrom(dateFromInput); setDateTo(dateToInput); resetTransactionPage(); }} style={styles.smallAction}><Text style={styles.smallActionText}>Apply dates</Text></Pressable>
          <Pressable onPress={() => { setDateFromInput(""); setDateToInput(""); setDateFrom(""); setDateTo(""); resetTransactionPage(); }} style={styles.smallAction}><Text style={styles.smallActionText}>Clear dates</Text></Pressable>
        </View>
        </FilterPanel>
        {history.loading ? <Text style={styles.helper}>Loading transactions…</Text> : transactions.length ? transactions.map((txn) => <Pressable key={txn.id} onPress={() => router.push(`/transaction/${txn.id}`)} style={styles.transactionRow}>
          <View style={styles.transactionMain}><Text style={styles.transactionAmount}>{txn.currency === "NGN" || !txn.currency ? "₦" : `${txn.currency} `}{money(Number(txn.amount))}</Text><Text style={styles.helper}>{txn.business?.name || "NearCash request"} · {txn.txnType || "CASH"}</Text></View>
          <Text style={styles.status}>{(txn.status || "Pending").replaceAll("_", " ")}</Text>
        </Pressable>) : <Text style={styles.empty}>All your transactions will appear here.</Text>}
        <Pagination page={pageNumber} totalPages={transactionPages} loading={history.loading} onPrevious={() => setPageNumber((page) => Math.max(1, page - 1))} onNext={() => setPageNumber((page) => Math.min(transactionPages, page + 1))} />
      </Card>
    </Screen>
  );
}

function Metric({ title, value, dark, accent }: { title: string; value: string; dark?: boolean; accent?: boolean }) {
  return <View style={[styles.metric, dark && styles.metricDark, accent && styles.metricAccent]}><Text style={[styles.metricTitle, (dark || accent) && styles.metricTitleLight]}>{title}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, (dark || accent) && styles.metricValueLight]}>{value}</Text></View>;
}

const styles: Record<string, any> = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }, welcome: { flex: 1, minWidth: 0 }, signOut: { color: colors.link, fontWeight: "600", fontSize: 14, paddingTop: 6 },
  quickActions: { flexDirection: "row", gap: 8 }, quickAction: { flex: 1, minWidth: 0 }, metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, metric: { flexGrow: 1, flexBasis: "30%", minWidth: 95, minHeight: 100, justifyContent: "space-between", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 }, metricDark: { backgroundColor: "#111827", borderColor: "#111827" }, metricAccent: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" }, metricTitle: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: "600" }, metricTitleLight: { color: "#E5E7EB" }, metricValue: { color: colors.ink, fontSize: 19, fontWeight: "800" }, metricValueLight: { color: colors.white },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }, sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: "700" }, helper: { color: colors.muted, fontSize: 13, lineHeight: 19 }, count: { color: colors.link, fontSize: 14, fontWeight: "700", backgroundColor: "#EEF2FF", borderRadius: 20, overflow: "hidden", paddingHorizontal: 11, paddingVertical: 5 },
  map: { height: 230, borderRadius: 14, overflow: "hidden" }, empty: { color: colors.muted, fontSize: 14, paddingVertical: 12, lineHeight: 20 }, vendorRow: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 13 }, avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#4F46E5" }, avatarText: { color: colors.white, fontSize: 13, fontWeight: "700" }, vendorDetails: { flex: 1, gap: 3 }, vendorName: { color: colors.ink, fontWeight: "700", fontSize: 15 }, collection: { color: colors.link, fontSize: 12, fontWeight: "600", textTransform: "capitalize" }, chevron: { color: colors.muted, fontSize: 25 }, fieldLabel: { color: colors.ink, fontWeight: "600", fontSize: 14 }, assetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: "#F9FAFB" }, assetSelected: { borderColor: colors.link, backgroundColor: "#EEF2FF" }, assetText: { color: colors.ink, fontWeight: "600" }, assetFee: { color: colors.link, fontWeight: "600", fontSize: 13 }, paymentRow: { flexDirection: "row", gap: 8 }, transactionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }, transactionMain: { flex: 1, gap: 4 }, transactionAmount: { color: colors.ink, fontSize: 16, fontWeight: "700" }, status: { color: colors.link, fontSize: 11, textTransform: "capitalize", backgroundColor: "#EEF2FF", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, overflow: "hidden" }, dateFilters: { flexDirection: "row", gap: 8 }, dateActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end" }, smallAction: { paddingHorizontal: 11, paddingVertical: 7, backgroundColor: "#F3F4F6", borderRadius: 9 }, smallActionText: { color: colors.ink, fontSize: 12, fontWeight: "600" },
});
