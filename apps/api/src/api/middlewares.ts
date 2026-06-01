import { authenticate } from "@medusajs/framework";
import { defineMiddlewares } from "@medusajs/medusa";

import { findDijieRoleMetadataPrivacyIssues } from "../lib/dijie/role-product-metadata";

const asRecord = (value: unknown): Record<string, unknown> => {
    return value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
};

const rejectPrivateDijieRoleMetadata = (req: any, res: any, next: any) => {
    const body = asRecord(req.body);
    const metadata = asRecord(body.metadata);
    const role = asRecord(metadata.dijieRole);

    if (!Object.keys(role).length) {
        return next();
    }

    const issues = findDijieRoleMetadataPrivacyIssues(role);
    if (issues.length > 0) {
        return res.status(400).json({
            message: "metadata.dijieRole contains private developer-mode or platform bridge fields.",
            issues,
        });
    }

    return next();
};

export default defineMiddlewares({
    routes: [
        {
            matcher: "/admin/products",
            method: ["POST", "PUT", "PATCH"],
            middlewares: [rejectPrivateDijieRoleMetadata],
        },
        {
            matcher: "/admin/products/:id",
            method: ["POST", "PUT", "PATCH"],
            middlewares: [rejectPrivateDijieRoleMetadata],
        },
        {
            matcher: "/vendor/products",
            method: ["POST", "PUT", "PATCH"],
            middlewares: [rejectPrivateDijieRoleMetadata],
        },
        {
            matcher: "/vendor/products/:id",
            method: ["POST", "PUT", "PATCH"],
            middlewares: [rejectPrivateDijieRoleMetadata],
        },
        {
            matcher: "/dijie/execution-token",
            method: ["POST"],
            middlewares: [authenticate("customer", ["session", "bearer"])],
        },
        {
            matcher: "/dijie/my-roles",
            method: ["GET"],
            middlewares: [authenticate("customer", ["session", "bearer"])],
        },
        {
            matcher: "/dijie/executions/:executionId",
            method: ["GET"],
            middlewares: [authenticate("customer", ["session", "bearer"])],
        },
    ],
});
