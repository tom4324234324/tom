// === SSL Deep Analyzer (Frida) ===
// Save as: ssl_deep_analyzer.js
// Run: frida -U -f <APP_ID> -l ssl_deep_analyzer.js --no-pause

if (typeof quiet_send === 'undefined') {
    var quiet_send = function() { try { send.apply(null, arguments); } catch (e) {} };
}

function hex(bytes) {
    if (bytes === null) return '';
    var hex = [];
    var u8 = new Uint8Array(bytes);
    for (var i = 0; i < u8.length; i++) {
        var h = u8[i].toString(16);
        if (h.length === 1) h = '0' + h;
        hex.push(h);
    }
    return hex.join('');
}

function printCertInfo(cert) {
    try {
        // cert is java.security.cert.X509Certificate instance
        var subj = cert.getSubjectDN ? cert.getSubjectDN().toString() : 'N/A';
        var issuer = cert.getIssuerDN ? cert.getIssuerDN().toString() : 'N/A';
        var serial = cert.getSerialNumber ? cert.getSerialNumber().toString(16) : 'N/A';
        var sigAlg = cert.getSigAlgName ? cert.getSigAlgName() : 'N/A';
        var notBefore = cert.getNotBefore ? cert.getNotBefore().toString() : 'N/A';
        var notAfter = cert.getNotAfter ? cert.getNotAfter().toString() : 'N/A';
        var pubAlg = 'N/A';
        try { pubAlg = cert.getPublicKey().getAlgorithm(); } catch (e) {}
        var enc = null;
        try { enc = cert.getEncoded(); } catch (e) {}
        var fingerprint = 'N/A';
        if (enc) {
            try {
                var md = Java.use('java.security.MessageDigest').getInstance('SHA-256');
                var fp = md.digest(enc);
                fingerprint = bytesToHexString(fp);
            } catch (e) {}
        }
        console.log('    Subject: ' + subj);
        console.log('    Issuer : ' + issuer);
        console.log('    Serial : ' + serial);
        console.log('    SigAlg : ' + sigAlg);
        console.log('    Valid  : ' + notBefore + ' --> ' + notAfter);
        console.log('    PubKey : ' + pubAlg);
        console.log('    SHA256 : ' + fingerprint);
    } catch (e) {
        console.log('    [!] Failed to print cert info: ' + e);
    }
}

function bytesToHexString(byteArray) {
    try {
        var sb = [];
        var len = byteArray.length;
        for (var i = 0; i < len; i++) {
            var b = (byteArray[i] & 0xff);
            var hx = (b < 16 ? '0' : '') + b.toString(16);
            sb.push(hx);
        }
        return sb.join('').toUpperCase();
    } catch (e) {
        return '<error>';
    }
}

