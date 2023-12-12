import mconfig from "./mconfig";
import express from "express";
import ClientOAuth2 from "client-oauth2";
import { randomUUID } from "crypto";
import cors from "cors";
import fetch from "node-fetch";
import pkceChallenge from "pkce-challenge";
import { saveSession, regenerateSession, sendError } from "./express";
import { getPacketWithOwnFetch } from "../commons/utils/fetch";
import { AuthenticationError, InvalidParamError, PermissionError } from "./errors";
import { PacketSourceDataType } from "../commons/types/packet";

type AuthSessionType = { codeVerifier?: string, state?: string, returnTo?: string };
type TokenSessionType = { accessToken:string, tokenType:string, refreshToken:string, scope:string, expiresAt:Date };
export type UserInfoType = {
  userId: string, 
  userName: string, 
  data: object,
  expiresAt: Date
};
export type SessionType = { auth?: AuthSessionType, token?: TokenSessionType, userInfo?: UserInfoType };

// const CLIENT_NAME = mconfig.get("clientName");
const CLIENT_ID = mconfig.get("clientId");
const CLIENT_SECRET = mconfig.get("clientSecret");
const OAUTH_DOMAIN = mconfig.get("oauthDomain");
const SERVICE_DOMAIN = mconfig.get("serviceDomain");

const CALLBACK_PATH = mconfig.get("oauthCallbackPath");
const OAUTH_TOKEN_PATH = mconfig.get("oauthTokenPath");
const OAUTH_AUTHORIZE_PATH = mconfig.get("oauthAuthorizePath");
const OAUTH_USER_INFO_PATH = mconfig.get("oauthUserInfoPath");

const USER_INFO_KEEP_DURATION = mconfig.getNumber("userInfoKeepDuration");

const SCOPES = ["user"];

const oauth2 = new ClientOAuth2({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  accessTokenUri: new URL(OAUTH_TOKEN_PATH, OAUTH_DOMAIN).toString(),
  authorizationUri: new URL(OAUTH_AUTHORIZE_PATH, OAUTH_DOMAIN).toString(),
  redirectUri: new URL(CALLBACK_PATH, SERVICE_DOMAIN).toString(),
  scopes: SCOPES
});

//////////////////////////////////// [ F U N C T I O N S ] ////////////////////////////////////
// sessions
function getSession(request:express.Request){
  const { auth, token, userInfo } = request.session.maruyuOAuth || {};
  return { auth, token, userInfo };
}
async function setSession(request:express.Request, { auth, token, userInfo }:{
  auth?:AuthSessionType, token?:TokenSessionType, userInfo?:UserInfoType
}){
  if(request.session.maruyuOAuth === undefined) {
    request.session.maruyuOAuth = {};
    await saveSession(request);
  }
  if(auth) request.session.maruyuOAuth.auth = auth;
  if(token) request.session.maruyuOAuth.token = token;
  if(userInfo) request.session.maruyuOAuth.userInfo = userInfo;
  await saveSession(request);
}
async function clearSession(request:express.Request, keys:("auth"|"token"|"userInfo")[]){
  if(request.session.maruyuOAuth === undefined) {
    request.session.maruyuOAuth = {};
    await saveSession(request);
  }
  if(keys.includes("auth")) request.session.maruyuOAuth.auth = undefined;
  if(keys.includes("token")) request.session.maruyuOAuth.token = undefined;
  if(keys.includes("userInfo")) request.session.maruyuOAuth.userInfo = undefined;
  await saveSession(request);
}

// tokens
async function refreshAccessToken(request:express.Request):Promise<boolean>{
  const { token } = getSession(request);
  if(token === undefined) throw new AuthenticationError("token is not saved");
  const { accessToken, tokenType, refreshToken, scope } = token;
  const tokenClient = new ClientOAuth2.Token(oauth2, {
    access_token: accessToken, 
    token_type: tokenType, 
    refresh_token: refreshToken, 
    scope
  });
  const isSuccess = await tokenClient.refresh()
  .then(async token=>{
    if(token.data.name === "AuthenticationError") throw new AuthenticationError("refreshToken is expired");
    const { accessToken, tokenType, refreshToken, scope, expiresAt } = token.data;
    await regenerateSession(request);
    await setSession(request, { token:{ accessToken, tokenType, refreshToken, scope, expiresAt:new Date(expiresAt) } });
    return true;
  })
  .catch(error=>{
    console.error(error);
    return false;
  });
  return isSuccess;
}

async function getAccessToken(request:express.Request):Promise<string>{
  const { token } = getSession(request);
  if(token === undefined) throw new Error("token is not saved");
  const { accessToken, expiresAt } = token;
  if(expiresAt.getTime() > Date.now()) return accessToken;
  const isRefreshSuccess = await refreshAccessToken(request);
  if(isRefreshSuccess) return await getAccessToken(request);
  throw new Error("refresh token was failed.");
}

