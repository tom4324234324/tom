function waitForFlutterAndHook() {
    const libsToCheck = ["libflutter.so", "libapp.so"];
    const pattern = "01 00 A0 E1";  
    // Example ARM32 NOP sequence - replace with your real signature
    // For ARM64 example: "20 00 80 D2"

    console.log("[*] Starting Flutter wait loop...");

    const interval = setInterval(() => {
        let module = null;

        // Check for either Flutter or App library
        for (let name of libsToCheck) {
            module = Process.findModuleByName(name);
            if (module) {
                console.log("[+] Found module:", name);
                break;
            }
        }

        if (!module) {
            console.log("[*] Waiting for Flutter libraries...");
            return;
        }

        clearInterval(interval);

        console.log("[*] Scanning for pattern:", pattern);
        console.log("[*] Module base:", module.base);
        console.log("[*] Module size:", module.size);

        // Scan the entire module
        Memory.scan(module.base, module.size, pattern, {
            onMatch: function (addr, size) {
                console.log("[+] Pattern found at:", addr);

                let offset = addr.sub(module.base);
                console.log("[+] Auto-calculated offset: 0x" + offset.toString(16));

                installHook(addr);
            },
            onComplete: function () {
                console.log("[*] Scan complete.");
            }
        });
    }, 500);
}

function installHook(addr) {
    try {
        // Make region RWX so hook doesn't crash
        Memory.protect(addr, 4, 'rwx');
    } catch (err) {
        console.log("[!] Memory.protect failed:", err);
        return;
    }

    try {
        Interceptor.replace(
            addr,
            new NativeCallback(function () {
                console.log("[+] Auto-scanned hook triggered!");
                return 1;
            }, 'int', [])
        );

        console.log("[+] Hook installed at:", addr);
    } catch (err) {
        console.log("[!] Hook installation failed:", err);
    }
}

setImmediate(waitForFlutterAndHook);
