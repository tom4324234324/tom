Java.perform(function () {
    var Process = Java.use("android.os.Process");
    Process.killProcess.implementation = function () {
        console.log("killProcess bypassed");
    };
});
