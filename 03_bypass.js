Java.perform(function () {

    console.log("[*] Starting SSL Pinning Bypass");

    // TrustManager bypass
    var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
    var SSLContext = Java.use('javax.net.ssl.SSLContext');

    var TrustManager = Java.registerClass({
        name: 'dev.asd.TrustManager',
        implements: [X509TrustManager],
        methods: {
            checkClientTrusted: function (chain, authType) {},
            checkServerTrusted: function (chain, authType) {},
            getAcceptedIssuers: function () { return []; }
        }
    });

    var TrustManagers = [TrustManager.$new()];
    var SSLContext_init = SSLContext.init.overload(
        '[Ljavax.net.ssl.KeyManager;',
        '[Ljavax.net.ssl.TrustManager;',
        'java.security.SecureRandom'
    );

    SSLContext_init.implementation = function (keyManager, trustManager, secureRandom) {
        console.log('[+] Overriding SSLContext.init()');
        SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
    };

    // OkHttp3 CertificatePinner bypass
    try {
        var CertificatePinner = Java.use('okhttp3.CertificatePinner');
        CertificatePinner.check.overload('java.lang.String', 'java.util.List')
            .implementation = function (hostname, peerCertificates) {
                console.log('[+] Bypassing OkHttp3 pinning for ' + hostname);
                return;
            };
    } catch (err) {
        console.log('[-] OkHttp3 not found');
    }

try {
    var HostnameVerifier = Java.use('javax.net.ssl.HostnameVerifier');
    var HttpsURLConnection = Java.use('javax.net.ssl.HttpsURLConnection');
    HttpsURLConnection.setDefaultHostnameVerifier.implementation = function (verifier) {
        console.log('[+] HostnameVerifier bypassed');
        return;
    };
} catch (err) {}

});
