import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isActive, setIsActive] = useState(false);
  const [scanned, setScanned] = useState(false);

  const router = useRouter();
  const scanLock = useRef(false);

  // Activate camera ONLY when screen is focused
  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      scanLock.current = false;
      setScanned(false);

      return () => setIsActive(false);
    }, []),
  );

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Camera permission required</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={styles.link}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    const data = result?.data;
    if (!data) return;

    if (scanLock.current) return;

    scanLock.current = true;
    setScanned(true);

    setTimeout(() => {
      router.push({
        pathname: "/result",
        params: { barcode: data },
      });
    }, 300);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {isActive && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            // keep it simple + safe across versions
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
      )}

      {scanned && (
        <TouchableOpacity
          style={styles.scanAgain}
          onPress={() => {
            scanLock.current = false;
            setScanned(false);
          }}
        >
          <Text style={{ color: "#fff" }}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  link: {
    color: "#4da6ff",
    marginTop: 10,
    fontWeight: "600",
  },
  scanAgain: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#000",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
});
