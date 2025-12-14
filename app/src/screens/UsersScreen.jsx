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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import api from "../services/api";
import { styles } from "./UsersScreen.styles";

const ROLE_LABELS = {
    admin: "Admin",
    branch: "Filial (Sotuvchi)",
    production: "Ishlab chiqarish",
};

export default function UsersScreen() {
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("branch");
    const [branchId, setBranchId] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchResources = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");
            const [uRes, bRes] = await Promise.all([api.get("/users"), api.get("/branches")]);
            setUsers(uRes.data || []);
            setBranches(bRes.data || []);
        } catch (err) {
            console.error(err);
            setError("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const openModal = (user = null) => {
        if (user) {
            setEditingId(user.id);
            setFullName(user.full_name || "");
            setUsername(user.username || "");
            setPassword("");
            setRole(user.role || "branch");
            setBranchId(user.branch_id ? String(user.branch_id) : "");
        } else {
            setEditingId(null);
            setFullName("");
            setUsername("");
            setPassword("");
            setRole("branch");
            setBranchId("");
        }
        setError("");
        setSuccess("");
        setModalVisible(true);
    };

    const handleSave = async () => {
        setError("");
        setSuccess("");

        if (!fullName.trim() || !username.trim()) {
            setError("Ism va username kiritish shart");
            return;
        }
        if (!editingId && !password) {
            setError("Yangi foydalanuvchi uchun parol kiritish shart");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                full_name: fullName.trim(),
                username: username.trim(),
                role,
                branch_id: role === "branch" && branchId ? Number(branchId) : null,
            };
            if (password) payload.password = password;

            if (editingId) await api.put(`/users/${editingId}`, payload);
            else await api.post("/users", payload);

            setSuccess(editingId ? "Muvaffaqiyatli yangilandi" : "Muvaffaqiyatli qo'shildi");
            setModalVisible(false);
            fetchResources();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "Saqlashda xatolik");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (user) => {
        Alert.alert("O'chirish", `"${user.full_name}" foydalanuvchini o'chirmoqchimisiz?`, [
            { text: "Yo'q", style: "cancel" },
            {
                text: "Ha",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.delete(`/users/${user.id}`);
                        fetchResources();
                    } catch {
                        Alert.alert("Xatolik", "O'chirishda xatolik");
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.full_name}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{ROLE_LABELS[item.role] || item.role}</Text>
                </View>
            </View>

            <Text style={styles.infoText}>Username: {item.username}</Text>
            {item.branch_name ? <Text style={styles.infoText}>Filial: {item.branch_name}</Text> : null}

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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Foydalanuvchilar</Text>
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
                    data={users}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Foydalanuvchilar mavjud emas</Text>}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingId ? "Tahrirlash" : "Yangi qo'shish"}</Text>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Text style={styles.label}>To'liq ism</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Ism Familiya"
                            placeholderTextColor="#64748b"
                        />

                        <Text style={styles.label}>Username (Login)</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="login123"
                            placeholderTextColor="#64748b"
                            autoCapitalize="none"
                        />

                        <Text style={styles.label}>Parol {editingId ? "(bo'sh qolsa o'zgarmaydi)" : ""}</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="******"
                            placeholderTextColor="#64748b"
                            secureTextEntry
                        />

                        <Text style={styles.label}>Rol</Text>
                        <View style={styles.pickerContainer}>
                            <Picker selectedValue={role} onValueChange={setRole}>
                                <Picker.Item label="Filial (Sotuvchi)" value="branch" />
                                <Picker.Item label="Ishlab chiqarish" value="production" />
                                <Picker.Item label="Admin" value="admin" />
                            </Picker>
                        </View>

                        {role === "branch" && (
                            <>
                                <Text style={styles.label}>Qaysi filialga biriktiriladi?</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker selectedValue={branchId} onValueChange={setBranchId}>
                                        <Picker.Item label="Tanlang..." value="" />
                                        {branches.map((b) => (
                                            <Picker.Item key={b.id} label={b.name} value={String(b.id)} />
                                        ))}
                                    </Picker>
                                </View>
                            </>
                        )}

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
