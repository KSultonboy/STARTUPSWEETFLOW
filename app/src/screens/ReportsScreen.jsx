import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, Pressable, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../services/api";

import ReportsSummaryCardsNative from "../components/reports/ReportsSummaryCardsNative";
import ReportsSalesByBranchSection from "../components/reports/ReportsSalesByBranchSection";
import ReportsExpensesByTypeSection from "../components/reports/ReportsExpensesByTypeSection";
import ReportsTopProductsSection from "../components/reports/ReportsTopProductsSection";
import ReportsMonthlyBarChartNative from "../components/reports/ReportsMonthlyBarChartNative";
import ReportsProductionSectionNative from "../components/reports/ReportsProductionSectionNative";

import Screen from "../components/ui/Screen";
import { colors, spacing, typography, radius } from "../styles";
import { reportStyles } from "../styles/reports";

const MODES = ["day", "week", "month", "year"];

function modeLabel(m) {
    if (m === "week") return "Haftalik";
    if (m === "month") return "Oylik";
    if (m === "year") return "Yillik";
    return "Kunlik";
}

function DetailModal({ visible, title, onClose, children }) {
    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <View
                style={{
                    flex: 1,
                    backgroundColor: "rgba(15,23,42,0.65)",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 12,
                }}
            >
                <View
                    style={{
                        width: "100%",
                        maxHeight: "80%",
                        borderRadius: radius.lg,
                        backgroundColor: colors.bg,
                        borderWidth: 1,
                        borderColor: "rgba(148,163,184,0.5)",
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: "rgba(30,64,175,0.6)",
                            justifyContent: "space-between",
                        }}
                    >
                        <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>
                            {title}
                        </Text>

                        <Pressable onPress={onClose} style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 18, color: colors.text }}>✕</Text>
                        </Pressable>
                    </View>

                    <ScrollView style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                        {children}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

