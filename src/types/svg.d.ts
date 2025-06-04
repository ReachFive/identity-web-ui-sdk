// Type definitions for SVG files

// declare module "*.svg" {
//     const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
//     export default content;
// }

declare module '*.svg' {
    const content: string;
    export const ReactComponent: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
    export default content;
}
