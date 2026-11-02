Java.perform(function () {

    console.log("[*] RootBeer Deep Bypass Loaded");

    /* =========================================================
       1) HIDE ROOT / DANGEROUS PACKAGES
       ========================================================= */

    var RootPackages = [
        "com.noshufou.android.su",
        "eu.chainfire.supersu",
        "com.topjohnwu.magisk",
        "com.kingroot.kinguser",
        "com.kingo.root",
        "com.zhiqupk.root.global",
        "com.alephzain.framaroot",
        "com.koushikdutta.rommanager",
        "com.dimonvideo.luckypatcher",
        "org.blackmart.market",
        "cc.madkite.freedom",
        "de.robv.android.xposed.installer",
        "com.saurik.substrate"
    ];

    var PM = Java.use("android.app.ApplicationPackageManager");

    PM.getPackageInfo.overload('java.lang.String', 'int')
        .implementation = function (pkg, flags) {

        if (RootPackages.indexOf(pkg) !== -1) {
            console.log("[+] Hidden package: " + pkg);
            pkg = "com.fake.package";
        }
        return this.getPackageInfo(pkg, flags);
    };

    /* =========================================================
       2) HIDE su / busybox BINARIES
       ========================================================= */

    var RootBins = ["su", "busybox", "magisk"];

    var File = Java.use("java.io.File");

    File.exists.implementation = function () {

        var name = this.getName();

        if (RootBins.indexOf(name) !== -1) {
            console.log("[+] Hidden binary: " + name);
            return false;
        }

        return this.exists.call(this);
    };

    /* =========================================================
       3) BLOCK SHELL COMMAND CHECKS
       ========================================================= */

    var Runtime = Java.use("java.lang.Runtime");

    Runtime.exec.overload('java.lang.String')
        .implementation = function (cmd) {

        if (cmd.match(/su|which|busybox|getprop|mount/i)) {
            console.log("[+] Blocked shell cmd: " + cmd);
            return this.exec("echo");
        }

        return this.exec(cmd);
    };

    /* =========================================================
       4) FAKE SYSTEM PROPERTIES
       ========================================================= */

    var SysProp = Java.use("android.os.SystemProperties");

    SysProp.get.overload('java.lang.String')
        .implementation = function (key) {

        if (key === "ro.build.tags") return "release-keys";
        if (key === "ro.debuggable") return "0";
        if (key === "ro.secure") return "1";

        return this.get(key);
    };

    /* =========================================================
       5) HIDE WRITABLE SYSTEM PATH CHECKS
       ========================================================= */

    File.canWrite.implementation = function () {

        var path = this.getAbsolutePath();

        if (path.startsWith("/system") ||
            path.startsWith("/vendor") ||
            path.startsWith("/sbin")) {

            console.log("[+] Fake non-writable: " + path);
            return false;
        }

        return this.canWrite.call(this);
    };

    /* =========================================================
       6) FAKE PATH ENVIRONMENT VARIABLE
       ========================================================= */

    var System = Java.use("java.lang.System");

    System.getenv.overload('java.lang.String')
        .implementation = function (name) {

        if (name === "PATH") {
            console.log("[+] Fake PATH returned");
            return "/system/bin";
        }

        return this.getenv(name);
    };

    /* =========================================================
       7) ROOTBEER JAVA API BYPASS
       ========================================================= */

    try {

        var RB = Java.use("com.scottyab.rootbeer.RootBeer");

        RB.isRooted.implementation = function () {
            console.log("[+] RootBeer.isRooted bypassed");
            return false;
        };

    } catch (e) {}

    /* =========================================================
       8) ROOTBEER NATIVE BYPASS
       ========================================================= */

    try {

        var RBN = Java.use("com.scottyab.rootbeer.RootBeerNative");

        RBN.checkForRoot.implementation = function () {
            console.log("[+] RootBeerNative bypassed");
            return 0;
        };

        RBN.wasNativeLibraryLoaded.implementation =
            function () { return true; };

    } catch (e) {}

    console.log("[*] All RootBeer checks neutralized");
});