import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

const COLORS = {
  sky: "#BBE0EF",
  navy: "#161E54",
  orange: "#F16D34",
  peach: "#FF986A",
  light: "#EEEEEE",
  white: "#FFFFFF",
};

export type GqlUser = {
  id: string;
  email: string;
};

export type GqlMember = {
  id: string;
  user_id: string;
  group_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  joined_at: string; // DateTime comes over the wire as ISO string
  user: GqlUser | null; // you defined user: User (nullable in your typeDefs)
};

export type GqlGroup = {
  id: string;
  name: string;
  active: boolean;
  created_by: string;
  created_at: string; // DateTime => string
  members: GqlMember[];
};

export type GetGroupsQueryData = {
  getGroups: GqlGroup[];
};

export type GetGroupsQueryVars = {
  limit: number;
};


export default function HomeScreen() {
  const router = useRouter();

  const GET_DASHBOARD = gql`
  query GetDashboard($limit: Int!) {
    dashboardSummary {
      totalDebt
    }
    getGroups(limit: $limit) {
      id
      name
      members { id }
    }
  }
`;

  type DashboardQueryData = {
    dashboardSummary: { totalDebt: number };
    getGroups: GqlGroup[];
  };

  type DashboardQueryVars = { limit: number };
  const { data, loading, error } = useQuery<DashboardQueryData, DashboardQueryVars>(
    GET_DASHBOARD,
    { variables: { limit: 50 } }
  );
  const totalDebt = data?.dashboardSummary.totalDebt ?? 0;
  const groups = data?.getGroups ?? [];
  return (
    <ThemedView style={styles.container}>
      {/* Total Debt Card */}
      <ThemedView style={headerStyles.debtCard}>
        <View style={headerStyles.debtTopRow}>
          <ThemedText style={headerStyles.debtLabel}>Total Debt</ThemedText>
          <View style={headerStyles.pill}>
            <ThemedText style={headerStyles.pillText}>This month</ThemedText>
          </View>
        </View>

        <ThemedText style={headerStyles.debtAmount}>
          ${totalDebt.toFixed(2)}
        </ThemedText>

        <ThemedText style={headerStyles.debtHint}>
          Track what you owe across all groups.
        </ThemedText>
      </ThemedView>

      {/* Groups */}
      <View style={styles.sectionHeader}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Groups
        </ThemedText>
        <ThemedText style={styles.sectionMeta}>{groups.length} total</ThemedText>
      </View>
      {groups.length === 0 ? (
        <ThemedText style={styles.emptyState}>No groups</ThemedText>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const isOwe = 11
            const isOwed = 15

            return (
              <Pressable style={styles.groupCard} onPress={() => router.push(`/group-expenses/${item.id}`)}>
                <View style={styles.groupLeft}>
                  <View style={styles.iconCircle}>
                    <ThemedText style={styles.iconText}>
                      {item.name.slice(0, 1).toUpperCase()}
                    </ThemedText>
                  </View>

                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold" style={styles.groupName}>
                      {item.name}
                    </ThemedText>
                    <ThemedText style={styles.groupMembers}>
                      {item.members.length} members
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.groupRight}>
                  <ThemedText
                    type="defaultSemiBold"
                    style={[
                      styles.groupBalance,
                      isOwe && { color: COLORS.orange },
                      isOwed && { color: COLORS.navy },
                    ]}
                  >
                    {/* {item.balance === 0
                      ? "$0.00"
                      : `${isOwe ? "-" : ""}$${Math.abs(item.balance).toFixed(2)}`} */}

                    $12
                  </ThemedText>
                  <ThemedText style={styles.groupBalanceLabel}>

                    Your owe
                    {/* {item.balance === 0 ? "Settled" : isOwe ? "You owe" : "You’re owed"} */}
                  </ThemedText>
                </View>
              </Pressable>
            );
          }}
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
    backgroundColor: COLORS.white,
  },

  header: {
    marginBottom: 14,
  },
  headerTitle: {
    color: COLORS.navy,
  },
  headerSubtitle: {
    marginTop: 4,
    color: COLORS.navy,
    opacity: 0.75,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.navy,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.peach,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  secondaryButtonText: {
    color: COLORS.navy,
    fontWeight: "700",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.navy,
  },
  sectionMeta: {
    color: COLORS.navy,
    opacity: 0.7,
    fontSize: 12,
  },

  emptyState: {
    color: COLORS.navy,
    opacity: 0.7,
    textAlign: "center",
    paddingVertical: 18,
  },
  listContent: {
    paddingBottom: 24,
  },
  groupCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupLeft: {
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
    borderColor: COLORS.light,
  },
  iconText: {
    color: COLORS.navy,
    fontWeight: "800",
  },
  groupName: {
    color: COLORS.navy,
  },
  groupMembers: {
    marginTop: 2,
    color: COLORS.navy,
    opacity: 0.65,
    fontSize: 12,
  },

  groupRight: {
    alignItems: "flex-end",
  },
  groupBalance: {
    color: COLORS.navy,
  },
  groupBalanceLabel: {
    marginTop: 2,
    color: COLORS.navy,
    opacity: 0.65,
    fontSize: 12,
  },
});


export const headerStyles = StyleSheet.create({
  debtCard: {
    backgroundColor: COLORS.sky,
    padding: 16,
    borderWidth: 1,
    borderRadius: 14,
    borderColor: COLORS.light,
  },
  debtTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  debtLabel: {
    color: COLORS.navy,
    opacity: 0.85,
  },
  pill: {
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  pillText: {
    color: COLORS.navy,
    opacity: 0.8,
    fontSize: 12,
  },
  debtAmount: {
    paddingTop: 3,
    fontSize: 26,
    color: COLORS.navy,
    fontWeight: "800",
  },
  debtHint: {
    marginTop: 6,
    color: COLORS.navy,
    opacity: 0.75,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.navy,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.peach,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  secondaryButtonText: {
    color: COLORS.navy,
    fontWeight: "700",
  },
})