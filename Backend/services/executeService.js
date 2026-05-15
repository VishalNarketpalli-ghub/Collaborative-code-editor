import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const JDOODLE_URL = "https://api.jdoodle.com/v1/execute";

// Map our frontend languages to JDoodle languages
const JDOODLE_LANGUAGE_MAP = {
    javascript: { language: "nodejs", versionIndex: "4" }, // Node.js 17.x
    python:     { language: "python3", versionIndex: "4" }, // Python 3.10
    cpp:        { language: "cpp", versionIndex: "5" },    // C++ 17
    java:       { language: "java", versionIndex: "4" },   // JDK 17
};

export const runCode = async (source_code, language, stdin = "") => {
    const langConfig = JDOODLE_LANGUAGE_MAP[language];
    if (!langConfig) throw new Error(`Unsupported language: ${language}`);

    const response = await axios.post(JDOODLE_URL, {
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: source_code,
        language: langConfig.language,
        versionIndex: langConfig.versionIndex,
        stdin: stdin
    });

    return response.data;
};