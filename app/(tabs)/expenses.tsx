import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const COLORS = {
  sky: "#BBE0EF",
  navy: "#161E54",
  orange: "#F16D34",
  peach: "#FF986A",
  gray: "#EEEEEE",
  white: "#FFFFFF",
};

const API_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:3001"
    : "http://localhost:3000";

const EXPENSES_URL = `${API_BASE}/api/expenses`;

type Expense = {
  id: string;
  groupId?: string;
  expenseTitle: string;
  expenseAmount: string;
  groupName: string;
  paid: boolean;
};

type ExpensesResponse = {
  ok: boolean;
  data: Expense[];
};

type TabsParamList = {
  expenses: { groupId?: string; groupName?: string };
};

export default function ExpensesScreen() {
  const navigation =
    useNavigation<BottomTabNavigationProp<TabsParamList, "expenses">>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = expenses.reduce(
    (acc, expense) => {
      const amount = Number(expense.expenseAmount);
      if (Number.isFinite(amount) && expense.paid === false) {
        acc.total += amount;
      }
      if (expense.paid) acc.paidCount += 1;
      else acc.unpaidCount += 1;
      return acc;
    },
    { total: 0, paidCount: 0, unpaidCount: 0 }
  );

  const loadExpenses = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) throw new Error("Missing auth token. Please log in again.");

      setError(null);

      const response = await fetch(EXPENSES_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const json = (await response.json()) as ExpensesResponse;

      if (!json?.ok || !Array.isArray(json.data)) {
        throw new Error("Unexpected response from server");
      }

      setExpenses(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const renderItem = ({ item }: { item: Expense }) => {
    const amountValue = Number(item.expenseAmount);
    const amountLabel = Number.isFinite(amountValue)
      ? `$${amountValue.toFixed(2)}`
      : `$${item.expenseAmount}`;

    const isUnpaid = !item.paid;

    return (
      <Pressable onPress={() => { }} style={styles.expenseCard}>
        <View style={styles.expenseLeft}>
          <View style={styles.iconCircle}>
            <ThemedText style={styles.iconText}>
              {item.expenseTitle.slice(0, 1).toUpperCase()}
            </ThemedText>
          </View>

          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={styles.expenseTitle}>
              {item.expenseTitle}
            </ThemedText>
            <ThemedText style={styles.expenseMeta}>{item.groupName}</ThemedText>
          </View>
        </View>

        <View style={styles.expenseRight}>
          <ThemedText
            type="defaultSemiBold"
            style={[
              styles.expenseAmount,
              { color: isUnpaid ? COLORS.orange : COLORS.navy },
            ]}
          >
            {amountLabel}
          </ThemedText>
          <ThemedText style={styles.expenseStatus}>
            {item.paid ? "Paid" : "Unpaid"}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Expenses
        </ThemedText>
      </View>

      {/* Summary */}
      <ThemedView style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <ThemedText style={styles.summaryLabel}>Total expenses</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.summaryAmount}>
            ${summary.total.toFixed(2)}
          </ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <View style={[styles.dot, { backgroundColor: COLORS.navy }]} />
            <ThemedText style={styles.summaryChipText}>
              Paid: {summary.paidCount}
            </ThemedText>
          </View>

          <View style={styles.summaryChip}>
            <View style={[styles.dot, { backgroundColor: COLORS.orange }]} />
            <ThemedText style={styles.summaryChipText}>
              Unpaid: {summary.unpaidCount}
            </ThemedText>
          </View>

          <Pressable onPress={() => loadExpenses(true)} style={styles.refreshPill}>
            <ThemedText style={styles.refreshPillText}>Refresh</ThemedText>
          </Pressable>
        </View>
      </ThemedView>

      {/* Error */}
      {error ? (
        <ThemedView style={styles.errorCard}>
          <ThemedText style={styles.errorTitle}>Couldn’t load expenses</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable onPress={() => loadExpenses(true)} style={styles.errorButton}>
            <ThemedText style={styles.errorButtonText}>Try again</ThemedText>
          </Pressable>
        </ThemedView>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.orange} />
          <ThemedText style={styles.loadingText}>Loading expenses...</ThemedText>
        </View>
      ) : (
        <FlatList
          alwaysBounceVertical={false}
          data={expenses}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadExpenses(true)}
            />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: {
    color: COLORS.navy,
  },
  headerMeta: {
    color: COLORS.navy,
    opacity: 0.7,
    fontSize: 12,
  },

  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gray,
    marginBottom: 12,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  summaryLabel: {
    color: COLORS.navy,
    opacity: 0.75,
  },
  summaryAmount: {
    color: COLORS.navy,
    fontSize: 20,
  },
  summaryRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.gray,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  summaryChipText: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: "700",
  },
  refreshPill: {
    marginLeft: "auto",
    backgroundColor: COLORS.peach,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  refreshPillText: {
    color: COLORS.navy,
    fontWeight: "800",
    fontSize: 12,
  },

  errorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gray,
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
  errorButton: {
    marginTop: 12,
    backgroundColor: COLORS.navy,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  errorButtonText: {
    color: COLORS.white,
    fontWeight: "800",
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.navy,
    opacity: 0.7,
  },

  listContent: {
    paddingBottom: 24,
  },

  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray,
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

  // ✅ Home-list style expense card
  expenseCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: COLORS.sky,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  iconText: {
    color: COLORS.navy,
    fontWeight: "800",
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
  expenseAmount: {
    fontSize: 16,
  },
  expenseStatus: {
    marginTop: 2,
    color: COLORS.navy,
    opacity: 0.65,
    fontSize: 12,
  },
});
