declare const TYPERT: {
    package: string;
    face: string;
    schemas: {
        name: string;
        create: () => {
            parse: (value: unknown) => unknown;
        };
    }[];
    /**
     * Package reflection. Required: without it registration fails with `TYPERT.model must be an
     * object`, the namespace never mounts, and every call answers 404 on `/api/<namespace>/<method>`.
     * Every service, event and object needs a `tags` array.
     */
    model: {
        services: {
            key: string;
            exportName: string;
            tags: never[];
            members: {
                kind: string;
                name: string;
                signature: string;
                summary: string;
            }[];
            types: never[];
        }[];
        events: never[];
        objects: never[];
    };
    invocations: ({
        id: string;
        service: string;
        namespace: string;
        method: string;
        invocation: {
            kind: string;
        };
        parameters: {
            name: string;
            wire: string;
            source: string;
            codec: Readonly<{
                mode: "strict";
                typeSymbol: string;
                create: () => {
                    parse: (value: unknown) => unknown;
                };
            }>;
            acceptsUndefined: boolean;
        }[];
        result: Readonly<{
            mode: "strict";
            typeSymbol: string;
            create: () => {
                parse: (value: unknown) => unknown;
            };
        }>;
    } | {
        id: string;
        service: string;
        namespace: string;
        method: string;
        invocation: {
            kind: string;
        };
        parameters: {
            name: string;
            wire: string;
            source: string;
            codec: Readonly<{
                mode: "strict";
                typeSymbol: string;
                create: () => {
                    parse: (value: unknown) => unknown;
                };
            }>;
        }[];
        result: Readonly<{
            mode: "strict";
            typeSymbol: string;
            create: () => {
                parse: (value: unknown) => unknown;
            };
        }>;
    })[];
};

export { TYPERT };
