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
    SafeAreaView,
    Platform,
    Linking,
    Dimensions,
    FlatList,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { DocumentFile, VehicleDocument } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DocumentDetailScreen({ route, navigation }: { route: any; navigation: any }) {
    const { document }: { document: VehicleDocument } = route.params;

    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [initialImageIndex, setInitialImageIndex] = useState(0);
    const [galleryImages, setGalleryImages] = useState<DocumentFile[]>([]);
    const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

    const scrollY = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        navigation.setParams({ scrollY } as any);
    }, []);

    const handleViewFile = async (file: DocumentFile) => {
        try {
            const fileName = file.name || 'document';
            const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
            const isImage = file.type === 'image' || fileName.match(/\.(jpg|jpeg|png|webp)$/i);

            if (isImage) {
                const allImages = (document.files || []).filter(f =>
                    f.type === 'image' || (f.name || '').match(/\.(jpg|jpeg|png|webp)$/i)
                );

                const imageIndex = allImages.findIndex(f => f.uri === file.uri);

                setGalleryImages(allImages);
                setInitialImageIndex(imageIndex >= 0 ? imageIndex : 0);
                setCurrentGalleryIndex(imageIndex >= 0 ? imageIndex : 0);
                setImageViewerVisible(true);
                return;
            }

            const ext = fileName.toLowerCase().split('.').pop();
            const mimeTypeMap: { [key: string]: string } = {
                'pdf': 'application/pdf',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'xls': 'application/vnd.ms-excel',
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'ppt': 'application/vnd.ms-powerpoint',
                'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'txt': 'text/plain',
                'csv': 'text/csv'
            };

            let mimeType = mimeTypeMap[ext || ''] || 'application/octet-stream';

            if (Platform.OS === 'android') {
                let contentUri = file.uri;
                const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).default?.cacheDirectory;

                if (contentUri.startsWith('http')) {
                    const downloadPath = cacheDir + safeFileName;

                    console.log('Downloading from:', contentUri);
                    const downloadResult = await FileSystem.downloadAsync(contentUri, downloadPath);

                    if (downloadResult.status !== 200) {
                        throw new Error(`Download failed with status ${downloadResult.status}`);
                    }

                    contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
                } else if (contentUri.startsWith('file://')) {
                    try {
                        contentUri = await FileSystem.getContentUriAsync(file.uri);
                    } catch (e) {
                        const dest = cacheDir + safeFileName;
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
                const canOpen = await Linking.canOpenURL(file.uri);
                if (canOpen) {
                    await Linking.openURL(file.uri);
                } else {
                    await Sharing.shareAsync(file.uri, {
                        mimeType,
                        UTI: fileName.toLowerCase().endsWith('.pdf') ? 'com.adobe.pdf' : undefined
                    });
                }
            }
        } catch (err) {
            console.error('Direct view failed, trying share fallback:', err);
            try {
                await Sharing.shareAsync(file.uri);
            } catch (shareErr) {
                Alert.alert('Error', 'Could not open file.');
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <View style={styles.detailsBox}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Type</Text>
                        <Text style={styles.detailValue}>{document.type}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Added Date</Text>
                        <Text style={styles.detailValue}>{document.addedDate}</Text>
                    </View>
                    {document.expiryDate && (
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Expiry Date</Text>
                            <Text style={[styles.detailValue, { color: COLORS.warning }]}>{document.expiryDate}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.sectionTitle}>Files ({(document.files || []).length})</Text>

                {(document.files || []).map((file, idx) => {
                    const fileName = file.name || 'document';
                    const isImage = file.type === 'image' || fileName.match(/\.(jpg|jpeg|png|webp)$/i);
                    return (
                        <View key={idx} style={styles.filePreviewCard}>
                            <View style={styles.pdfCard}>
                                {isImage ? (
                                    <Image source={{ uri: file.uri }} style={styles.thumbnail} />
                                ) : (
                                    <Ionicons name="document-text" size={40} color={COLORS.danger} />
                                )}
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
                                    <Text style={styles.fileSize}>{isImage ? 'Photo' : (fileName.split('.').pop()?.toUpperCase() || 'Document')}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.viewPdfBtn}
                                    onPress={() => handleViewFile(file)}
                                >
                                    <Text style={styles.viewPdfText}>View</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}

                <View style={{ height: 40 }} />
            </Animated.ScrollView>

            <Modal
                visible={imageViewerVisible}
                transparent={true}
                onRequestClose={() => setImageViewerVisible(false)}
                animationType="fade"
            >
                <View style={{ flex: 1, backgroundColor: 'black' }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.galleryHeader}>
                            <Text style={styles.galleryCounter}>
                                {currentGalleryIndex + 1} / {galleryImages.length}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setImageViewerVisible(false)}
                                style={styles.galleryCloseBtn}
                            >
                                <Ionicons name="close-circle" size={36} color="white" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={galleryImages}
                            horizontal
                            pagingEnabled
                            initialScrollIndex={initialImageIndex}
                            getItemLayout={(data, index) => (
                                { length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index }
                            )}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                setCurrentGalleryIndex(index);
                            }}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <View style={{ width: SCREEN_WIDTH, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                                    <Image
                                        source={{ uri: item.uri }}
                                        style={{ width: '100%', height: '80%', resizeMode: 'contain' }}
                                    />
                                </View>
                            )}
                            showsHorizontalScrollIndicator={false}
                        />
                    </SafeAreaView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        padding: 20,
    },
    detailsBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        gap: 16,
        marginBottom: 24,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
    detailValue: { fontSize: 15, color: COLORS.text, fontWeight: 'bold' },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
    },
    filePreviewCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...SHADOWS.light,
    },
    pdfCard: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    thumbnail: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#f1f5f9'
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    fileSize: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    viewPdfBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#eff6ff',
        borderRadius: 8,
    },
    viewPdfText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 13,
    },
    galleryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        zIndex: 20,
    },
    galleryCounter: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    galleryCloseBtn: {
        padding: 5,
    },
});
