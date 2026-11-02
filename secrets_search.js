/*
====================================================
 Android VAPT Frida Script Library

 File:
 secrets_search.js

 Purpose:
 Runtime detection of sensitive strings during
 authorized Android application security testing.

 Searches for:
 - API keys
 - Tokens
 - Password keywords
 - URLs
 - JWT tokens
 - Secrets in memory/classes

 Usage:
 frida -U -f package.name -l secrets_search.js

====================================================
*/


Java.perform(function () {


console.log("[+] Runtime Secrets Search Loaded");



/*
====================================================
Search String Patterns
====================================================
*/


var patterns = [

    "password",
    "passwd",
    "secret",
    "apikey",
    "api_key",
    "token",
    "authorization",
    "bearer",
    "private",
    "credential",
    "client_secret",
    "access_key"

];



/*
====================================================
Hook String Usage
====================================================
*/


try {


var StringClass =
Java.use(
"java.lang.String"
);



StringClass.toString
.implementation=function(){


var value =
this.toString();



for(var i=0;i<patterns.length;i++)
{


if(
value.toLowerCase()
.indexOf(patterns[i]) !== -1
)
{


console.log(
"[+] Possible Sensitive String:"
);

console.log(
value
);


}

}


return value;


};



console.log(
"[+] String Monitor Enabled"
);



}

catch(e){

console.log(
"[-] String Hook Failed"
);

}





/*
====================================================
SharedPreferences Monitoring
====================================================
*/


try {


var SharedPreferences =
Java.use(
"android.app.SharedPreferencesImpl"
);



SharedPreferences.getString
.overload(
"java.lang.String",
"java.lang.String"
)
.implementation=function(
key,
def
){


console.log(
"[+] SharedPreferences Access"
);


console.log(
"    Key: "
+ key
);



var value =
this.getString(
key,
def
);



console.log(
"    Value: "
+ value
);



return value;


};



console.log(
"[+] SharedPreferences Hook Enabled"
);



}

catch(e){

console.log(
"[-] SharedPreferences Hook Failed"
);

}





/*
====================================================
Clipboard Monitoring
====================================================
*/


try {


var Clipboard =
Java.use(
"android.content.ClipboardManager"
);



Clipboard.getPrimaryClip
.implementation=function(){


console.log(
"[+] Clipboard Access Detected"
);



return this.getPrimaryClip();


};



console.log(
"[+] Clipboard Hook Enabled"
);



}

catch(e){

console.log(
"[-] Clipboard Hook Failed"
);

}




});



console.log(
"[+] Secrets Search Ready"
);