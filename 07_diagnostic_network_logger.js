// === Full Native TLS + Java Network Diagnostic Script (Safe, No Bypass)
// === FIXED VERSION: No TypeError, compatible with LDPlayer/Frida === (Safe, No Bypass) ===
// This script ONLY logs network + TLS activity. It does NOT bypass anything.
// Works on any Android app for testing and analysis.

console.log("=== Network + Native TLS Diagnostic Started ===");

// ------------------------------------------------------------
// 0. Defensive logger (handles old scripts calling quiet_send)
// ------------------------------------------------------------
if (typeof quiet_send === 'undefined') {
    var quiet_send = function() {
        try { send.apply(null, arguments); } catch (e) {}
    };
}

// ------------------------------------------------------------
// 1. Java-level diagnostics: URLConnection, WebView, HttpURLConnection
// ------------------------------------------------------------
Java.perform(function() {
    try {
        var URL = Java.use('java.net.URL');
        URL.openConnection.overload().implementation = function() {
            console.log('[Java] URL.openConnection() -> ' + this.toString());
            return this.openConnection();
        };
        console.log('[+] Hooked URL.openConnection');
    } catch (e) { console.log('[-] URL.openConnection not found ' + e); }

    try {
        var HUC = Java.use('javax.net.ssl.HttpsURLConnection');
        HUC.setHostnameVerifier.implementation = function(verifier) {
            console.log('[Java] HttpsURLConnection.setHostnameVerifier');
            return this.setHostnameVerifier(verifier);
        };
        HUC.setSSLSocketFactory.implementation = function(fact) {
            console.log('[Java] HttpsURLConnection.setSSLSocketFactory');
            return this.setSSLSocketFactory(fact);
        };
        console.log('[+] Hooked HttpsURLConnection');
    } catch (e) { console.log('[-] HttpsURLConnection not found ' + e); }

    try {
        var WVC = Java.use('android.webkit.WebViewClient');
        WVC.onReceivedSslError.overload(
            'android.webkit.WebView',
            'android.webkit.SslErrorHandler',
            'android.net.http.SslError'
        ).implementation = function(a, b, c) {
            console.log('[Java] WebViewClient.onReceivedSslError');
            return this.onReceivedSslError(a, b, c);
        };
        console.log('[+] Hooked WebViewClient');
    } catch (e) { console.log('[-] WebViewClient not found ' + e); }

    // Try detecting presence of OkHttp3
    try {
        var OkHttpClient = Java.use('okhttp3.OkHttpClient');
        console.log('[!] OkHttp3 library detected');
    } catch (e) {
        console.log('[-] OkHttp3 not found');
    }
});

// ------------------------------------------------------------
// 2. Native module scanner — log all .so modules and interesting exports
// ------------------------------------------------------------
setTimeout(function() {
    console.log("=== Native Module Scan ===");
    var mods = Module.enumerateModules();
    mods.forEach(function(m) {
        console.log("MODULE: " + m.name);
    });

    console.log("=== Searching for TLS/network-related libraries ===");
    mods.filter(m => /ssl|crypto|curl|boringssl|mbedtls|nghttp|quic|http|ws/i.test(m.name))
        .forEach(function(m) {
            console.log('>> Suspect: ' + m.name);
            try {
                var exps = Module.enumerateExports(m.name);
                exps.forEach(x => {
                    if (/ssl|SSL|curl|BIO|EVP|handshake|TLS|http|quic/i.test(x.name)) {
                        console.log('   export ' + x.name + ' @ ' + x.address);
                    }
                });
            } catch (e) {}
        });
}, 1000);

// ------------------------------------------------------------
// 3. Hook native connect() — detects outgoing socket connections
// ------------------------------------------------------------
function hookConnect() {
    try {
        var addr = Module.getExportByName(null, 'connect');
        Interceptor.attach(addr, {
            onEnter: function(args) {
                try {
                    var sa = args[1];
                    var family = sa.readU16();
                    if (family === 2) { // AF_INET
                        var port = sa.add(2).readU16();
                        port = ((port & 0xff) << 8) | (port >> 8);
                        var ip = [sa.add(4).readU8(), sa.add(5).readU8(), sa.add(6).readU8(), sa.add(7).readU8()].join('.');
                        console.log('[Native] connect -> ' + ip + ':' + port);
                    }
                } catch (e) {}
            }
        });
        console.log('[+] Hooked native connect()');
    } catch (e) {
        console.log('[-] connect not found');
    }
}
hookConnect();

// ------------------------------------------------------------
// 4. Hook OpenSSL/BoringSSL TLS functions (SSL_connect, SSL_read, SSL_write)
// ------------------------------------------------------------
function tryHook(name, onEnter, onLeave) {
    try {
        var addr = Module.getExportByName(null, name);
        Interceptor.attach(addr, {
            onEnter: onEnter || function() {},
            onLeave: onLeave || function() {},
        });
        console.log('[+] Hooked ' + name);
    } catch (e) {
        console.log('[-] ' + name + ' not found');
    }
}

// TLS handshake detection
tryHook('SSL_connect', function(args) {
    console.log('[TLS] SSL_connect called, SSL*=' + args[0]);
}, function(retval) {
    console.log('[TLS] SSL_connect returned ' + retval);
});

// TLS read
tryHook('SSL_read', function(args) {
    this.buf = args[1];
    this.len = args[2].toInt32 ? args[2].toInt32() : args[2];
}, function(retval) {
    try {
        var n = retval.toInt32();
        if (n > 0) {
            console.log('[TLS] SSL_read ' + n + ' bytes');
        }
    } catch (e) {}
});

// TLS write
tryHook('SSL_write', function(args) {
    try {
        var n = args[2].toInt32 ? args[2].toInt32() : args[2];
        console.log('[TLS] SSL_write ' + n + ' bytes');
    } catch (e) {}
});

console.log('=== Network + TLS Diagnostic Ready ===');
