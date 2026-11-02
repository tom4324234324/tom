Java.perform(function() {
    console.log("[*] Starting rootbeerFresh bypass...");

    // 1. Hook Java-based root detection
    var RootBeer = Java.use("com.scottyab.rootbeer.RootBeer");
    RootBeer.isRooted.implementation = function() {
        console.log("[+] Bypassed RootBeer.isRooted()");
        return false;
    };
    RootBeer.isRootedWithBusyBox.implementation = function() {
        console.log("[+] Bypassed RootBeer.isRootedWithBusyBox()");
        return false;
    };
    RootBeer.isRootedAdvanced.implementation = function() {
        console.log("[+] Bypassed RootBeer.isRootedAdvanced()");
        return false;
    };

    // 2. Hook Native (NDK) checks which rootbeerFresh uses heavily
    var RootBeerNative = Java.use("com.scottyab.rootbeer.RootBeerNative");
    RootBeerNative.checkForRoot.implementation = function(args) {
        console.log("[+] Bypassed RootBeerNative.checkForRoot()");
        return false;
    };

    // 3. Bypass common file existence checks
    var File = Java.use("java.io.File");
    File.exists.implementation = function() {
        var path = this.getPath();
        if (path.indexOf("su") !== -1 || path.indexOf("magisk") !== -1) {
            console.log("[+] Faking file not found: " + path);
            return false;
        }
        return this.exists();
    };

    // 4. Bypass System Property Checks (Dangerous Props)
    var SystemProperties = Java.use("android.os.SystemProperties");
    SystemProperties.get.overload('java.lang.String').implementation = function(key) {
        if (key.indexOf("ro.debuggable") !== -1 || key.indexOf("ro.secure") !== -1) {
            console.log("[+] Faking prop: " + key);
            return "0";
        }
        return this.get(key);
    };

  console.log("[*] RootBeerNative specific bypass loaded");

    try {

        var RootBeerNative = Java.use(
            "com.scottyab.rootbeer.RootBeerNative"
        );

        /* -------- Bypass native root check -------- */

        RootBeerNative.checkForRoot.implementation = function (arr) {
            console.log("[+] RootBeerNative.checkForRoot() bypassed");
            return 0;   // 0 = Not rooted
        };

        /* -------- Bypass debug logging setter -------- */

        RootBeerNative.setLogDebugMessages.implementation = function (z) {
            console.log("[+] setLogDebugMessages bypassed");
            return 0;
        };

        /* -------- Fake library loaded -------- */

        RootBeerNative.wasNativeLibraryLoaded.implementation =
            function () {
                console.log("[+] wasNativeLibraryLoaded() forced TRUE");
                return true;
            };

        console.log("[*] RootBeerNative Java layer bypass applied");

    } catch (e) {
        console.log("[-] RootBeerNative class not found");
    }
});