// userinfo
export async function getUserInfo(request:express.Request, willReload:boolean=false):Promise<UserInfoType|null>{
  const { userInfo } = getSession(request);
  if(willReload === false && userInfo != null && userInfo.expiresAt.getTime() > Date.now()) return userInfo;
  const accessToken = await getAccessToken(request).catch(()=>null);
  if(accessToken == null) return null;
  const url = new URL(OAUTH_USER_INFO_PATH, OAUTH_DOMAIN);
  const fetchReturn = await getPacketWithOwnFetch(fetch, url.toString(), { accessToken })
                      .then(({data})=>data as PacketSourceDataType)
                      .catch(error=>{console.error(error);return null;});
  if(fetchReturn == null) return null;
  // const { userId, userName, data } = fetchReturn as { userId:string, userName:string, data:object };
  const { user_id: userId, user_name: userName, data } = fetchReturn as { user_id:string, user_name:string, data:object };
  const expiresAt = new Date(Date.now() + USER_INFO_KEEP_DURATION);
  await setSession(request, { userInfo:{ userId, userName, data, expiresAt } });
  return { userId, userName, data, expiresAt };
}

///////////////////////////////////// [ E N D P O I N T ] /////////////////////////////////////
export async function redirectToSignin(request:express.Request, response:express.Response):Promise<void>{
  const returnTo = "";
  const state = randomUUID();
  const { code_verifier: codeVerifier, code_challenge: codeChallenge } = pkceChallenge();
  await setSession(request, { auth:{ codeVerifier, state, returnTo } });
  const codeChallengeMethod = "S256";
  const clientSecret = CLIENT_SECRET;
  // {authorization_uri} ? {client_id=} & {redirect_uri=(service_domain + /api/oauth/callback, etc)}
  //                     & {response_type=code} & {state=} & {scope=} & {code_challenge=} & {code_challenge_method=}
  const uri = oauth2.code.getUri({ state, query: { 
    client_secret: clientSecret, code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod
  } });
  response.redirect(uri);
}

export async function processCallbackThenRedirect(request:express.Request, response:express.Response):Promise<void>{
  if(getSession(request).auth === undefined) return sendError(response, new AuthenticationError("Session is expired"));
  const { auth } = getSession(request);
  if(auth == null) return sendError(response, new AuthenticationError("auth is empty."));
  const { state, codeVerifier, returnTo } = auth;
  await clearSession(request, ["auth"]);
  if(!state) return sendError(response, new AuthenticationError("state is empty."));
  if(!codeVerifier) return sendError(response, new AuthenticationError("codeVerifier is empty."));
  
  if(request.query.state === undefined) return sendError(response, new InvalidParamError("state"));
  const returnedState = String(request.query.state);
  if(state !== returnedState) return sendError(response, new AuthenticationError("state is not match."));

  // post to access_token_uri with body { grant_type=authorization_code, code, redirect_uri, code_verifier }
  // response: { access_token, token_type, expires_in(second), refresh_token, scope }
  await oauth2.code.getToken(request.originalUrl, { body: { code_verifier: codeVerifier } })
  .catch((error:Error)=>{sendError(response, error); throw error;})
  .then(async token=>{
    const { 
      access_token: accessToken, 
      token_type: tokenType, 
      refresh_token: refreshToken, 
      scope, 
      expires_at: expiresAt
    } = token.data;
    await regenerateSession(request);
    await setSession(request, { token:{ accessToken, tokenType, refreshToken, scope, expiresAt:new Date(expiresAt) } });
    return response.redirect(returnTo || "/");
  })
  .catch(()=>null);
}

export async function signoutThenRedirectTop(request:express.Request, response:express.Response){
  await clearSession(request, ["auth", "token", "userInfo"]);
  await regenerateSession(request);
  response.redirect("/");
}

export async function refreshUserInfo(request:express.Request, response:express.Response){
  const willReload = true;
  await getUserInfo(request, willReload);
  response.redirect("/");
}
////////////////////////////////// [ M I D D L E W A R E S ] //////////////////////////////////
export async function redirectIfNotSignedIn(request:express.Request, response:express.Response, next:express.NextFunction):Promise<void>{
  const currentUser = await getUserInfo(request);
  if(currentUser == null) return redirectToSignin(request, response);
  next();
}

export function addCors(request:express.Request, response:express.Response, next:express.NextFunction):void{
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  cors({
    origin: OAUTH_DOMAIN,
    credentials: true,
    optionsSuccessStatus: 200
  })(request, response, next);
}

export async function getData(request:express.Request, reload:boolean=false){
  const userInfo = await getUserInfo(request, reload);
  if(userInfo == null) throw new PermissionError("user is invalid");
  return userInfo.data || {};
}