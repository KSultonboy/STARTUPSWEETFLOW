import React from "react";
import { View, Text, Pressable } from "react-native";
import { colors, typography, radius } from "../../styles";
import { reportStyles } from "../../styles/reports";

export default function ReportsSummaryCardsNative({ cards = [], onCardPress }) {
    if (!cards?.length) return null;

    const handlePress = (card) => {
        if (!card.clickable || !onCardPress) return;
        onCardPress(card);
    };

    const profitBoxStyle = (card) => {
        if (card.key !== "profit") return null;
        const v = Number(card.rawValue || 0);

        if (v < 0) return { backgroundColor: "#7f1d1d", borderColor: "#fecaca" };
        if (v <= 50_000_000) return { backgroundColor: "#78350f", borderColor: "#facc15" };
        return { backgroundColor: "#14532d", borderColor: "#4ade80" };
    };

    return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {cards.map((card) => {
                const clickable = !!card.clickable;
                const profit = profitBoxStyle(card);

                return (
                    <Pressable
                        key={card.key}
                        onPress={() => handlePress(card)}
                        style={({ pressed }) => [
                            {
                                width: "48%",
                                marginBottom: 10,
                                borderRadius: radius.lg,
                                borderWidth: 1,
                                borderColor: "rgba(148,163,184,0.3)",
                                backgroundColor: colors.bg,
                                padding: 10,
                            },
                            profit,
                            pressed && clickable && { transform: [{ translateY: -1 }] },
                        ]}
                    >
                        <Text style={[typography.small, { color: colors.muted }]}>{card.title}</Text>
                        <Text style={[typography.h2, { color: colors.text, marginTop: 4 }]}>
                            {card.value}
                        </Text>
                        {card.subtitle ? (
                            <Text style={[typography.small, { color: "#6b7280", marginTop: 6, lineHeight: 16 }]}>
                                {card.subtitle}
                            </Text>
                        ) : null}
                        {card.key === "profit" ? (
                            <Text style={[typography.small, { color: colors.text, marginTop: 6 }]}>
                                Sof foyda holati
                            </Text>
                        ) : null}
                    </Pressable>
                );
            })}
        </View>
    );
}
