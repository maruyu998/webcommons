export abstract class CustomError extends Error {
  secret: boolean = true
  errorcode: number = 500
  constructor(props:{
    name: string,
    message: string,
    secret?: boolean,
    errorcode?: number,
  }){
    super(props.message);
    this.name = props.name;
    if(props.secret !== undefined) this.secret = props.secret;
    if(props.errorcode !== undefined) this.errorcode = props.errorcode;
  }
}

/// 4xx Client Errors

/// 400 Bad Request
export class InvalidParamError extends CustomError {
  constructor(paramName:string, errorType:"missing"|"invalidType"|"invalidValue"){
    if(errorType == "missing"){
      super({name: "InvalidParamError", message: `Required param '${paramName}' is empty.`, errorcode: 400})
    }else if(errorType == "invalidType"){
      super({name: "InvalidParamError", message:`Required param '${paramName}' is invalid type.`, errorcode: 400});
    }else if(errorType == "invalidValue"){
      super({name: "InvalidParamError", message: `Required param '${paramName}' is invalid value.`, errorcode: 400});
    }else{
      throw new UnexpectedError("errorType is required");
    }
  }
}
export class UnsupportedError extends CustomError {
  constructor(message: string){
    super({
      name: "UnsupportedError",
      message,
      errorcode: 400,
      secret: false
    });
  }
}
/// 401 Unauthorized
export class SigninRequiredError extends CustomError {
  constructor(){
    super({
      name: "SigninRequiredError",
      message: "sign in is required to access this path",
      errorcode: 401,
      secret: false,
    })
  }
}
export class AuthenticationError extends CustomError {
  constructor(message: string){
    super({
      name: "AuthenticationError",
      message,
      errorcode: 401,
      secret: false
    });
  }
}
/// 402 Payment Required
/// 403 Forbidden
export class OperationNotAllowedError extends CustomError {
  constructor(message: string){
    super({
      name: "OperationNotAllowedError",
      message,
      errorcode: 403,
      secret: false
    });
  }
}
export class PermissionError extends CustomError {
  constructor(message: string){
    super({
      name: "PermissionError",
      message,
      errorcode: 403,
      secret: false
    });
  }
}
/// 404 Not Found
export class DataNotFoundError extends CustomError {
  constructor(objectName: string) {
    super({
      name: "DataNotFoundError",
      message: `${objectName} is not found`,
      errorcode: 404,
      secret: false
    });
  }
}
/// 409 Conflict
export class ConflictError extends CustomError {
  constructor(message: string){
    super({
      name: "ConflictError",
      message,
      errorcode: 409,
      secret: false
    });
  }
}
/// 421 Misdirected Request
/// 422 Unprocessable Content
export class InputFormatError extends CustomError {
  constructor(message: string){
    super({ 
      name: "InputFormatError", 
      message, 
      errorcode: 422,
      secret: false,
    })
  }
}

/// 5xx Server Errors
/// 500 Internal Server Error
export class InternalServerError extends CustomError {
  constructor(message:string){
    super({ 
      name: "InternalServerError", 
      message, 
      errorcode: 500,
      secret: true, 
    });
  }
}
export class ConfigError extends CustomError {
  constructor(message: string) {
    super({
      name: "ConfigError",
      message,
      secret: true,
      errorcode: 500,
    });
  }
}
/// 501 Not Implemented

/// 502 Bad Gateway
/// 503 Service Unavailable
/// 504 Gateway Timeout
/// 505 HTTP Version Not Supported
/// 508 Loop Detected
/// 520 Web Server is Returning an unknown error
export class UnexpectedError extends CustomError {
  constructor(message: string) {
    super({ 
      name: "UnexpectedError", 
      message, 
      errorcode: 500,
      secret: true,
    });
  }
}