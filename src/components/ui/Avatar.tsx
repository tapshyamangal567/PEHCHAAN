import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, radius } from '../../theme';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: number;
  showOnlineStatus?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 40,
  showOnlineStatus = true,
}) => {
  const getInitials = (fullName: string) => {
    if (!fullName) return 'P';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[typography.bodyMedium, styles.initials, { fontSize: size * 0.38 }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {showOnlineStatus && (
        <View
          style={[
            styles.statusDot,
            {
              width: Math.max(10, size * 0.26),
              height: Math.max(10, size * 0.26),
              borderRadius: size * 0.13,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderWidth: 1.5,
    borderColor: colors.roseBorder,
  },
  fallback: {
    backgroundColor: colors.softRoseBg,
    borderWidth: 1.5,
    borderColor: colors.roseBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.primaryRose,
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});

export default Avatar;
