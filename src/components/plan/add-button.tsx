/**
 * AddButton Component
 * + button for creating new items using SF Symbol
 */

import { Pressable, StyleSheet, Text } from 'react-native';
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
      <Text style={styles.plus}>+</Text>
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
  plus: {
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
    marginTop: -2,
  },
});
