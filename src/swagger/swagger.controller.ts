import { Controller, Get, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('swagger')
export class SwaggerController {
  @Get('json')
  @Header('Content-Type', 'application/json')
  getSwaggerJson(@Res() res: Response) {
    try {
      const swaggerPath = path.join(process.cwd(), 'swagger.json');

      if (fs.existsSync(swaggerPath)) {
        const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
        res.send(swaggerContent);
      } else {
        // Return a fallback if file doesn't exist
        res.status(404).json({
          message: 'Swagger JSON file not found',
          suggestion: 'Access full Swagger docs at /api/docs',
          note: 'swagger.json is generated automatically in development mode',
        });
      }
    } catch (error) {
      res.status(500).json({
        message: 'Error reading swagger documentation',
        suggestion: 'Access full Swagger docs at /api/docs',
        error: error.message,
      });
    }
  }
}
