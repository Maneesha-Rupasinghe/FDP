import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { auth } from '../../firebase/firebase';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native'; // Added useNavigation
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Link } from 'expo-router';

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

type RootStackParamList = {
    ScanHistoryDashboard: undefined;
    ChartsDashboard: undefined;
    // add other routes here if needed
};

const ScanHistoryDashboard = () => {
    const [historyResponse, setHistoryResponse] = useState<HistoryResponse | null>(null);
    const [selectedRecords, setSelectedRecords] = useState<ScanRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
    const [loading, setLoading] = useState<boolean>(false);
    const user = auth.currentUser;
    const navigation = useNavigation<NavigationProp<RootStackParamList>>(); // For navigation to ChartsDashboard
    const recordsPerPage = 10;

    // Fetch scan history function
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
            console.log('Received data:', data);
            setHistoryResponse(data);
        } catch (error: any) {
            console.error('Fetch history error:', error.message);
            showSnackbar(`Error fetching scan history: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Auto-refetch when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchHistory(1); // Fetch first page on focus
        }, [fetchHistory])
    );

    // Handle pagination
    const loadMore = () => {
        if (loading || !historyResponse || historyResponse.page >= historyResponse.total_pages) return;
        const nextPage = historyResponse.page + 1;
        fetchHistory(nextPage);
    };

    // Handle search (client-side filtering for now)
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (historyResponse) {
            const filtered = historyResponse.data.filter(record =>
                new Date(record.timestamp).toLocaleDateString().includes(query) ||
                record.result.toLowerCase().includes(query.toLowerCase())
            );
            setHistoryResponse({ ...historyResponse, data: filtered.slice(0, recordsPerPage) });
        }
    };

    // Handle record selection for comparison
    const handleSelectRecord = (record: ScanRecord) => {
        if (selectedRecords.includes(record)) {
            setSelectedRecords(selectedRecords.filter(r => r !== record));
        } else if (selectedRecords.length < 2) {
            setSelectedRecords([...selectedRecords, record]);
        } else {
            showSnackbar('You can only compare two records at a time.', 'error');
        }
    };

    // Close comparison mode
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

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Scan History Dashboard</Text>
                <View style={styles.headerButtons}>
                    {/* <TouchableOpacity onPress={() => navigation.navigate('ChartsDashboard')} style={styles.chartButton}>
                        <Icon name="bar-chart" size={24} color="#3674B5" />
                    </TouchableOpacity> */}
                    <Link href="/components/User/ChartsDashboard" style={styles.chartButton}>
                        <Icon name="bar-chart" size={24} color="#3674B5" />
                    </Link>
                    <TouchableOpacity onPress={() => fetchHistory(1)} style={styles.refreshButton}>
                        <Icon name="refresh" size={24} color="#3674B5" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <TextInput
                style={styles.searchBar}
                placeholder="Search by date or condition..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
            />

            {/* Scan History List */}
            {historyResponse && (
                <FlatList
                    data={historyResponse.data}
                    renderItem={renderScanRecord}
                    keyExtractor={(item) => item._id}
                    ListEmptyComponent={<Text style={styles.emptyText}>No scan history found.</Text>}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loading ? <Text style={styles.loadingText}>Loading...</Text> : null}
                    style={styles.historyList}
                />
            )}

            {/* Comparison Section */}
            {selectedRecords.length === 2 && (
                <ScrollView style={styles.comparisonContainer}>
                    <View style={styles.comparisonHeader}>
                        <Text style={styles.subHeader}>Compare Images</Text>
                        <TouchableOpacity onPress={closeComparison} style={styles.closeButton}>
                            <Icon name="close" size={24} color="#3E4241" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.comparisonRow}>
                        {selectedRecords.map((record, index) => (
                            <View key={index} style={styles.comparisonItem}>
                                <Text style={styles.comparisonText}>{new Date(record.timestamp).toLocaleDateString()}</Text>
                                <Image
                                    source={{ uri: `data:image/jpeg;base64,${record.image_base64}`, cache: 'force-cache' }}
                                    style={styles.comparisonImage}
                                    onError={(e) => console.log('Image error:', e.nativeEvent.error)}
                                />
                                <Text style={styles.comparisonText}>Condition: {record.result}</Text>
                                <Text style={styles.comparisonText}>Confidence: {(record.confidence * 100).toFixed(2)}%</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}

            {/* Snackbar */}
            <View style={styles.snackbarContainer}>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{
                        backgroundColor: snackbarType === 'success' ? 'green' : 'red',
                        borderRadius: 8,
                        padding: 10,
                        marginHorizontal: 10,
                    }}
                >
                    {snackbarMessage}
                </Snackbar>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FBF8EF',
        padding: 16,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#3E4241',
        textAlign: 'center',
    },
    headerButtons: {
        flexDirection: 'row',
    },
    chartButton: {
        padding: 8,
        marginRight: 8,
    },
    refreshButton: {
        padding: 8,
    },
    subHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3E4241',
        textAlign: 'center',
    },
    comparisonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    closeButton: {
        padding: 8,
    },
    searchBar: {
        height: 40,
        borderColor: '#D1D5DB',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 16,
        backgroundColor: '#FFF',
    },
    historyList: {
        flex: 1,
    },
    recordCard: {
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedRecord: {
        borderColor: '#3674B5',
        borderWidth: 2,
    },
    recordText: {
        fontSize: 16,
        color: '#3E4241',
        marginBottom: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
    },
    loadingText: {
        textAlign: 'center',
        color: '#888',
        padding: 10,
    },
    comparisonContainer: {
        marginTop: 16,
    },
    comparisonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    comparisonItem: {
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    comparisonImage: {
        width: 150,
        height: 150,
        borderRadius: 8,
        marginVertical: 10,
        resizeMode: 'contain',
    },
    comparisonText: {
        fontSize: 14,
        color: '#3E4241',
        textAlign: 'center',
    },
    snackbarContainer: {
        position: 'absolute',
        bottom: 5,
        left: 0,
        right: 0,
    },
});

export default ScanHistoryDashboard;