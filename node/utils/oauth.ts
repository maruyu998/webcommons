import { z } from "zod";
import env, { parseDuration } from "../env";
import express from "express";
import ClientOAuth2 from "client-oauth2";
import { randomUUID } from "crypto";
import cors from "cors";
import pkceChallenge from "pkce-challenge";
import { saveSession, regenerateSession, sendError } from "../express";
import { getPacket } from "../../commons/utils/fetch";
import { AuthenticationError, InvalidParamError, PermissionError } from "../errors";
import { PacketDataType } from "../../commons/types/packet";
import { UserIdType, UserNameType } from "../../commons/types/user";
import { SessionType, AuthSessionType, TokenSessionType, UserInfoType } from "../types/oauth";

const CLIENT_ID = env.get("CLIENT_ID", z.string().nonempty());
const CLIENT_SECRET = env.get("CLIENT_SECRET", z.string().nonempty());
const OAUTH_DOMAIN = env.get("OAUTH_DOMAIN", z.string().startsWith("https://"));
const SERVICE_DOMAIN = env.get("SERVICE_DOMAIN", z.union([z.string().startsWith("http://localhost"), z.string().startsWith("https://")]));

const OAUTH_CALLBACK_PATH = env.get("OAUTH_CALLBACK_PATH", z.string().nonempty());
const OAUTH_TOKEN_PATH = env.get("OAUTH_TOKEN_PATH", z.string().nonempty());
const OAUTH_AUTHORIZE_PATH = env.get("OAUTH_AUTHORIZE_PATH", z.string().nonempty());
const OAUTH_USER_INFO_PATH = env.get("OAUTH_USER_INFO_PATH", z.string().nonempty());

const USER_INFO_KEEP_DURATION = env.get("USER_INFO_KEEP_DURATION", z.string().nonempty().transform(parseDuration));
const AUTH_SESSION_KEEP_DURATION = env.get("AUTH_SESSION_KEEP_DURATION", z.string().nonempty().transform(parseDuration));

const SCOPES = ["user"];

const oauth2 = new ClientOAuth2({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  accessTokenUri: new URL(OAUTH_TOKEN_PATH, OAUTH_DOMAIN).toString(),
  authorizationUri: new URL(OAUTH_AUTHORIZE_PATH, OAUTH_DOMAIN).toString(),
  redirectUri: new URL(OAUTH_CALLBACK_PATH, SERVICE_DOMAIN).toString(),
  scopes: SCOPES
});