export default function ReportsScreen() {
    const navigation = useNavigation();

    const [stats, setStats] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [monthlySales, setMonthlySales] = useState([]);
    const [salesByBranch, setSalesByBranch] = useState([]);
    const [expensesByType, setExpensesByType] = useState([]);
    const [productionByProduct, setProductionByProduct] = useState([]);
    const [returnsByProduct, setReturnsByProduct] = useState([]);
    const [outletTransfersByBranch, setOutletTransfersByBranch] = useState([]);
    const [returnsByBranchToday, setReturnsByBranchToday] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [mode, setMode] = useState("day");

    const [detailType, setDetailType] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [branchesList, setBranchesList] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [productsList, setProductsList] = useState([]);
    const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");

    const fetchOverview = async (selectedDate, selectedMode) => {
        try {
            setLoading(true);
            setError("");

            const res = await api.get("/reports/overview", {
                params: { date: selectedDate, mode: selectedMode },
            });

            const data = res.data || {};
            setStats(data.stats || null);
            setTopProducts(data.topProducts || []);
            setMonthlySales(data.monthlySales || []);
            setSalesByBranch(data.salesByBranch || []);
            setExpensesByType(data.expensesByType || []);
            setProductionByProduct(data.productionByProduct || []);
            setReturnsByProduct(data.returnsByProduct || []);
            setOutletTransfersByBranch(data.outletTransfersByBranch || []);
            setReturnsByBranchToday(data.returnsByBranchToday || []);
        } catch (err) {
            console.error("Reports fetch error:", err.response?.data || err.message);
            setError("Hisobot ma'lumotlarini yuklashda xatolik.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Drawer burger
    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <Pressable onPress={() => navigation.openDrawer()} style={{ paddingHorizontal: 12 }}>
                    <Text style={{ color: colors.text, fontSize: 22 }}>≡</Text>
                </Pressable>
            ),
        });
    }, [navigation]);

    useEffect(() => {
        fetchOverview(date, mode);
    }, [date, mode]);

    const branchChecksTotal = useMemo(() => {
        return (salesByBranch || [])
            .filter((row) => String(row.branch_type || "BRANCH").toUpperCase() === "BRANCH")
            .reduce((sum, row) => sum + (row.sale_count || 0), 0);
    }, [salesByBranch]);

    const summaryCards = useMemo(() => {
        if (!stats) return [];

        const totalBranches = stats.totalBranches ?? 0;
        const totalOutlets = stats.totalOutlets ?? 0;
        const totalLocations = totalBranches + totalOutlets;

        const totalUsers = stats.totalUsers ?? 0;
        const totalProducts = stats.totalProducts ?? 0;

        const productionQuantity = stats.productionQuantity ?? 0;
        const productionBatchCount = stats.productionBatchCount ?? 0;

        const totalExpenses = stats.totalExpenses ?? 0;
        const totalRevenue = stats.totalRevenue ?? stats.todaySalesAmount ?? 0;

        const cashReceivedToday = stats.cashReceivedToday ?? 0;
        const returnsAmountToday = stats.returnsAmountToday ?? 0;
        const debtsAmount = stats.debtsAmount ?? 0;

        const profit = stats.profit ?? (totalRevenue - totalExpenses - returnsAmountToday);

        const salesLabel =
            mode === "week"
                ? "Haftalik savdo (cheklar)"
                : mode === "month"
                    ? "Oylik savdo (cheklar)"
                    : mode === "year"
                        ? "Yillik savdo (cheklar)"
                        : "Kunlik savdo (cheklar)";

        return [
            {
                key: "locations",
                title: "Joylar",
                value: totalLocations.toString(),
                rawValue: totalLocations,
                subtitle: `Filiallar: ${totalBranches}, do‘konlar: ${totalOutlets}`,
                clickable: true,
            },
            {
                key: "daily_sales",
                title: salesLabel,
                value: `${branchChecksTotal} ta chek`,
                rawValue: branchChecksTotal,
                subtitle: "Filiallardagi umumiy cheklar soni",
                clickable: true,
            },
            {
                key: "users",
                title: "Foydalanuvchilar",
                value: totalUsers.toString(),
                rawValue: totalUsers,
                subtitle: "Admin va xodimlar",
                clickable: true,
            },
            {
                key: "products",
                title: "Mahsulotlar",
                value: totalProducts.toString(),
                rawValue: totalProducts,
                subtitle: "Aktiv menyu pozitsiyalari",
                clickable: true,
            },
            {
                key: "production",
                title: "Ishlab chiqarish",
                value: productionQuantity.toLocaleString("uz-UZ"),
                rawValue: productionQuantity,
                subtitle: `${productionBatchCount} ta partiya (miqdor yig‘indisi)`,
                clickable: true,
            },
            {
                key: "revenue",
                title: "Umumiy daromad",
                value: `${totalRevenue.toLocaleString("uz-UZ")} so‘m`,
                rawValue: totalRevenue,
                subtitle: "Savdo + do‘konlarga transferlar",
                clickable: false,
            },
            {
                key: "cash",
                title: "Olingan pullar",
                value: `${cashReceivedToday.toLocaleString("uz-UZ")} so‘m`,
                rawValue: cashReceivedToday,
                subtitle: "Kassa moduliga ulanish uchun tayyor",
                clickable: false,
            },
            {
                key: "returns",
                title: "Vazvratlar",
                value: `${returnsAmountToday.toLocaleString("uz-UZ")} so‘m`,
                rawValue: returnsAmountToday,
                subtitle: "Bugungi qaytgan tovarlar",
                clickable: true,
            },
            {
                key: "debts",
                title: "Qarzlar",
                value: `${debtsAmount.toLocaleString("uz-UZ")} so‘m`,
                rawValue: debtsAmount,
                subtitle: "Filial va do‘konlar (transfer − vazvrat)",
                clickable: false,
            },
            {
                key: "expenses",
                title: "Xarajatlar",
                value: `${totalExpenses.toLocaleString("uz-UZ")} so‘m`,
                rawValue: totalExpenses,
                subtitle: "Barcha turdagi xarajatlar yig‘indisi",
                clickable: false,
            },
            {
                key: "profit",
                title: "Sof foyda",
                value: `${profit.toLocaleString("uz-UZ")} so‘m`,
                rawValue: profit,
                subtitle: "Daromad − xarajatlar − vazvratlar",
                clickable: false,
            },
        ];
    }, [stats, mode, branchChecksTotal]);

    const monthlyChartData = useMemo(() => {
        if (!monthlySales?.length) return [];
        const maxAmount = Math.max(...monthlySales.map((d) => d.total_amount || 0));
        return monthlySales.map((item) => {
            const amount = item.total_amount || 0;
            const width = maxAmount ? Math.round((amount / maxAmount) * 100) : 0;
            const label = item.sale_date ? item.sale_date.slice(5) : "";
            return { ...item, label, amount, width };
        });
    }, [monthlySales]);

    const expenseTypeLabel = (t) => {
        switch (t) {
            case "ingredients":
                return "Masalliqlar";
            case "decor":
                return "Bezaklar";
            case "utility":
                return "Qo‘shimcha xarajatlar";
            default:
                return t || "—";
        }
    };

    const locationTypeLabel = (rawType) => {
        const t = String(rawType || "").toUpperCase();
        if (t === "BRANCH") return "Filial";
        if (t === "OUTLET" || t === "SHOP" || t === "STORE") return "Do‘kon";
        return "—";
    };

    const handleCardPress = async (card) => {
        switch (card.key) {
            case "locations":
                setDetailType("locations");
                if (!branchesList.length) {
                    setDetailLoading(true);
                    try {
                        const res = await api.get("/branches");
                        setBranchesList(res.data || []);
                    } finally {
                        setDetailLoading(false);
                    }
                }
                break;

            case "daily_sales":
                setDetailType("daily_sales");
                break;

            case "users":
                setDetailType("users");
                if (!usersList.length) {
                    setDetailLoading(true);
                    try {
                        const res = await api.get("/users");
                        setUsersList(res.data || []);
                    } finally {
                        setDetailLoading(false);
                    }
                }
                break;

            case "products":
                setDetailType("products");
                if (!productsList.length) {
                    setDetailLoading(true);
                    try {
                        const res = await api.get("/products");
                        setProductsList(res.data || []);
                    } finally {
                        setDetailLoading(false);
                    }
                }
                break;

            case "production":
                setDetailType("production");
                break;

            case "returns":
                setDetailType("returns");
                break;

            default:
                break;
        }
    };

    const closeDetail = () => setDetailType(null);

    const filteredProductsForModal = useMemo(() => {
        if (!productsList?.length) return [];
        if (productCategoryFilter === "ALL") return productsList;
        return productsList.filter(
            (p) => String(p.category || "").toUpperCase() === productCategoryFilter.toUpperCase()
        );
    }, [productsList, productCategoryFilter]);

    const resetToToday = () => setDate(new Date().toISOString().slice(0, 10));

    return (
        <Screen scroll={false}>
            {/* Header */}
            <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
                <Text style={[typography.h1, { color: colors.text }]}>Hisobotlar</Text>
                <Text style={[typography.small, { color: colors.muted, marginTop: 6, lineHeight: 16 }]}>
                    Ruxshona Tort tarmog‘i bo‘yicha filiallar, do‘konlar, savdo, xarajatlar va ishlab chiqarish statistikasi.
                </Text>
            </View>

            {/* Filters */}
            <View style={{ paddingBottom: spacing.sm }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {MODES.map((m) => {
                        const active = m === mode;
                        return (
                            <Pressable
                                key={m}
                                onPress={() => setMode(m)}
                                style={{
                                    paddingVertical: 6,
                                    paddingHorizontal: 10,
                                    borderRadius: radius.pill,
                                    borderWidth: 1,
                                    borderColor: active ? "#3b82f6" : "#4b5563",
                                    backgroundColor: active ? "#3b82f6" : "transparent",
                                }}
                            >
                                <Text style={[typography.small, { color: colors.text, fontWeight: active ? "800" : "600" }]}>
                                    {modeLabel(m)}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Pressable
                    onPress={resetToToday}
                    style={{
                        alignSelf: "flex-start",
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: radius.pill,
                        backgroundColor: colors.panel,
                        borderWidth: 1,
                        borderColor: colors.border,
                    }}
                >
                    <Text style={[typography.small, { color: colors.muted, marginRight: 6 }]}>Sana:</Text>
                    <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>{date}</Text>
                    <Text style={[typography.small, { color: colors.muted }]}> (Bugungi sana)</Text>
                </Pressable>
            </View>

            {error ? (
                <View
                    style={{
                        marginTop: 10,
                        padding: 10,
                        borderRadius: radius.md,
                        backgroundColor: "rgba(248, 113, 113, 0.08)",
                        borderWidth: 1,
                        borderColor: "rgba(239, 68, 68, 0.6)",
                    }}
                >
                    <Text style={[typography.small, { color: "#fecaca" }]}>{error}</Text>
                </View>
            ) : null}

            {loading && !stats ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator />
                    <Text style={[typography.small, { color: colors.text, marginTop: 8 }]}>Yuklanmoqda...</Text>
                </View>
            ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
                    {/* Summary */}
                    <View style={reportStyles.section}>
                        <Text style={reportStyles.sectionTitle}>Umumiy ko‘rsatkichlar</Text>
                        <ReportsSummaryCardsNative cards={summaryCards} onCardPress={handleCardPress} />
                    </View>

                    <ReportsSalesByBranchSection
                        date={date}
                        salesByBranch={salesByBranch}
                        outletTransfersByBranch={outletTransfersByBranch}
                        returnsByBranchToday={returnsByBranchToday}
                        locationTypeLabel={locationTypeLabel}
                    />

                    <ReportsExpensesByTypeSection
                        date={date}
                        expensesByType={expensesByType}
                        expenseTypeLabel={expenseTypeLabel}
                    />

                    <ReportsTopProductsSection date={date} topProducts={topProducts} loading={loading} />

                    <ReportsProductionSectionNative
                        stats={stats}
                        onGoToHistory={() => navigation.navigate("History")}
                    />

                    <ReportsMonthlyBarChartNative monthLabel={date.slice(0, 7)} data={monthlyChartData} />
                </ScrollView>
            )}

            {/* DETAIL MODALS */}
            <DetailModal visible={detailType === "locations"} title="Filial va do‘konlar ro‘yxati" onClose={closeDetail}>
                {detailLoading ? (
                    <Text style={[typography.small, { color: colors.text }]}>Yuklanmoqda...</Text>
                ) : !branchesList.length ? (
                    <Text style={reportStyles.empty}>Joylar topilmadi.</Text>
                ) : (
                    branchesList.map((b, idx) => {
                        const t = String(b.branch_type || "BRANCH").toUpperCase();
                        const typeLabel = t === "OUTLET" ? "Do‘kon / ulgurji" : "Filial";
                        return (
                            <View
                                key={b.id}
                                style={{
                                    paddingVertical: 10,
                                    borderBottomWidth: 1,
                                    borderBottomColor: "#111827",
                                }}
                            >
                                <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>
                                    {idx + 1}. {b.name}
                                </Text>
                                <Text style={[typography.small, { color: colors.muted, marginTop: 2 }]}>
                                    {typeLabel} • {b.is_active ? "Faol" : "Nofaol"}
                                </Text>
                            </View>
                        );
                    })
                )}
            </DetailModal>

            <DetailModal visible={detailType === "daily_sales"} title="Filiallar bo‘yicha cheklar soni" onClose={closeDetail}>
                {(salesByBranch || [])
                    .filter((row) => String(row.branch_type || "BRANCH").toUpperCase() === "BRANCH")
                    .map((row, idx) => (
                        <View
                            key={(row.branch_id || "null") + "-" + idx}
                            style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#111827" }}
                        >
                            <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>
                                {idx + 1}. {row.branch_name || "—"}
                            </Text>
                            <Text style={[typography.small, { color: colors.muted, marginTop: 2 }]}>
                                Cheklar: {(row.sale_count || 0).toLocaleString("uz-UZ")} • Savdo:{" "}
                                {(row.total_amount || 0).toLocaleString("uz-UZ")} so‘m
                            </Text>
                        </View>
                    ))}

                {(salesByBranch || []).filter(
                    (row) => String(row.branch_type || "BRANCH").toUpperCase() === "BRANCH"
                ).length === 0 ? (
                    <Text style={reportStyles.empty}>Ushbu sana uchun savdo topilmadi.</Text>
                ) : null}
            </DetailModal>

            <DetailModal visible={detailType === "users"} title="Foydalanuvchilar ro‘yxati" onClose={closeDetail}>
                {detailLoading ? (
                    <Text style={[typography.small, { color: colors.text }]}>Yuklanmoqda...</Text>
                ) : !usersList.length ? (
                    <Text style={reportStyles.empty}>Foydalanuvchilar topilmadi.</Text>
                ) : (
                    usersList.map((u, idx) => (
                        <View
                            key={u.id}
                            style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#111827" }}
                        >
                            <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>
                                {idx + 1}. {u.full_name}
                            </Text>
                            <Text style={[typography.small, { color: colors.muted, marginTop: 2 }]}>
                                @{u.username} • {u.role}
                                {u.branch_name ? ` • ${u.branch_name}` : ""}
                            </Text>
                        </View>
                    ))
                )}
            </DetailModal>

            <DetailModal visible={detailType === "products"} title="Mahsulotlar katalogi" onClose={closeDetail}>
                {detailLoading ? (
                    <Text style={[typography.small, { color: colors.text }]}>Yuklanmoqda...</Text>
                ) : (
                    <>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                            {[
                                { key: "ALL", label: "Hammasi" },
                                { key: "PRODUCT", label: "Ishlab chiqilgan" },
                                { key: "INGREDIENT", label: "Masalliqlar" },
                                { key: "DECORATION", label: "Dekoratsiya / bezak" },
                                { key: "UTILITY", label: "Kommunal / xizmatlar" },
                            ].map((opt) => {
                                const active = productCategoryFilter === opt.key;
                                return (
                                    <Pressable
                                        key={opt.key}
                                        onPress={() => setProductCategoryFilter(opt.key)}
                                        style={{
                                            borderRadius: radius.pill,
                                            borderWidth: 1,
                                            borderColor: active ? "#3b82f6" : "#4b5563",
                                            backgroundColor: active ? "#3b82f6" : "transparent",
                                            paddingVertical: 4,
                                            paddingHorizontal: 8,
                                        }}
                                    >
                                        <Text style={[typography.small, { color: colors.text, fontWeight: active ? "800" : "600" }]}>
                                            {opt.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {!filteredProductsForModal.length ? (
                            <Text style={reportStyles.empty}>Mahsulot topilmadi.</Text>
                        ) : (
                            filteredProductsForModal.map((p, idx) => (
                                <View
                                    key={p.id}
                                    style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#111827" }}
                                >
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>
                                                {idx + 1}. {p.name}
                                            </Text>
                                            <Text style={[typography.small, { color: colors.muted, marginTop: 2 }]}>
                                                Kategoriya: {p.category || "—"} • Birlik: {p.unit}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: "flex-end" }}>
                                            <Text style={[typography.small, { color: "#facc15", fontWeight: "800" }]}>
                                                Narx: {typeof p.price === "number" ? p.price.toLocaleString("uz-UZ") : "-"} so‘m
                                            </Text>
                                            {typeof p.wholesale_price === "number" && p.wholesale_price > 0 ? (
                                                <Text style={[typography.small, { color: "#facc15", fontWeight: "800", marginTop: 2 }]}>
                                                    Ulgurji: {p.wholesale_price.toLocaleString("uz-UZ")} so‘m
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </>
                )}
            </DetailModal>

            <DetailModal visible={detailType === "production"} title="Ishlab chiqarish (mahsulotlar bo‘yicha)" onClose={closeDetail}>
                {!productionByProduct.length ? (
                    <Text style={reportStyles.empty}>Ushbu sana uchun ishlab chiqarish topilmadi.</Text>
                ) : (
                    productionByProduct.map((row, idx) => (
                        <View
                            key={row.product_id}
                            style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#111827" }}
                        >
                            <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>
                                {idx + 1}. {row.product_name}
                            </Text>
                            <Text style={[typography.small, { color: colors.muted, marginTop: 2 }]}>
                                Birlik: {row.unit} • Miqdor: {(row.total_quantity || 0).toLocaleString("uz-UZ")}
                            </Text>
                        </View>
                    ))
                )}
            </DetailModal>

            <DetailModal visible={detailType === "returns"} title="Vazvratlar (mahsulotlar bo‘yicha)" onClose={closeDetail}>
                {!returnsByProduct.length ? (
                    <Text style={reportStyles.empty}>Bugungi kunda vazvratlar topilmadi.</Text>
                ) : (
                    returnsByProduct.map((row, idx) => (
                        <View
                            key={row.product_id}
                            style={{
                                paddingVertical: 10,
                                borderBottomWidth: 1,
                                borderBottomColor: "#111827",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                gap: 10,
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>
                                    {idx + 1}. {row.product_name}
                                </Text>
                                <Text style={[typography.small, { color: colors.muted, marginTop: 2 }]}>
                                    Birlik: {row.unit} • Qaytgan miqdor: {(row.total_quantity || 0).toLocaleString("uz-UZ")}
                                </Text>
                            </View>
                            <Text style={[typography.small, { color: "#facc15", fontWeight: "900" }]}>
                                {(row.total_amount || 0).toLocaleString("uz-UZ")} so‘m
                            </Text>
                        </View>
                    ))
                )}
            </DetailModal>
        </Screen>
    );
}
