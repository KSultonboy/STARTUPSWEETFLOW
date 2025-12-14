import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    Modal,
    Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import api from "../services/api";
import { styles } from "./BranchesScreen.styles";

export default function BranchesScreen() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);

    const [name, setName] = useState("");
    const [branchType, setBranchType] = useState("BRANCH"); // BRANCH | OUTLET
    const [useCentralStock, setUseCentralStock] = useState(false);
    const [isActive, setIsActive] = useState(true);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchBranches = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");
            const res = await api.get("/branches");
            setBranches(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Filiallarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const openModal = (branch = null) => {
        if (branch) {
            setEditingBranch(branch);
            setName(branch.name || "");
            setBranchType(branch.branch_type || "BRANCH");
            setUseCentralStock(Boolean(branch.use_central_stock));
            setIsActive(branch.is_active !== 0);
        } else {
            setEditingBranch(null);
            setName("");
            setBranchType("BRANCH");
            setUseCentralStock(false);
            setIsActive(true);
        }
        setError("");
        setSuccess("");
        setModalVisible(true);
    };

    const handleSave = async () => {
        setError("");
        setSuccess("");

        if (!name.trim()) {
            setError("Nom kiritish shart");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                name: name.trim(),
                branch_type: branchType,
                is_active: isActive ? 1 : 0,
                use_central_stock: branchType === "BRANCH" ? (useCentralStock ? 1 : 0) : 0,
            };

            if (editingBranch) await api.put(`/branches/${editingBranch.id}`, payload);
            else await api.post("/branches", payload);

            setSuccess(editingBranch ? "Muvaffaqiyatli yangilandi" : "Muvaffaqiyatli qo'shildi");
            setModalVisible(false);
            fetchBranches();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "Saqlashda xatolik");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (branch) => {
        Alert.alert(
            "O'chirish",
            `"${branch.name}" ni o'chirib (faol emas holatga o'tkazmoqchimisiz)?`,
            [
                { text: "Yo'q", style: "cancel" },
                {
                    text: "Ha",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/branches/${branch.id}`);
                            fetchBranches();
                        } catch {
                            Alert.alert("Xatolik", "O'chirishda xatolik");
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }) => {
        const active = item.is_active !== 0;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{active ? "FAOL" : "NOFAOL"}</Text>
                    </View>
                </View>

                <Text style={styles.infoText}>Tip: {item.branch_type || "BRANCH"}</Text>
                {String(item.branch_type || "BRANCH").toUpperCase() === "BRANCH" ? (
                    <Text style={styles.infoText}>
                        Ombor: {item.use_central_stock ? "Markaziy" : "Alohida"}
                    </Text>
                ) : null}

                <View style={styles.cardFooter}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openModal(item)}>
                        <Text style={styles.btnText}>Tahrirlash</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                        <Text style={styles.deleteBtnText}>O'chirish</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Filiallar va Do'konlar</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
                    <Text style={styles.addBtnText}>+ Yangi</Text>
                </TouchableOpacity>
            </View>

            {success ? <Text style={{ color: "#86efac", fontWeight: "900", textAlign: "center", paddingTop: 10 }}>{success}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {loading ? (
                <ActivityIndicator size="large" color="#60a5fa" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={branches}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Filiallar mavjud emas</Text>}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingBranch ? "Tahrirlash" : "Yangi qo'shish"}</Text>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Text style={styles.label}>Nomi</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Filial nomi"
                            placeholderTextColor="#64748b"
                        />

                        <Text style={styles.label}>Tipi</Text>
                        <View style={styles.pickerContainer}>
                            <Picker selectedValue={branchType} onValueChange={setBranchType}>
                                <Picker.Item label="Filial (Branch)" value="BRANCH" />
                                <Picker.Item label="Do'kon (Outlet)" value="OUTLET" />
                            </Picker>
                        </View>

                        {branchType === "BRANCH" && (
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Markaziy ombor ishlatadimi?</Text>
                                <Switch value={useCentralStock} onValueChange={setUseCentralStock} />
                            </View>
                        )}

                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Faol holatda?</Text>
                            <Switch value={isActive} onValueChange={setIsActive} />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalBtnText}>Bekor</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSave} disabled={saving}>
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={[styles.modalBtnText, { color: "#fff" }]}>Saqlash</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
