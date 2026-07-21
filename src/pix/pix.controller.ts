import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { PixService } from './pix.service';
import { CreatePixChargeDto } from './dto/create-pix-charge.dto';

@Controller('pix')
export class PixController {
  private readonly logger = new Logger(PixController.name);

  constructor(private readonly pixService: PixService) {}

  @Post('charges')
  createCharge(@Body() dto: CreatePixChargeDto) {
    return this.pixService.createCharge(dto);
  }

  @Get('charges/:id')
  getCharge(@Param('id') id: string) {
    return this.pixService.getCharge(id);
  }

  @Post('webhooks')
  async webhook(
    @Body() body: { type?: string; action?: string; data?: { id?: string } },
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
  ) {
    const dataId = body?.data?.id;

    this.pixService.verifySignature(xSignature, xRequestId, dataId);

    void this.pixService
      .handleWebhook(body)
      .then((charge) => {
        this.logger.log(`Webhook PIX: ${JSON.stringify(charge)}`);
      })
      .catch((err) => {
        this.logger.error(
          `Webhook PIX falhou: ${err instanceof Error ? err.message : JSON.stringify(err)}`,
        );
      });
    return { received: true };
  }
}
