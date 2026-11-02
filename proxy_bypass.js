Java.perform(function () {

    console.log("[*] Proxy detection bypass loaded");

    /* Bypass System.getProperty proxy checks */
    var System = Java.use("java.lang.System");

    System.getProperty.overload('java.lang.String').implementation = function(key) {

        if (key === "http.proxyHost" ||
            key === "http.proxyPort" ||
            key === "https.proxyHost" ||
            key === "https.proxyPort") {

            console.log("[+] Bypassing proxy check for: " + key);
            return null;
        }

        return this.getProperty(key);
    };

    /* Bypass ProxySelector */
    try {
        var ProxySelector = Java.use("java.net.ProxySelector");

        ProxySelector.select.implementation = function(uri) {
            console.log("[+] ProxySelector bypass for: " + uri);
            return Java.use("java.util.Collections").emptyList();
        };
    } catch (err) {
        console.log("[-] ProxySelector hook failed");
    }

});