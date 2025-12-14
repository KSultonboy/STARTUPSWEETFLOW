import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import {
    createDrawerNavigator,
    DrawerContentScrollView,
} from "@react-navigation/drawer";

import { useAuth } from "../context/AuthContext";
import { colors, spacing, typography, radius } from "../styles";

// Screens
import ReportsScreen from "../screens/ReportsScreen";
import WarehouseScreen from "../screens/WarehouseScreen";
import SalesScreen from "../screens/SalesScreen";
import ProductsScreen from "../screens/ProductsScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProductionScreen from "../screens/ProductionScreen";
import ReceivingScreen from "../screens/ReceivingScreen";
import ReturnsScreen from "../screens/ReturnsScreen";
import TransfersScreen from "../screens/TransfersScreen";
import BranchesScreen from "../screens/BranchesScreen";
import UsersScreen from "../screens/UsersScreen";
import ExpensesScreen from "../screens/ExpensesScreen";

const Drawer = createDrawerNavigator();

function DrawerItem({ label, onPress, active }) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                {
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: radius.md,
                    backgroundColor: active ? "rgba(79,70,229,0.18)" : "transparent",
                },
                pressed && { opacity: 0.85 },
            ]}
        >
            <Text style={[typography.body, { color: colors.text, fontWeight: "700" }]}>
                {label}
            </Text>
        </Pressable>
    );
}

function CustomDrawerContent(props) {
    const { state, navigation } = props;
    const { user, logout } = useAuth();

    const role = String(user?.role || "").toLowerCase();
    const isAdmin = role === "admin";
    const isBranch = role === "branch";
    const isProduction = role === "production";

    const items = useMemo(() => {
        // ❌ Home yo‘q — hech qaysi rolda ko‘rinmaydi
        if (isAdmin) {
            return [
                { name: "Reports", label: "Hisobotlar" },
                { name: "Branches", label: "Filiallar" },
                { name: "Users", label: "Foydalanuvchilar" },
                { name: "Expenses", label: "Xarajatlar" },
                { name: "Warehouse", label: "Omborxona" },
                { name: "Products", label: "Asosiy Catalog" },
                { name: "Transfers", label: "Transferlar" },
                { name: "Returns", label: "Vazvratlar" },
                { name: "History", label: "Tarix" },
                
                
            ];
        }

        if (isBranch) {
            return [
                { name: "Warehouse", label: "Omborxona" },
                { name: "Sales", label: "Sotuv" },
                { name: "Receiving", label: "Qabul qilish" },
                { name: "Returns", label: "Vazvratlar" },
                { name: "History", label: "Tarix" },
            ];
        }

        if (isProduction) {
            return [
                { name: "Warehouse", label: "Omborxona" },
                { name: "Production", label: "Production" },
                { name: "History", label: "Tarix" },
            ];
        }

        // fallback: hech bo‘lmasa Reports
        return [{ name: "Reports", label: "Hisobotlar" }];
    }, [isAdmin, isBranch, isProduction]);

    const activeRouteName = state?.routes?.[state.index]?.name;

    const go = (routeName) => {
        const exists = state?.routeNames?.includes(routeName);
        if (!exists) {
            console.warn("Drawer route not found:", routeName, state?.routeNames);
            return;
        }
        navigation.navigate(routeName);
        navigation.closeDrawer();
    };

    return (
        <DrawerContentScrollView
            {...props}
            contentContainerStyle={{
                padding: spacing.lg,
                backgroundColor: colors.bg,
                flex: 1,
            }}
        >
            <View style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.h2, { color: colors.text }]}>
                    {user?.full_name || user?.username || "Foydalanuvchi"}
                </Text>
                <Text style={[typography.small, { color: colors.muted, marginTop: 4 }]}>
                    Rol: {user?.role || "-"}
                </Text>
            </View>

            <View style={{ gap: 6 }}>
                {items.map((it) => (
                    <DrawerItem
                        key={it.name}
                        label={it.label}
                        active={activeRouteName === it.name}
                        onPress={() => go(it.name)}
                    />
                ))}
            </View>

            <View style={{ flex: 1 }} />

            <Pressable
                onPress={logout}
                style={({ pressed }) => [
                    {
                        marginTop: spacing.xl,
                        backgroundColor: colors.panel,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: radius.md,
                    },
                    pressed && { opacity: 0.85 },
                ]}
            >
                <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>
                    Chiqish
                </Text>
            </Pressable>
        </DrawerContentScrollView>
    );
}

export default function AppDrawer() {
    const { user } = useAuth();

    const role = String(user?.role || "").toLowerCase();
    const isAdmin = role === "admin";
    const isBranch = role === "branch";
    const isProduction = role === "production";

    // ✅ default route: admin -> Reports, branch -> Sales, production -> Production
    const defaultRoute = isAdmin
        ? "Reports"
        : isBranch
            ? "Sales"
            : isProduction
                ? "Production"
                : "Reports";

    const screenOptions = {
        headerStyle: { backgroundColor: colors.panel },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "800" },
        sceneContainerStyle: { backgroundColor: colors.bg },
        drawerStyle: { backgroundColor: colors.bg },
    };

    return (
        <Drawer.Navigator
            initialRouteName={defaultRoute}
            screenOptions={screenOptions}
            drawerContent={(props) => <CustomDrawerContent {...props} />}
        >
            {/* ADMIN */}
            {isAdmin && (
                <>
                    <Drawer.Screen name="Reports" component={ReportsScreen} options={{ title: "Hisobotlar" }} />
                    <Drawer.Screen name="Branches" component={BranchesScreen} options={{ title: "Filiallar" }} />
                    <Drawer.Screen name="Users" component={UsersScreen} options={{ title: "Foydalanuvchilar" }} />
                    <Drawer.Screen name="Expenses" component={ExpensesScreen} options={{ title: "Xarajatlar" }} />
                    <Drawer.Screen name="Warehouse" component={WarehouseScreen} options={{ title: "Omborxona" }} />
                    <Drawer.Screen name="Products" component={ProductsScreen} options={{ title: "Asosiy Catalog" }} />
                    <Drawer.Screen name="Transfers" component={TransfersScreen} options={{ title: "Transferlar" }} />
                    <Drawer.Screen name="Returns" component={ReturnsScreen} options={{ title: "Vazvratlar" }} />
                    <Drawer.Screen name="History" component={HistoryScreen} options={{ title: "Tarix" }} />
                </>
            )}

            {/* BRANCH */}
            {isBranch && (
                <>
                    <Drawer.Screen name="Sales" component={SalesScreen} options={{ title: "Sotuv" }} />
                    <Drawer.Screen name="Warehouse" component={WarehouseScreen} options={{ title: "Omborxona" }} />
                    <Drawer.Screen name="Receiving" component={ReceivingScreen} options={{ title: "Qabul qilish" }} />
                    <Drawer.Screen name="Returns" component={ReturnsScreen} options={{ title: "Vazvratlar" }} />
                    <Drawer.Screen name="History" component={HistoryScreen} options={{ title: "Tarix" }} />
                </>
            )}

            {/* PRODUCTION */}
            {isProduction && (
                <>
                    <Drawer.Screen name="Production" component={ProductionScreen} options={{ title: "Production" }} />
                    <Drawer.Screen name="Warehouse" component={WarehouseScreen} options={{ title: "Omborxona" }} />
                    <Drawer.Screen name="History" component={HistoryScreen} options={{ title: "Tarix" }} />
                </>
            )}
        </Drawer.Navigator>
    );
}
