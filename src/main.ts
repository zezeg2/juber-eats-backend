import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const errorMessages = {};
        errors.forEach((error) => {
          errorMessages[error.property] = Object.values(error.constraints)
            .join('. ')
            .trim();
        });
        return new BadRequestException(errorMessages);
      },
    }),
  );
  // app.use(jwtMiddleware);
  await app.listen(3000);
}
bootstrap();
