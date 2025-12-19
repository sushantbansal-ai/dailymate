/**
 * Bar Chart Component using Victory Native
 */

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Dimensions, StyleSheet, View } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  data: ChartDataPoint[];
  height?: number;
  showValues?: boolean;
  maxValue?: number;
}

export function SimpleChart({ data, height = 200, showValues = true, maxValue }: SimpleChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyChart, { height }]}>
        <ThemedText style={{ color: colors.textSecondary }}>No data available</ThemedText>
      </View>
    );
  }

  const chartWidth = Dimensions.get('window').width - 80;
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  // Transform data for Victory Native (needs x and y keys)
  const victoryData = data.map((item, index) => ({
    x: index,
    y: item.value,
    label: item.label,
    color: item.color || colors.primary,
  }));

  return (
    <View style={[styles.container, { width: chartWidth, height }]}>
      <View style={styles.chartContainer}>
        <CartesianChart
          data={victoryData}
          xKey="x"
          yKeys={['y']}
          padding={{ left: 50, right: 20, top: 20, bottom: 50 }}
          domain={{ y: [0, max] }}
          domainPadding={{ x: 20 }}
          axisOptions={{
            font: null,
            lineColor: colors.border,
            labelColor: colors.textSecondary,
            formatYLabel: (value) => {
              const num = Number(value);
              return num > 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
            },
            formatXLabel: (value) => {
              const index = Number(value);
              const item = data[index];
              if (!item) return '';
              return item.label.length > 8 ? `${item.label.substring(0, 7)}...` : item.label;
            },
          }}
        >
          {({ points, chartBounds }) => {
            // Check if we have points to render
            if (!points.y || points.y.length === 0) {
              return null;
            }
            return (
              <Bar
                points={points.y}
                chartBounds={chartBounds}
                color={colors.primary}
                roundedCorners={{ top: 4 }}
              />
            );
          }}
        </CartesianChart>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chartContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
