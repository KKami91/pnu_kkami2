import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    // 이미 base64 형식이므로 Buffer로 변환할 필요 없음
    const base64Image = image.split(',')[1]; // 헤더 제거

    // Gemini 설정
    const genAI = new GoogleGenerativeAI("AIzaSyCGiYZLEj-5t38AUOS6wVYMcy0bVLtENeI");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // 이미지 분석 요청
    const prompt = `
        이 헬스케어 대시보드를 분석하여 다음 사항들을 포함해 설명해주세요:
        1. 주요 건강 지표들의 현재 상태
        2. 시간에 따른 패턴이나 추세
        3. 주목할 만한 이상치나 특이사항
        4. 전반적인 건강 상태에 대한 인사이트
        5. 개선이 필요해 보이는 영역
        결과는 한국어로 작성해주세요.
    `;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/png"
        }
      }
    ]);

    const response = await result.response;
    const analysis = response.text();

    res.status(200).json({ analysis });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ 
      message: 'Error analyzing image',
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}