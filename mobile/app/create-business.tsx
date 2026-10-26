import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation } from "@apollo/client";
import { useAuth } from "../src/auth/AuthContext";
import { CREATE_BUSINESS, UPDATE_BUSINESS_TYPE, UPDATE_USER } from "../src/api/operations";
import { Button, Card, Field, Heading, Message, Screen, colors, textStyles } from "../src/ui";

const cashAssets = [
  { range: "1000-5000", chargeRate: 200 }, { range: "5001-10000", chargeRate: 300 },
  { range: "10001-20000", chargeRate: 400 }, { range: "20001-50000", chargeRate: 500 },
  { range: "50001-100000", chargeRate: 600 }, { range: "100001+", chargeRate: 700 },
];
export default function CreateBusiness() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(""); const [address, setAddress] = useState(""); const [country, setCountry] = useState("Nigeria"); const [description, setDescription] = useState(""); const [businessType, setBusinessType] = useState("LOCAL"); const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(["USD"]); const [selectedRanges, setSelectedRanges] = useState<string[]>([cashAssets[0].range]);
  const [create, state] = useMutation(CREATE_BUSINESS); const [normalizeType, normalizeState] = useMutation(UPDATE_BUSINESS_TYPE); const [updateUser, updateUserState] = useMutation(UPDATE_USER); const [error, setError] = useState("");
  const toggleRange = (range: string) => setSelectedRanges((current) => current.includes(range) ? current.filter((item) => item !== range) : [...current, range]);
  const submit = async () => {
    if (!name.trim() || !address.trim() || !country.trim()) { setError("Business name, address, and country are required."); return; }
    if (businessType === "LOCAL" && !selectedRanges.length) { setError("Choose at least one cash range to list."); return; }
    if (businessType === "FX" && !supportedCurrencies.length) { setError("Choose at least one currency to exchange."); return; }
    setError("");
    const businessData = { businessName: name.trim(), address: address.trim(), country: country.trim(), description: description.trim(), businessType, ...(businessType === "FX" ? { supportedCurrencies } : {}) };
    const financialAssets = businessType === "LOCAL" ? cashAssets.filter((asset) => selectedRanges.includes(asset.range)) : [];
    try {
      let businessId: string; let successMessage = "Business profile is ready.";
      if (!user?.businesses?.length) {
        // First vendor setup must send businessData with userType. The existing
        // backend creates a first business inside updateUser for new vendors.
        const result = await updateUser({ variables: { data: { userType: "VENDOR", businessData } } });
        const created = result.data?.updateUser?.user?.businesses?.[0];
        if (!created?.id) throw new Error("The server did not return the new business profile.");
        businessId = String(created.id); successMessage = result.data?.updateUser?.message || successMessage;
        await normalizeType({ variables: { businessId, updateData: { businessType }, financialAssets } });
      } else {
        if (user.userType !== "VENDOR") await updateUser({ variables: { data: { userType: "VENDOR" } } });
        const result = await create({ variables: { data: businessData, financialAssets } });
        const created = result.data?.createBusiness?.business;
        if (!created?.id) throw new Error("The server did not return a business ID.");
        businessId = String(created.id); successMessage = result.data?.createBusiness?.message || successMessage;
        await normalizeType({ variables: { businessId, updateData: { businessType } } });
      }
      await refresh(); Alert.alert("Business created", successMessage); router.replace("/vendor");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create business"); }
  };
  return <Screen><Heading subtitle="Create a local cash vendor or an FX vendor profile.">Business profile</Heading><Field label="Business name" value={name} onChangeText={setName} autoCapitalize="words" /><Field label="Address" value={address} onChangeText={setAddress} autoCapitalize="words" /><Field label="Country" value={country} onChangeText={setCountry} autoCapitalize="words" /><Field label="Description (optional)" value={description} onChangeText={setDescription} multiline numberOfLines={3} /><Text style={textStyles.body}>Business type</Text><View style={{ flexDirection: "row", gap: 8 }}><Button title="Local cash" secondary={businessType !== "LOCAL"} onPress={() => setBusinessType("LOCAL")} /><Button title="FX exchange" secondary={businessType !== "FX"} onPress={() => setBusinessType("FX")} /></View>{businessType === "LOCAL" ? <><Text style={textStyles.section}>Cash ranges and service fees (NGN)</Text>{cashAssets.map((asset) => { const selected = selectedRanges.includes(asset.range); return <Pressable key={asset.range} onPress={() => toggleRange(asset.range)}><Card><Text style={{ color: selected ? colors.brand : colors.ink, fontWeight: "700" }}>{selected ? "✓  " : "○  "}{asset.range} · fee ₦{asset.chargeRate}</Text></Card></Pressable>; })}</> : <><Text style={textStyles.section}>Currencies you support</Text>{["USD", "GBP", "EUR", "CAD", "GHS", "XOF", "KES", "ZAR"].map((currency) => { const selected = supportedCurrencies.includes(currency); return <Pressable key={currency} onPress={() => setSupportedCurrencies((list) => selected ? list.filter((item) => item !== currency) : [...list, currency])}><Card><Text style={{ color: selected ? colors.brand : colors.ink, fontWeight: "700" }}>{selected ? "✓  " : "○  "}{currency}</Text></Card></Pressable>; })}</>}<Message error>{error}</Message><Button title="Create business" onPress={() => void submit()} busy={state.loading || normalizeState.loading || updateUserState.loading} /><Button title="Back" secondary onPress={() => router.back()} /></Screen>;
}
