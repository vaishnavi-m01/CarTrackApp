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

    // Find my story group
    const myStoryGroup = user ? storyGroups.find(g => g.userId === user.id) : undefined;

    // Filter out my story from others
    const otherStories = user ? storyGroups.filter(g => g.userId !== user.id) : storyGroups;

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
                        userAvatar={myStoryGroup.userAvatar}
                        hasUnviewed={myStoryGroup.hasUnviewed}
                        onPress={() => onViewStory(myStoryGroup)}
                        onAddPress={onAddStory}
                    />
                ) : (
                    <StoryCircle
                        userName="Your Story"
                        isAddStory
                        hasUnviewed={false}
                        onPress={onAddStory}
                    />
                )}

                {/* Other Users' Stories */}
                {otherStories.map((group) => (
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
