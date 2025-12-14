import React from "react";
import { View, Text, TextInput } from "react-native";
import { colors, radius, spacing, typography } from "../../styles";

export default function TextField({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    autoCapitalize = "none",
    autoCorrect = false,
}) {
    return (
        <View style={{ width: "100%" }}>
            {label ? (
                <Text style={[typography.small, { color: colors.muted, marginBottom: 6 }]}>
                    {label}
                </Text>
            ) : null}

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#6b7280"
                secureTextEntry={secureTextEntry}
                autoCapitalize={autoCapitalize}
                autoCorrect={autoCorrect}
                style={{
                    width: "100%",
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: "rgba(55, 65, 81, 0.9)",
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    paddingVertical: 11,
                    paddingHorizontal: 13,
                    color: colors.text,
                    fontSize: 14,
                }}
            />
        </View>
    );
}
