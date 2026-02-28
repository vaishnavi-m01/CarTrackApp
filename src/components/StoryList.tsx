import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import StoryCircle from './StoryCircle';
import { StoryGroup } from '../types/Story';

interface StoryListProps {
    storyGroups: StoryGroup[];
    onAddStory: () => void;
    onViewStory: (group: StoryGroup) => void;
}

import { useAuth } from '../context/AuthContext';

export default function StoryList({ storyGroups, onAddStory, onViewStory }: StoryListProps) {
    const { user } = useAuth();

    // Find my story group - using String() for robust comparison
    const myStoryGroup = user ? storyGroups.find(g => String(g.userId) === String(user.id)) : undefined;

    // Filter out my story from others
    const otherStories = user
        ? storyGroups.filter(g => String(g.userId) !== String(user.id))
        : storyGroups;

    // Sort: Unviewed first, then viewed
    const sortedOtherStories = [...otherStories].sort((a, b) => {
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0;
    });

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Your Story Logic */}
                {myStoryGroup ? (
                    <StoryCircle
                        userName="Your Story"
                        userAvatar={myStoryGroup.userAvatar || user?.profilePicUrl}
                        hasUnviewed={myStoryGroup.hasUnviewed}
                        onPress={() => onViewStory(myStoryGroup)}
                        onAddPress={onAddStory}
                    />
                ) : (
                    <StoryCircle
                        userName="Your Story"
                        isAddStory
                        userAvatar={user?.profilePicUrl}
                        hasUnviewed={false}
                        onPress={onAddStory}
                    />
                )}

                {/* Other Users' Stories */}
                {sortedOtherStories.map((group) => (
                    <StoryCircle
                        key={group.userId}
                        userName={group.userName}
                        userAvatar={group.userAvatar}
                        hasUnviewed={group.hasUnviewed}
                        onPress={() => onViewStory(group)}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
});
