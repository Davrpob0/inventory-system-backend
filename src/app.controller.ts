import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'Inventory System API is running',
      docs: '/api/docs',
    };
  }
}
