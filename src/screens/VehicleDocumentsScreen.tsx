import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    Modal,
    TextInput,
    SafeAreaView,
    Platform,
    Linking,
    ActivityIndicator,
    Dimensions,
    FlatList,
    ToastAndroid,
    Animated,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp, VehicleDocument, DocumentFile } from '../context/AppContext';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/apiClient';

type DocType = VehicleDocument['type'];

const DOC_TYPES: DocType[] = ['RC', 'Insurance', 'Pollution', 'Service', 'Other'];

export default function VehicleDocumentsScreen({ route, navigation }: { route: any; navigation: any }) {
    const { vehicleId } = route.params;
    const [documents, setDocuments] = useState<VehicleDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState<VehicleDocument | null>(null);

    const scrollY = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        navigation.setParams({ scrollY });
    }, []);

    const fetchDocuments = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get(`/documents/vehicle/${vehicleId}`);
            if (response.data) {
                // Map API response to frontend types
                const mappedDocs = response.data.map((doc: any) => ({
                    ...doc,
                    // Map documentType.name to type for UI logic
                    type: doc.documentType?.name || 'Other',
                    // Map documentTypetypeId to documentTypeId
                    documentTypeId: doc.documentTypetypeId,
                    // Convert YYYY-MM-DD from API to DD/MM/YYYY for display
                    expiryDate: doc.expiryDate ? doc.expiryDate.split('-').reverse().join('/') : doc.expiryDate,
                    addedDate: doc.addedDate ? doc.addedDate.split('-').reverse().join('/') : doc.addedDate,
                    files: (doc.files || []).map((f: any) => {
                        const url = f.fileUrl || '';
                        const encodedFilename = url.split('/').pop() || 'file';
                        const filename = decodeURIComponent(encodedFilename);
                        const isImage = /\.(jpg|jpeg|png|webp)$/i.test(filename);
                        const isPdf = /\.pdf$/i.test(filename);
                        return {
                            id: f.id,
                            uri: url,
                            fileUrl: url,
                            name: filename,
                            type: isImage ? 'image' : (isPdf ? 'pdf' : 'other')
                        };
                    })
                }));
                setDocuments(mappedDocs);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            Alert.alert('Error', 'Failed to load documents');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchDocuments();
        }, [vehicleId])
    );

    const deleteDocument = async (id: string) => {
        try {
            await apiClient.delete(`/documents/${id}`);
            if (Platform.OS === 'android') {
                ToastAndroid.show('Document deleted successfully', ToastAndroid.SHORT);
            } else {
                Alert.alert('Success', 'Document deleted successfully');
            }
            fetchDocuments(); // Refresh list
        } catch (error) {
            console.error('Error deleting document:', error);
            Alert.alert('Error', 'Failed to delete document');
        }
    };

    const handleEdit = (doc: VehicleDocument) => {
        navigation.navigate('AddDocument', { vehicleId, document: doc });
    };

    const confirmDelete = (id: string) => {
        Alert.alert(
            'Delete Document',
            'Are you sure you want to remove this document?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: () => {
                        deleteDocument(id);
                    }
                }
            ]
        );
    };

    const getDocStyle = (type: DocType) => {
        switch (type) {
            case 'RC': return { icon: 'document-text', color: '#8B5CF6', bg: '#F5F3FF' };
            case 'Insurance': return { icon: 'shield-checkmark', color: '#10B981', bg: '#ECFDF5' };
            case 'Pollution': return { icon: 'cloud-upload', color: '#64748B', bg: '#F1F5F9' };
            case 'Service': return { icon: 'build', color: '#3B82F6', bg: '#EFF6FF' };
            default: return { icon: 'document', color: '#F59E0B', bg: '#FFFBEB' };
        }
    };

    const renderDocumentCard = (doc: VehicleDocument) => {
        const style = getDocStyle(doc.type);
        // Better date parsing for DD/MM/YYYY
        const isExpired = doc.expiryDate && (() => {
            const parts = doc.expiryDate.split('/');
            if (parts.length === 3) {
                const expiry = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                return expiry < new Date();
            }
            return false;
        })();

        return (
            <TouchableOpacity
                key={doc.id}
                style={styles.docCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('DocumentDetail', { document: doc })}
            >
                <View style={[styles.iconBox, { backgroundColor: style.bg }]}>
                    <Ionicons name={style.icon as any} size={22} color={style.color} />
                </View>

                <View style={styles.docMainInfo}>
                    <Text style={styles.docTitleText}>{doc.title || doc.type}</Text>
                    <Text style={[styles.docSubText, isExpired && { color: COLORS.danger }]}>
                        {doc.expiryDate ? `Exp: ${doc.expiryDate}` : 'Valid Lifetime'} • {(doc.files || []).length} {(doc.files || []).length === 1 ? 'file' : 'files'}
                    </Text>
                </View>

                {doc.type === 'Pollution' && isExpired ? (
                    <TouchableOpacity
                        style={styles.updateBtn}
                        onPress={() => handleEdit(doc)}
                    >
                        <Text style={styles.updateBtnText}>Update</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.actionGroup}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleEdit(doc);
                            }}
                        >
                            <FontAwesome5 name="edit" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                confirmDelete(doc.id);
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <View style={styles.headerSpacer} />
                {isLoading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
                ) : documents.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-lock-outline" size={80} color={COLORS.border} />
                        <Text style={styles.emptyTitle}>No Documents</Text>
                        <Text style={styles.emptySubtitle}>Upload your vehicle papers for quick access (Images or PDFs).</Text>
                    </View>
                ) : (
                    documents.map(renderDocumentCard)
                )}
            </Animated.ScrollView>

            <TouchableOpacity style={styles.fab} onPress={() => {
                navigation.navigate('AddDocument', { vehicleId });
            }}>
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.fabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={30} color={COLORS.white} />
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FCFCFC' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    headerSpacer: { height: 10 },
    docCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...SHADOWS.light,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    docMainInfo: { flex: 1, marginLeft: 16 },
    docTitleText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    docSubText: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
    actionGroup: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { padding: 8, marginLeft: 4 },
    updateBtn: { backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    updateBtnText: { color: COLORS.danger, fontSize: 12, fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, ...SHADOWS.medium },
    fabGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 120, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 20 },
    emptySubtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
