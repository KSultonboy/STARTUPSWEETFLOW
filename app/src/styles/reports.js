import { colors, radius, spacing, typography } from "./index";

export const reportStyles = {
    section: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        ...typography.h2,
        color: "#f9fafb",
        marginBottom: 4,
    },
    sectionSubtitle: {
        ...typography.small,
        color: colors.muted,
        marginBottom: spacing.sm,
    },

    card: {
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        backgroundColor: colors.bg,
    },

    list: {
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        backgroundColor: colors.bg,
    },

    empty: {
        ...typography.small,
        color: colors.muted,
    },
};
