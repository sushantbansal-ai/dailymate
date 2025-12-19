/**
 * Line Chart Component using Victory Native
 */

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { CartesianChart, Line, Scatter } from 'victory-native';

interface LineChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface LineChartProps {
  data?: LineChartDataPoint[]; // Optional when lines is provided
  height?: number;
  showValues?: boolean;
  showDots?: boolean;
  maxValue?: number;
  minValue?: number;
  lines?: Array<{ data: LineChartDataPoint[]; color: string; label?: string }>; // Multiple lines support
}

export function LineChart({
  data,
  height = 200,
  showValues = false,
  showDots = true,
  maxValue,
  minValue,
  lines,
}: LineChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Support multiple lines or single line
  const chartLines = lines || (data ? [{ data, color: colors.primary, label: 'Value' }] : []);

  if (!chartLines || chartLines.length === 0 || chartLines.every(line => !line.data || line.data.length === 0)) {
    return (
      <View style={[styles.emptyChart, { height }]}>
        <ThemedText style={{ color: colors.textSecondary }}>No data available</ThemedText>
      </View>
    );
  }

  const chartWidth = Dimensions.get('window').width - 80;
  const allValues = chartLines.flatMap((line) => line.data.map((d) => d.value));
  const max = maxValue !== undefined ? maxValue : Math.max(...allValues, 1);
  const min = minValue !== undefined ? minValue : Math.min(...allValues, 0);

  // For multiple lines, we need to combine data with different yKeys
  // Transform data for Victory Native - each line needs its own yKey
  const combinedData: Array<Record<string, number | string>> = [];
  const maxLength = Math.max(...chartLines.map(line => line.data.length));
  
  // Create combined dataset with x and y keys for each line
  for (let i = 0; i < maxLength; i++) {
    const dataPoint: Record<string, number | string> = { x: i };
    chartLines.forEach((line, lineIndex) => {
      const yKey = `y${lineIndex}`;
      dataPoint[yKey] = line.data[i]?.value ?? 0;
    });
    combinedData.push(dataPoint);
  }

  const yKeys = chartLines.map((_, index) => `y${index}`);

  // Custom legend component
  const renderLegend = () => {
    if (chartLines.length <= 1) return null;
    
    return (
      <View style={styles.legendContainer}>
        {chartLines.map((line, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: line.color }]} />
            <ThemedText style={[styles.legendText, { color: colors.text }]}>
              {line.label || `Line ${index + 1}`}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderLegend()}
      <View style={[styles.chartContainer, { width: chartWidth, height }]}>
        <View style={{ width: chartWidth, height }}>
          <CartesianChart
          data={combinedData}
          xKey="x"
          yKeys={yKeys}
          padding={{ left: 50, right: 20, top: 20, bottom: 50 }}
          domain={{ y: [min, max] }}
          domainPadding={{ x: 10 }}
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
              const labelData = data || chartLines[0]?.data || [];
              const item = labelData[index];
              if (!item) return '';
              return item.label.length > 6 ? `${item.label.substring(0, 5)}...` : item.label;
            },
          }}
        >
          {({ points, chartBounds }) => {
            if (!points || Object.keys(points).length === 0) {
              return null;
            }

            return (
              <>
                {chartLines.map((line, lineIndex) => {
                  const yKey = `y${lineIndex}`;
                  // Access points dynamically for multiple yKeys
                  const linePoints = (points as Record<string, any>)[yKey];
                  
                  if (!linePoints || !Array.isArray(linePoints) || linePoints.length === 0) {
                    return null;
                  }

                  return (
                    <React.Fragment key={lineIndex}>
                      <Line
                        points={linePoints}
                        chartBounds={chartBounds}
                        color={line.color}
                        strokeWidth={2}
                      />
                      {showDots && (
                        <Scatter
                          points={linePoints}
                          chartBounds={chartBounds}
                          color={line.color}
                          radius={4}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </>
            );
          }}
        </CartesianChart>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
});
