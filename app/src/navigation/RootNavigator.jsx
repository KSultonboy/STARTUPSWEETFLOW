import React from "react";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text } from "react-native";

import { useAuth } from "../context/AuthContext";
import { colors } from "../styles";

import LoginScreen from "../screens/LoginScreen";
import AppDrawer from "./AppDrawer";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#e5e7eb", fontWeight: "700" }}>Yuklanmoqda...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Auth" component={LoginScreen} />
                ) : (
                    <Stack.Screen name="App" component={AppDrawer} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
