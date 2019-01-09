export function createDefaultLogger() {
    return console;
}

export function createDefaultStorage() {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
}