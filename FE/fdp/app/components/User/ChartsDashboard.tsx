import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { auth } from '../../firebase/firebase';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, PieChart, BarChart, StackedBarChart } from 'react-native-chart-kit';
import { Link } from 'expo-router';
import { colors } from '../../config/colors';

interface ScanRecord {
    _id: string;
    user_id: string;
    timestamp: string;
    result: string;
    confidence: number;
    image_base64: string;
}

interface HistoryResponse {
    data: ScanRecord[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

interface ConditionFrequency {
    date: string;
    condition: string;
    count: number;
}

interface ConditionDistribution {
    condition: string;
    count: number;
}

interface ScanFrequencyByDay {
    day: string;
    count: number;
}

interface ConditionByConfidence {
    confidenceRange: string;
    [key: string]: number | string;
}

type RootStackParamList = {
    ChartsDashboard: undefined;
    ScanHistoryDashboard: undefined;
};

const ChartsDashboard = () => {
    const [historyResponse, setHistoryResponse] = useState<HistoryResponse | null>(null);
    const [conditionFrequency, setConditionFrequency] = useState<ConditionFrequency[]>([]);
    const [conditionDistribution, setConditionDistribution] = useState<ConditionDistribution[]>([]);
    const [scanFrequencyByDay, setScanFrequencyByDay] = useState<ScanFrequencyByDay[]>([]);
    const [conditionByConfidence, setConditionByConfidence] = useState<ConditionByConfidence[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<ScanRecord[]>([]);
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
    const [loading, setLoading] = useState<boolean>(false);
    const user = auth.currentUser;
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const recordsPerPage = 10;

    const fetchHistory = useCallback(async (page: number = 1) => {
        if (!user) {
            showSnackbar('User not authenticated.', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`http://192.168.1.4:8000/api/predict/history/${user.uid}?page=${page}&limit=${recordsPerPage}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch scan history');
            }
            const data: HistoryResponse = await response.json();
            setHistoryResponse(data);
        } catch (error: any) {
            console.error('Fetch history error:', error.message);
            showSnackbar(`Error fetching scan history: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchConditionFrequency = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`http://192.168.1.4:8000/api/predict/stats/${user.uid}/condition-frequency`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch condition frequency');
            }
            const data: ConditionFrequency[] = await response.json();
            setConditionFrequency(data);
        } catch (error: any) {
            console.error('Fetch condition frequency error:', error.message);
            showSnackbar(`Error fetching condition frequency: ${error.message}`, 'error');
        }
    }, [user]);

    const fetchConditionDistribution = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`http://192.168.1.4:8000/api/predict/stats/${user.uid}/condition-distribution`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch condition distribution');
            }
            const data: ConditionDistribution[] = await response.json();
            setConditionDistribution(data);
        } catch (error: any) {
            console.error('Fetch condition distribution error:', error.message);
            showSnackbar(`Error fetching condition distribution: ${error.message}`, 'error');
        }
    }, [user]);

    const fetchScanFrequencyByDay = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`http://192.168.1.4:8000/api/predict/stats/${user.uid}/scan-frequency-by-day`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch scan frequency by day');
            }
            const data: ScanFrequencyByDay[] = await response.json();
            setScanFrequencyByDay(data);
        } catch (error: any) {
            console.error('Fetch scan frequency by day error:', error.message);
            showSnackbar(`Error fetching scan frequency by day: ${error.message}`, 'error');
        }
    }, [user]);

    const fetchConditionByConfidence = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`http://192.168.1.4:8000/api/predict/stats/${user.uid}/condition-by-confidence`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch condition by confidence');
            }
            const data: ConditionByConfidence[] = await response.json();
            setConditionByConfidence(data);
        } catch (error: any) {
            console.error('Fetch condition by confidence error:', error.message);
            showSnackbar(`Error fetching condition by confidence: ${error.message}`, 'error');
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchHistory(1);
            fetchConditionFrequency();
            fetchConditionDistribution();
            fetchScanFrequencyByDay();
            fetchConditionByConfidence();
        }, [fetchHistory, fetchConditionFrequency, fetchConditionDistribution, fetchScanFrequencyByDay, fetchConditionByConfidence])
    );

    const loadMore = () => {
        if (loading || !historyResponse || historyResponse.page >= historyResponse.total_pages) return;
        const nextPage = historyResponse.page + 1;
        fetchHistory(nextPage);
    };

    const handleSelectRecord = (record: ScanRecord) => {
        if (selectedRecords.includes(record)) {
            setSelectedRecords(selectedRecords.filter(r => r !== record));
        } else if (selectedRecords.length < 2) {
            setSelectedRecords([...selectedRecords, record]);
        } else {
            showSnackbar('You can only compare two records at a time.', 'error');
        }
    };

    const closeComparison = () => {
        setSelectedRecords([]);
        showSnackbar('Comparison mode closed.', 'success');
    };

    const showSnackbar = (message: string, type: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    const renderScanRecord = ({ item }: { item: ScanRecord }) => {
        const isSelected = selectedRecords.includes(item);
        return (
            <TouchableOpacity
                style={[styles.recordCard, isSelected && styles.selectedRecord]}
                onPress={() => handleSelectRecord(item)}
            >
                <Text style={styles.recordText}>Date: {new Date(item.timestamp).toLocaleString()}</Text>
                <Text style={styles.recordText}>Condition: {item.result}</Text>
                <Text style={styles.recordText}>Confidence: {(item.confidence * 100).toFixed(2)}%</Text>
            </TouchableOpacity>
        );
    };

    const conditionFrequencyChartData = () => {
        const conditions = [...new Set(conditionFrequency.map(item => item.condition))];
        const dates = [...new Set(conditionFrequency.map(item => item.date))].sort();

        const truncatedConditions = conditions.map(condition =>
            condition.length > 8 ? condition.substring(0, 8) + ".." : condition
        );

        const datasets = conditions.map(condition => {
            const data = dates.map(date => {
                const entry = conditionFrequency.find(cf => cf.date === date && cf.condition === condition);
                return entry ? entry.count : 0;
            });
            return { data, label: condition };
        });

        return {
            labels: dates,
            datasets: datasets.map((ds, index) => ({
                data: ds.data,
                color: () => ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#6A5ACD'][index % 5],
                strokeWidth: 2,
            })),
            legend: truncatedConditions
        };
    };

    const conditionDistributionChartData = () => {
        const conditions = conditionDistribution.map(item => item.condition);
        const truncatedConditions = conditions.map(condition =>
            condition.length > 8 ? condition.substring(0, 8) + ".." : condition
        );

        return conditionDistribution.map((item, index) => ({
            name: truncatedConditions[index],
            population: item.count,
            color: ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#6A5ACD'][index % 5],
            legendFontColor: colors.text,
            legendFontSize: 15,
        }));
    };

    const scanFrequencyByDayChartData = () => {
        return {
            labels: scanFrequencyByDay.map(item => item.day),
            datasets: [{
                data: scanFrequencyByDay.map(item => item.count),
            }],
        };
    };

    const conditionByConfidenceChartData = () => {
        const conditions = [...new Set(conditionFrequency.map(item => item.condition))];
        const truncatedConditions = conditions.map(condition =>
            condition.length > 8 ? condition.substring(0, 8) + ".." : condition
        );

        return {
            labels: conditionByConfidence.map(item => item.confidenceRange),
            legend: truncatedConditions,
            data: conditionByConfidence.map(item => {
                const dataRow: number[] = [];
                conditions.forEach(condition => {
                    dataRow.push(typeof item[condition] === 'number' ? (item[condition] as number) : 0);
                });
                return dataRow;
            }),
            barColors: ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#6A5ACD'],
        };
    };

    const confidenceComparisonChartData = () => ({
        labels: selectedRecords.map(record => new Date(record.timestamp).toLocaleDateString()),
        datasets: [{
            data: selectedRecords.map(record => record.confidence * 100),
        }],
    });

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('ScanHistoryDashboard')}>
                    <Text style={styles.header}>Charts Dashboard</Text>
                </TouchableOpacity>
            </View>

            {conditionFrequency.length > 0 && (
                <View style={styles.chartSection}>
                    <Text style={styles.chartTitle}>Condition Frequency Over Time</Text>
                    <ScrollView horizontal>
                        <LineChart
                            data={conditionFrequencyChartData()}
                            width={Math.max(Dimensions.get('window').width - 32, conditionFrequency.length * 50)}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix=""
                            chartConfig={{
                                backgroundColor: colors.cardBackground,
                                backgroundGradientFrom: colors.cardBackground,
                                backgroundGradientTo: colors.cardBackground,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                labelColor: (opacity = 1) => colors.text,
                                style: { borderRadius: 16 },
                                propsForDots: { r: '6', strokeWidth: '2', stroke: colors.secondary },
                                propsForLabels: {
                                    fontSize: 12,
                                },
                            }}
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    </ScrollView>
                </View>
            )}

            {conditionDistribution.length > 0 && (
                <View style={styles.chartSection}>
                    <Text style={styles.chartTitle}>Condition Distribution</Text>
                    <ScrollView horizontal>
                        <PieChart
                            data={conditionDistributionChartData()}
                            width={Dimensions.get('window').width - 32}
                            height={220}
                            chartConfig={{
                                backgroundColor: colors.cardBackground,
                                backgroundGradientFrom: colors.cardBackground,
                                backgroundGradientTo: colors.cardBackground,
                                color: (opacity = 1) => colors.text,
                            }}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                        />
                    </ScrollView>
                </View>
            )}

            {scanFrequencyByDay.length > 0 && (
                <View style={styles.chartSection}>
                    <Text style={styles.chartTitle}>Scan Frequency by Day</Text>
                    <ScrollView horizontal>
                        <BarChart
                            data={scanFrequencyByDayChartData()}
                            width={Dimensions.get('window').width - 32}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix=""
                            chartConfig={{
                                backgroundColor: colors.cardBackground,
                                backgroundGradientFrom: colors.cardBackground,
                                backgroundGradientTo: colors.cardBackground,
                                decimalPlaces: 0,
                                color: (opacity = 1) => colors.primary,
                                labelColor: (opacity = 1) => colors.text,
                            }}
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    </ScrollView>
                </View>
            )}

            {conditionByConfidence.length > 0 && (
                <View style={styles.chartSection}>
                    <Text style={styles.chartTitle}>Condition by Confidence Range</Text>
                    <ScrollView horizontal>
                        <StackedBarChart
                            data={conditionByConfidenceChartData()}
                            width={Dimensions.get('window').width - 32}
                            height={220}
                            chartConfig={{
                                backgroundColor: colors.cardBackground,
                                backgroundGradientFrom: colors.cardBackground,
                                backgroundGradientTo: colors.cardBackground,
                                color: (opacity = 1) => colors.text,
                                labelColor: (opacity = 1) => colors.text,
                            }}
                            style={{ marginVertical: 8, borderRadius: 16 }}
                            hideLegend={false}
                        />
                    </ScrollView>
                </View>
            )}

            <View style={styles.snackbarContainer}>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{
                        backgroundColor: snackbarType === 'success' ? colors.success : colors.error,
                        borderRadius: 8,
                        padding: 10,
                        marginHorizontal: 10,
                    }}
                >
                    <Text style={styles.snackbarText}>{snackbarMessage}</Text>
                </Snackbar>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 8,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    chartSection: {
        padding: 16,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    recordCard: {
        backgroundColor: colors.cardBackground,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: colors.shadow || '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    recordText: {
        fontSize: 16,
        color: colors.text,
        marginBottom: 4,
    },
    selectedRecord: {
        borderWidth: 2,
        borderColor: colors.primary,
    },
    snackbarContainer: {
        position: 'absolute',
        bottom: 5,
        left: 0,
        right: 0,
    },
    snackbarText: {
        color: colors.cardBackground,
    },
});

export default ChartsDashboard;