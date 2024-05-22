// pages/api/payments/webhook.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { paymentId, status } = req.body;

    // 전달받은 데이터를 검증하고 처리하는 로직을 구현합니다.
    // 예: 결제 완료 이벤트에 대한 처리
    if (status === 'PAID') {
      // 결제 완료 시 수행할 작업을 구현합니다.
      // 예: 주문 상태 업데이트, 이메일 발송 등
      console.log('PAID!!!');
      console.log('Payment completed:', paymentId);
      console.log('req.body', req.body);

      // 필요한 로직을 추가로 구현합니다.
    }

    res.status(200).json({ message: 'Webhook received' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}