Java.perform(function () {
    console.log('=== SSL Deep Analyzer attached ===');

    // 1) Hook SSLContext.init to see which TrustManagers are provided
    try {
        var SSLContext = Java.use('javax.net.ssl.SSLContext');
        SSLContext.init.overload(
            '[Ljavax.net.ssl.KeyManager;',
            '[Ljavax.net.ssl.TrustManager;',
            'java.security.SecureRandom'
        ).implementation = function (km, tm, sr) {
            try {
                console.log('\n[SSLContext.init] called');
                if (tm === null) {
                    console.log('  TrustManagers: null  (system default)');
                } else {
                    console.log('  TrustManagers count: ' + tm.length);
                    for (var i = 0; i < tm.length; i++) {
                        try {
                            console.log('   TM[' + i + '] -> ' + tm[i].$className);
                        } catch (e) {
                            console.log('   TM[' + i + '] -> (could not read className)');
                        }
                    }
                }
            } catch (e) {
                console.log('[!] SSLContext.init hook error: ' + e);
            }
            return this.init(km, tm, sr);
        };
        console.log('[+] Hooked javax.net.ssl.SSLContext.init');
    } catch (e) {
        console.log('[-] javax.net.ssl.SSLContext not available: ' + e);
    }

    // 2) Hook HttpsURLConnection.setSSLSocketFactory and setHostnameVerifier
    try {
        var HUC = Java.use('javax.net.ssl.HttpsURLConnection');
        HUC.setSSLSocketFactory.implementation = function (sf) {
            try {
                console.log('\n[HttpsURLConnection] setSSLSocketFactory called -> factory class: ' + (sf ? sf.$className : 'null'));
            } catch (e) {
                console.log('\n[HttpsURLConnection] setSSLSocketFactory called (could not read factory class)');
            }
            return this.setSSLSocketFactory(sf);
        };
        HUC.setHostnameVerifier.implementation = function (hv) {
            try {
                console.log('\n[HttpsURLConnection] setHostnameVerifier called -> verifier class: ' + (hv ? hv.$className : 'null'));
            } catch (e) {
                console.log('\n[HttpsURLConnection] setHostnameVerifier called (could not read verifier class)');
            }
            return this.setHostnameVerifier(hv);
        };
        console.log('[+] Hooked HttpsURLConnection.setSSLSocketFactory & setHostnameVerifier');
    } catch (e) {
        console.log('[-] HttpsURLConnection hooks not available: ' + e);
    }

    // 3) Hook HostnameVerifier.verify to log the hostname check and stacktrace
    try {
        var HostnameVerifier = Java.use('javax.net.ssl.HostnameVerifier');
        // Can't directly override interface methods; instead override known implementors by catching at setHostnameVerifier above.
        console.log('[i] HostnameVerifier interface present (we log actual instances at setHostnameVerifier)');
    } catch (e) {
        // ignore
    }

    // 4) Hook X509TrustManager.checkServerTrusted (common Java-level trust checks)
    try {
        var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
        // Override both typical checkServerTrusted signatures if present
        try {
            X509TrustManager.checkServerTrusted.overload('[Ljava.security.cert.X509Certificate;', 'java.lang.String').implementation = function (chain, authType) {
                console.log('\n[X509TrustManager] checkServerTrusted called, authType=' + authType);
                try {
                    if (chain && chain.length > 0) {
                        console.log('  chain length: ' + chain.length);
                        for (var i = 0; i < chain.length; i++) {
                            console.log('  Cert[' + i + '] -----------------');
                            printCertInfo(chain[i]);
                        }
                    } else {
                        console.log('  chain: null or empty');
                    }
                } catch (e) {
                    console.log('  [!] error reading chain: ' + e);
                }
                // Call original (do not bypass)
                return this.checkServerTrusted(chain, authType);
            };
        } catch (e) {
            // maybe not present
        }
        try {
            X509TrustManager.checkServerTrusted.overload('[Ljava.security.cert.X509Certificate;', 'java.lang.String', 'java.lang.String').implementation = function (chain, authType, host) {
                console.log('\n[X509TrustManager] checkServerTrusted called (3-arg) authType=' + authType + ' host=' + host);
                try {
                    if (chain && chain.length > 0) {
                        console.log('  chain length: ' + chain.length);
                        for (var i = 0; i < chain.length; i++) {
                            console.log('  Cert[' + i + '] -----------------');
                            printCertInfo(chain[i]);
                        }
                    }
                } catch (e) {
                    console.log('  [!] error reading chain: ' + e);
                }
                return this.checkServerTrusted(chain, authType, host);
            };
        } catch (e) {}
        console.log('[+] Hooked X509TrustManager.checkServerTrusted (if present)');
    } catch (e) {
        console.log('[-] X509TrustManager not present: ' + e);
    }

    // 5) Hook TrustManagerImpl (Android >7) functions if present
    try {
        var TMI = Java.use('com.android.org.conscrypt.TrustManagerImpl');
        try {
            TMI.checkTrustedRecursive.implementation = function (certs, ocspData, tlsSctData, host, clientAuth, untrustedChain, trustAnchorChain, used) {
                try {
                    console.log('\n[TrustManagerImpl] checkTrustedRecursive for host=' + host + ' certs.length=' + (certs ? certs.length : 'null'));
                    if (certs) {
                        for (var i = 0; i < certs.length; i++) {
                            console.log('  Cert[' + i + '] -----------------');
                            printCertInfo(certs[i]);
                        }
                    }
                } catch (e) {
                    console.log('[!] TrustManagerImpl.checkTrustedRecursive error: ' + e);
                }
                return this.checkTrustedRecursive(certs, ocspData, tlsSctData, host, clientAuth, untrustedChain, trustAnchorChain, used);
            };
            console.log('[+] Hooked TrustManagerImpl.checkTrustedRecursive');
        } catch (e) {
            // ignore
        }
        try {
            TMI.verifyChain.implementation = function(untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
                try {
                    console.log('\n[TrustManagerImpl] verifyChain for host=' + host + ' untrustedChain.length=' + (untrustedChain ? untrustedChain.length : 'null'));
                } catch (e) {}
                return this.verifyChain(untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData);
            };
            console.log('[+] Hooked TrustManagerImpl.verifyChain');
        } catch (e) {}
    } catch (e) {
        console.log('[-] TrustManagerImpl not present: ' + e);
    }

    // 6) Hook SSLSocket startHandshake() and session getters
    try {
        // Many Android builds use OpenSSLSocketImpl / Conscrypt OpenSSLSocketImpl
        var SocketImplNames = [
            'com.android.org.conscrypt.OpenSSLSocketImpl',
            'org.apache.harmony.xnet.provider.jsse.OpenSSLSocketImpl',
            'javax.net.ssl.SSLSocket'
        ];
        SocketImplNames.forEach(function (name) {
            try {
                var S = Java.use(name);
                // startHandshake
                try {
                    S.startHandshake.implementation = function () {
                        console.log('\n[SSLSocket] startHandshake on ' + name);
                        // optional: print stack trace
                        try {
                            var Thread = Java.use('java.lang.Thread');
                            var st = Thread.currentThread().getStackTrace();
                            console.log('  stack (top 6):');
                            for (var i = 0; i < Math.min(6, st.length); i++) {
                                console.log('   ' + st[i].toString());
                            }
                        } catch (e) {}
                        return this.startHandshake();
                    };
                } catch (e) {}
                // getSession
                try {
                    S.getSession.implementation = function () {
                        var sess = this.getSession();
                        try {
                            if (sess) {
                                console.log('\n[SSLSession] from ' + name + ' -> Protocol=' + sess.getProtocol() + ' Cipher=' + sess.getCipherSuite());
                                // peer certificates
                                try {
                                    var peers = sess.getPeerCertificates ? sess.getPeerCertificates() : null;
                                    if (peers) {
                                        for (var i = 0; i < peers.length; i++) {
                                            console.log('  PeerCert[' + i + '] -----------------');
                                            printCertInfo(peers[i]);
                                        }
                                    } else {
                                        // try getPeerPrincipal or getPeerCertificateChain (legacy)
                                        try {
                                            var chain = sess.getPeerCertificateChain ? sess.getPeerCertificateChain() : null;
                                            if (chain) {
                                                for (var j = 0; j < chain.length; j++) {
                                                    printCertInfo(chain[j]);
                                                }
                                            }
                                        } catch (e) {}
                                    }
                                } catch (e) {}
                            }
                        } catch (e) {
                            // ignore
                        }
                        return sess;
                    };
                } catch (e) {}
                console.log('[+] Hooked ' + name);
            } catch (e) {
                // not present, ignore
            }
        });
    } catch (e) {
        console.log('[-] SSLSocket hooking failed: ' + e);
    }

    // 7) Hook javax.net.ssl.SSLSession methods (global)
    try {
        var SSLSession = Java.use('javax.net.ssl.SSLSession');
        try {
            SSLSession.getPeerCertificates.implementation = function () {
                var arr = this.getPeerCertificates();
                try {
                    console.log('\n[SSLSession] getPeerCertificates called, len=' + (arr ? arr.length : 'null'));
                    if (arr) {
                        for (var i = 0; i < arr.length; i++) {
                            console.log('  PeerCert[' + i + '] -----------------');
                            printCertInfo(arr[i]);
                        }
                    }
                } catch (e) {}
                return arr;
            };
        } catch (e) {}
        try {
            SSLSession.getProtocol.implementation = function () {
                var p = this.getProtocol();
                console.log('[SSLSession] getProtocol -> ' + p);
                return p;
            };
        } catch (e) {}
        try {
            SSLSession.getCipherSuite.implementation = function () {
                var c = this.getCipherSuite();
                console.log('[SSLSession] getCipherSuite -> ' + c);
                return c;
            };
        } catch (e) {}
        console.log('[+] Hooked javax.net.ssl.SSLSession (where available)');
    } catch (e) {
        console.log('[-] javax.net.ssl.SSLSession not present: ' + e);
    }

    // 8) Optional: Hook HttpsURLConnection.connect() to show endpoint and Session info
    try {
        var HConn = Java.use('javax.net.ssl.HttpsURLConnection');
        HConn.connect.implementation = function () {
            try {
                console.log('\n[HttpsURLConnection] connect() -> URL: ' + this.getURL());
            } catch (e) {}
            var res = this.connect();
            try {
                try { var sess = this.getSession(); } catch (e) { var sess = null; }
                if (sess) {
                    try {
                        console.log('[HttpsURLConnection] Session protocol=' + sess.getProtocol() + ' cipher=' + sess.getCipherSuite());
                    } catch (e) {}
                }
            } catch (e) {}
            return res;
        };
        console.log('[+] Hooked HttpsURLConnection.connect');
    } catch (e) {
        // ignore
    }

    // 9) Print a small startup summary
    try {
        console.log('\n=== SSL deep analyzer ready. Watching for TLS activity... ===');
    } catch (e) {}
});
