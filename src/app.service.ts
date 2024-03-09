import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async getHelloAsync(): Promise<string> {
    return 'Hello World!';
  }
}
