import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { AppModule } from './app.module';
import { SuperAdminSeeder } from './database/seeds/super-admin.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // === Global API prefix ===
  app.setGlobalPrefix('api');

  // === Validation pipes ===
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // === Handle raw body for Paystack webhooks ===
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

  // === Serve static files (for swagger.json) ===
  app.use(express.static('.'));

// === Enable CORS ===
app.enableCors({
  origin: true,          // allow all origins
  methods: '*',          // allow all HTTP methods
  allowedHeaders: '*',   // allow all headers
  credentials: true,     // allow cookies/auth headers
});

  
  // === Swagger Documentation ===
  const config = new DocumentBuilder()
    .setTitle(process.env.APP_NAME || 'Investment Platform Admin API')
    .setDescription(
      `API documentation for ${process.env.APP_NAME || 'Investment Platform admin services'}`,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Always generate swagger.json file for frontend access
  const fs = require('fs');
  fs.writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
  console.log('📘 Swagger JSON generated at /swagger.json');

  // serve swagger at /api/docs
  SwaggerModule.setup('/api/docs', app, document);

  // Add swagger.json endpoint using the document object
  app.use('/api/swagger.json', (req, res, next) => {
    if (req.method === 'GET') {
      try {
        res.setHeader('Content-Type', 'application/json');
        res.json(document);
      } catch (error) {
        res.status(500).json({
          message: 'Error generating swagger documentation',
          suggestion: 'Access full Swagger docs at /api/docs',
          error: error.message,
        });
      }
    } else {
      next();
    }
  });

  console.log('📘 Swagger running at http://localhost:${port}/api/docs');
  console.log(
    '📘 Swagger JSON available at http://localhost:${port}/api/swagger.json',
  );

  // === Seeder ===
  try {
    const seeder = app.get(SuperAdminSeeder);
    await seeder.seed();
    console.log('✅ SuperAdmin seeded successfully');
  } catch (error) {
    console.warn('⚠️ Seeder skipped or failed:', error.message);
  }

  // === Start Server ===
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}/api`);
  console.log(`ENV → APP_NAME=${process.env.APP_NAME}`);
  console.log(`ENV → SMTP_HOST=${process.env.SMTP_HOST}`);
  console.log(`ENV → FRONTEND_URL=${process.env.FRONTEND_URL}`);
}

bootstrap();
