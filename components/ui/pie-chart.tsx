/**
 * Pie Chart Component using Victory Native
 */

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, View } from 'react-native';
import { Pie, PolarChart } from 'victory-native';

interface PieChartDataPoint {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartDataPoint[];
  size?: number;
  showLabels?: boolean;
  showLegend?: boolean;
}

export function PieChart({ data, size = 200, showLabels = true, showLegend = true }: PieChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyChart, { width: size, height: size }]}>
        <ThemedText style={{ color: colors.textSecondary }}>No data available</ThemedText>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <View style={[styles.emptyChart, { width: size, height: size }]}>
        <ThemedText style={{ color: colors.textSecondary }}>No data available</ThemedText>
      </View>
    );
  }

  // Transform data for Victory Native (needs label, value, color keys)
  const victoryData = data.map((item) => ({
    label: item.label,
    value: item.value,
    color: item.color,
  }));

  return (  
    <View style={styles.container}>
      <View style={[styles.chartWrapper, { width: size, height: size }]}>
        <PolarChart
          data={victoryData}
          labelKey="label"
          valueKey="value"
          colorKey="color"
        >
          <Pie.Chart
            size={size}
            innerRadius={0}
          >
            {() => <Pie.Slice />}
          </Pie.Chart>
        </PolarChart>
      </View>
      {showLegend && (
        <View style={styles.legend}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            return (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <ThemedText style={[styles.legendText, { color: colors.text }]}>
                  {item.label}
                </ThemedText>
                <ThemedText style={[styles.legendPercentage, { color: colors.textSecondary }]}>
                  {percentage.toFixed(1)}%
                </ThemedText>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartWrapper: {
    overflow: 'hidden',
  },
  legend: {
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
});
