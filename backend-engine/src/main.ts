import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend integration
  app.enableCors({
    origin: '*', // For demo purposes. In prod, restrict to specific domains.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // Global validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('MST SaralChain API')
    .setDescription('Backend Engine API for Supply Chain dApp')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 Backend Engine is running on: http://localhost:${port}`);
  Logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
