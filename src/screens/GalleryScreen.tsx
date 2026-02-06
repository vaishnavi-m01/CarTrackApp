import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal,
    Dimensions,
    FlatList,
    Platform,
    Alert,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { GalleryAlbum } from '../types/Gallery';
import { MediaItem } from '../types/Community';

const { width, height } = Dimensions.get('window');

export default function GalleryScreen({ navigation }: { navigation: any }) {
    const { galleryAlbums, createGalleryAlbum, addMediaToGallery } = useApp();
    const [viewerVisible, setViewerVisible] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [createAlbumModalVisible, setCreateAlbumModalVisible] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState('');
    const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
    const [activeMedia, setActiveMedia] = useState<MediaItem[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleAddPhoto = () => {
        setUploadModalVisible(true);
    };

    const handleCreateAlbum = () => {
        if (newAlbumName.trim()) {
            createGalleryAlbum(newAlbumName.trim());
            setNewAlbumName('');
            setCreateAlbumModalVisible(false);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera access to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            const albumId = selectedAlbum ? selectedAlbum.id : 'timeline';
            addMediaToGallery(albumId, [{
                id: `manual_${Date.now()}`,
                type: 'image',
                uri: result.assets[0].uri
            }]);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const albumId = selectedAlbum ? selectedAlbum.id : 'timeline';
            const newMedia: MediaItem[] = result.assets.map((asset, index) => ({
                id: `manual_${Date.now()}_${index}`,
                type: asset.type === 'video' ? 'video' : 'image',
                uri: asset.uri
            }));
            addMediaToGallery(albumId, newMedia);
        }
    };

    const openViewer = (media: MediaItem[], index = 0) => {
        setActiveMedia(media);
        setActiveIndex(index);
        setViewerVisible(true);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Albums</Text>
                    <TouchableOpacity
                        style={styles.newAlbumBtn}
                        onPress={() => setCreateAlbumModalVisible(true)}
                    >
                        <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                        <Text style={styles.newAlbumBtnText}>New Album</Text>
                    </TouchableOpacity>
                </View>

                {selectedAlbum ? (
                    <View>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => setSelectedAlbum(null)}
                        >
                            {/* <Ionicons name="arrow-back" size={24} color={COLORS.text} /> */}
                        </TouchableOpacity>
                        <Text style={styles.albumTitle}>{selectedAlbum.title}</Text>
                        <View style={styles.photoGrid}>
                            {selectedAlbum.media.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.photoCard}
                                    onPress={() => openViewer(selectedAlbum.media, index)}
                                >
                                    <Image source={{ uri: item.uri }} style={styles.photoImage} />
                                    {item.type === 'video' && (
                                        <View style={styles.videoOverlay}>
                                            <Ionicons name="play" size={20} color={COLORS.white} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                            {selectedAlbum.media.length === 0 && (
                                <View style={styles.emptyAlbum}>
                                    <Ionicons name="images-outline" size={60} color={COLORS.border} />
                                    <Text style={styles.emptyAlbumText}>No photos in this album yet</Text>
                                </View>
                            )}
                        </View>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {galleryAlbums.map((album) => (
                            <TouchableOpacity
                                key={album.id}
                                style={styles.card}
                                activeOpacity={0.9}
                                onPress={() => setSelectedAlbum(album)}
                            >
                                {album.media.length > 0 ? (
                                    <Image
                                        source={{ uri: album.media[0].uri }}
                                        style={styles.cardImage}
                                    />
                                ) : (
                                    <View style={styles.emptyCardPlaceholder}>
                                        <Ionicons name="folder-open" size={40} color={COLORS.border} />
                                    </View>
                                )}
                                <View style={styles.cardOverlay}>
                                    <Text style={styles.cardTitle}>{album.title}</Text>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{album.media.length}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Sticky Footer for Add Photo */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.addBtnRow}
                    activeOpacity={0.7}
                    onPress={handleAddPhoto}
                >
                    <Ionicons name="camera" size={24} color={COLORS.white} />
                    <Text style={styles.addBtnText}>Add Photo</Text>
                </TouchableOpacity>
            </View>

            {/* Image Viewer Modal */}
            <Modal visible={viewerVisible} transparent animationType="fade">
                <View style={styles.viewerContainer}>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setViewerVisible(false)}
                    >
                        <Ionicons name="close" size={30} color={COLORS.white} />
                    </TouchableOpacity>

                    <FlatList
                        data={activeMedia}
                        horizontal
                        pagingEnabled
                        initialScrollIndex={activeIndex}
                        getItemLayout={(_, index) => ({
                            length: width,
                            offset: width * index,
                            index,
                        })}
                        keyExtractor={(item, index) => index.toString()}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={styles.imageSlide}>
                                {item.type === 'video' ? (
                                    <Video
                                        source={{ uri: item.uri }}
                                        style={styles.fullImage}
                                        resizeMode={ResizeMode.CONTAIN}
                                        useNativeControls
                                        shouldPlay
                                    />
                                ) : (
                                    <Image source={{ uri: item.uri }} style={styles.fullImage} resizeMode="contain" />
                                )}
                            </View>
                        )}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setActiveIndex(index);
                        }}
                    />

                    {/* Pagination Indicator */}
                    {activeMedia.length > 1 && (
                        <View style={styles.pagination}>
                            <Text style={styles.paginationText}>
                                {activeIndex + 1} / {activeMedia.length}
                            </Text>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Create Album Modal */}
            <Modal
                visible={createAlbumModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCreateAlbumModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.dialogBox}>
                        <Text style={styles.dialogTitle}>Create New Album</Text>
                        <TextInput
                            style={styles.albumInput}
                            placeholder="Album Name"
                            value={newAlbumName}
                            onChangeText={setNewAlbumName}
                            autoFocus
                        />
                        <View style={styles.dialogActions}>
                            <TouchableOpacity
                                style={[styles.dialogBtn, { backgroundColor: '#F1F5F9' }]}
                                onPress={() => setCreateAlbumModalVisible(false)}
                            >
                                <Text style={[styles.dialogBtnText, { color: COLORS.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.dialogBtn, { backgroundColor: COLORS.primary }]}
                                onPress={handleCreateAlbum}
                            >
                                <Text style={styles.dialogBtnText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Photo Upload Source Modal (Bottom Sheet) */}
            <Modal
                visible={uploadModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setUploadModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setUploadModalVisible(false)}
                >
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeader}>
                            <View style={styles.dragHandle} />
                            <Text style={styles.sheetTitle}>Add Photo to {selectedAlbum?.title || 'Timeline'}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => {
                                setUploadModalVisible(false);
                                takePhoto();
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#EFF6FF' }]}>
                                <Ionicons name="camera" size={24} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.optionTitle}>Take Photo</Text>
                                <Text style={styles.optionSub}>Use camera to snap a picture</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.border} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => {
                                setUploadModalVisible(false);
                                pickImage();
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="images" size={24} color={COLORS.success} />
                            </View>
                            <View>
                                <Text style={styles.optionTitle}>Choose from Gallery</Text>
                                <Text style={styles.optionSub}>Select one or more existing photos</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.border} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setUploadModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: 15,
        paddingBottom: 40,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: (width - 45) / 2,
        height: 180,
        borderRadius: 20,
        marginBottom: 15,
        overflow: 'hidden',
        backgroundColor: COLORS.white,
        ...SHADOWS.medium,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    badge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    footer: {
        paddingHorizontal: SIZES.padding,
        paddingTop: 15,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        ...SHADOWS.medium,
    },
    addBtnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 25,
        gap: 10,
        ...SHADOWS.medium,
    },
    addBtnText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    viewerContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    imageSlide: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: width,
        height: height * 0.8,
    },
    pagination: {
        position: 'absolute',
        bottom: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    paginationText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    },
    sheetHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        marginBottom: 15,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#F8FAFC',
        borderRadius: 15,
        marginBottom: 12,
    },
    optionIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    optionSub: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 2,
    },
    cancelButton: {
        marginTop: 10,
        paddingVertical: 15,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: COLORS.danger,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    newAlbumBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    newAlbumBtnText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 8,
    },
    backBtnText: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
    },
    albumTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 15,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    photoCard: {
        width: (width - 50) / 3, // 3 column grid for photos inside album
        height: (width - 50) / 3,
        borderRadius: 12,
        overflow: 'hidden',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyAlbum: {
        width: '100%',
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    emptyAlbumText: {
        color: COLORS.textLight,
        fontSize: 16,
    },
    emptyCardPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dialogBox: {
        width: width * 0.85,
        backgroundColor: COLORS.white,
        borderRadius: 25,
        padding: 25,
        ...SHADOWS.dark,
    },
    dialogTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    albumInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 15,
        padding: 15,
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 25,
    },
    dialogActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    dialogBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: 'center',
    },
    dialogBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
