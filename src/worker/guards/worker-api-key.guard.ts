import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WorkerApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const expectedApiKey = this.configService.get<string>('WORKER_API_KEY');
    if (!expectedApiKey) {
      throw new UnauthorizedException('Worker API key is not configured');
    }

    // Accept header 'x-api-key' or 'authorization: Bearer <API_KEY>'
    const apiKeyHeader =
      request.headers['x-api-key'] ||
      request.headers['x-worker-key'] ||
      request.headers['x-worker-secret'];

    const authHeader = request.headers['authorization'];
    let bearerToken: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      bearerToken = authHeader.substring(7).trim();
    }

    const providedKey = apiKeyHeader || bearerToken;

    if (!providedKey || providedKey !== expectedApiKey) {
      throw new UnauthorizedException(
        'Invalid or missing worker API key. Provide "x-api-key" header.',
      );
    }

    return true;
  }
}
