setTimeout(function () {
  Java.perform(function () {
    console.log("[*] Anti-Frida + SSL Bypass Loaded");

    /* -----------------------------
       Anti-Frida (Java Layer)
    ----------------------------- */
    try {
      var StringCls = Java.use("java.lang.String");

      StringCls.contains.implementation = function (s) {
        if (s) {
          var lower = s.toLowerCase();
          if (
            lower.indexOf("frida") !== -1 ||
            lower.indexOf("gum") !== -1 ||
            lower.indexOf("xposed") !== -1 ||
            lower.indexOf("substrate") !== -1
          ) {
            return false;
          }
        }
        return this.contains(s);
      };
      console.log("[+] String.contains anti-frida applied");
    } catch (e) {}

    /* -----------------------------
       Anti-Frida (Process Check)
    ----------------------------- */
    try {
      var Process = Java.use("java.lang.ProcessBuilder");
      Process.start.implementation = function () {
        console.log("[+] ProcessBuilder bypass");
        return null;
      };
    } catch (e) {}

    /* -----------------------------
       SSL TrustManager Bypass
    ----------------------------- */
    try {
      var X509TrustManager = Java.use("javax.net.ssl.X509TrustManager");
      var SSLContext = Java.use("javax.net.ssl.SSLContext");

      var TrustManager = Java.registerClass({
        name: "dev.frida.TrustManager",
        implements: [X509TrustManager],
        methods: {
          checkClientTrusted: function () {},
          checkServerTrusted: function () {},
          getAcceptedIssuers: function () {
            return [];
          }
        }
      });

      SSLContext.init.overload(
        "[Ljavax.net.ssl.KeyManager;",
        "[Ljavax.net.ssl.TrustManager;",
        "java.security.SecureRandom"
      ).implementation = function (km, tm, sr) {
        console.log("[+] SSL pinning bypass");
        this.init(km, [TrustManager.$new()], sr);
      };
    } catch (e) {}

    /* -----------------------------
       OkHTTP Bypass
    ----------------------------- */
    try {
      var CertPinner = Java.use("okhttp3.CertificatePinner");
      CertPinner.check.overload(
        "java.lang.String",
        "java.util.List"
      ).implementation = function () {
        console.log("[+] OkHTTP bypass");
        return;
      };
    } catch (e) {}

    console.log("[*] Hooks applied safely");
  });
}, 4000);