//////////////////////////////////// [ F U N C T I O N S ] ////////////////////////////////////
// sessions
function getSession(request:express.Request):SessionType{
  const { auths, token, userInfo } = request.session.maruyuOAuth || {};
  return { auths, token, userInfo };
}
async function setAuthSession(request:express.Request, state:string, auth:AuthSessionType){
  if(request.session.maruyuOAuth === undefined) {
    request.session.maruyuOAuth = {};
  }
  if(request.session.maruyuOAuth.auths === undefined) {
    request.session.maruyuOAuth.auths = {};
  }
  request.session.maruyuOAuth.auths[state] = auth;
  await saveSession(request);
}
async function setTokenSession(request:express.Request, token:TokenSessionType){
  if(request.session.maruyuOAuth === undefined) {
    request.session.maruyuOAuth = {};
  }
  request.session.maruyuOAuth.token = token;
  await saveSession(request);
}
async function setUserInfoSession(request:express.Request, userInfo:UserInfoType){
  if(request.session.maruyuOAuth === undefined) {
    request.session.maruyuOAuth = {};
  }
  request.session.maruyuOAuth.userInfo = userInfo;
  await saveSession(request);
}
async function clearAuthSession(request:express.Request, state:string){
  if(request.session.maruyuOAuth === undefined) {
    request.session.maruyuOAuth = {};
  }
  if(request.session.maruyuOAuth.auths){
    delete request.session.maruyuOAuth.auths[state];
  }
  await saveSession(request);
}
async function clearTokenSession(request:express.Request){
  if(request.session.maruyuOAuth === undefined) {
    request.session.maruyuOAuth = {};
  }else{
    request.session.maruyuOAuth.token = undefined;
  }
  await saveSession(request);
}
async function clearUserInfoSession(request:express.Request){
  if(request.session.maruyuOAuth === undefined) {
    request.session.maruyuOAuth = {};
  }else{
    request.session.maruyuOAuth.userInfo = undefined;
  }
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
    const { 
      access_token: accessToken,
      token_type: tokenType,
      refresh_token: refreshToken,
      scope,
      expires_at: expiresAt 
    } = token.data;
    await regenerateSession(request);
    await setTokenSession(request, { accessToken, tokenType, refreshToken, scope, expiresAt:new Date(expiresAt) });
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
export async function getUserInfo(request:express.Request, willReload=false):Promise<UserInfoType|null>{
  const { userInfo } = getSession(request);
  if(willReload === false && userInfo != null && userInfo.expiresAt.getTime() > Date.now()) return userInfo;
  const accessToken = await getAccessToken(request).catch(()=>null);
  if(accessToken == null) return null;
  const url = new URL(OAUTH_USER_INFO_PATH, OAUTH_DOMAIN);
  const fetchReturn = await getPacket({url, option:{ accessToken }})
                      .then(({data})=>data as PacketDataType)
                      .catch(error=>{console.error(error);return null;});
  if(fetchReturn === null) return null;
  // const { userId, userName, data } = fetchReturn as { userId:string, userName:string, data:object };
  const { user_id: userId, user_name: userName, data } = fetchReturn as { user_id:UserIdType, user_name:UserNameType, data:object };
  const expiresAt = new Date(Date.now() + USER_INFO_KEEP_DURATION);
  await setUserInfoSession(request, { userId, userName, data, expiresAt });
  return { userId, userName, data, expiresAt };
}

///////////////////////////////////// [ E N D P O I N T ] /////////////////////////////////////
export async function redirectToSignin(request:express.Request, response:express.Response):Promise<void>{
  const returnTo = request.url;
  const state = randomUUID();
  const { code_verifier: codeVerifier, code_challenge: codeChallenge } = await pkceChallenge();
  const expiresAt = new Date(Date.now() + AUTH_SESSION_KEEP_DURATION);
  await setAuthSession(request, state, { codeVerifier, returnTo, expiresAt });
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
  // if(getSession(request).auths === undefined) return sendError(response, new AuthenticationError("Session is expired"));
  const { auths } = getSession(request);
  if(auths == undefined) return sendError(response, new AuthenticationError("auth is empty."));
  if(request.query.state === undefined) return sendError(response, new InvalidParamError("state", "missing"));
  const returnedState = String(request.query.state);

  const auth = auths[returnedState];
  if(auth == undefined) return sendError(response, new AuthenticationError("state is not match."));
  const { codeVerifier, returnTo, expiresAt } = auth;
  if(expiresAt.getTime() < Date.now()) {
    clearAuthSession(request, returnedState);
    return sendError(response, new AuthenticationError("Auth session is expired."));
  }
  if(!codeVerifier) return sendError(response, new AuthenticationError("codeVerifier is empty."));
  await clearAuthSession(request, returnedState);

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
    for(const [state, auth] of Object.entries(auths)){
      if(state == returnedState) continue;
      await setAuthSession(request, state, auth);
    }
    await setTokenSession(request, { accessToken, tokenType, refreshToken, scope, expiresAt:new Date(expiresAt) });
    return response.redirect(returnTo || "/");
  })
  .catch(()=>null);
}

export async function signoutThenRedirectTop(request:express.Request, response:express.Response){
  const { auths } = getSession(request);
  // await clearAuthSession(request);
  await clearTokenSession(request);
  await clearUserInfoSession(request);
  await regenerateSession(request);
  if(auths != undefined){
    for(let [state, auth] of Object.entries(auths)){
      await setAuthSession(request, state, auth);
    }
  }
  response.redirect("/");
}

export async function refreshUserInfo(request:express.Request, response:express.Response){
  const willReload = true;
  await getUserInfo(request, willReload);
  response.redirect("/");
}
////////////////////////////////// [ M I D D L E W A R E S ] //////////////////////////////////
export async function redirectIfNotSignedIn(request:express.Request, response:express.Response, next:express.NextFunction):Promise<void>{
  const userInfo = await getUserInfo(request);
  if(userInfo == null) return redirectToSignin(request, response);
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

export async function getData(request:express.Request, reload=false){
  const userInfo = await getUserInfo(request, reload);
  if(userInfo == null) throw new PermissionError("user is invalid");
  return userInfo.data || {};
}