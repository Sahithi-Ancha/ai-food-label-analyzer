import { CameraView, useCameraPermissions } from "expo-camera";

import { StyleSheet, Text, View } from "react-native";

export default function BarcodeScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Permission still loading
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission is required</Text>
        <Text style={styles.link} onPress={requestPermission}>
          Grant Permission
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  link: {
    color: "blue",
    fontSize: 16,
  },
});
