declare module 'iamport' {
  interface IamportConfig {
    identificationCode: string;
  }

  interface IamportResponse {
    success: boolean;
    error_msg: string;
    imp_uid: string;
    merchant_uid: string;
    // ... 추가적인 응답 필드 ...
  }

  interface RequestPayParams {
    pg: string;
    pay_method: string;
    merchant_uid: string;
    name: string;
    amount: number;
    buyer_email: string;
    buyer_name: string;
    buyer_tel: string;
    m_redirect_url: string;
    // ... 추가적인 요청 파라미터 ...
  }

  interface IMP {
    init(identificationCode: string): void;
    request_pay(params: RequestPayParams, callback: (response: IamportResponse) => void): void;
  }

  interface Window {
    IMP: IMP;
  }
}