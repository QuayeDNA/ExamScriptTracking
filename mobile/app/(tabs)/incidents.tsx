/**
 * Incidents Tab Screen
 * Main incident management screen with list, filters, and statistics
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IncidentCard, StatsCard } from "@/components/IncidentComponents";
import {
  getIncidents,
  getStatistics,
  type IncidentType,
  type IncidentSeverity,
  type IncidentStatus,
} from "@/api/incidents";
import type { Incident } from "@/types";

export default function IncidentsScreen() {
  const colors = useThemeColors();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState<{
    type?: IncidentType;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
  }>({});

  // Fetch incidents
  const fetchIncidents = useCallback(async () => {
    try {
      const response = await getIncidents({
        ...filters,
        limit: 50,
      });
      setIncidents(response.incidents);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    }
  }, [filters]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await getStatistics();
      setStatistics(response.statistics);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchIncidents(), fetchStatistics()]);
      setLoading(false);
    };
    loadData();
  }, [fetchIncidents, fetchStatistics]);

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchIncidents(), fetchStatistics()]);
    setRefreshing(false);
  }, [fetchIncidents, fetchStatistics]);

  // Filter incidents by search
  const filteredIncidents = incidents.filter((incident) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      incident.incidentNumber.toLowerCase().includes(query) ||
      incident.title.toLowerCase().includes(query) ||
      incident.description.toLowerCase().includes(query)
    );
  });

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top"]}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            className="mt-4 text-sm"
            style={{ color: colors.foregroundMuted }}
          >
            Loading incidents...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-4 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text
                className="text-2xl font-bold"
                style={{ color: colors.foreground }}
              >
                Incidents
              </Text>
              <Text
                className="text-sm"
                style={{ color: colors.foregroundMuted }}
              >
                Track and manage incidents
              </Text>
            </View>
            <Button
              size="sm"
              onPress={() => router.push("/report-incident" as any)}
              className="flex-row items-center gap-2"
            >
              <Ionicons name="add-circle-outline" size={18} color="white" />
              <Text className="text-white font-semibold">Report</Text>
            </Button>
          </View>
        </View>

        {/* Statistics */}
        {statistics && (
          <View className="px-4 mb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              <StatsCard
                icon="alert-circle"
                label="Total Incidents"
                value={statistics.total}
              />
              <StatsCard
                icon="time"
                label="Open"
                value={statistics.openIncidents}
                iconColor={colors.warning}
              />
              <StatsCard
                icon="checkmark-circle"
                label="Resolved Today"
                value={statistics.resolvedToday}
                iconColor={colors.success}
              />
              <StatsCard
                icon="trending-up"
                label="Avg Resolution"
                value={`${statistics.avgResolutionTime.toFixed(1)}h`}
                iconColor={colors.info}
              />
            </ScrollView>
          </View>
        )}

        {/* Search Bar */}
        <View className="px-4 mb-3">
          <View
            className="flex-row items-center px-4 py-3 rounded-lg"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <Ionicons name="search" size={20} color={colors.foregroundMuted} />
            <TextInput
              className="flex-1 ml-3 text-base"
              placeholder="Search incidents..."
              placeholderTextColor={colors.foregroundMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ color: colors.foreground }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.foregroundMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Toggle */}
        <View className="px-4 mb-3">
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center gap-2"
          >
            <Ionicons
              name={showFilters ? "funnel" : "funnel-outline"}
              size={18}
              color={colors.primary}
            />
            <Text
              className="text-sm font-medium"
              style={{ color: colors.primary }}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Text>
            {(filters.type || filters.severity || filters.status) && (
              <View className="w-2 h-2 rounded-full bg-primary" />
            )}
          </TouchableOpacity>
        </View>

        {/* Filters */}
        {showFilters && (
          <View className="px-4 mb-4">
            <Card>
              <View className="p-4 gap-3">
                {/* Type Filter */}
                <View>
                  <Text
                    className="text-xs font-medium mb-2"
                    style={{ color: colors.foregroundMuted }}
                  >
                    Type
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      <FilterChip
                        label="All"
                        selected={!filters.type}
                        onPress={() => handleFilterChange("type", undefined)}
                      />
                      {[
                        "MISSING_SCRIPT",
                        "DAMAGED_SCRIPT",
                        "MALPRACTICE",
                        "STUDENT_ILLNESS",
                        "VENUE_ISSUE",
                        "COUNT_DISCREPANCY",
                        "LATE_SUBMISSION",
                        "OTHER",
                      ].map((type) => (
                        <FilterChip
                          key={type}
                          label={type.replace("_", " ")}
                          selected={filters.type === type}
                          onPress={() =>
                            handleFilterChange("type", type as IncidentType)
                          }
                        />
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Severity Filter */}
                <View>
                  <Text
                    className="text-xs font-medium mb-2"
                    style={{ color: colors.foregroundMuted }}
                  >
                    Severity
                  </Text>
                  <View className="flex-row gap-2 flex-wrap">
                    <FilterChip
                      label="All"
                      selected={!filters.severity}
                      onPress={() => handleFilterChange("severity", undefined)}
                    />
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((severity) => (
                      <FilterChip
                        key={severity}
                        label={severity}
                        selected={filters.severity === severity}
                        onPress={() =>
                          handleFilterChange(
                            "severity",
                            severity as IncidentSeverity
                          )
                        }
                      />
                    ))}
                  </View>
                </View>

                {/* Status Filter */}
                <View>
                  <Text
                    className="text-xs font-medium mb-2"
                    style={{ color: colors.foregroundMuted }}
                  >
                    Status
                  </Text>
                  <View className="flex-row gap-2 flex-wrap">
                    <FilterChip
                      label="All"
                      selected={!filters.status}
                      onPress={() => handleFilterChange("status", undefined)}
                    />
                    {[
                      "REPORTED",
                      "INVESTIGATING",
                      "RESOLVED",
                      "CLOSED",
                      "ESCALATED",
                    ].map((status) => (
                      <FilterChip
                        key={status}
                        label={status}
                        selected={filters.status === status}
                        onPress={() =>
                          handleFilterChange("status", status as IncidentStatus)
                        }
                      />
                    ))}
                  </View>
                </View>

                {/* Clear Filters */}
                {(filters.type ||
                  filters.severity ||
                  filters.status ||
                  searchQuery) && (
                  <Button variant="outline" size="sm" onPress={clearFilters}>
                    Clear All Filters
                  </Button>
                )}
              </View>
            </Card>
          </View>
        )}

        {/* Incident List */}
        <View className="px-4">
          {filteredIncidents.length === 0 ? (
            <Card>
              <View className="p-8 items-center">
                <Ionicons
                  name="folder-open-outline"
                  size={48}
                  color={colors.foregroundMuted}
                />
                <Text
                  className="text-base font-medium mt-4"
                  style={{ color: colors.foreground }}
                >
                  No incidents found
                </Text>
                <Text
                  className="text-sm text-center mt-1"
                  style={{ color: colors.foregroundMuted }}
                >
                  {searchQuery ||
                  filters.type ||
                  filters.severity ||
                  filters.status
                    ? "Try adjusting your filters"
                    : "Report an incident to get started"}
                </Text>
              </View>
            </Card>
          ) : (
            <>
              <Text
                className="text-xs font-medium mb-3"
                style={{ color: colors.foregroundMuted }}
              >
                {filteredIncidents.length} incident
                {filteredIncidents.length !== 1 ? "s" : ""}
              </Text>
              {filteredIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onPress={() =>
                    router.push(`/incident-details?id=${incident.id}` as any)
                  }
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper Component: Filter Chip
function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full ${selected ? "bg-primary" : "bg-muted"}`}
      style={{
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
      }}
    >
      <Text
        className="text-xs font-medium"
        style={{ color: selected ? "white" : colors.foreground }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
