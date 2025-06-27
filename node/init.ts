import express from "express";
import session from "express-session";
import connectMongoSession from "connect-mongodb-session";
import mongoose from "mongoose";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import ipaddr from 'ipaddr.js';
import { SessionType } from "./types/oauth";
import { z } from "zod";
import env, { parseDuration, parseList } from "./env";
import { parseStats } from "./middleware";
/* eslint-disable-next-line @typescript-eslint/naming-convention*/
const MongoDBStore = connectMongoSession(session);

declare module "express-session" {
  /* eslint-disable-next-line @typescript-eslint/naming-convention*/
  interface SessionData {
    maruyuOAuth: SessionType,
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

const TRUST_PROXIES = env.get("TRUST_PROXIES",z.string().transform(parseList));
console.log({TRUST_PROXIES, 'trust proxy': TRUST_PROXIES.length});
app.set('trust proxy', TRUST_PROXIES.length); 

const TRUSTED_SUBNETS = env.get("TRUSTED_SUBNETS",z.string().transform(parseList));
const RATE_LIMIT_WINDOW = env.get("RATE_LIMIT_WINDOW",z.string().nonempty().transform(parseDuration));
const RATE_LIMIT_COUNT = env.get("RATE_LIMIT_COUNT",z.coerce.number().positive());
console.log({TRUSTED_SUBNETS, RATE_LIMIT_WINDOW, RATE_LIMIT_COUNT});

const isProductionMode = env.get("RUN_MODE", z.enum(['development','production','test']).transform(v=>v==="production"));

if(isProductionMode){
  app.use(rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_COUNT,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const ip = req.ip || '';
      if(!ipaddr.isValid(ip)) return false;
      const addr = ipaddr.parse(ip);
      return TRUSTED_SUBNETS.some(subnetStr => {
        const [subnetIpStr, prefixLengthStr] = subnetStr.split('/');
        if(!subnetIpStr || !prefixLengthStr) return false;
        const subnetIp = ipaddr.parse(subnetIpStr);
        const prefixLength = parseInt(prefixLengthStr, 10);
        if(addr.kind() == "ipv4" && subnetIp.kind() == "ipv4") return (addr as ipaddr.IPv4).match((subnetIp as ipaddr.IPv4), prefixLength);
        if(addr.kind() == "ipv6" && subnetIp.kind() == "ipv6") return (addr as ipaddr.IPv6).match((subnetIp as ipaddr.IPv6), prefixLength);
        return false;
      });
    },
  }));
}

const SCRIPT_SOURCES = env.get("SCRIPT_SOURCES",z.string().transform(parseList));
const STYLE_SOURCES = env.get("STYLE_SOURCES",z.string().transform(parseList));
const FONT_SOURCES = env.get("FONT_SOURCES",z.string().transform(parseList));
const FRAME_SOURCES = env.get("FRAME_SOURCES",z.string().transform(parseList));

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", ...SCRIPT_SOURCES, ...(isProductionMode ? [] : ["'unsafe-eval'"])],
      "style-src": ["'self'", "'unsafe-inline'", ...STYLE_SOURCES],
      "img-src": ["'self'", "data:"],
      "font-src": ["'self'", ...FONT_SOURCES],
      "frame-src": ["'self'", ...FRAME_SOURCES],
      ...(isProductionMode ? {} : { "upgrade-insecure-requests": null }),
    },
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: env.get("SESSION_NAME", z.string().regex(/^[!#$%&'*+\-.^_`|~0-9a-zA-Z]{1,64}$/)),
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
  }) as unknown as session.Store,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    maxAge: env.get("SESSION_KEEP_DURATION", z.string().nonempty().transform(parseDuration)),
    secure: isProductionMode,
    sameSite: "lax"
  }
}));
app.use(parseStats);

export default app;