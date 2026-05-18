import { runCode } from "./services/executeService.js";

async function test() {
    try {
        const res = await runCode("console.log('Hello');", "javascript", "");
        console.log("Success:", res);
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Response:", e.response.data);
        }
    }
}

test();
