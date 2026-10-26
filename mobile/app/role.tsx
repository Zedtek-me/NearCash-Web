import React, { useState } from "react";
import { router } from "expo-router";
import { useMutation } from "@apollo/client";
import { Heading, Screen, Button, Card, Message, textStyles } from "../src/ui";
import { useAuth } from "../src/auth/AuthContext";
import { UPDATE_USER } from "../src/api/operations";
export default function ChooseRole() { const { user, refresh } = useAuth(); const [update, { loading, error }] = useMutation(UPDATE_USER); const [localError, setLocalError] = useState(""); const choose = async (userType: string) => { setLocalError(""); if (userType === "VENDOR") { router.push("/create-business"); return; } try { await update({ variables: { data: { userType } } }); await refresh(); router.replace("/client"); } catch (e) { setLocalError(e instanceof Error ? e.message : "Could not update account type"); } }; return <Screen><Heading subtitle="Choose how you want to use NearCash.">Set up your account</Heading><Card><Button title="I need cash · Client" onPress={() => void choose("CLIENT")} busy={loading} /></Card><Card><Button title="I provide cash · Vendor" onPress={() => void choose("VENDOR")} secondary disabled={!user} /></Card><Message error>{localError || error?.message}</Message><Message>{!user?.userType ? "Your account type is not set yet." : `Current account type: ${user.userType}`}</Message></Screen>; }
