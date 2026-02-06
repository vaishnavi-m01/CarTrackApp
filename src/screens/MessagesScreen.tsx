import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    StatusBar,
    Platform,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';

type MessagesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Messages'>;

const MOCK_MESSAGES = [
    {
        id: '1',
        userName: 'TurboTom99',
        lastMessage: 'Yo, did you see that new exhaust on the Ducati? Sounds insane!',
        time: '2m ago',
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
        unread: true,
    },
    {
        id: '2',
        userName: 'RevHigh_Sarah',
        lastMessage: 'The group ride is starting at 10 AM at the hub.',
        time: '15m ago',
        image: 'https://randomuser.me/api/portraits/women/44.jpg',
        unread: true,
    },
    {
        id: '3',
        userName: 'DriftKing_Leo',
        lastMessage: 'Check out these track photos from last Sunday.',
        time: '1h ago',
        image: 'https://randomuser.me/api/portraits/men/85.jpg',
        unread: false,
    },
    {
        id: '4',
        userName: 'Apex_Mechanics',
        lastMessage: 'Your car is ready for pickup. Dyno results look good!',
        time: '4h ago',
        category: 'Service',
        image: 'https://randomuser.me/api/portraits/brands/1.jpg',
        unread: false,
    },
    {
        id: '5',
        userName: 'Classic_Clara',
        lastMessage: 'Found a rare radiator at the swap meet today.',
        time: '6h ago',
        image: 'https://randomuser.me/api/portraits/women/12.jpg',
        unread: false,
    },
];

const AVAILABLE_CONTACTS = [
    { id: '10', userName: 'SpeedDemon_Mike', image: 'https://randomuser.me/api/portraits/men/45.jpg' },
    { id: '11', userName: 'NitroNancy', image: 'https://randomuser.me/api/portraits/women/68.jpg' },
    { id: '12', userName: 'TrackStar_Alex', image: 'https://randomuser.me/api/portraits/men/22.jpg' },
    { id: '13', userName: 'GearHead_Emma', image: 'https://randomuser.me/api/portraits/women/33.jpg' },
    { id: '14', userName: 'RacerRick', image: 'https://randomuser.me/api/portraits/men/67.jpg' },
    { id: '15', userName: 'BoostQueen_Lisa', image: 'https://randomuser.me/api/portraits/women/55.jpg' },
];

export default function MessagesScreen() {
    const navigation = useNavigation<MessagesScreenNavigationProp>();
    const [searchQuery, setSearchQuery] = useState('');
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactSearchQuery, setContactSearchQuery] = useState('');

    const filteredContacts = AVAILABLE_CONTACTS.filter(contact =>
        contact.userName.toLowerCase().includes(contactSearchQuery.toLowerCase())
    );

    const handleNewMessage = (contact: typeof AVAILABLE_CONTACTS[0]) => {
        setShowContactModal(false);
        setContactSearchQuery('');
        navigation.navigate('ChatDetail', {
            userId: contact.id,
            userName: contact.userName,
            userImage: contact.image
        });
    };

    const renderChatItem = ({ item }: { item: typeof MOCK_MESSAGES[0] }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate('ChatDetail', {
                userId: item.id,
                userName: item.userName,
                userImage: item.image
            })}
        >
            <View style={styles.avatarContainer}>
                <Image source={{ uri: item.image }} style={styles.avatar} />
                {item.id === '4' && (
                    <View style={styles.onlineBadge}>
                        <Ionicons name="build" size={10} color="#fff" />
                    </View>
                )}
            </View>
            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={styles.userName}>{item.userName}</Text>
                    <Text style={[styles.timeText, item.unread && styles.unreadTime]}>{item.time}</Text>
                </View>
                <Text style={[styles.lastMessage, item.unread && styles.unreadMessage]} numberOfLines={1}>
                    {item.lastMessage}
                </Text>
            </View>
            {item.unread && <View style={styles.unreadIndicator} />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={COLORS.textLight} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users or vehicles"
                        placeholderTextColor={COLORS.textExtraLight}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <FlatList
                data={MOCK_MESSAGES}
                renderItem={renderChatItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowContactModal(true)}
            >
                <Ionicons name="chatbubble" size={24} color="#fff" />
            </TouchableOpacity>

            <Modal
                visible={showContactModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowContactModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Message</Text>
                            <TouchableOpacity onPress={() => setShowContactModal(false)}>
                                <Ionicons name="close" size={28} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>Select a contact to start chatting</Text>

                        <View style={styles.modalSearchContainer}>
                            <Ionicons name="search" size={20} color={COLORS.textLight} />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder="Search contacts..."
                                placeholderTextColor={COLORS.textExtraLight}
                                value={contactSearchQuery}
                                onChangeText={setContactSearchQuery}
                            />
                            {contactSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setContactSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <FlatList
                            data={filteredContacts}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.contactItem}
                                    onPress={() => handleNewMessage(item)}
                                >
                                    <Image source={{ uri: item.image }} style={styles.contactAvatar} />
                                    <Text style={styles.contactName}>{item.userName}</Text>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginVertical: 15,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.extraLightGray,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: COLORS.text,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.extraLightGray,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatContent: {
        flex: 1,
        marginLeft: 15,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.text,
    },
    timeText: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    unreadTime: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    lastMessage: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    unreadMessage: {
        color: COLORS.text,
        fontWeight: '600',
    },
    unreadIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginLeft: 10,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.dark,
        elevation: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.extraLightGray,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginHorizontal: 20,
        marginBottom: 15,
        height: 44,
    },
    modalSearchInput: {
        flex: 1,
        marginLeft: 10,
        color: COLORS.text,
        fontSize: 15,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    contactAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    contactName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
    },
});
