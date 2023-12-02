import express from "express";
import session from "express-session";
import connectMongoSession from "connect-mongodb-session";
import mongoose from "mongoose";
import * as maruyuOAuthClient from "./oauth";
import mconfig from "./mconfig";
/* eslint-disable-next-line @typescript-eslint/naming-convention*/
const MongoDBStore = connectMongoSession(session);

declare module "express-session" {
  /* eslint-disable-next-line @typescript-eslint/naming-convention*/
  interface SessionData {
    maruyuOAuth: maruyuOAuthClient.SessionType
  }
};

mongoose.Promise = global.Promise;
mongoose.connect(mconfig.get("mongoPath")).catch((error)=>{console.error(error);});
mongoose.connection.on("error", function(err) {
  console.error("MongoDB connection error: " + err);
  process.exit(-1);
});

const app: express.Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: mconfig.get("sessionSecret"),
  store: new MongoDBStore({
    uri: mconfig.get("mongoSessionPath"),
    collection: mconfig.get("mongoSessionCollection"),
    expires: mconfig.getNumber("sessionKeepDuration"),
    databaseName: undefined,
    connectionOptions: undefined,
    idField: undefined,
    expiresKey: undefined,
    expiresAfterSeconds: undefined,
  }),
  resave: false,
  saveUninitialized: true,
  rolling: true,
  cookie: {
    httpOnly: true,
    maxAge: mconfig.getNumber("sessionKeepDuration")
  }
}));

export default app;