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
    if(props.secret) this.secret = props.secret;
    if(props.errorcode) this.errorcode = props.errorcode;
  }
}

export class InternalServerError extends CustomError {
  constructor(message:string){
    super({
      name: "InternalServerError",
      message,
      secret: true,
      errorcode: 500,
    });
  }
}

export class InvalidParamError extends CustomError {
  constructor(paramName:string, errorType:"missing"|"invalidType"|"invalidValue"){
    if(errorType == "missing"){
      super({name: "InvalidParamError", message: `Required param '${paramName}' is empty.`})
    }else if(errorType == "invalidType"){
      super({name: "InvalidParamError", message:`Required param '${paramName}' is invalid type.`});
    }else if(errorType == "invalidValue"){
      super({name: "InvalidParamError", message: `Required param '${paramName}' is invalid value.`});
    }else{
      throw new UnexpectedError("errorType is required");
    }
  }
}

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

export class UnexpectedError extends CustomError {
  constructor(message: string) {
    super({
      name: "UnexpectedError",
      message,
      errorcode: 500,
      secret: true
    });
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

export class ConfigError extends CustomError {
  constructor(message: string) {
    super({
      name: "ConfigError",
      message,
      errorcode: 500,
      secret: true
    });
  }
}

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