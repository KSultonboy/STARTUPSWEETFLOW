// client/src/pages/ReportsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext"; // [NEW]

import ReportsFilterBar from "../components/reports/ReportsFilterBar";
import ReportsSummaryCards from "../components/reports/ReportsSummaryCards";
import ReportsSalesByBranchTable from "../components/reports/ReportsSalesByBranchTable";
import ReportsExpensesByTypeTable from "../components/reports/ReportsExpensesByTypeTable";
import ReportsTopProductsTable from "../components/reports/ReportsTopProductsTable";
import ReportsMonthlyBarChart from "../components/reports/ReportsMonthlyBarChart";
import ReportsProductionSection from "../components/reports/ReportsProductionSection";
import ReportsDetailsModal from "../components/reports/ReportsDetailsModal";

function ReportsPage() {
    const { user } = useAuth(); // [NEW]
    const [stats, setStats] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [monthlySales, setMonthlySales] = useState([]);
    const [salesByBranch, setSalesByBranch] = useState([]);
    const [expensesByType, setExpensesByType] = useState([]);
    const [productionByProduct, setProductionByProduct] = useState([]);
    const [returnsByProduct, setReturnsByProduct] = useState([]);
    const [outletTransfersByBranch, setOutletTransfersByBranch] = useState([]);
    const [returnsByBranchToday, setReturnsByBranchToday] = useState([]);
    const [cashByBranchPeriod, setCashByBranchPeriod] = useState([]);


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [date, setDate] = useState(() => {
        const now = new Date();
        return now.toISOString().slice(0, 10);
    });

    const [mode, setMode] = useState("day"); // day | week | month | year

    // Detal modallar uchun state
    const [detailType, setDetailType] = useState(null); // null | 'locations' | 'daily_sales' | 'users' | 'products' | 'production' | 'returns'
    const [detailLoading, setDetailLoading] = useState(false);

    const [branchesList, setBranchesList] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [productsList, setProductsList] = useState([]);
    const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");

    const fetchOverview = async (selectedDate) => {
        try {
            setLoading(true);
            setError("");

            const res = await api.get("/reports/overview", {
                params: { date: selectedDate, mode },
            });

            setStats(res.data.stats || null);
            setTopProducts(res.data.topProducts || []);
            setMonthlySales(res.data.monthlySales || []);
            setSalesByBranch(res.data.salesByBranch || []);
            setExpensesByType(res.data.expensesByType || []);
            setProductionByProduct(res.data.productionByProduct || []);
            setReturnsByProduct(res.data.returnsByProduct || []);
            setOutletTransfersByBranch(res.data.outletTransfersByBranch || []);
            setReturnsByBranchToday(res.data.returnsByBranchToday || []);
            setCashByBranchPeriod(res.data.cashByBranchPeriod || []);
        } catch (err) {
            console.error(err);
            setError("Hisobot ma'lumotlarini yuklashda xatolik.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview(date);
    }, [date, mode]);

    // Filiallar bo‘yicha jami cheklar soni (faqat BRANCH)
    const branchChecksTotal = useMemo(() => {
        return (salesByBranch || [])
            .filter(
                (row) =>
                    String(row.branch_type || "BRANCH").toUpperCase() === "BRANCH"
            )
            .reduce((sum, row) => sum + (row.sale_count || 0), 0);
    }, [salesByBranch]);

    // Summary cardlar
    const summaryCards = useMemo(() => {
        if (!stats) return [];

        const totalBranches = stats.totalBranches ?? 0;
        const totalOutlets = stats.totalOutlets ?? 0;
        const totalLocations = totalBranches + totalOutlets;

        const totalUsers = stats.totalUsers ?? 0;
        const totalProducts = stats.totalProducts ?? 0;

        const todaySalesAmount = stats.todaySalesAmount ?? 0;
        const productionQuantity = stats.productionQuantity ?? 0;
        const productionBatchCount = stats.productionBatchCount ?? 0;

        const totalExpenses = stats.totalExpenses ?? 0;
        const totalRevenue =
            stats.totalRevenue ?? stats.todaySalesAmount ?? 0;

        const cashReceivedToday = stats.cashReceivedToday ?? 0;
        const returnsAmountToday = stats.returnsAmountToday ?? 0;
        const debtsAmount = stats.debtsAmount ?? 0;

        const profit =
            stats.profit ??
            (totalRevenue - totalExpenses - returnsAmountToday);

        const salesLabel =
            mode === "week"
                ? "Haftalik savdo (cheklar)"
                : mode === "month"
                    ? "Oylik savdo (cheklar)"
                    : mode === "year"
                        ? "Yillik savdo (cheklar)"
                        : "Kunlik savdo (cheklar)";

        return [
            // 1) Joylar
            {
                key: "locations",
                title: "Joylar",
                value: totalLocations.toString(),
                rawValue: totalLocations,
                subtitle: `Filiallar: ${totalBranches}, do‘konlar: ${totalOutlets}`,
                clickable: true,
            },
            // 2) Kun/hafta/oy/yil bo‘yicha savdo – faqat filial cheklari
            {
                key: "daily_sales",
                title: salesLabel,
                value: `${branchChecksTotal} ta chek`,
                rawValue: branchChecksTotal,
                subtitle: "Filiallardagi umumiy cheklar soni",
                clickable: true,
            },
            // 3) Foydalanuvchilar
            {
                key: "users",
                title: "Foydalanuvchilar",
                value: totalUsers.toString(),
                rawValue: totalUsers,
                subtitle: "Admin va xodimlar",
                clickable: true,
            },
            // 4) Mahsulotlar
            {
                key: "products",
                title: "Mahsulotlar",
                value: totalProducts.toString(),
                rawValue: totalProducts,
                subtitle: "Aktiv menyu pozitsiyalari",
                clickable: true,
            },
            // 5) Ishlab chiqarish
            {
                key: "production",
                title: "Ishlab chiqarish",
                value: productionQuantity.toLocaleString("uz-UZ"),
                rawValue: productionQuantity,
                subtitle: `${productionBatchCount} ta partiya (miqdor yig‘indisi)`,
                clickable: true,
            },
            // 6) Umumiy daromad
            {
                key: "revenue",
                title: "Umumiy daromad",
                value: `${totalRevenue.toLocaleString("uz-UZ")} so‘m`,
                rawValue: totalRevenue,
                subtitle: "Savdo + do‘konlarga transferlar",
                clickable: false,
            },
            // 7) Olingan pullar (placeholder)
            {
                key: "cash",
                title: "Olingan pullar",
                value: `${cashReceivedToday.toLocaleString("uz-UZ")} so‘m`,
                rawValue: cashReceivedToday,
                subtitle: "Kassa moduliga ulanish uchun tayyor",
                clickable: false,
            },
            // 8) Vazvratlar
            {
                key: "returns",
                title: "Vazvratlar",
                value: `${returnsAmountToday.toLocaleString("uz-UZ")} so‘m`,
                rawValue: returnsAmountToday,
                subtitle: "Bugungi qaytgan tovarlar",
                clickable: true,
            },
            // 9) Qarzlar – 50%
            {
                key: "debts",
                title: "Qarzlar",
                value: `${debtsAmount.toLocaleString("uz-UZ")} so‘m`,
                rawValue: debtsAmount,
                subtitle: "Filial va do‘konlar (transfer − vazvrat)",
                clickable: false,
            },
            // 10) Xarajatlar – 50%
            {
                key: "expenses",
                title: "Xarajatlar",
                value: `${totalExpenses.toLocaleString("uz-UZ")} so‘m`,
                rawValue: totalExpenses,
                subtitle: "Barcha turdagi xarajatlar yig‘indisi",
                clickable: false,
            },
            // 11) Sof foyda – 100%
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

    // Oylik grafika uchun data
    const monthlyChartData = useMemo(() => {
        if (!monthlySales || monthlySales.length === 0) return [];

        const maxAmount = Math.max(
            ...monthlySales.map((d) => d.total_amount || 0)
        );

        return monthlySales.map((item) => {
            const amount = item.total_amount || 0;
            const width = maxAmount ? Math.round((amount / maxAmount) * 100) : 0;
            const label = item.sale_date ? item.sale_date.slice(5) : "";

            return {
                ...item,
                label,
                amount,
                width,
            };
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

    const handleCardClick = async (card) => {
        switch (card.key) {
            case "locations":
                setDetailType("locations");
                if (!branchesList.length) {
                    setDetailLoading(true);
                    try {
                        const res = await api.get("/branches");
                        setBranchesList(res.data || []);
                    } catch (err) {
                        console.error(err);
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
                    } catch (err) {
                        console.error(err);
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
                    } catch (err) {
                        console.error(err);
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

    // ✅ PDF EXPORT – hisobot sahifasini COPY qilmaydi, alohida HTML generatsiya qiladi
    const handleExportPdf = () => {
        const modeLabel =
            mode === "week"
                ? "Haftalik"
                : mode === "month"
                    ? "Oylik"
                    : mode === "year"
                        ? "Yillik"
                        : "Kunlik";

        const safeStats = stats || {};

        const summaryRowsHtml = summaryCards
            .map(
                (card) => `
          <tr>
            <td>${card.title}</td>
            <td>${card.value}</td>
            <td>${card.subtitle || ""}</td>
          </tr>`
            )
            .join("");

        const salesByBranchHtml =
            (salesByBranch || [])
                .map(
                    (row, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${row.branch_name || "—"}</td>
            <td>${(row.sale_count || 0).toLocaleString("uz-UZ")}</td>
            <td>${(row.total_amount || 0).toLocaleString("uz-UZ")}</td>
          </tr>`
                )
                .join("") ||
            `<tr><td colspan="4" style="text-align:center">Ma'lumot topilmadi</td></tr>`;

        const expensesByTypeHtml =
            (expensesByType || [])
                .map(
                    (row, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${expenseTypeLabel(row.expense_type)}</td>
            <td>${(row.total_amount || 0).toLocaleString("uz-UZ")}</td>
          </tr>`
                )
                .join("") ||
            `<tr><td colspan="3" style="text-align:center">Ma'lumot topilmadi</td></tr>`;

        const topProductsHtml =
            (topProducts || [])
                .map(
                    (item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${item.product_name}</td>
            <td>${item.branch_name || "—"}</td>
            <td>${item.sold_quantity}</td>
            <td>${(item.total_amount || 0).toLocaleString("uz-UZ")}</td>
          </tr>`
                )
                .join("") ||
            `<tr><td colspan="5" style="text-align:center">Ma'lumot topilmadi</td></tr>`;

        const html = `
      <!DOCTYPE html>
      <html lang="uz">
        <head>
          <meta charset="UTF-8" />
          <title>${user?.tenantName || 'Ruxshona Tort'} – Hisobot (${date})</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              padding: 16px 24px;
              background: #ffffff;
              color: #111827;
            }
            h1, h2, h3 {
              margin: 0 0 8px 0;
            }
            .muted {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 12px;
            }
            .section {
              margin-bottom: 18px;
              page-break-inside: avoid;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-top: 6px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 4px 6px;
              text-align: left;
            }
            th {
              background: #f3f4f6;
            }
          </style>
        </head>
        <body>
          <h1>${user?.tenantName || 'Ruxshona Tort'} – Umumiy hisobot</h1>
          <div class="muted">
            Sana: <b>${date}</b> &nbsp; | &nbsp;
            Rejim: <b>${modeLabel}</b>
          </div>

          <div class="section">
            <h2>Umumiy ko‘rsatkichlar</h2>
            <table>
              <thead>
                <tr>
                  <th>Ko‘rsatkich</th>
                  <th>Qiymat</th>
                  <th>Izoh</th>
                </tr>
              </thead>
              <tbody>
                ${summaryRowsHtml}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Filial va do‘konlar bo‘yicha savdo</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Joy nomi</th>
                  <th>Cheklar soni</th>
                  <th>Savdo summasi (so‘m)</th>
                </tr>
              </thead>
              <tbody>
                ${salesByBranchHtml}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Xarajatlar taqsimoti</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Turi</th>
                  <th>Summasi (so‘m)</th>
                </tr>
              </thead>
              <tbody>
                ${expensesByTypeHtml}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Eng ko‘p sotilgan mahsulotlar</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mahsulot</th>
                  <th>Joy</th>
                  <th>Soni</th>
                  <th>Summasi (so‘m)</th>
                </tr>
              </thead>
              <tbody>
                ${topProductsHtml}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        // xohlasang avtomatik yopish ham mumkin:
        // printWindow.close();
    };

    // Products modalidagi category filterlangan ro‘yxat
    const filteredProductsForModal = useMemo(() => {
        if (!productsList || productsList.length === 0) return [];
        if (productCategoryFilter === "ALL") return productsList;
        return productsList.filter(
            (p) =>
                String(p.category || "").toUpperCase() ===
                productCategoryFilter.toUpperCase()
        );
    }, [productsList, productCategoryFilter]);

    const closeDetail = () => setDetailType(null);

    return (
        <div className="page" id="reports-root">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{user?.tenantName || 'Dashboard'} — Hisobotlar</h1>
                    <p className="page-subtitle">
                        Filial va do‘konlar bo‘yicha qisqacha kunlik/oylik statistik ma’lumotlar: savdo, xarajatlar va sof foyda.
                    </p>
                </div>

                <div className="page-header-actions" style={{ gap: 8 }}>
                    <ReportsFilterBar
                        mode={mode}
                        date={date}
                        onModeChange={setMode}
                        onDateChange={setDate}
                        onExportPdf={handleExportPdf}
                    />
                </div>
            </div>

            {error && (
                <div
                    className="info-box info-box--error"
                    style={{ marginBottom: 8 }}
                >
                    {error}
                </div>
            )}

            {loading && !stats ? (
                <p>Yuklanmoqda...</p>
            ) : (
                <>
                    {/* Summary cards */}
                    <ReportsSummaryCards
                        cards={summaryCards}
                        onCardClick={handleCardClick}
                    />

                    {/* Filial / do‘konlar bo‘yicha savdo */}
                    <div className="page-section">
                        <div className="page-section-header">
                            <h2 className="page-section-title">
                                Filial va do‘konlar bo‘yicha savdo holati
                            </h2>
                            <p className="page-section-subtitle">Sana: {date}</p>
                        </div>

                        <div className="card">
                            <ReportsSalesByBranchTable
                                salesByBranch={salesByBranch}
                                outletTransfersByBranch={outletTransfersByBranch}
                                returnsByBranchToday={returnsByBranchToday}
                                cashByBranchPeriod={cashByBranchPeriod}
                                locationTypeLabel={locationTypeLabel}
                            />
                        </div>
                    </div>

                    {/* Xarajatlar turlari bo‘yicha */}
                    <div className="page-section">
                        <div className="page-section-header">
                            <h2 className="page-section-title">
                                Xarajatlar taqsimoti (turlar bo‘yicha)
                            </h2>
                            <p className="page-section-subtitle">Sana: {date}</p>
                        </div>

                        <div className="card">
                            <ReportsExpensesByTypeTable
                                expensesByType={expensesByType}
                                expenseTypeLabel={expenseTypeLabel}
                            />
                        </div>
                    </div>

                    {/* Eng ko‘p sotilgan mahsulotlar */}
                    <div className="page-section">
                        <div className="page-section-header">
                            <h2 className="page-section-title">
                                Eng ko‘p sotilgan mahsulotlar
                            </h2>
                            <p className="page-section-subtitle">Sana: {date}</p>
                        </div>

                        <div className="card">
                            <ReportsTopProductsTable topProducts={topProducts} />
                        </div>
                    </div>

                    {/* Ishlab chiqarish umumiy ko‘rsatkichlar */}
                    <div className="page-section">
                        <div className="page-section-header">
                            <h2 className="page-section-title">
                                Ishlab chiqarish bo‘yicha umumiy ko‘rsatkichlar
                            </h2>
                            <p className="page-section-subtitle">Sana: {date}</p>
                        </div>

                        <div className="card">
                            <ReportsProductionSection stats={stats} />
                        </div>
                    </div>

                    {/* Oylik savdo bar-chart */}
                    <div className="page-section">
                        <div className="page-section-header">
                            <h2 className="page-section-title">
                                Oylik savdo dinamikasi (kunlar kesimida)
                            </h2>
                            <p className="page-section-subtitle">
                                Sana bo‘yicha oy: {date.slice(0, 7)}
                            </p>
                        </div>

                        <div className="card">
                            <ReportsMonthlyBarChart data={monthlyChartData} />
                        </div>
                    </div>
                </>
            )}

            {/* ---------- DETAL MODALLAR ---------- */}

            {/* 1) Joylar (filial + do‘konlar) */}
            <ReportsDetailsModal
                open={detailType === "locations"}
                title="Filial va do‘konlar ro‘yxati"
                onClose={closeDetail}
                maxWidth={700}
            >
                {detailLoading ? (
                    <p>Yuklanmoqda...</p>
                ) : (
                    <div className="table-wrapper" style={{ maxHeight: "60vh" }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nomi</th>
                                    <th>Turi</th>
                                    <th>Holati</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branchesList.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: "center" }}>
                                            Birorta joy topilmadi.
                                        </td>
                                    </tr>
                                ) : (
                                    branchesList.map((b, idx) => {
                                        const t = String(
                                            b.branch_type || "BRANCH"
                                        ).toUpperCase();
                                        return (
                                            <tr key={b.id}>
                                                <td>{idx + 1}</td>
                                                <td>{b.name}</td>
                                                <td>
                                                    {t === "OUTLET"
                                                        ? "Do‘kon / ulgurji"
                                                        : "Filial"}
                                                </td>
                                                <td>
                                                    {b.is_active ? "Faol" : "Nofaol"}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </ReportsDetailsModal>

            {/* 2) Kunlik savdo – filiallar bo‘yicha cheklar */}
            <ReportsDetailsModal
                open={detailType === "daily_sales"}
                title="Filiallar bo‘yicha cheklar soni"
                onClose={closeDetail}
                maxWidth={700}
            >
                <div className="table-wrapper" style={{ maxHeight: "60vh" }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Filial</th>
                                <th>Cheklar soni</th>
                                <th>Savdo summasi (so‘m)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(salesByBranch || [])
                                .filter(
                                    (row) =>
                                        String(
                                            row.branch_type || "BRANCH"
                                        ).toUpperCase() === "BRANCH"
                                )
                                .map((row, idx) => (
                                    <tr key={(row.branch_id || "null") + "-" + idx}>
                                        <td>{idx + 1}</td>
                                        <td>{row.branch_name || "—"}</td>
                                        <td>
                                            {(row.sale_count || 0).toLocaleString(
                                                "uz-UZ"
                                            )}
                                        </td>
                                        <td>
                                            {(row.total_amount || 0).toLocaleString(
                                                "uz-UZ"
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </ReportsDetailsModal>

            {/* 3) Foydalanuvchilar ro‘yxati */}
            <ReportsDetailsModal
                open={detailType === "users"}
                title="Foydalanuvchilar ro‘yxati"
                onClose={closeDetail}
                maxWidth={750}
            >
                {detailLoading ? (
                    <p>Yuklanmoqda...</p>
                ) : (
                    <div className="table-wrapper" style={{ maxHeight: "60vh" }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Ism</th>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Filial / do‘kon</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersList.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: "center" }}>
                                            Foydalanuvchilar topilmadi.
                                        </td>
                                    </tr>
                                ) : (
                                    usersList.map((u, idx) => (
                                        <tr key={u.id}>
                                            <td>{idx + 1}</td>
                                            <td>{u.full_name}</td>
                                            <td>{u.username}</td>
                                            <td>{u.role}</td>
                                            <td>
                                                {u.branch_name
                                                    ? u.branch_name
                                                    : u.branch_id
                                                        ? `ID: ${u.branch_id}`
                                                        : "—"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </ReportsDetailsModal>

            {/* 4) Mahsulotlar ro‘yxati (katalog) */}
            <ReportsDetailsModal
                open={detailType === "products"}
                title="Mahsulotlar katalogi"
                onClose={closeDetail}
                maxWidth={800}
            >
                {detailLoading ? (
                    <p>Yuklanmoqda...</p>
                ) : (
                    <>
                        <div
                            style={{
                                marginBottom: 8,
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            <span style={{ fontSize: 13 }}>Kategoriya:</span>
                            <select
                                className="input"
                                style={{ maxWidth: 220 }}
                                value={productCategoryFilter}
                                onChange={(e) =>
                                    setProductCategoryFilter(e.target.value)
                                }
                            >
                                <option value="ALL">Hammasi</option>
                                <option value="PRODUCT">
                                    Ishlab chiqilgan mahsulotlar
                                </option>
                                <option value="INGREDIENT">Masalliqlar</option>
                                <option value="DECORATION">
                                    Dekoratsiya / bezaklar
                                </option>
                                <option value="UTILITY">
                                    Kommunal / xizmatlar
                                </option>
                            </select>
                        </div>

                        <div className="table-wrapper" style={{ maxHeight: "60vh" }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Nomi</th>
                                        <th>Kategoriya</th>
                                        <th>Birlik</th>
                                        <th>Narx</th>
                                        <th>Ulgurji narx</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProductsForModal.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                style={{ textAlign: "center" }}
                                            >
                                                Mahsulot topilmadi.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProductsForModal.map((p, idx) => (
                                            <tr key={p.id}>
                                                <td>{idx + 1}</td>
                                                <td>{p.name}</td>
                                                <td>{p.category || "—"}</td>
                                                <td>{p.unit}</td>
                                                <td>
                                                    {typeof p.price === "number"
                                                        ? p.price.toLocaleString("uz-UZ")
                                                        : "-"}
                                                </td>
                                                <td>
                                                    {typeof p.wholesale_price ===
                                                        "number" &&
                                                        p.wholesale_price > 0
                                                        ? p.wholesale_price.toLocaleString(
                                                            "uz-UZ"
                                                        )
                                                        : "-"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </ReportsDetailsModal>

            {/* 5) Ishlab chiqarish – mahsulotlar bo‘yicha */}
            <ReportsDetailsModal
                open={detailType === "production"}
                title="Ishlab chiqarish (mahsulotlar bo‘yicha)"
                onClose={closeDetail}
                maxWidth={750}
            >
                <div className="table-wrapper" style={{ maxHeight: "60vh" }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Mahsulot</th>
                                <th>Birlik</th>
                                <th>Miqdor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productionByProduct.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: "center" }}>
                                        Ushbu sana uchun ishlab chiqarish topilmadi.
                                    </td>
                                </tr>
                            ) : (
                                productionByProduct.map((row, idx) => (
                                    <tr key={row.product_id}>
                                        <td>{idx + 1}</td>
                                        <td>{row.product_name}</td>
                                        <td>{row.unit}</td>
                                        <td>
                                            {(row.total_quantity || 0).toLocaleString(
                                                "uz-UZ"
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </ReportsDetailsModal>

            {/* 7) Vazvratlar – mahsulotlar bo‘yicha */}
            <ReportsDetailsModal
                open={detailType === "returns"}
                title="Vazvratlar (mahsulotlar bo‘yicha)"
                onClose={closeDetail}
                maxWidth={750}
            >
                <div className="table-wrapper" style={{ maxHeight: "60vh" }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Mahsulot</th>
                                <th>Birlik</th>
                                <th>Qaytgan miqdor</th>
                                <th>Vazvrat summasi (so‘m)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnsByProduct.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center" }}>
                                        Bugungi kunda vazvratlar topilmadi.
                                    </td>
                                </tr>
                            ) : (
                                returnsByProduct.map((row, idx) => (
                                    <tr key={row.product_id}>
                                        <td>{idx + 1}</td>
                                        <td>{row.product_name}</td>
                                        <td>{row.unit}</td>
                                        <td>
                                            {(row.total_quantity || 0).toLocaleString(
                                                "uz-UZ"
                                            )}
                                        </td>
                                        <td>
                                            {(row.total_amount || 0).toLocaleString(
                                                "uz-UZ"
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </ReportsDetailsModal>
        </div>
    );
}

export default ReportsPage;
