import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface FeedVideoPlayerProps {
    source: string;
    style?: any;
    isMuted?: boolean;
    isActive?: boolean;
}

export const FeedVideoPlayer = ({ source, style, isMuted = true, isActive = false }: FeedVideoPlayerProps) => {
    const player = useVideoPlayer(source, (player) => {
        player.loop = true;
        player.muted = isMuted;
        if (isActive) {
            player.play();
        } else {
            player.pause();
        }
    });

    React.useEffect(() => {
        player.muted = isMuted;
    }, [isMuted, player]);

    React.useEffect(() => {
        if (isActive) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, player]);

    return (
        <View style={[styles.container, style]}>
            <VideoView
                player={player}
                style={styles.video}
                contentFit="cover"
                nativeControls={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    video: {
        width: '100%',
        height: '100%',
    },
});
