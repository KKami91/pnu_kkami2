import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

declare global {
  interface Window {
    IMP: any;
  }
}

interface IamportResponse {
  success: boolean;
  error_msg: string;
  imp_uid: string;
  merchant_uid: string;
  // ... 추가적인 응답 필드 ...
}

const PaymentsPage: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    const iamport = document.createElement('script');
    //iamport.src = 'https://cdn.iamport.kr/js/iamport.payment-1.2.0.js';
    iamport.src = 'https://cdn.iamport.kr/v1/iamport.js';
    iamport.async = true;
    iamport.onload = () => {
      // Iamport 초기화
      if (window.IMP) {
        window.IMP.init('imp06057803'); // 아임포트에서 발급받은 가맹점 식별코드를 입력합니다.
      }
    };
    document.head.appendChild(iamport);

    return () => {
      document.head.removeChild(iamport);
    };
  }, []);

  const startPayment = () => {
    const IMP = window.IMP;
    if (IMP) {
      IMP.request_pay(
        {
          pg: 'tosspayments', // PG사 선택 (tosspay, html5_inicis, kcp 등)
          pay_method: 'card', // 결제 수단 선택 (card, trans, vbank 등)
          merchant_uid: `mid_${new Date().getTime()}`, // 주문번호 (unique한 값으로 생성)
          name: '의자', // 결제 상품명
          amount: 10000, // 결제 금액
          buyer_email: '구매자 이메일',
          buyer_name: '구매자 이름',
          buyer_tel: '구매자 전화번호',
          m_redirect_url: 'http://localhost:3000/payments/complete', // 모바일 결제 후 리디렉션할 URL
        },
        (rsp: IamportResponse) => {
          if (rsp.success) {
            // 결제 성공 시 처리 로직
            const { imp_uid, merchant_uid } = rsp;
            console.log(imp_uid);
            // ... 필요한 로직 추가 ...
            router.push(`http://localhost:3000/payments/complete?imp_uid=${rsp.imp_uid}&merchant_uid=${rsp.merchant_uid}`);
          } else {
            // 결제 실패 시 처리 로직
            
            if (rsp.error_msg) {
              alert(`결제 실패: ${rsp.error_msg}`);
            } else {
              alert('결제가 실패하였습니다. 다시 시도해 주세요.');
            }
          }
        }
      );
    }
  };

  return (
    <div>
      <h1>결제하기</h1>
      <button onClick={startPayment}>결제하기</button>
    </div>
  );
};

export default PaymentsPage;
