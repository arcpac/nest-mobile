import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { headerStyles } from "../(tabs)";

const COLORS = {
    sky: "#BBE0EF",
    navy: "#161E54",
    orange: "#F16D34",
    peach: "#FF986A",
    light: "#EEEEEE",
    white: "#FFFFFF",
};

const STATUS_FILTERS = ["All", "Paid", "Unpaid"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

type GqlGroupExpense = {
    id: string; // ✅ expense id
    title: string;
    amount: string;
    description: string | null;
    isEqual: boolean;
    myShare: number;
    created_by: string;
    createdAt: Date;
    isPaid: boolean;
    expenseShareId: string; // can exist but we won't use it for selection anymore
};

type GetGroupExpensesQueryData = {
    getGroupExpenses: GqlGroupExpense[];
};

type GetGroupExpensesVars = {
    groupId: string;
    limit: number;
};

type PayExpenseSharesData = {
    payExpenseShares: {
        isSuccess: boolean;
        message?: string | null;
        updatedCount: number;
    };
};

type PayExpenseSharesVars = {
    expenseIds: string[];
};

const GET_GROUP_EXPENSE = gql`
  query GetGroups($groupId: ID!, $limit: Int!) {
    getGroupExpenses(groupId: $groupId, limit: $limit) {
      id
      title
      amount
      description
      isEqual
      myShare
      created_by
      created_at
      isPaid
      expenseShareId
    }
  }
`;

const PAY_EXPENSE_SHARES = gql`
  mutation PayExpenseShares($expenseIds: [ID!]!) {
    payExpenseShares(expenseIds: $expenseIds) {
      isSuccess
      message
      updatedCount
    }
  }
`;
function filterExpenseShares(
    filter: StatusFilter,
    expenseShares?: GqlGroupExpense[]
): GqlGroupExpense[] {
    const list = expenseShares ?? [];
    if (filter === "All") return list;
    if (filter === "Paid") return list.filter((x) => x.isPaid);
    return list.filter((x) => !x.isPaid);
}

export default function GroupExpensesScreen() {
    const { groupId } = useLocalSearchParams<{ groupId: string }>();

    const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(
        () => new Set()
    );

    const [filter, setFilter] = useState<StatusFilter>("All");
    const [submitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [payExpenseShares] = useMutation<PayExpenseSharesData, PayExpenseSharesVars>(
        PAY_EXPENSE_SHARES
    );

    const { data, loading, error, refetch } = useQuery<
        GetGroupExpensesQueryData,
        GetGroupExpensesVars
    >(GET_GROUP_EXPENSE, {
        variables: { groupId, limit: 50 },
    });

    const raw = data?.getGroupExpenses ?? [];

    const expenseShares = useMemo(() => {
        return filterExpenseShares(filter, raw);
    }, [filter, raw]);

    const toggleExpenseSelection = useCallback((expenseId: string) => {
        setSelectedExpenseIds((prev) => {
            const next = new Set(prev);
            if (next.has(expenseId)) next.delete(expenseId);
            else next.add(expenseId);
            return next;
        });
    }, []);

    const selectedExpensesCount = selectedExpenseIds.size;

    // Map expenseId -> myShare
    const expenseAmountByExpenseId = useMemo(() => {
        const amounts = new Map<string, number>();
        for (let i = 0; i < raw.length; i++) {
            const exp = raw[i];
            amounts.set(exp.id, exp.myShare);
        }
        return amounts;
    }, [raw]);

    const selectedExpensesTotalAmount = useMemo(() => {
        if (selectedExpenseIds.size === 0) return 0;

        let total = 0;
        selectedExpenseIds.forEach((expenseId) => {
            total += expenseAmountByExpenseId.get(expenseId) ?? 0;
        });

        return total;
    }, [selectedExpenseIds, expenseAmountByExpenseId]);

    const handleSettleSelectedExpenses = useCallback(async () => {
        if (selectedExpenseIds.size === 0 || submitting) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const res = await payExpenseShares({
                variables: { expenseIds: [...selectedExpenseIds] },
            });

            const payload = res.data?.payExpenseShares;
            if (payload?.isSuccess) {
                await refetch();
                setSelectedExpenseIds(new Set());
                setIsSubmitting(false);
                return;
            }

            setErrorMessage(payload?.message ?? "Failed to pay expenses");
            setIsSubmitting(false);
        } catch (e) {
            setErrorMessage("Failed to pay expenses");
            setIsSubmitting(false);
        }
    }, [payExpenseShares, refetch, selectedExpenseIds, submitting]);

    const renderItem = ({ item }: { item: GqlGroupExpense }) => {
        const isSelected = selectedExpenseIds.has(item.id);

        return (
            <Pressable style={styles.expenseCard}>
                <View style={styles.expenseLeft}>
                    {!item.isPaid && filter === "Unpaid" && (
                        <Pressable onPress={() => toggleExpenseSelection(item.id)}>
                            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                                {isSelected ? (
                                    <ThemedText style={styles.checkboxCheck}>✓</ThemedText>
                                ) : null}
                            </View>
                        </Pressable>
                    )}

                    <View style={{ flex: 1 }}>
                        <ThemedText type="defaultSemiBold" style={styles.expenseTitle}>
                            {item.title}
                        </ThemedText>
                        {!!item.description && (
                            <ThemedText style={styles.expenseMeta}>{item.description}</ThemedText>
                        )}
                    </View>
                </View>

                <View style={styles.expenseRight}>
                    <ThemedText type="defaultSemiBold">${item.myShare}</ThemedText>
                    <ThemedText style={styles.expenseStatus}>
                        {item.isPaid ? "Paid" : "Unpaid"}
                    </ThemedText>
                </View>
            </Pressable>
        );
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: "Group Expenses",
                    headerShown: true,
                    headerBackVisible: false,
                    headerLeft: () => (
                        <Pressable
                            onPress={() => {
                                if (router.canGoBack?.()) router.back();
                                else router.replace("/(tabs)");
                            }}
                            style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                        >
                            <Text style={{ fontSize: 16 }}>Home</Text>
                        </Pressable>
                    ),
                }}
            />

            <ThemedView style={headerStyles.debtCard}>
                <View style={headerStyles.debtTopRow}>
                    <ThemedText style={headerStyles.debtLabel}>Total Debt</ThemedText>
                </View>

                <ThemedText style={headerStyles.debtAmount}>
                    {/* TODO: wire total debt for this group */}
                    12
                </ThemedText>

                <View style={headerStyles.ctaRow}>
                    <Pressable
                        style={headerStyles.primaryButton}
                        onPress={() => {
                            router.push({
                                pathname: "/add-expense",
                                params: { groupId },
                            });
                        }}
                    >
                        <ThemedText style={headerStyles.primaryButtonText}>Add expense</ThemedText>
                    </Pressable>

                    <Pressable style={headerStyles.secondaryButton} onPress={() => { }}>
                        <ThemedText style={headerStyles.secondaryButtonText}>Settle up</ThemedText>
                    </Pressable>
                </View>
            </ThemedView>

            <ThemedView style={styles.container}>
                <ThemedView style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        {STATUS_FILTERS.map((ft) => (
                            <Pressable
                                key={ft}
                                onPress={() => {
                                    setFilter(ft);
                                    setSelectedExpenseIds(new Set());
                                }}
                                style={[styles.statusChip, ft === filter && styles.statusChipActive]}
                            >
                                <ThemedText
                                    style={[
                                        styles.statusChipText,
                                        ft === filter && styles.statusChipTextActive,
                                    ]}
                                >
                                    {ft}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </ThemedView>

                {!!errorMessage && (
                    <ThemedView style={styles.errorCard}>
                        <ThemedText style={styles.errorTitle}>Error</ThemedText>
                        <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                    </ThemedView>
                )}

                {selectedExpensesCount > 0 && (
                    <Pressable
                        style={[
                            styles.secondaryButton,
                            (selectedExpensesCount === 0 || submitting) && styles.secondaryButtonDisabled,
                        ]}
                        onPress={handleSettleSelectedExpenses}
                        disabled={selectedExpensesCount === 0 || submitting}
                    >
                        <View style={styles.secondaryButtonContent}>
                            <ThemedText style={styles.secondaryButtonText}>
                                {submitting ? "Paying..." : "Settle selected expenses"}
                            </ThemedText>
                            <View style={styles.secondaryButtonCountPill}>
                                <ThemedText style={styles.secondaryButtonCountText}>
                                    {selectedExpensesTotalAmount.toFixed(2)}
                                </ThemedText>
                            </View>
                        </View>
                    </Pressable>
                )}

                <FlatList
                    alwaysBounceVertical={false}
                    data={expenseShares}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    ListEmptyComponent={
                        <ThemedView style={styles.emptyCard}>
                            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                                No expenses yet
                            </ThemedText>
                            <ThemedText style={styles.emptyText}>
                                Add your first expense and it will show up here.
                            </ThemedText>
                        </ThemedView>
                    }
                />
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 18,
    },

    summaryCard: {
        flexDirection: "row",
        marginBottom: 12,
    },

    summaryRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        alignItems: "center",
    },

    statusChip: {
        backgroundColor: COLORS.sky,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: COLORS.sky,
    },
    statusChipActive: {
        backgroundColor: COLORS.navy,
        borderColor: COLORS.navy,
    },
    statusChipText: {
        color: COLORS.navy,
        fontSize: 12,
        fontWeight: "700",
    },
    statusChipTextActive: {
        color: COLORS.white,
    },

    errorCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.sky,
        marginBottom: 12,
    },
    errorTitle: {
        color: COLORS.navy,
        fontWeight: "900",
        marginBottom: 4,
    },
    errorText: {
        color: COLORS.navy,
        opacity: 0.75,
    },

    listContent: {
        paddingBottom: 24,
    },

    emptyCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.sky,
        marginTop: 12,
    },
    emptyTitle: {
        color: COLORS.navy,
        marginBottom: 4,
    },
    emptyText: {
        color: COLORS.navy,
        opacity: 0.75,
    },

    secondaryButton: {
        backgroundColor: COLORS.peach,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        minHeight: 48,
        borderWidth: 1,
        borderColor: COLORS.light,
    },
    secondaryButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    secondaryButtonText: {
        color: COLORS.navy,
        fontWeight: "700",
    },
    secondaryButtonCountPill: {
        backgroundColor: COLORS.navy,
        minWidth: 24,
        height: 24,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    secondaryButtonCountText: {
        color: COLORS.white,
        fontWeight: "800",
        fontSize: 12,
    },
    secondaryButtonDisabled: {
        opacity: 0.5,
    },

    expenseCard: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.sky,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    expenseLeft: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        flex: 1,
        paddingTop: 3,
        paddingRight: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.navy,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: {
        backgroundColor: COLORS.navy,
    },
    checkboxCheck: {
        color: COLORS.white,
        fontWeight: "800",
        fontSize: 14,
        lineHeight: 16,
    },
    expenseTitle: {
        color: COLORS.navy,
    },
    expenseMeta: {
        marginTop: 2,
        color: COLORS.navy,
        opacity: 0.65,
        fontSize: 12,
    },
    expenseRight: {
        alignItems: "flex-end",
    },
    expenseStatus: {
        marginTop: 2,
        color: COLORS.navy,
        opacity: 0.65,
        fontSize: 12,
    },
});
