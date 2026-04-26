const { Client } = require('pg');
const regions = ['ap-northeast-2','sa-east-1','ca-central-1','us-east-2','us-west-2','eu-west-2','eu-west-3','eu-north-1','ap-northeast-3'];
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
      console.log('FAIL', r);
    }
  }
  console.log('ALL FAILED');
  process.exit(1);
}
test();
