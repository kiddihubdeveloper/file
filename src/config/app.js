import env from "dotenv";

env.config();

export default {
    mainDomain: process.env.MAIN_DOMAIN || 'kiddihub.com',
    appDomain: process.env.APP_DOMAIN,
    allowOrigins: process.env.ALLOW_ORIGIN.split(",")
}
