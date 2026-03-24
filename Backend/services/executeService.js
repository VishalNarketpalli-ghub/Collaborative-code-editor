import axios from "axios";

const JUDGE0_URL = "https://ce.judge0.com";

export const runCode = async (source_code, language_id, stdin = "") => {
  try {
    // submit code
    const submission = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
      {
        source_code,
        language_id,
        stdin,
      }
    );

    const token = submission.data.token;

    //poll result
    let result;
    while (true) {
      const res = await axios.get(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`
      );

      result = res.data;

      if (result.status.id >= 3) break;

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return result;
  } catch (err) {
    throw new Error("Judge0 execution failed");
  }
};