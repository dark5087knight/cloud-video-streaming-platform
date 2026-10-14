import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';

@Injectable()
export class SqsService implements OnModuleInit {
  private readonly logger = new Logger(SqsService.name);
  private sqsClient: SQSClient;
  private queueUrl: string;

  constructor(private readonly configService: ConfigService) {
    const region =
      this.configService.get<string>('SQS_REGION') ||
      this.configService.get<string>('AWS_SQS_REGION') ||
      this.configService.get<string>('AWS_REGION', 'eu-central-1');

    const accessKeyId =
      this.configService.get<string>('SQS_ACCESS_KEY_ID') ||
      this.configService.get<string>('AWS_SQS_ACCESS_KEY_ID');

    const secretAccessKey =
      this.configService.get<string>('SQS_SECRET_ACCESS_KEY') ||
      this.configService.get<string>('AWS_SQS_SECRET_ACCESS_KEY');

    this.queueUrl =
      this.configService.get<string>('SQS_QUEUE_URL') ||
      this.configService.get<string>('AWS_SQS_QUEUE_URL') ||
      '';

    this.sqsClient = new SQSClient({
      region,
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(`Initialized SQS Service targeting queue URL: ${this.queueUrl}`);
  }

  public async publish<T>(
    queueOrUrl: string,
    message: T,
  ): Promise<string> {
    const targetUrl = queueOrUrl.startsWith('http') ? queueOrUrl : this.queueUrl;
    if (!targetUrl) {
      throw new Error('SQS Queue URL is not configured. Please set SQS_QUEUE_URL.');
    }

    const command = new SendMessageCommand({
      QueueUrl: targetUrl,
      MessageBody: JSON.stringify(message),
    });

    const response = await this.sqsClient.send(command);
    const messageId = response.MessageId || '';

    this.logger.log(
      `Published message [ID: ${messageId}] to SQS queue "${targetUrl}"`,
    );

    return messageId;
  }
}
