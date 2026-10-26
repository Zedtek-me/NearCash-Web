import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "@apollo/client";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { GET_TRANSACTION, RESPOND_TO_TRANSACTION, UPDATE_TRANSACTION_STATUS } from "../../src/api/operations";
import { useAuth } from "../../src/auth/AuthContext";
import { useNotificationSocket } from "../../src/notifications/SocketProvider";
import { Button, Card, Heading, Message, Screen, colors, textStyles } from "../../src/ui";

type Point = { latitude: number; longitude: number };
type Transaction = {
  id: string; txnRef?: string; txnType?: string; amount?: string | number; currency?: string; charge?: number | string;
  status?: string; transferMode?: string; dateCreated?: string; lastUpdated?: string; collectionMode?: string;
  awaitingTransfer?: boolean; txnLocation?: unknown; meta?: unknown;
  business?: { id?: string; name?: string; address?: string; location?: unknown; meta?: unknown };
  client?: { id?: string; fullName?: string; email?: string; phoneNumber?: string };
  vendor?: { id?: string; fullName?: string; email?: string; phoneNumber?: string };
};

function parseObject(value: unknown): any {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return null; }
}

function parsePoint(value: unknown): Point | null {
  const parsed = parseObject(value);
  if (Array.isArray(parsed) && parsed.length >= 2) return validPoint(parsed[1], parsed[0]);
  if (!parsed || typeof parsed !== "object") return null;
  const coords = Array.isArray(parsed.coordinates) ? parsed.coordinates : null;
  if (coords) return validPoint(coords[1], coords[0]);
  return validPoint(parsed.latitude ?? parsed.lat ?? parsed.y, parsed.longitude ?? parsed.lng ?? parsed.lon ?? parsed.x);
}

function validPoint(latValue: unknown, lngValue: unknown): Point | null {
  const latitude = Number(latValue); const longitude = Number(lngValue);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || (latitude === 0 && longitude === 0)) return null;
  return { latitude, longitude };
}

function parseMetaLocations(metaValue: unknown) {
  const meta = parseObject(metaValue);
  if (!meta || typeof meta !== "object") return { client: null as Point | null, vendor: null as Point | null };
  return {
    client: parsePoint(meta.client_current_location ?? meta.clientCurrentLocation ?? meta.client_location),
    vendor: parsePoint(meta.vendor_current_location ?? meta.vendorCurrentLocation ?? meta.vendor_location),
  };
}

