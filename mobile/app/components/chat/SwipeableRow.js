import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRANSLATE_X_THRESHOLD = -SCREEN_WIDTH * 0.3;

const SwipeableRow = ({ children, onDelete }) => {
  const translateX = useSharedValue(0);
  const rowHeight = useSharedValue(70);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const x = Math.min(0, event.translationX);
      translateX.value = x;
    })
    .onEnd((event) => {
      const shouldDelete = translateX.value < TRANSLATE_X_THRESHOLD;
      if (shouldDelete) {
        runOnJS(onDelete)();
      }
      translateX.value = withSpring(0);
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const rDeleteContainerStyle = useAnimatedStyle(() => {
    const opacity = Math.min(1, -translateX.value / TRANSLATE_X_THRESHOLD);
    return { opacity };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.deleteContainer, rDeleteContainerStyle]}>
        <Ionicons name="trash-outline" size={24} color="white" />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.rowContent, rStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EF4444',
  },
  rowContent: {
    backgroundColor: 'white',
  },
  deleteContainer: {
    position: 'absolute',
    right: 0,
    height: '100%',
    width: SCREEN_WIDTH * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SwipeableRow;
