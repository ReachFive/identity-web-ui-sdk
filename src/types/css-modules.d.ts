// Type definitions for CSS module files

declare module '*.css' {
    const content: Record<string, string>;
    export default content;
}