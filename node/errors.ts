export class InternalServerError extends Error {
  constructor(message:string){
    super(message);
    this.name = "InternalServerError";
  }
}

export class InvalidParamError extends Error {
  constructor(paramName:string, errorType:"missing"|"invalidType"|"invalidValue"){
    if(errorType == "missing"){
      super(`Required param '${paramName}' is empty.`)
    }else if(errorType == "invalidType"){
      super(`Required param '${paramName}' is invalid type.`);
    }else if(errorType == "invalidValue"){
      super(`Required param '${paramName}' is invalid value.`);
    }else{
      throw new UnexpectedError("errorType is required");
    }
    this.name = "InvalidParamError";
  }
}

export class AuthenticationError extends Error {
  constructor(message:string){
    super(message);
    this.name = "AuthenticationError";
  }
}

export class PermissionError extends Error {
  constructor(message:string){
    super(message);
    this.name = "PermissionError";
  }
}

export class UnexpectedError extends Error {
  constructor(message:string){
    super(message);
    this.name = "UnexpectedError";
  }
}

export class UnsupportedError extends Error {
  constructor(message:string){
    super(message);
    this.name = "UnsupportedError";
  }
}

export class ConfigError extends Error {
  constructor(message:string){
    super(message);
    this.name = "ConfigError";
  }
}

export class DataNotFoundError extends Error {
  constructor(objectName:string){
    super(`${objectName} is not found`);
    this.name = "DataNotFoundError";
  }
}