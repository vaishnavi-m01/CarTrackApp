import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Platform,
    Alert,
    Keyboard,
    ActivityIndicator,
    KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp, VehicleDocument, DocumentFile } from '../context/AppContext';
import apiClient from '../api/apiClient';

// type DocType = VehicleDocument['type'];
// const DOC_TYPES: DocType[] = ['RC', 'Insurance', 'Pollution', 'Service', 'Other'];

export default function AddDocumentScreen({ navigation, route }: { navigation: any, route: any }) {
    const { } = useApp();
    const insets = useSafeAreaInsets();
    const { vehicleId, document: docToEdit } = route.params || {};

    const isEdit = !!docToEdit;

    // Form state
    const [docTypes, setDocTypes] = useState<{ id: number, name: string }[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [files, setFiles] = useState<DocumentFile[]>([]);
    const [expiryDate, setExpiryDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [isTypeDropdownVisible, setIsTypeDropdownVisible] = useState(false);

    useEffect(() => {
        const fetchDocTypes = async () => {
            try {
                const response = await apiClient.get('/document-types');
                if (response.data) {
                    setDocTypes(response.data);
                    // Set default to first type if not editing
                    if (!isEdit && response.data.length > 0) {
                        setSelectedTypeId(response.data[0].id);
                    }
                }
            } catch (error) {
                console.error('Error fetching document types:', error);
                Alert.alert('Error', 'Failed to load document types');
            }
        };

        fetchDocTypes();
    }, []);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);
    

    const formatToYYYYMMDD = (dateString: string) => {
        const parts = dateString.split("-");
        return parts[2] + "-" + parts[1] + "-" + parts[0];
    };


    useEffect(() => {
        if (docToEdit) {
            // Mapping existing doc type to ID might be tricky if we don't have the full object
            // For now assuming we edit title/files/expiry mainly
            if (docToEdit.documentTypeId) setSelectedTypeId(docToEdit.documentTypeId);
            setTitle(docToEdit.title);
            setFiles(docToEdit.files || []);
            setExpiryDate(formatToYYYYMMDD(docToEdit.expiryDate || ""));
        }
    }, [docToEdit]);



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

    const handleSave = async () => {
        if (!title || files.length === 0 || !selectedTypeId) {
            Alert.alert('Required Fields', 'Please provide a type, title and at least one document file/photo');
            return;
        }

        setIsSaving(true);
        try {
            // 1. Save Document Metadata
            const docPayload = {
                id: isEdit ? docToEdit.id : 0,
                vehicleId: parseInt(vehicleId),
                documentTypetypeId: selectedTypeId,
                title: title,
                expiryDate: expiryDate
                    ? formatToYYYYMMDD(expiryDate)
                    : null,
                addedDate: new Date().toISOString().split('T')[0]
            };

            console.log("Doucment Payload", docPayload)
            let docResponse;
            if (isEdit) {
                docResponse = await apiClient.put(`/documents/${docToEdit.id}`, docPayload);
            } else {
                docResponse = await apiClient.post('/documents', docPayload);
            }

            if (docResponse.status >= 200 && docResponse.status < 300) {
                const documentId = docResponse.data.id;

                // 2. Upload Files
                const uploadPromises = files.map(async (file) => {
                    // Skip if file already has an ID (meaning it was already uploaded and just being kept)
                    if ((file as any).id) return;

                    const formData = new FormData();

                    // Create the JSON payload for the 'data' part
                    const filePayload = {
                        id: 0,
                        documentId: documentId,
                        fileUrl: "" // Backend handles the file path
                    };

                    formData.append('data', JSON.stringify(filePayload));

                    const fileObj = {
                        uri: file.uri,
                        name: file.name,
                        type: file.type === 'pdf' ? 'application/pdf' : 'image/jpeg' // Adjust mime type safely
                    };

                    formData.append('file', fileObj as any);

                    return apiClient.post('/document-files', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                });

                await Promise.all(uploadPromises);

                Alert.alert('Success', `Document ${isEdit ? 'updated' : 'saved'} successfully!`, [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Error saving document:', error);
            Alert.alert('Error', 'Failed to save document. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={[styles.inputGroup, { marginTop: 0 }]}>
                        <Text style={styles.label}>Document Type <Text style={styles.required}>*</Text></Text>
                        <TouchableOpacity
                            style={[
                                styles.dropdownBtn,
                                isTypeDropdownVisible && styles.dropdownBtnOpen
                            ]}
                            onPress={() => setIsTypeDropdownVisible(!isTypeDropdownVisible)}
                            activeOpacity={0.7}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Ionicons
                                    name="document-text-outline"
                                    size={22}
                                    color={COLORS.primary}
                                />
                                <Text style={styles.dropdownText}>
                                    {docTypes.find(t => t.id === selectedTypeId)?.name || 'Select Type'}
                                </Text>
                            </View>
                            <Ionicons
                                name={isTypeDropdownVisible ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={COLORS.textLight}
                            />
                        </TouchableOpacity>

                        {isTypeDropdownVisible && (
                            <View style={styles.inlineDropdown}>
                                {docTypes.map((t) => (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={[
                                            styles.option,
                                            selectedTypeId === t.id && styles.optionActive
                                        ]}
                                        onPress={() => {
                                            setSelectedTypeId(t.id);
                                            setIsTypeDropdownVisible(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            selectedTypeId === t.id && styles.optionTextActive
                                        ]}>
                                            {t.name}
                                        </Text>
                                        {selectedTypeId === t.id && (
                                            <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Document Title <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Insurance Policy"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={40}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Expiry Date (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="DD/MM/YYYY"
                            value={expiryDate}
                            onChangeText={setExpiryDate}
                            maxLength={10}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={[styles.label, { marginBottom: 0 }]}>Attachments ({files.length}) <Text style={styles.required}>*</Text></Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity style={styles.miniPickBtn} onPress={pickImage}>
                                    <Ionicons name="image-outline" size={18} color={COLORS.primary} />
                                    <Text style={styles.miniPickText}>Photo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.miniPickBtn} onPress={pickDocument}>
                                    <Ionicons name="document-attach-outline" size={18} color={COLORS.primary} />
                                    <Text style={styles.miniPickText}>File</Text>
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
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {!isKeyboardVisible && (
                    <View style={[
                        styles.footer,
                        { paddingBottom: Math.max(insets.bottom, 20) }
                    ]}>
                        <View style={styles.footerButtons}>
                            <TouchableOpacity
                                style={[styles.saveBtn, styles.cancelBtn]}
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSave}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryDark]}
                                    style={styles.saveGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.saveBtnText}>{isEdit ? 'Update' : 'Save'}</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SIZES.padding,
        paddingTop: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 6,
        marginTop: 4,
    },
    required: {
        color: COLORS.danger,
    },
    inputGroup: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    dropdownBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    dropdownBtnOpen: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomWidth: 0,
    },
    dropdownText: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    inlineDropdown: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderTopWidth: 0,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        padding: 5,
        marginTop: -1,
        ...SHADOWS.light,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        marginBottom: 2,
    },
    optionActive: {
        backgroundColor: COLORS.primary,
    },
    optionText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    optionTextActive: {
        color: COLORS.white,
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
    miniPickText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    fileList: {
        gap: 10,
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    fileIconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileItemName: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: COLORS.text,
    },
    removeFileBtn: {
        padding: 4,
    },
    imageZone: {
        height: 120,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        backgroundColor: COLORS.white,
        overflow: 'hidden',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageHint: {
        marginTop: 12,
        fontSize: 13,
        color: COLORS.textExtraLight,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SIZES.padding,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    footerButtons: {
        flexDirection: 'row',
        gap: 15,
    },
    saveBtn: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    saveGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelBtn: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        shadowOpacity: 0,
        elevation: 0,
    },
    cancelBtnText: {
        color: COLORS.textLight,
        fontSize: 16,
        fontWeight: '600',
    },
});
