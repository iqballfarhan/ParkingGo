import React from 'react';
import { StyleSheet, Dimensions, TouchableWithoutFeedback, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ChatScreen from '../screens/ChatScreen';

const { width } = Dimensions.get('window');

const ChatDrawer = ({ isOpen, onClose }) => {
  const navigation = useNavigation();
  const translateX = useSharedValue(width);

  const gesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      translateX.value = isOpen ? 0 : width;
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = Math.max(0, Math.min(event.translationX + (isOpen ? 0 : width), width));
    })
    .onEnd((event) => {
      'worklet';
      const shouldClose = event.velocityX > 500 || event.translationX > width / 2;
      translateX.value = withSpring(
        shouldClose ? width : 0,
        {
          velocity: event.velocityX,
          damping: 20,
          stiffness: 90
        }
      );
      if (shouldClose) {
        runOnJS(onClose)();
      }
    });

  React.useEffect(() => {
    translateX.value = withSpring(isOpen ? 0 : width, {
      damping: 20,
      stiffness: 90,
      velocity: 3,
    });
  }, [isOpen]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOpen ? 0.5 : 0),
    display: isOpen ? 'flex' : 'none',
  }));

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  return (
    <>      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.container, drawerStyle]}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.dragIndicator} />
            <ChatScreen navigation={navigation} onClose={onClose} />
          </SafeAreaView>
        </Animated.View>
      </GestureDetector>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 999,
  },
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: 'white',
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
});

export default ChatDrawer;
