Java.perform(function () {

    var AssetManager = Java.use("android.content.res.AssetManager");

    AssetManager.open.overload('java.lang.String').implementation = function(name) {

        if (name.includes("vder.cer")) {

            console.log("[+] Injecting Burp certificate");

            var FileInputStream = Java.use("java.io.FileInputStream");
            return FileInputStream.$new("/data/local/tmp/cacert2.der");
        }

        return this.open(name);
    };

});