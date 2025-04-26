import express from "express";
import session from "express-session";
import connectMongoSession from "connect-mongodb-session";
import mongoose from "mongoose";
import helmet from 'helmet';
import * as maruyuOAuthClient from "./oauth";
import { z } from "zod";
import env, { parseDuration } from "./env";
/* eslint-disable-next-line @typescript-eslint/naming-convention*/
const MongoDBStore = connectMongoSession(session);

declare module "express-session" {
  /* eslint-disable-next-line @typescript-eslint/naming-convention*/
  interface SessionData {
    maruyuOAuth: maruyuOAuthClient.SessionType,
    clientData: Record<string, any>
  }
};

mongoose.Promise = global.Promise;
mongoose.connect(env.get("MONGO_PATH",z.string().startsWith("mongodb://").nonempty())).catch((error)=>{console.error(error);});
mongoose.connection.on("error", function(error:Error) {
  console.error(`MongoDB connection error: [${error.name}] ${error.message}`);
  process.exit(-1);
});

const app: express.Express = express();
app.set('trust proxy', true);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "https://cdn.tailwindcss.com",
      ],
      "style-src": [
        "'self'",
        "'unsafe-inline'",
      ],
      "img-src": ["'self'", "data:"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
    },
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: env.get("SESSION_SECRET", z.string().nonempty()),
  store: new MongoDBStore({
    uri: env.get("MONGO_SESSION_PATH", z.string().startsWith("mongodb://").nonempty()),
    collection: env.get("MONGO_SESSION_COLLECTION", z.string().nonempty()),
    expires: env.get("SESSION_KEEP_DURATION", z.string().nonempty().transform(parseDuration)),
    databaseName: undefined,
    connectionOptions: undefined,
    idField: undefined,
    expiresKey: undefined,
    expiresAfterSeconds: undefined,
  }),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    maxAge: env.get("SESSION_KEEP_DURATION", z.string().nonempty().transform(parseDuration)),
    secure: true,
    sameSite: "lax"
  }
}));

export default app;