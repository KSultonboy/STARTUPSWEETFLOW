import React from "react";
import { View } from "react-native";
import { colors, radius, spacing, shadows } from "../../styles";

export default function Card({ children, style }) {
    return (
        <View
            style={[
                {
                    backgroundColor: colors.panel,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                },
                shadows.card,
                style,
            ]}
        >
            {children}
        </View>
    );
}
