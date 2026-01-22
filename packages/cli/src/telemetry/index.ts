import { configStore } from "./store";
import { execSync } from "child_process";
import { getConfig } from "../utils/get-config";
import { detectSystemInfo } from "./detect-system-info";
import { getPackageManager } from "../utils/get-package-manager";
import { hashToBase64 } from "./hash";
import { getProjectInfo } from "../utils/get-project-info";

interface PackageJson {
    name?: string;
}

const TELEMETRY_URL = process.env.TELEMETRY_URL || 'https://telemetry.mercurjs.com/api/v1/events'

export interface TelemetryEvent {
    type: string;
    payload?: Record<string, any>;
}


export const setTelemetryEmail = (email: string) => {
    configStore.set("telemetry_email", email)
}

export const toggleTelemetry = (enabled: boolean) => {
    configStore.set("telemetry_enabled", enabled)
}

const isTelemetryEnabled = () => {
    return configStore.get("telemetry_enabled") && process.env.MERCUR_DISABLE_TELEMETRY !== 'true'
}

export const sendTelemetryEvent = async (event: TelemetryEvent, options: { cwd: string }) => {
    try {
        if (!isTelemetryEnabled()) {
            return;
        }

        const projectInfo = await getProjectInfo(options.cwd)

        const { projectId } = getProjectId(projectInfo.packageJson!)

        const baseEvent = {
            nodeEnv: detectEnvironment(),
            nodeVersion: process.version,
            mercurVersion: projectInfo.mercurVersion,
            medusaVersion: projectInfo.medusaVersion,
            isSrcDir: projectInfo.isSrcDir,
            aliasPrefix: projectInfo.aliasPrefix,
            config: await getConfig(options.cwd),
            projectId,
            systemInfo: await detectSystemInfo(),
            packageManager: await getPackageManager(options.cwd),
            email: getTelemetryEmail(),
        }

        await fetch(TELEMETRY_URL, {
            body: JSON.stringify({ ...baseEvent, ...event }),
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'post',
        })
    } catch (error) {
        // Eat any errors in sending telemetry event
    }
}

export function detectEnvironment() {
    return process.env.NODE_ENV || 'development'
}

const getGitID = () => {
    try {
        const originBuffer = execSync('git config --local --get remote.origin.url', {
            stdio: 'pipe',
            timeout: 1000,
        })

        return String(originBuffer).trim()
    } catch (_) {
        return null
    }
}

const getProjectId = (
    packageJson: PackageJson,
): { gitId?: string; packageJsonId?: string; cwdId?: string; } => {
    const gitID = getGitID()
    if (gitID) {
        return { gitId: hashToBase64(gitID), }
    }

    const packageJSONID = packageJson.name
    if (packageJSONID) {
        return { packageJsonId: hashToBase64(packageJSONID), }
    }

    const cwd = process.cwd()
    return { cwdId: hashToBase64(cwd), }
}


export const getTelemetryEmail = () => {
    return configStore.get("telemetry_email") || null
}