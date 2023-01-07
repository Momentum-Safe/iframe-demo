
export const dappUrl = window.origin.includes("localhost")
    ? window.origin.replace("localhost", "127.0.0.1")
    : window.origin.replace("127.0.0.1", "localhost");

//const dappUrl = 'http://localhost:3000'

export const msafeURL = 'http://localhost:3000';