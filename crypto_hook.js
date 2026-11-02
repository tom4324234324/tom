/*
====================================================
 Android VAPT Frida Script Library

 File:
 crypto_hook.js

 Purpose:
 Monitor cryptographic API usage during authorized
 mobile application security testing.

 Detects:
 - Cipher usage
 - SecretKey usage
 - MessageDigest usage
 - Base64 operations

 Usage:
 frida -U -f package.name -l crypto_hook.js

====================================================
*/


Java.perform(function () {


console.log("[+] Crypto Monitoring Script Loaded");



/*
====================================================
 Cipher Hook
====================================================
*/


try {


var Cipher =
Java.use(
"javax.crypto.Cipher"
);



Cipher.getInstance
.overload("java.lang.String")
.implementation=function(
algorithm
){


console.log(
"[+] Cipher Algorithm Requested: "
+ algorithm
);



return this.getInstance(
algorithm
);


};



Cipher.doFinal
.overload("[B")
.implementation=function(
data
){


console.log(
"[+] Cipher.doFinal called"
);


console.log(
"    Data Length: "
+ data.length
);



var result =
this.doFinal(data);



console.log(
"    Output Length: "
+ result.length
);



return result;


};



console.log(
"[+] Cipher Hook Enabled"
);



}

catch(e){

console.log(
"[-] Cipher Hook Failed: "
+ e
);

}





/*
====================================================
SecretKey Hook
====================================================
*/


try {


var SecretKeySpec =
Java.use(
"javax.crypto.spec.SecretKeySpec"
);



SecretKeySpec.$init.overload(
"[B",
"java.lang.String"
)
.implementation=function(
key,
algorithm
){


console.log(
"[+] SecretKey Created"
);


console.log(
"    Algorithm: "
+ algorithm
);


console.log(
"    Key Length: "
+ key.length
);



return this.$init(
key,
algorithm
);


};



console.log(
"[+] SecretKey Hook Enabled"
);



}

catch(e){

console.log(
"[-] SecretKey Hook Failed"
);

}





/*
====================================================
MessageDigest Hook
====================================================
*/


try {


var MessageDigest =
Java.use(
"java.security.MessageDigest"
);



MessageDigest.getInstance
.overload("java.lang.String")
.implementation=function(
algorithm
){


console.log(
"[+] Hash Algorithm: "
+ algorithm
);



return this.getInstance(
algorithm
);


};



console.log(
"[+] MessageDigest Hook Enabled"
);



}

catch(e){

console.log(
"[-] MessageDigest Hook Failed"
);

}





/*
====================================================
Base64 Hook
====================================================
*/


try {


var Base64 =
Java.use(
"android.util.Base64"
);



Base64.encodeToString
.overload(
"[B",
"int"
)
.implementation=function(
data,
flags
){


console.log(
"[+] Base64 Encoding Detected"
);


console.log(
"    Data Length: "
+ data.length
);



return this.encodeToString(
data,
flags
);


};



Base64.decode
.overload(
"java.lang.String",
"int"
)
.implementation=function(
data,
flags
){


console.log(
"[+] Base64 Decoding Detected"
);


console.log(
"    Input: "
+ data
);



return this.decode(
data,
flags
);


};



console.log(
"[+] Base64 Hook Enabled"
);



}

catch(e){

console.log(
"[-] Base64 Hook Failed"
);

}



});



console.log(
"[+] Crypto Monitoring Ready"
);