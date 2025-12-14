import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import { colors, radius, spacing, shadows, typography } from "../../styles";

export default function Button({
    title,
    onPress,
    loading,
    disabled,
    variant = "primary", // primary | ghost | danger
    style,
}) {
    const isDisabled = disabled || loading;

    const base = {
        paddingVertical: 10,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    };

    const variants = {
        primary: { backgroundColor: colors.primary, ...shadows.primary },
        ghost: {
            backgroundColor: colors.panel,
            borderWidth: 1,
            borderColor: colors.border,
        },
        danger: { backgroundColor: colors.danger },
    };

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                base,
                variants[variant],
                isDisabled && { opacity: 0.7 },
                pressed && !isDisabled && { transform: [{ translateY: -1 }] },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={colors.text} />
            ) : (
                <Text style={[typography.body, { color: colors.text, fontWeight: "700" }]}>
                    {title}
                </Text>
            )}
        </Pressable>
    );
}
