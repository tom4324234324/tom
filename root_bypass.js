/*
====================================================
 Android VAPT Frida Script Library

 File:
 root_bypass.js

 Purpose:
 Testing Android root detection mechanisms
 during authorized mobile application security testing.

 Usage:
 frida -U -f package.name -l root_bypass.js

====================================================
*/


Java.perform(function () {


console.log("[+] Root Detection Testing Script Loaded");



/*
====================================================
 Common Root File Checks
====================================================
*/


try {


var File = Java.use(
    "java.io.File"
);



File.exists.implementation = function(){


var path = this.getAbsolutePath();


var root_paths = [

"/system/bin/su",
"/system/xbin/su",
"/sbin/su",
"/vendor/bin/su",
"/data/local/bin/su",
"/data/local/xbin/su",
"/system/app/Superuser.apk",
"/system/bin/magisk"

];



for(var i=0;i<root_paths.length;i++){


if(path === root_paths[i]){


console.log(
"[+] Blocked root file check: "
+ path
);


return false;


}

}


return this.exists();


};


console.log(
"[+] File.exists Hook Enabled"
);



}

catch(e){

console.log(
"[-] File hook failed: "
+ e
);

}



/*
====================================================
 Runtime.exec Root Command Checks
====================================================
*/


try{


var Runtime = Java.use(
"java.lang.Runtime"
);



Runtime.exec.overload(
"java.lang.String"
)
.implementation=function(command){


console.log(
"[+] Runtime command: "
+ command
);



if(
command.indexOf("su") >= 0 ||
command.indexOf("magisk") >= 0 ||
command.indexOf("busybox") >= 0
){


console.log(
"[+] Blocking root command"
);


throw new Error(
"Root command blocked"
);


}



return this.exec(command);


};



console.log(
"[+] Runtime.exec Hook Enabled"
);



}

catch(e){

console.log(
"[-] Runtime hook failed"
);

}




/*
====================================================
 Build Properties Check
====================================================
*/


try{


var Build =
Java.use(
"android.os.Build"
);



Build.TAGS.value =
"release-keys";


console.log(
"[+] Build tags modified"
);


}

catch(e){

console.log(
"[-] Build modification failed"
);

}



/*
====================================================
 RootBeer Library Detection
====================================================
*/


try{


var RootBeer =
Java.use(
"com.scottyab.rootbeer.RootBeer"
);



RootBeer.isRooted
.implementation=function(){


console.log(
"[+] RootBeer detection bypassed"
);


return false;


};


console.log(
"[+] RootBeer Hook Enabled"
);



}

catch(e){

console.log(
"[-] RootBeer not detected"
);

}



});



console.log(
"[+] Root Detection Script Ready"
);