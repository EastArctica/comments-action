type cssNode = {
    attributes: Record<string, string | string[]>;
    children: {
        [key: string]: cssNode
    };
};

type cssOptions = {
    ordered?: boolean;
    comments?: boolean;
    stripComments?: boolean;
    split?: boolean;
};

declare module 'cssjson' {
    // Modifies string prototypes :husk:
    function init(): void;
    function toJSON(cssString: string, args?: any): cssNode;
    function toCSS(node: cssNode, depth?: number, breaks?: boolean): string;
}
