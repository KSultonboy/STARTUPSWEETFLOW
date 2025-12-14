import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../styles";

export default function Screen({
    children,
    scroll = true,
    contentStyle,
    style,
}) {
    if (!scroll) {
        return (
            <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
                <View style={[{ flex: 1, padding: spacing.lg }, contentStyle]}>
                    {children}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[
                    { padding: spacing.lg, paddingBottom: spacing.xl },
                    contentStyle,
                ]}
                keyboardShouldPersistTaps="handled"
            >
                {children}
            </ScrollView>
        </SafeAreaView>
    );
}
