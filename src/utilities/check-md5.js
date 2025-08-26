import md5 from "md5";
import env from "dotenv";

env.config();

/**
 * Check hash
 * @param {String} hash
 * @param {String[]} digests
 */
export default function (hash, digests = []) {
  try {
    digests.unshift(process.env.SECRET_KEY);
    const checkString = md5(digests.join());
    return checkString === hash;
  } catch (error) {
    console.log(error);
  }
}
