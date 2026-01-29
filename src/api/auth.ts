export async function POST(req) {
  try {
    console.log('ENV:', {
      BREVO_KEY: process.env.BREVO_API_KEY,
      SENDER: process.env.MAIL_SENDER
    });

    const body = await req.json();
    console.log('BODY:', body);

    // 原有逻辑
  } catch (err) {
    console.error('SEND CODE ERROR:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 }
    );
  }
}
