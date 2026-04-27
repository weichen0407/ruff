/**
 * SquareButton Component
 * Grid icon button using SF Symbol
 */

import { Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { PlatformColor } from 'react-native';
import { RADIUS } from '@/constants/themes';

interface Props {
  onPress?: () => void;
}

export default function SquareButton({ onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <SymbolView
        name="square.grid.2x2"
        size={20}
        tintColor={PlatformColor('label')}
        weight="regular"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
