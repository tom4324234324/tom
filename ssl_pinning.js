/*
====================================================
 Android VAPT Frida Script Library

 File:
 ssl_pinning.js

 Purpose:
 Testing SSL/TLS certificate validation behavior
 during authorized mobile application security testing.

 Usage:
 frida -U -f package.name -l ssl_pinning.js

====================================================
*/


Java.perform(function () {

    console.log("[+] SSL Pinning Testing Script Loaded");


    /*
    ================================================
    OkHttp CertificatePinner
    ================================================
    */


    try {

        var CertificatePinner =
            Java.use(
            "okhttp3.CertificatePinner"
            );


        CertificatePinner.check.overload(
            'java.lang.String',
            'java.util.List'
        ).implementation = function (
            hostname,
            peerCertificates
        ) {


            console.log(
                "[+] OkHttp CertificatePinner bypass:"
                + hostname
            );


            return;


        };


        console.log(
            "[+] OkHttp CertificatePinner Hooked"
        );


    }

    catch(e){

        console.log(
            "[-] OkHttp CertificatePinner not found"
        );

    }



    /*
    ================================================
    TrustManager Hook
    ================================================
    */


    try {


        var TrustManagerImpl =
        Java.use(
        "com.android.org.conscrypt.TrustManagerImpl"
        );


        TrustManagerImpl.verifyChain
        .implementation = function(){

            console.log(
            "[+] TrustManager verification called"
            );


            return arguments[0];

        };


        console.log(
        "[+] TrustManager Hooked"
        );


    }


    catch(e){

        console.log(
        "[-] TrustManagerImpl not available"
        );

    }




    /*
    ================================================
    SSLContext Hook
    ================================================
    */


    try {


        var SSLContext =
        Java.use(
        "javax.net.ssl.SSLContext"
        );


        SSLContext.init.overload(
            '[Ljavax.net.ssl.KeyManager;',
            '[Ljavax.net.ssl.TrustManager;',
            'java.security.SecureRandom'
        )
        .implementation=function(
            keyManager,
            trustManager,
            secureRandom
        ){


            console.log(
            "[+] SSLContext.init called"
            );


            return this.init(
                keyManager,
                trustManager,
                secureRandom
            );


        };


        console.log(
        "[+] SSLContext Monitor Enabled"
        );


    }


    catch(e){

        console.log(
        "[-] SSLContext hook failed"
        );

    }


});


console.log(
"[+] SSL Pinning Script Ready"
);