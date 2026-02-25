/**
 * 测试 OSS 上传功能
 */

import { config } from 'dotenv';
import OSS from 'ali-oss';
import * as crypto from 'crypto';

config({ path: '.env.local' });

const OSS_REGION = process.env.ALIYUN_OSS_REGION;
const OSS_BUCKET = process.env.ALIYUN_OSS_BUCKET;
const OSS_ACCESS_KEY_ID = process.env.ALIYUN_OSS_ACCESS_KEY_ID;
const OSS_ACCESS_KEY_SECRET = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET;

async function main() {
  try {
    console.log('🚀 测试 OSS 上传功能\n');

    if (!OSS_REGION || !OSS_BUCKET || !OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET) {
      throw new Error('缺少 OSS 配置，请检查 .env.local');
    }

    console.log('📝 OSS 配置:');
    console.log(`  Region: ${OSS_REGION}`);
    console.log(`  Bucket: ${OSS_BUCKET}`);
    console.log('');

    // 初始化 OSS 客户端
    const client = new OSS({
      region: OSS_REGION,
      accessKeyId: OSS_ACCESS_KEY_ID,
      accessKeySecret: OSS_ACCESS_KEY_SECRET,
      bucket: OSS_BUCKET,
    });

    console.log('✅ OSS 客户端初始化成功\n');

    // 创建测试文件
    const testContent = Buffer.from('Hello, HNU-TimeLetter! 测试上传功能。');
    const hash = crypto.createHash('md5').update(testContent).digest('hex');
    const ossPath = `hnu-timeletter/test/${hash}.txt`;

    console.log(`📤 上传测试文件: ${ossPath}`);

    // 上传文件
    const result = await client.put(ossPath, testContent);
    
    console.log('✅ 上传成功！');
    console.log(`📍 URL: ${result.url}`);
    console.log(`🔗 公网访问: https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com/${ossPath}`);

    // 测试文件是否存在
    console.log('\n🔍 验证文件是否存在...');
    const headResult = await client.head(ossPath);
    console.log('✅ 文件存在，大小:', headResult.res.headers['content-length'], 'bytes');

    console.log('\n✨ OSS 测试完成！');

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('\n❌ 测试失败:', error.message);
      if ('code' in error) {
        console.error('错误代码:', (error as Error & { code?: string }).code);
      }
    } else {
      console.error('\n❌ 测试失败:', error);
    }
    process.exit(1);
  }
}

main();
