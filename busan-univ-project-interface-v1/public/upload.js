const AWS = require('aws-sdk');
const fs = require('fs');

// AWS SDK 설정
AWS.config.update({
  region: 'ap-northeast-2',
  accessKeyId: 'AKIA4MTWLQBSHMBRL3MK',
  secretAccessKey: '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',
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// JSON 파일 읽기
const jsonData = JSON.parse(fs.readFileSync('C:/Users/AIA01/Desktop/project/pnu_fin_kkami/busan-univ-project-interface-v1/public/hrv.json'));

// 데이터 업로드 함수
async function uploadData() {
  const tableName = 'hrv_data2';

  for (const item of jsonData) {
    if (item.metadata && item.metadata.id) {
      const params = {
        TableName: tableName,
        Item: {
          "metadata.id": item.metadata.id,
          endTime: item.endTime,
          beatsPerMinute: item.samples[0].beatsPerMinute,
        },
      };
  
      try {
        await dynamoDB.put(params).promise();
        console.log(`Item uploaded successfully: ${item.metadata.id}`);
      } catch (error) {
        console.error(`Error uploading item: ${item.metadata.id}`, error);
      }
    } else {
      console.warn(`Skipping item without metadata.id:`, item);
    }
  }
}

// 데이터 업로드 실행
uploadData();