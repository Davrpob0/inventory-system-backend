import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

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
