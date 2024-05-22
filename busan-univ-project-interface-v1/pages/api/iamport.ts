import { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

interface IamportResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<IamportResponse>) {
  if (req.method === 'POST') {
    const { imp_uid, merchant_uid } = req.body;
    //const mertKey = '95160cce09854ef44d2edb2bfb05f9f3';

    try {
      // 웹훅 검증
      const getTokenResponse = await axios.post('https://api.iamport.kr/users/getToken', {
        imp_key: process.env.IAMPORT_API_KEY,
        imp_secret: process.env.IAMPORT_SECRET_KEY,
      });
      const { access_token } = getTokenResponse.data.response;

      const getPaymentDataResponse = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
        headers: { Authorization: access_token },
      });
      const paymentData = getPaymentDataResponse.data.response;

      // 머트키(C)를 사용하여 웹훅 요청 검증
      if (paymentData.merchant_uid !== merchant_uid || paymentData.status !== 'paid' || paymentData.amount !== 1000) {
        throw new Error('유효하지 않은 결제 정보');
      }

      res.status(200).json({ success: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        res.status(500).json({ success: false, message: axiosError.message });
      } else {
        const unknownError = error as Error;
        res.status(500).json({ success: false, message: unknownError.message });
      }
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}