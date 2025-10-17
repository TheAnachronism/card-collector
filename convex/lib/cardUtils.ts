export function fixSetCode(setCode: string): string {
    return setCode.replace(/-(?:[A-Z]{2})(\d{3,})$/, "-EN$1");
}