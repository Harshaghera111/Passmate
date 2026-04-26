const { Client } = require('pg');
const regions = ['us-east-1','us-west-1','eu-west-1','eu-central-1','ap-south-1','ap-southeast-1','ap-southeast-2','ap-northeast-1'];

async function test() {
  for(let r of regions) {
    const client = new Client({
      connectionString: `postgresql://postgres.dtruypevalcnjugwjmbl:Passmate116%40@aws-0-${r}.pooler.supabase.com:6543/postgres`,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log('SUCCESS REGION', r);
      process.exit(0);
    } catch(e) {
      console.log('FAIL', r, e.message);
    }
  }
  console.log('ALL FAILED');
  process.exit(1);
}
test();
