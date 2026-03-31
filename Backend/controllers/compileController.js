import axios from "axios";

// Run Code Controller
export const runCode = async (req, res) => {
    try {
        const { code, languageId, input } = req.body;

        if (!code || !languageId) {
            return res.status(400).json({
                message: "Code and languageId are required"
            });
        }


        // Call Judge0 API
        const response = await axios.post(
            "https://ce.judge0.com/submissions?wait=true",
            {
                source_code: code,
                language_id: languageId,
                stdin: input || ""
            }
        );

        // Extract useful output
        const result = response.data;

        res.status(200).json({
            stdout: result.stdout,
            stderr: result.stderr,
            compile_output: result.compile_output,
            status: result.status,
            time: result.time,
            memory: result.memory
        });

    } catch (error) {
        console.log("Compile Error:", error.message);
        res.status(500).json({
            message: "Error while compiling code"
        });
    }
};