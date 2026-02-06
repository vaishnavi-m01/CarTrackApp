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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp, VehicleDocument, DocumentFile } from '../context/AppContext';

type DocType = VehicleDocument['type'];

const DOC_TYPES: DocType[] = ['RC', 'Insurance', 'Pollution', 'Service', 'Other'];

export default function VehicleDocumentsScreen({ route, navigation }: { route: any; navigation: any }) {
    const { vehicleId } = route.params;
    const { documents, addDocument, updateDocument, deleteDocument } = useApp();
    const [isModalVisible, setModalVisible] = useState(false);
    const [isViewModalVisible, setViewModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<VehicleDocument | null>(null);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [currentImageUri, setCurrentImageUri] = useState<string | null>(null);

    // Form state
    const [type, setType] = useState<DocType>('RC');
    const [title, setTitle] = useState('');
    const [files, setFiles] = useState<DocumentFile[]>([]);
    const [expiryDate, setExpiryDate] = useState('');

    const vehicleDocs = documents.filter(doc => doc.vehicleId === vehicleId);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const newFiles: DocumentFile[] = result.assets.map(asset => ({
                uri: asset.uri,
                name: asset.fileName || `image_${Date.now()}.jpg`,
                type: 'image'
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
                multiple: true
            });

            if (!result.canceled) {
                const newFiles: DocumentFile[] = result.assets.map(asset => {
                    const isPdf = asset.mimeType === 'application/pdf' || asset.name.toLowerCase().endsWith('.pdf');
                    return {
                        uri: asset.uri,
                        name: asset.name,
                        type: isPdf ? 'pdf' : 'other'
                    };
                });
                setFiles(prev => [...prev, ...newFiles]);
            }
        } catch (err) {
            console.error('Error picking document:', err);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleViewFile = async (file: DocumentFile) => {
        try {
            // 1. Handle Images Internally
            if (file.type === 'image' || file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
                setCurrentImageUri(file.uri);
                setImageViewerVisible(true);
                return;
            }

            // 2. Handle Documents (PDF etc)
            let mimeType = 'application/octet-stream';
            if (file.type === 'pdf' || file.name.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';

            if (Platform.OS === 'android') {
                let contentUri = file.uri;

                // If it's already content://, use it. If file://, convert it.
                if (contentUri.startsWith('file://')) {
                    try {
                        contentUri = await FileSystem.getContentUriAsync(file.uri);
                    } catch (e) {
                        console.log('Error getting content URI directly, trying copy:', e);
                        // Fallback: Copy to cache to ensure it's accessible and then get URI
                        const dest = FileSystem.cacheDirectory + file.name;
                        await FileSystem.copyAsync({ from: file.uri, to: dest });
                        contentUri = await FileSystem.getContentUriAsync(dest);
                    }
                }

                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1,
                    type: mimeType,
                });
            } else {
                // iOS: Try Linking first for direct open
                const canOpen = await Linking.canOpenURL(file.uri);
                if (canOpen) {
                    await Linking.openURL(file.uri);
                } else {
                    // Fallback to sharing 
                    await Sharing.shareAsync(file.uri, {
                        mimeType,
                        UTI: file.type === 'pdf' ? 'com.adobe.pdf' : undefined
                    });
                }
            }
        } catch (err) {
            console.error('Direct view failed, trying share fallback:', err);
            if (file.type !== 'image') {
                try {
                    await Sharing.shareAsync(file.uri);
                } catch (shareErr) {
                    Alert.alert('Error', 'Could not open file.');
                }
            } else {
                Alert.alert('Error', 'Could not open image.');
            }
        }
    };

    const handleAddDocument = () => {
        if (!title || files.length === 0) {
            Alert.alert('Error', 'Please provide a title and at least one document file/photo');
            return;
        }

        if (isEditing && selectedDoc) {
            updateDocument(selectedDoc.id, {
                type,
                title,
                files,
                expiryDate: expiryDate || undefined,
            });
        } else {
            addDocument({
                vehicleId,
                type,
                title,
                files,
                expiryDate: expiryDate || undefined,
                addedDate: new Date().toLocaleDateString(),
            });
        }

        resetForm();
    };

    const handleEdit = (doc: VehicleDocument) => {
        setType(doc.type);
        setTitle(doc.title);
        setFiles(doc.files || []);
        setExpiryDate(doc.expiryDate || '');
        setSelectedDoc(doc);
        setIsEditing(true);
        setModalVisible(true);
    };

    const resetForm = () => {
        setTitle('');
        setFiles([]);
        setExpiryDate('');
        setType('RC');
        setIsEditing(false);
        setSelectedDoc(null);
        setModalVisible(false);
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
                        setViewModalVisible(false);
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
                style={styles.docRow}
                activeOpacity={0.7}
                onPress={() => {
                    setSelectedDoc(doc);
                    setViewModalVisible(true);
                }}
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
                            <Ionicons name="create-outline" size={22} color={COLORS.textExtraLight} />
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.headerSpacer} />
                {vehicleDocs.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-lock-outline" size={80} color={COLORS.border} />
                        <Text style={styles.emptyTitle}>No Documents</Text>
                        <Text style={styles.emptySubtitle}>Upload your vehicle papers for quick access (Images or PDFs).</Text>
                    </View>
                ) : (
                    vehicleDocs.map(renderDocumentCard)
                )}
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={() => {
                resetForm();
                setModalVisible(true);
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

            {/* View Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isViewModalVisible}
                onRequestClose={() => setViewModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setViewModalVisible(false)}
                >
                    <View style={[styles.modalContent, { height: '90%' }]}>
                        <View style={styles.dragHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedDoc?.title || 'Document View'}</Text>
                            <TouchableOpacity onPress={() => setViewModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedDoc && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.detailsBox}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Type</Text>
                                        <Text style={styles.detailValue}>{selectedDoc.type}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Added Date</Text>
                                        <Text style={styles.detailValue}>{selectedDoc.addedDate}</Text>
                                    </View>
                                    {selectedDoc.expiryDate && (
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailLabel}>Expiry Date</Text>
                                            <Text style={[styles.detailValue, { color: COLORS.warning }]}>{selectedDoc.expiryDate}</Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.sectionTitle}>Files ({(selectedDoc.files || []).length})</Text>
                                {(selectedDoc.files || []).map((file, idx) => (
                                    <View key={idx} style={styles.filePreviewCard}>
                                        {file.type === 'image' ? (
                                            <TouchableOpacity
                                                style={styles.fullImageContainer}
                                                onPress={() => handleViewFile(file)}
                                            >
                                                <Image source={{ uri: file.uri }} style={styles.fullImage} />
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.pdfCard}>
                                                <Ionicons name="document-text" size={40} color={COLORS.danger} />
                                                <View style={{ flex: 1, marginLeft: 12 }}>
                                                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                                                    <Text style={styles.fileSize}>Document</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.viewPdfBtn}
                                                    onPress={() => handleViewFile(file)}
                                                >
                                                    <Text style={styles.viewPdfText}>View</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                ))}

                                {selectedDoc.type === 'Insurance' && (
                                    <View style={styles.quickActions}>
                                        <TouchableOpacity style={styles.quickActionBtn}>
                                            <Ionicons name="download-outline" size={20} color={COLORS.primary} />
                                            <Text style={styles.quickActionLabel}>Download All</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                                            <Ionicons name="call-outline" size={20} color="#0284C7" />
                                            <Text style={[styles.quickActionLabel, { color: '#0284C7' }]}>Call Support</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[styles.submitAction, { backgroundColor: '#FEE2E2', marginTop: 30 }]}
                                    onPress={() => confirmDelete(selectedDoc.id)}
                                >
                                    <View style={[styles.submitGradient, { backgroundColor: 'transparent' }]}>
                                        <Text style={[styles.submitActionText, { color: COLORS.danger }]}>Delete Document</Text>
                                    </View>
                                </TouchableOpacity>
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Add/Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.dragHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{isEditing ? 'Edit Document' : 'New Document'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Document Type</Text>
                            <View style={styles.typeSelector}>
                                {DOC_TYPES.map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.typeChip, type === t && styles.typeChipActive]}
                                        onPress={() => setType(t)}
                                    >
                                        <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Document Title</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g. Insurance Policy"
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor={COLORS.textExtraLight}
                            />

                            <Text style={styles.inputLabel}>Expiry Date (Optional)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="DD/MM/YYYY"
                                value={expiryDate}
                                onChangeText={setExpiryDate}
                                placeholderTextColor={COLORS.textExtraLight}
                            />

                            <View style={{ marginTop: 24, marginBottom: 12 }}>
                                <Text style={[styles.inputLabel, { marginTop: 0, marginBottom: 12 }]}>Attachments ({files.length})</Text>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity style={styles.miniPickBtn} onPress={pickImage}>
                                        <Ionicons name="image-outline" size={18} color={COLORS.primary} />
                                        <Text style={styles.miniPickText}>Add Photo</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.miniPickBtn} onPress={pickDocument}>
                                        <Ionicons name="document-attach-outline" size={18} color={COLORS.primary} />
                                        <Text style={styles.miniPickText}>Add File</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {files.length > 0 ? (
                                <View style={styles.fileList}>
                                    {files.map((file, idx) => (
                                        <View key={idx} style={styles.fileItem}>
                                            <View style={styles.fileIconBox}>
                                                <Ionicons
                                                    name={file.type === 'image' ? 'image' : 'document-text'}
                                                    size={20}
                                                    color={file.type === 'image' ? COLORS.primary : COLORS.danger}
                                                />
                                            </View>
                                            <Text style={styles.fileItemName} numberOfLines={1}>{file.name}</Text>
                                            <TouchableOpacity onPress={() => removeFile(idx)} style={styles.removeFileBtn}>
                                                <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.imageZone} onPress={pickImage}>
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="cloud-upload-outline" size={40} color={COLORS.border} />
                                        <Text style={styles.imageHint}>Tap to add photos or documents</Text>
                                    </View>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.submitAction} onPress={handleAddDocument}>
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryDark]}
                                    style={styles.submitGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.submitActionText}>Save Document</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Full Screen Image Viewer Modal */}
            <Modal
                visible={imageViewerVisible}
                transparent={true}
                onRequestClose={() => setImageViewerVisible(false)}
                animationType="fade"
            >
                <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
                    <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                        <TouchableOpacity
                            onPress={() => setImageViewerVisible(false)}
                            style={{ padding: 20, alignSelf: 'flex-end' }}
                        >
                            <Ionicons name="close-circle" size={36} color="white" />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {currentImageUri && (
                        <Image
                            source={{ uri: currentImageUri }}
                            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                        />
                    )}
                </View>
            </Modal>

        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FCFCFC' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    headerSpacer: { height: 10 },
    docRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...SHADOWS.light,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    docMainInfo: { flex: 1 },
    docTitleText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    docSubText: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
    actionGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionBtn: { padding: 8 },
    updateBtn: {
        backgroundColor: '#F97316',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    updateBtnText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 24, marginBottom: 12 },
    filePreviewCard: { marginBottom: 16 },
    fullImageContainer: {
        width: '100%',
        height: 300,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
    },
    fullImage: { width: '100%', height: '100%', resizeMode: 'contain' },
    pdfCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    fileName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
    fileSize: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    viewPdfBtn: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    viewPdfText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
    detailsBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
    detailValue: { fontSize: 15, color: COLORS.text, fontWeight: 'bold' },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    quickActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#E0E7FF',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    quickActionLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },
    emptyContainer: { alignItems: 'center', marginTop: 120, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 20 },
    emptySubtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, ...SHADOWS.medium },
    fabGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '92%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
    closeBtn: { padding: 4 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 20 },
    typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
    typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    typeChipText: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
    typeChipTextActive: { color: COLORS.white },
    textInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: COLORS.text,
    },
    miniPickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    miniPickText: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },
    fileList: { gap: 10 },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    fileIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
    fileItemName: { flex: 1, marginLeft: 12, fontSize: 14, color: COLORS.text },
    removeFileBtn: { padding: 4 },
    imageZone: {
        height: 120,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
    },
    imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    imageHint: { marginTop: 12, fontSize: 13, color: COLORS.textExtraLight },
    submitAction: { marginTop: 32, borderRadius: 16, overflow: 'hidden' },
    submitGradient: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    submitActionText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
    bottomModal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 20,
    },
});
