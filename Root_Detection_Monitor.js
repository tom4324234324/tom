Java.perform(function () {

    console.log("[*] Root Detection Monitor Started");

    // --- Monitor Runtime.exec() ---
    var Runtime = Java.use("java.lang.Runtime");
    Runtime.exec.overload('java.lang.String').implementation = function (cmd) {
        console.log("[Runtime.exec] Command: " + cmd);
        return this.exec(cmd);
    };

    Runtime.exec.overload('[Ljava.lang.String;').implementation = function (cmdArray) {
        console.log("[Runtime.exec] Command Array: " + cmdArray);
        return this.exec(cmdArray);
    };

    // --- Monitor File.exists() ---
    var File = Java.use("java.io.File");
    File.exists.implementation = function () {
        var path = this.getAbsolutePath();
        if (path.toLowerCase().includes("su") ||
            path.toLowerCase().includes("magisk") ||
            path.toLowerCase().includes("busybox")) {
            console.log("[File.exists] Checking: " + path);
        }
        return this.exists();
    };

    // --- Monitor System Properties ---
    var SystemProperties = Java.use("android.os.SystemProperties");
    SystemProperties.get.overload('java.lang.String').implementation = function (key) {
        console.log("[SystemProperties.get] Key: " + key);
        return this.get(key);
    };

    // --- Monitor Build Tags ---
    var Build = Java.use("android.os.Build");
    console.log("[Build.TAGS] = " + Build.TAGS.value);

    // --- Monitor PackageManager (root apps check) ---
    var PM = Java.use("android.app.ApplicationPackageManager");
    PM.getPackageInfo.overload('java.lang.String', 'int').implementation =
        function (pkg, flag) {
            if (pkg.toLowerCase().includes("superuser") ||
                pkg.toLowerCase().includes("magisk")) {
                console.log("[Package Check] " + pkg);
            }
            return this.getPackageInfo(pkg, flag);
        };

    console.log("[*] Root Detection Monitor Active");

});