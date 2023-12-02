export class InvalidParamError extends Error {
  constructor(paramName:string){
    super(`Required param '${paramName}' is empty of invalid.`);
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