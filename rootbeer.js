Java.perform(function () {

    console.log("[*] Advanced Root Detection Bypass Loaded");

    var RootPackages = [
        "com.noshufou.android.su",
        "com.thirdparty.superuser",
        "eu.chainfire.supersu",
        "com.koushikdutta.superuser",
        "com.topjohnwu.magisk"
    ];

    var RootBinaries = ["su", "busybox", "magisk"];

    /* -------- Package Checks -------- */
    var PackageManager = Java.use("android.app.ApplicationPackageManager");

    PackageManager.getPackageInfo.overload(
        'java.lang.String', 'int'
    ).implementation = function (pkg, flag) {

        if (RootPackages.indexOf(pkg) !== -1) {
            console.log("[+] Root package hidden: " + pkg);
            pkg = "fake.package.name";
        }
        return this.getPackageInfo(pkg, flag);
    };

    /* -------- File.exists -------- */
    var File = Java.use("java.io.File");

    File.exists.implementation = function () {
        var name = this.getName();

        if (RootBinaries.indexOf(name) !== -1) {
            console.log("[+] Root binary hidden: " + name);
            return false;
        }
        return this.exists.call(this);
    };

    /* -------- Runtime.exec -------- */
    var Runtime = Java.use("java.lang.Runtime");

    Runtime.exec.overload('java.lang.String').implementation = function (cmd) {

        if (cmd.indexOf("su") !== -1 ||
            cmd.indexOf("which") !== -1 ||
            cmd.indexOf("busybox") !== -1) {

            console.log("[+] Blocked exec: " + cmd);
            return this.exec("echo");
        }

        return this.exec(cmd);
    };

    /* -------- System Properties -------- */
    var SystemProperties = Java.use("android.os.SystemProperties");

    SystemProperties.get.overload('java.lang.String').implementation =
        function (key) {

            if (key === "ro.build.tags") return "release-keys";
            if (key === "ro.debuggable") return "0";
            if (key === "ro.secure") return "1";

            return this.get(key);
        };

    var Build = Java.use("android.os.Build");
    Build.TAGS.value = "release-keys";

    /* =========================================================
       ROOTBEER BYPASS
       ========================================================= */

    try {

        var RootBeer = Java.use(
            "com.scottyab.rootbeer.RootBeer"
        );

        RootBeer.isRooted.implementation = function () {
            console.log("[+] RootBeer.isRooted() bypassed");
            return false;
        };

        RootBeer.isRootedWithoutBusyBoxCheck.implementation = function () {
            return false;
        };

        RootBeer.detectRootManagementApps.implementation = function () {
            return false;
        };

        RootBeer.detectPotentiallyDangerousApps.implementation = function () {
            return false;
        };

        RootBeer.detectTestKeys.implementation = function () {
            return false;
        };

        RootBeer.checkForBusyBoxBinary.implementation = function () {
            return false;
        };

        RootBeer.checkForSuBinary.implementation = function () {
            return false;
        };

        RootBeer.checkSuExists.implementation = function () {
            return false;
        };

        RootBeer.checkForRWSystem.implementation = function () {
            return false;
        };

        console.log("[*] RootBeer bypass applied");

    } catch (e) {
        console.log("[-] RootBeer not found");
    }

    /* =========================================================
       ROOTBEER NATIVE BYPASS (JNI)
       ========================================================= */

    try {

        var RootBeerNative = Java.use(
            "com.scottyab.rootbeer.RootBeerNative"
        );

        RootBeerNative.checkForRoot.implementation = function () {
            console.log("[+] RootBeerNative.checkForRoot bypassed");
            return false;
        };

        console.log("[*] RootBeerNative bypass applied");

    } catch (e) {
        console.log("[-] RootBeerNative not found");
    }

    console.log("[*] All Root Detection Bypasses Applied");
});