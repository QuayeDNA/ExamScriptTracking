// Type declarations for missing packages
declare module "uuid" {
  export function v4(): string;
}

declare module "cloudinary" {
  export namespace v2 {
    export const config: any;
    export const uploader: any;
  }
}

declare module "@aws-sdk/client-s3" {
  export class S3Client {
    constructor(config: any);
    send(command: any): Promise<any>;
  }
  export class PutObjectCommand {
    constructor(params: any);
  }
  export class DeleteObjectCommand {
    constructor(params: any);
  }
}
