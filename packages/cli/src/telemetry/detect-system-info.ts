export const importRuntime = <T>(m: string): Promise<T> => {
    return (Function("mm", "return import(mm)") as any)(m);
};

function getVendor() {
    const hasAny = (...keys: string[]) =>
        keys.some((k) => Boolean(process.env[k]));

    if (
        hasAny(
            "MEDUSA_CLOUD_ENVIRONMENT_HANDLE",
            "MEDUSA_CLOUD_SANDBOX_HANDLE",
            "MEDUSA_CLOUD_API_KEY",
        )
    ) {
        return "medusa-cloud";
    }

    if (
        hasAny(
            "RENDER",
            "RENDER_URL",
            "RENDER_INTERNAL_HOSTNAME",
            "RENDER_SERVICE_ID",
        )
    ) {
        return "render";
    }

    if (hasAny("FLY_APP_NAME", "FLY_REGION", "FLY_ALLOC_ID")) return "fly-io";

    if (hasAny("RAILWAY_STATIC_URL", "RAILWAY_ENVIRONMENT_NAME"))
        return "railway";

    if (hasAny("DYNO", "HEROKU_APP_NAME")) return "heroku";

    if (hasAny("DO_DEPLOYMENT_ID", "DO_APP_NAME", "DIGITALOCEAN"))
        return "digitalocean";

    if (hasAny("KOYEB", "KOYEB_DEPLOYMENT_ID", "KOYEB_APP_NAME")) return "koyeb";

    return null;
}

export async function detectSystemInfo() {
    try {
        //check if it's cloudflare
        const os = await importRuntime<typeof import("os")>("os");
        const cpus = os.cpus();
        return {
            deploymentVendor: getVendor(),
            systemPlatform: os.platform(),
            systemRelease: os.release(),
            systemArchitecture: os.arch(),
            cpuCount: cpus.length,
            cpuModel: cpus.length ? cpus[0]!.model : null,
            cpuSpeed: cpus.length ? cpus[0]!.speed : null,
            memory: os.totalmem(),
            isWSL: await isWsl(),
            isDocker: await isDocker(),
            isTTY:
                typeof process !== "undefined" && (process as any).stdout
                    ? (process as any).stdout.isTTY
                    : null,
        };
    } catch {
        return {
            systemPlatform: null,
            systemRelease: null,
            systemArchitecture: null,
            cpuCount: null,
            cpuModel: null,
            cpuSpeed: null,
            memory: null,
            isWSL: null,
            isDocker: null,
            isTTY: null,
        };
    }
}


async function isWsl() {
    try {
        if (typeof process === "undefined" || process?.platform !== "linux") {
            return false;
        }
        const fs = await importRuntime<typeof import("fs")>("fs");
        const os = await importRuntime<typeof import("os")>("os");
        if (os.release().toLowerCase().includes("microsoft")) {
            if (await isInsideContainer()) {
                return false;
            }

            return true;
        }

        return fs
            .readFileSync("/proc/version", "utf8")
            .toLowerCase()
            .includes("microsoft")
            ? !(await isInsideContainer())
            : false;
    } catch {
        return false;
    }
}
const hasContainerEnv = async () => {
    try {
        const fs = await importRuntime<typeof import("fs")>("fs");
        fs.statSync("/run/.containerenv");
        return true;
    } catch {
        return false;
    }
};

async function isDocker() {
    return (await hasDockerEnv()) || (await hasDockerCGroup());
}


async function hasDockerEnv() {
    try {
        const fs = await importRuntime<typeof import("fs")>("fs");
        fs.statSync("/.dockerenv");
        return true;
    } catch {
        return false;
    }
}

async function hasDockerCGroup() {
    try {
        const fs = await importRuntime<typeof import("fs")>("fs");
        return fs.readFileSync("/proc/self/cgroup", "utf8").includes("docker");
    } catch {
        return false;
    }
}


async function isInsideContainer() {
    return (await hasContainerEnv()) || (await isDocker());
}