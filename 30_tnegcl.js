Java.perform(function () {

    var classes = [
        "com.stripe.android.stripe3ds2.init.SecurityCheck$DebuggerAttached",
        "com.stripe.android.stripe3ds2.init.SecurityCheck$Emulator",
        "com.stripe.android.stripe3ds2.init.SecurityCheck$RootedCheck",
        "com.stripe.android.stripe3ds2.init.SecurityCheck$Tampered",
        "com.stripe.android.stripe3ds2.init.SecurityCheck$UnsupportedOS"
    ];

    classes.forEach(function(className) {
        try {
            var clazz = Java.use(className);

            clazz.check.implementation = function () {
                console.log("[+] Bypassing " + className + ".check()");
                return false;
            };

            console.log("[+] Hooked " + className);

        } catch (err) {
            console.log("[-] Failed to hook " + className + ": " + err);
        }
    });

});
