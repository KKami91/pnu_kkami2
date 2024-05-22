import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useEffect } from 'react';

const PaymentCompletePage: NextPage = () => {
  const router = useRouter();
  const { imp_uid, merchant_uid } = router.query;

  // 서버에 결제 정보 확인 요청
  const verifyPayment = async () => {
    try {
      const response = await axios.post('/api/iamport', { imp_uid });
      if (response.data.success) {
        const paymentData = response.data.data;
        // 결제 정보 처리 로직 작성
        console.log(paymentData);
      } else {
        // 결제 정보 확인 실패 처리
        console.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 컴포넌트 마운트 시 결제 정보 확인
  useEffect(() => {
    if (imp_uid && merchant_uid) {
      verifyPayment();
    }
  }, [imp_uid, merchant_uid]);

  return (
    <div>
      <h1>결제 완료</h1>
      {/* 결제 완료 페이지 UI */}
    </div>
  );
};

export default PaymentCompletePage;