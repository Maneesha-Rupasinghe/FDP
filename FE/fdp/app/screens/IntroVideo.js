import React, { useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Video } from "expo-av";

const IntroVideo = ({ onFinish }) => {
  const video = useRef(null);
  const [playCount, setPlayCount] = useState(1); // Starts with 1st play

  const handlePlaybackStatusUpdate = (status) => {
    if (status.didJustFinish && !status.isLooping) {
      if (playCount < 3) {
        setPlayCount((prev) => prev + 1);
        video.current.replayAsync(); // Replay the video manually
      } else {
        onFinish(); // Call finish after 3rd play
      }
    }
  };

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        source={require("../../assets/intro.mp4")}
        style={styles.video}
        resizeMode="cover"
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />

      <TouchableOpacity style={styles.button} onPress={onFinish}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  video: { flex: 1 },
  button: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "bold",
  },
});

export default IntroVideo;
