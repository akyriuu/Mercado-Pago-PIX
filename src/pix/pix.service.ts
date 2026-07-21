import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { CreatePixChargeDto } from './dto/create-pix-charge.dto';

@Injectable()
export class PixService {
  private readonly payment: Payment;

  constructor(private readonly config: ConfigService) {
    const accessToken = this.config.getOrThrow<string>(
      'MERCADO_PAGO_ACCESS_TOKEN',
    );

    const client = new MercadoPagoConfig({ accessToken });
    this.payment = new Payment(client);
  }

  async createCharge(dto: CreatePixChargeDto) {
    const documentType =
      dto.payerDocument.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF';

    const result = await this.payment.create({
      body: {
        transaction_amount: dto.amount,
        description: dto.description,
        payment_method_id: 'pix',
        payer: {
          email: dto.payerEmail,
          identification: {
            type: documentType,
            number: dto.payerDocument.replace(/\D/g, ''),
          },
        },
      },
      requestOptions: {
        idempotencyKey: randomUUID(),
      },
    });

    const tx = result.point_of_interaction?.transaction_data;

    return {
      id: result.id,
      status: result.status,
      amount: result.transaction_amount,
      description: result.description,
      qrCode: tx?.qr_code ?? null,
      qrCodeBase64: tx?.qr_code_base64 ?? null,
      ticketUrl: tx?.ticket_url ?? null,
    };
  }

  async getCharge(id: string) {
    const result = await this.payment.get({ id });

    if (!result?.id) {
      throw new NotFoundException('Cobrança PIX não encontrada');
    }

    const tx = result.point_of_interaction?.transaction_data;

    return {
      id: result.id,
      status: result.status,
      amount: result.transaction_amount,
      description: result.description,
      qrCode: tx?.qr_code ?? null,
      qrCodeBase64: tx?.qr_code_base64 ?? null,
      ticketUrl: tx?.ticket_url ?? null,
    };
  }

  async handleWebhook(payload: {
    type?: string;
    action?: string;
    data?: { id?: string };
  }) {
    const paymentId = payload?.data?.id;

    if (!paymentId) {
      return { ignored: true };
    }

    if (payload.type && payload.type !== 'payment') {
      return { ignored: true, type: payload.type };
    }

    return this.getCharge(String(paymentId));
  }

  verifySignature(
    xSignature: string | undefined,
    xRequestId: string | undefined,
    dataId: string | undefined,
  ) {
    const secret = this.config.get<string>('MERCADO_PAGO_WEBHOOK_SECRET');

    if (!secret) {
      return true;
    }

    if (!xSignature || !xRequestId || !dataId) {
      throw new UnauthorizedException('Assinatura inválida');
    }

    const parts = Object.fromEntries(
      xSignature.split(',').map((p) => {
        const [k, v] = p.split('=');
        return [k.trim(), v];
      }),
    );

    const ts = parts['ts'];
    const v1 = parts['v1'];

    if (!ts || !v1) {
      throw new UnauthorizedException('Assinatura inválida');
    }

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const expected = createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    const a = Buffer.from(v1);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Assinatura inválida');
    }

    return true;
  }
}
