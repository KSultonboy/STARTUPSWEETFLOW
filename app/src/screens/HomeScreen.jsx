import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { useAuth } from "../context/AuthContext";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import { colors, spacing, typography } from "../styles";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
    const { user } = useAuth();
    const navigation = useNavigation();

    const role = String(user?.role || "").toLowerCase();
    const isAdmin = role === "admin";
    const isBranch = role === "branch";
    const isProduction = role === "production";

    const menu = useMemo(() => {
        if (isAdmin) {
            return [
                { key: "Reports", title: "Hisobotlar", sub: "Savdo, xarajatlar, foyda" },
                { key: "Branches", title: "Filiallar", sub: "Joylar ro‘yxati" },
                { key: "Users", title: "Foydalanuvchilar", sub: "Admin/xodimlar" },
                { key: "Expenses", title: "Xarajatlar", sub: "Masalliqlar, bezaklar..." },
                { key: "Warehouse", title: "Omborxona", sub: "Qoldiq va harakat" },
                { key: "Products", title: "Asosiy Catalog", sub: "Mahsulotlar" },
                { key: "Transfers", title: "Transferlar", sub: "Jo‘natish/qabul" },
                { key: "Returns", title: "Vazvratlar", sub: "Qaytgan tovar" },
                { key: "History", title: "Tarix", sub: "Aktivliklar" },
            ];
        }

        if (isBranch) {
            return [
                { key: "Sales", title: "Sotuv", sub: "Chek va savdo" },
                { key: "Warehouse", title: "Omborxona", sub: "Qoldiq" },
                { key: "Receiving", title: "Qabul qilish", sub: "Kelgan tovar" },
                { key: "Returns", title: "Vazvratlar", sub: "Qaytarish" },
                { key: "History", title: "Tarix", sub: "Sotuv tarixi" },
            ];
        }

        if (isProduction) {
            return [
                { key: "Production", title: "Production", sub: "Ishlab chiqarish kiritish" },
                { key: "Warehouse", title: "Omborxona", sub: "Masalliqlar qoldig‘i" },
                { key: "History", title: "Tarix", sub: "Production tarixi" },
            ];
        }

        return [{ key: "Reports", title: "Hisobotlar", sub: "Umumiy statistika" }];
    }, [isAdmin, isBranch, isProduction]);

    return (
        <Screen>
            <View style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.h1, { color: colors.text }]}>
                    Salom, {user?.full_name || user?.username || "foydalanuvchi"} 👋
                </Text>
                <Text style={[typography.small, { color: colors.muted, marginTop: 6 }]}>
                    Rol: {user?.role || "-"}
                </Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                {menu.map((item) => (
                    <Pressable
                        key={item.key}
                        onPress={() => navigation.navigate(item.key)}
                        style={({ pressed }) => [
                            { width: "48%", marginBottom: 12 },
                            pressed && { transform: [{ translateY: -1 }] },
                        ]}
                    >
                        <Card>
                            <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>
                                {item.title}
                            </Text>
                            <Text style={[typography.small, { color: colors.muted, marginTop: 6, lineHeight: 16 }]}>
                                {item.sub}
                            </Text>
                        </Card>
                    </Pressable>
                ))}
            </View>
        </Screen>
    );
}
