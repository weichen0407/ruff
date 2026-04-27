/**
 * AddButton Component
 * + button for creating new items using SF Symbol
 */

import { Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { COLORS } from '@/constants/themes';

interface Props {
  onPress?: () => void;
}

export default function AddButton({ onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <SymbolView
        name="plus"
        size={20}
        tintColor="#FFFFFF"
        weight="regular"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
