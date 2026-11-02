Java.perform(function () {
    // 1. Hook Build Properties
    var Build = Java.use("android.os.Build");
    Build.FINGERPRINT.value = "google/pixel/pixel:10/QP1A.190711.020/5858309:user/release-keys";
    Build.MODEL.value = "Pixel 4";
    Build.MANUFACTURER.value = "Google";
    Build.BRAND.value = "google";
    Build.DEVICE.value = "pixel";
    Build.PRODUCT.value = "pixel";
    Build.HARDWARE.value = "goldfish"; // Or "qcom"

    // 2. Hook System Properties
    var SystemProperties = Java.use("android.os.SystemProperties");
    var String = Java.use("java.lang.String");
    SystemProperties.get.overload('java.lang.String').implementation = function (key) {
        if (key.indexOf("emulator") > -1 || key.indexOf("vbox") > -1 || key.indexOf("qemu") > -1) {
            return "";
        }
        return this.get(key);
    };

    // 3. Hook Known Emulator Detection Classes
    // Example: com.scottyab.rootbeer (often checks for emulator too)
    // Adjust class names based on target app analysis
    var EmulatorDetector = Java.use("com.nekolaboratory.EmulatorDetector");
    EmulatorDetector.isEmulator.implementation = function () {
        console.log("[+] Bypassing Emulator Check");
        return false;
    };
});