export default function TransactionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const socket = useNotificationSocket();
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTION, { variables: { transactionId: String(id) }, skip: !id, fetchPolicy: "network-only" });
  const [setStatus, statusState] = useMutation(UPDATE_TRANSACTION_STATUS);
  const [respond, respondState] = useMutation(RESPOND_TO_TRANSACTION);
  const txn: Transaction | undefined = data?.transaction;
  const [clientLocation, setClientLocation] = useState<Point | null>(null);
  const [vendorLocation, setVendorLocation] = useState<Point | null>(null);

  const metaLocations = useMemo(() => parseMetaLocations(txn?.meta), [txn?.meta]);
  const transactionPoint = parsePoint(txn?.txnLocation);
  const businessPoint = parsePoint(txn?.business?.location) || parsePoint(txn?.business?.meta);
  const pending = ["INITIATED", "IN_PROGRESS"].includes(txn?.status || "");
  const userIsVendor = user?.userType?.toUpperCase() === "VENDOR";
  const outgoingVendor = Boolean(userIsVendor && txn?.client?.id && String(txn.client.id) === String(user?.id));
  const vendorView = userIsVendor && !outgoingVendor;
  const locations = useMemo(() => ({
    client: clientLocation || metaLocations.client,
    vendor: vendorLocation || metaLocations.vendor,
  }), [clientLocation, vendorLocation, metaLocations]);
  const fallbackPoint = transactionPoint || businessPoint;
  const visiblePoint = vendorView
    ? locations.client || locations.vendor || fallbackPoint
    : locations.client || locations.vendor || fallbackPoint;
  const mapCenter = visiblePoint || { latitude: 9.082, longitude: 8.6753 };

  useEffect(() => {
    setClientLocation(null); setVendorLocation(null);
  }, [id]);

  useEffect(() => {
    if (!txn?.id || !user?.id) return;
    const vendorId = txn.vendor?.id;
    const clientId = txn.client?.id;
    socket.send({ message_type: "retrieve_vendor_latest_location", vendor_id: vendorId, client_id: clientId, txn_id: txn.id });
    socket.send({ message_type: "retrieve_client_latest_location", vendor_id: vendorId, client_id: clientId, txn_id: txn.id });
  }, [txn?.id, txn?.vendor?.id, txn?.client?.id, user?.id, socket.connected]);

  useEffect(() => {
    if (!pending || !txn?.id || !socket.latestEvent) return;
    const event = socket.latestEvent;
    const eventTxnId = event.txn_id ?? event.transaction_id;
    if (eventTxnId && String(eventTxnId) !== String(txn.id)) return;
    const point = parsePoint(event.location);
    if (!point) return;
    if (event.message_type === "vendor_latest_location" || event.message_type === "vendor_location_update_ack") setVendorLocation(point);
    if (event.message_type === "client_latest_location" || event.message_type === "client_location_update_ack") setClientLocation(point);
  }, [socket.latestEvent, pending, txn?.id]);

  useEffect(() => {
    if (!pending || !txn?.id || !user?.id) return;
    let active = true;
    let watcher: Location.LocationSubscription | null = null;
    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!active || permission.status !== "granted") return;
      watcher = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 25 }, (position) => {
        const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        if (vendorView) setVendorLocation(point); else setClientLocation(point);
        socket.send({
          message_type: vendorView ? "vendor_location_update" : "client_location_update",
          vendor_id: txn.vendor?.id || null,
          client_id: txn.client?.id || null,
          txn_id: txn.id,
          business_id: txn.business?.id || null,
          location: point,
        });
      });
    })().catch(() => undefined);
    return () => { active = false; watcher?.remove(); };
  }, [pending, txn?.id, user?.id, vendorView, socket.connected, socket.send]);

  const changeStatus = async (next: string) => {
    if (!txn?.id) return;
    try { await setStatus({ variables: { txnId: String(txn.id), status: next } }); await refetch(); }
    catch (e) { Alert.alert("Could not update", e instanceof Error ? e.message : "Please try again."); }
  };
  const delayed = async (decision: "WAIT" | "SYSTEM_SEARCH" | "CANCEL") => {
    if (!txn?.id) return;
    try { await respond({ variables: { txnId: String(txn.id), decision } }); await refetch(); }
    catch (e) { Alert.alert("Could not update request", e instanceof Error ? e.message : "Please try again."); }
  };
  const openMap = async () => {
    const url = visiblePoint ? `https://maps.google.com/?q=${visiblePoint.latitude},${visiblePoint.longitude}` : txn?.business?.address ? `https://maps.google.com/?q=${encodeURIComponent(txn.business.address)}` : "";
    if (!url) return;
    try { await Linking.openURL(url); } catch { Alert.alert("Maps unavailable", "Could not open a map for this transaction."); }
  };
  const callVendor = async () => {
    const phone = txn?.vendor?.phoneNumber;
    if (phone) try { await Linking.openURL(`tel:${phone}`); } catch { Alert.alert("Call unavailable", "Could not open the phone app."); }
  };

  return <Screen>
    <Stack.Screen options={{ headerShown: true, title: "Transaction details", headerTintColor: colors.ink }} />
    <Heading subtitle={txn?.txnRef || (id ? `Transaction ${id}` : "Transaction details")}>{txn?.txnType === "FX" ? "FX transaction" : "Cash transaction"}</Heading>
    {loading ? <Message>Loading transaction…</Message> : null}
    <Message error>{error?.message}</Message>
    {!loading && !error && !txn ? <Card><Text style={textStyles.body}>This transaction could not be found.</Text><Button title="Back to dashboard" onPress={() => router.replace("/")} /></Card> : null}
    {txn ? <>
      <Card>
        <Text style={styles.amount}>{txn.currency === "NGN" || !txn.currency ? "₦" : `${txn.currency} `}{Number(txn.amount || 0).toLocaleString()}</Text>
        <Text style={textStyles.body}>Status: {(txn.status || "Unknown").replaceAll("_", " ")}</Text>
        <Text style={textStyles.muted}>Reference: {txn.txnRef || "—"}</Text>
        <Text style={textStyles.muted}>Fee: {txn.charge ?? "—"} · Payment: {txn.transferMode || "—"}</Text>
        <Text style={textStyles.muted}>Created: {txn.dateCreated ? new Date(txn.dateCreated).toLocaleString() : "—"}</Text>
        <Text style={textStyles.muted}>Updated: {txn.lastUpdated ? new Date(txn.lastUpdated).toLocaleString() : "—"}</Text>
      </Card>

      <Card>
        <Text style={textStyles.section}>{txn.business?.name || "Collection location"}</Text>
        <Text style={textStyles.body}>{txn.business?.address || "Address not available"}</Text>
        <Text style={textStyles.muted}>Collection: {txn.collectionMode?.replaceAll("_", " ") || "—"}</Text>
        {(visiblePoint || pending) ? <>
          <View style={styles.mapHeader}><Text style={styles.mapTitle}>{pending ? "Live transaction map" : "Transaction location"}</Text><Text style={styles.mapHint}>{socket.connected && pending ? "Live updates connected" : "Showing available location"}</Text></View>
          <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={{ ...mapCenter, latitudeDelta: 0.025, longitudeDelta: 0.025 }} showsUserLocation={false}>
            {transactionPoint ? <Marker coordinate={transactionPoint} title="Transaction location" pinColor="#4F46E5" /> : null}
            {businessPoint ? <Marker coordinate={businessPoint} title={txn.business?.name || "Business location"} description={txn.business?.address} pinColor="#F59E0B" /> : null}
            {locations.client ? <Marker coordinate={locations.client} title="Client" pinColor="#10B981" /> : null}
            {locations.vendor ? <Marker coordinate={locations.vendor} title="Vendor" pinColor="#F59E0B" /> : null}
            {!transactionPoint && !businessPoint && visiblePoint ? <Marker coordinate={visiblePoint} title={vendorView ? "Vendor location" : "Your location"} /> : null}
          </MapView>
          {visiblePoint || txn.business?.address ? <Button title="Open location in Maps" secondary onPress={() => void openMap()} /> : <Text style={styles.mapHint}>Waiting for a location fix. Allow location access to show your position on the map.</Text>}
        </> : <Text style={styles.mapHint}>No map location has been recorded for this transaction yet.</Text>}
      </Card>

      <Card>
        <Text style={textStyles.section}>{vendorView ? "Customer information" : "Vendor information"}</Text>
        <Text style={textStyles.body}>{vendorView ? txn.client?.fullName || txn.client?.email || "—" : txn.vendor?.fullName || txn.vendor?.email || "—"}</Text>
        {!vendorView && txn.vendor?.phoneNumber ? <Button title="Call vendor" secondary onPress={() => void callVendor()} /> : null}
      </Card>
      {txn.awaitingTransfer ? <Message>The transaction is awaiting bank transfer confirmation.</Message> : null}

      {pending ? <Card>
        <Text style={textStyles.section}>Available actions</Text>
        {vendorView && txn.status === "INITIATED" ? <Button title="Approve transaction" onPress={() => void changeStatus("IN_PROGRESS")} busy={statusState.loading} /> : null}
        {vendorView ? <Button title="Decline transaction" secondary onPress={() => void changeStatus("DECLINED")} busy={statusState.loading} /> : <Button title="Cancel transaction" secondary onPress={() => void changeStatus("CANCELLED")} busy={statusState.loading} />}
        {!vendorView && txn.status === "INITIATED" ? <><Button title="Keep waiting for vendor" secondary onPress={() => void delayed("WAIT")} busy={respondState.loading} /><Button title="Search for another vendor" secondary onPress={() => void delayed("SYSTEM_SEARCH")} busy={respondState.loading} /></> : null}
      </Card> : <Message>This transaction has no actions available in its current status.</Message>}
    </> : null}
  </Screen>;
}

const styles: Record<string, any> = StyleSheet.create({
  amount: { color: colors.ink, fontWeight: "800", fontSize: 26 },
  mapHeader: { gap: 3, marginTop: 4 }, mapTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" }, mapHint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  map: { height: 260, width: "100%", borderRadius: 14, overflow: "hidden", marginTop: 6 },
});
