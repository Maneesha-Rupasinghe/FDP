import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { auth } from '../../firebase/firebase';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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

type RootStackParamList = {
    ScanHistoryDashboard: undefined;
    ChartsDashboard: undefined;
};

const ScanHistoryDashboard = () => {
    const [historyResponse, setHistoryResponse] = useState<HistoryResponse | null>(null);
    const [filteredData, setFilteredData] = useState<ScanRecord[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<ScanRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const user = auth.currentUser;
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const recordsPerPage = 4;

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
            setFilteredData(data.data);
            setCurrentPage(page);
            setSearchQuery('');
        } catch (error: any) {
            console.error('Fetch history error:', error.message);
            showSnackbar(`Error fetching scan history: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            setCurrentPage(1);
            fetchHistory(1);
        }, [fetchHistory])
    );

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (historyResponse) {
            if (query.trim() === '') {
                setFilteredData(historyResponse.data);
            } else {
                const filtered = historyResponse.data.filter(record =>
                    new Date(record.timestamp).toLocaleDateString().includes(query) ||
                    record.result.toLowerCase().includes(query.toLowerCase())
                );
                setFilteredData(filtered);
            }
        }
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

    const goToPage = (page: number) => {
        if (page > 0 && page <= (historyResponse?.total_pages || 1)) {
            fetchHistory(page);
        }
    };

    const renderScanRecord = ({ item }: { item: ScanRecord }) => {
        const isSelected = selectedRecords.includes(item);
        return (
            <TouchableOpacity style={[styles.recordCard, isSelected && styles.selectedRecord]} onPress={() => handleSelectRecord(item)}>
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
                    <Link href="/components/User/ChartsDashboard" style={styles.chartButton}>
                        <Icon name="bar-chart" size={24} color={colors.primary} />
                    </Link>
                    <TouchableOpacity onPress={() => { setCurrentPage(1); fetchHistory(1); }} style={styles.refreshButton}>
                        <Icon name="refresh" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>
            <TextInput
                style={styles.searchBar}
                placeholder="Search by date or condition..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
            />
            {historyResponse && (
                <FlatList
                    data={filteredData}
                    renderItem={renderScanRecord}
                    keyExtractor={(item) => item._id}
                    ListEmptyComponent={<Text style={styles.emptyText}>No scan history found.</Text>}
                    ListFooterComponent={
                        loading ? <Text style={styles.loadingText}>Loading...</Text> :
                            (historyResponse.total_pages > 1
                                ? (
                                    <View style={styles.pagination}>
                                        <TouchableOpacity onPress={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                            <Text style={[styles.paginationText, currentPage === 1 && styles.disabledText]}>Previous</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.paginationText}>Page {currentPage} of {historyResponse.total_pages}</Text>
                                        <TouchableOpacity onPress={() => goToPage(currentPage + 1)} disabled={currentPage === historyResponse.total_pages}>
                                            <Text style={[styles.paginationText, currentPage === historyResponse.total_pages && styles.disabledText]}>Next</Text>
                                        </TouchableOpacity>
                                    </View>
                                )
                                : null
                            )
                    }
                    style={styles.historyList}
                />
            )}
            {selectedRecords.length === 2 && (
                <View style={styles.comparisonContainer}>
                    <View style={styles.comparisonHeader}>
                        <Text style={styles.subHeader}>Compare Images</Text>
                        <TouchableOpacity onPress={closeComparison} style={styles.closeButton}>
                            <Icon name="close" size={24} color={colors.text} />
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
                </View>
            )}
            <View style={styles.snackbarContainer}>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{ backgroundColor: snackbarType === 'success' ? colors.success : colors.error, borderRadius: 8, elevation: 3 }}
                >
                    <Text style={styles.snackbarText}>{snackbarMessage}</Text>
                </Snackbar>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 8,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
        flex: 1,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
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
        color: colors.text,
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
        backgroundColor: colors.cardBackground,
    },
    historyList: {
        flex: 1,
    },
    recordCard: {
        backgroundColor: colors.cardBackground,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedRecord: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    recordText: {
        fontSize: 16,
        color: colors.text,
        marginBottom: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.inactiveTint,
        marginTop: 20,
    },
    loadingText: {
        textAlign: 'center',
        color: colors.inactiveTint,
        padding: 10,
    },
    comparisonContainer: {
        marginTop: 16,
        backgroundColor: colors.cardBackground,
        borderRadius: 8,
        padding: 10,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    comparisonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    comparisonItem: {
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
        gap: 5,
        borderRadius: 8,
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
        color: colors.text,
        textAlign: 'center',
    },
    snackbarContainer: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
    },
    snackbarText: {
        color: '#FFF',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    paginationText: {
        fontSize: 16,
        color: colors.primary,
    },
    disabledText: {
        color: colors.inactiveTint,
    },
});

export default ScanHistoryDashboard;