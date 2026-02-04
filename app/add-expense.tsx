import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { gql, } from "@apollo/client";

import { useMutation, useQuery } from "@apollo/client/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

type GqlUser = { id: string; email: string };
type GqlMember = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    user: GqlUser | null;
};

type GroupQueryData = {
    group: {
        id: string;
        name: string;
        members: GqlMember[];
    } | null;
};

type GroupQueryVars = {
    groupId: string;
};

const GET_GROUP_MEMBERS = gql`
  query Group($groupId: ID!) {
    group(groupId: $groupId) {
      id
      name
      members {
        id
        first_name
        last_name
        email
      }
    }
  }
`;

const ADD_EXPENSE = gql`
  mutation AddExpense($input: AddExpenseInput!) {
    addExpense(input: $input) {
      isSuccess
      message
      expenseId
    }
  }
`;

type AddExpenseData = {
    addExpense: {
        isSuccess: boolean;
        message?: string | null;
        expenseId?: string | null;
    };
};

type AddExpenseVars = {
    input: {
        groupId: string;
        title: string;
        amount: number;
        description?: string | null;
        isEqual: boolean;
        memberIds: string[];
    };
};

export default function AddExpenseModal() {
    const { groupId } = useLocalSearchParams<{ groupId?: string }>();

    // Guard: if no groupId param, just close
    if (!groupId) {
        return (
            <ThemedView style={styles.center}>
                <ThemedText type="defaultSemiBold">Missing groupId</ThemedText>
                <Pressable onPress={() => router.back()} style={styles.closeBtn}>
                    <ThemedText>Close</ThemedText>
                </Pressable>
            </ThemedView>
        );
    }

    const { data, loading, error } = useQuery<GroupQueryData, GroupQueryVars>(
        GET_GROUP_MEMBERS,
        { variables: { groupId } }
    );

    const members = data?.group?.members ?? [];

    // form state
    const [title, setTitle] = useState("");
    const [amountText, setAmountText] = useState("");
    const [description, setDescription] = useState("");

    // default: select ALL members (common for equal split)
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
        () => new Set()
    );

    // when members load the first time, preselect all (simple approach)
    useEffect(() => {
        if (members.length && selectedMemberIds.size === 0) {
            setSelectedMemberIds(new Set(members.map((m) => m.id)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [members.length]);

    const toggleMember = useCallback((memberId: string) => {
        setSelectedMemberIds((prev) => {
            const next = new Set(prev);
            next.has(memberId) ? next.delete(memberId) : next.add(memberId);
            return next;
        });
    }, []);

    const isEqual = true; // for now

    const parsedAmount = useMemo(() => Number(amountText), [amountText]);

    const canSubmit = useMemo(() => {
        return (
            title.trim().length > 0 &&
            Number.isFinite(parsedAmount) &&
            parsedAmount > 0 &&
            selectedMemberIds.size > 0
        );
    }, [title, parsedAmount, selectedMemberIds.size]);

    const [addExpense, { loading: saving }] = useMutation<AddExpenseData, AddExpenseVars>(
        ADD_EXPENSE
    );

    const handleSubmit = useCallback(async () => {
        if (!canSubmit || saving) return;

        try {
            const res = await addExpense({
                variables: {
                    input: {
                        groupId,
                        title: title.trim(),
                        amount: parsedAmount,
                        description: description.trim() ? description.trim() : null,
                        isEqual,
                        memberIds: [...selectedMemberIds],
                    },
                },
            });

            const payload = res.data?.addExpense;

            if (payload?.isSuccess) {
                // optionally: show toast/snackbar
                router.back();
                return;
            }

            Alert.alert("Failed", payload?.message ?? "Failed to create expense");
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Failed to create expense");
        }
    }, [
        addExpense,
        canSubmit,
        description,
        groupId,
        isEqual,
        parsedAmount,
        saving,
        selectedMemberIds,
        title,
    ]);

    return (
        <>
            <Stack.Screen options={{ title: "Add expense" }} />

            <ThemedView style={styles.container}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator />
                    </View>
                ) : error ? (
                    <View style={styles.center}>
                        <ThemedText type="defaultSemiBold">Failed to load members</ThemedText>
                        <ThemedText>{error.message}</ThemedText>
                        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
                            <ThemedText>Close</ThemedText>
                        </Pressable>
                    </View>
                ) : (
                    <>
                        {/* Header */}
                        <ThemedText type="defaultSemiBold" style={styles.groupTitle}>
                            {data?.group?.name ?? "Group"}
                        </ThemedText>

                        {/* Form */}
                        <View style={styles.form}>
                            <ThemedText style={styles.label}>Title</ThemedText>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g. Dinner"
                                style={styles.input}
                            />

                            <ThemedText style={styles.label}>Amount</ThemedText>
                            <TextInput
                                value={amountText}
                                onChangeText={setAmountText}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                style={styles.input}
                            />

                            <ThemedText style={styles.label}>Description (optional)</ThemedText>
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Notes…"
                                style={[styles.input, styles.textarea]}
                                multiline
                            />
                        </View>

                        {/* Members */}
                        <View style={styles.membersHeader}>
                            <ThemedText type="defaultSemiBold">Split between</ThemedText>
                            <ThemedText style={styles.meta}>
                                {selectedMemberIds.size} selected
                            </ThemedText>
                        </View>

                        <FlatList
                            data={members}
                            keyExtractor={(m) => m.id}
                            contentContainerStyle={{ paddingBottom: 12 }}
                            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                            renderItem={({ item }) => {
                                const selected = selectedMemberIds.has(item.id);
                                const name =
                                    [item.first_name, item.last_name].filter(Boolean).join(" ") ||
                                    item.email;

                                return (
                                    <Pressable
                                        onPress={() => toggleMember(item.id)}
                                        style={[styles.memberRow, selected && styles.memberRowSelected]}
                                    >
                                        <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                                            {selected ? <ThemedText style={styles.check}>✓</ThemedText> : null}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <ThemedText type="defaultSemiBold">{name}</ThemedText>
                                            <ThemedText style={styles.meta}>{item.email}</ThemedText>
                                        </View>
                                    </Pressable>
                                );
                            }}
                        />

                        {/* Actions */}
                        <View style={styles.actions}>
                            <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
                                <ThemedText style={styles.secondaryText}>Cancel</ThemedText>
                            </Pressable>

                            <Pressable
                                onPress={handleSubmit}
                                disabled={!canSubmit || saving}
                                style={[
                                    styles.primaryBtn,
                                    (!canSubmit || saving) && styles.primaryBtnDisabled,
                                ]}
                            >
                                <ThemedText style={styles.primaryText}>
                                    {saving ? "Saving..." : "Create"}
                                </ThemedText>
                            </Pressable>
                        </View>
                    </>
                )}
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    closeBtn: { paddingVertical: 10, paddingHorizontal: 14 },

    groupTitle: { marginBottom: 10, fontSize: 16 },

    form: { gap: 8, marginBottom: 14 },
    label: { opacity: 0.8, marginTop: 6 },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    textarea: { minHeight: 70, textAlignVertical: "top" },

    membersHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 10,
        marginTop: 4,
    },
    meta: { opacity: 0.7, fontSize: 12 },

    memberRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 14,
        padding: 12,
    },
    memberRowSelected: {
        borderColor: "#cbd5e1",
    },

    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#bbb",
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: {
        borderColor: "#111",
    },
    check: { fontSize: 14 },

    actions: { flexDirection: "row", gap: 10, paddingTop: 8 },
    secondaryBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 14,
        alignItems: "center",
        paddingVertical: 12,
    },
    secondaryText: { fontWeight: "700" },

    primaryBtn: {
        flex: 1,
        borderRadius: 14,
        alignItems: "center",
        paddingVertical: 12,
        backgroundColor: "#111",
    },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryText: { color: "#fff", fontWeight: "700" },
});
